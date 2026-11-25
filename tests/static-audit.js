"use strict";
// Auditoría estática del código. Uso: node tests/static-audit.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? "  -> " + detail : ""}`);
};

const files = ["index.html", "js/app.js", "service-worker.js", "manifest.json", "css/styles.css"];
const src = Object.fromEntries(files.map((f) => [f, read(f)]));
const js = ["js/app.js", "service-worker.js"];

// APIs prohibidas en todo el código de la aplicación
const forbidden = [
  ["localStorage", /localStorage/], ["sessionStorage", /sessionStorage/], ["indexedDB", /indexedDB/],
  ["cookies", /document\.cookie/], ["XMLHttpRequest", /XMLHttpRequest/], ["WebSocket", /WebSocket/],
  ["sendBeacon", /sendBeacon/], ["EventSource", /EventSource/], ["importScripts", /importScripts/],
  ["eval/Function", /\beval\s*\(|new\s+Function\s*\(/], ["innerHTML", /innerHTML|insertAdjacentHTML|document\.write/],
  ["console.*", /console\./], ["URL absoluta http(s)", /https?:\/\//],
  ["history/location con datos", /history\.(push|replace)State|location\.(href|hash|search)\s*=/]
];
for (const f of files) {
  for (const [label, re] of forbidden) check(`${f}: sin ${label}`, !re.test(src[f]));
}
check("fetch( solo en service-worker.js", !/fetch\s*\(/.test(src["js/app.js"]) && /fetch\s*\(/.test(src["service-worker.js"]));
check("app.js no usa Cache API", !/caches\./.test(src["js/app.js"]));

const html = src["index.html"];
const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((m) => !/\bsrc=/.test(m[1]) || m[2].trim());
check("HTML sin JavaScript inline", inlineScripts.length === 0);
check("HTML sin manejadores on*=", !/\son[a-z]+\s*=/i.test(html));
check("HTML sin style= inline ni <style>", !/\sstyle\s*=|<style/i.test(html));
check("HTML sin enlaces <a>", !/<a[\s>]/i.test(html));
check("HTML sin action/method en formularios", !/<form[^>]*\b(action|method)=/i.test(html));
check("HTML sin iframes, objetos ni embed", !/<(iframe|object|embed|frame)\b/i.test(html));
check("HTML sin atributo required", !/\brequired\b/i.test(html));
check("HTML sin recursos externos (src/href absolutos)", ![...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].some((m) => /^(?:[a-z]+:)?\/\//i.test(m[1])));

const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map((m) => m[0]);
check("17 campos de formulario", inputs.length === 17, `hay ${inputs.length}`);
check("autocomplete=\"off\" en el formulario y en cada campo",
  /<form[^>]*autocomplete="off"/.test(html) && inputs.every((i) => /autocomplete="off"/.test(i)));
check("autocorrect=off y spellcheck=false en cada campo", inputs.every((i) => /autocorrect="off"/.test(i) && /spellcheck="false"/.test(i)));
check("campos sin atributo name (sin heurísticas de autorrelleno)", inputs.every((i) => !/\sname=/.test(i)));

const EXPECTED = ["Asunto", "Implicado", "Nombre", "DNI", "Teléfono", "Dirección", "Fecha de nacimiento", "Lugar de nacimiento", "Matrícula", "Correo electrónico", "N.º de póliza", "Compañía", "Validez permiso", "Nombre padre", "Nombre madre", "Municipio", "Provincia"];
const htmlFields = [...html.matchAll(/<label class="field[^"]*"><span>([^<]+)<\/span><input id="(campo-\d\d)"/g)].map((m) => [m[2], m[1]]);
check("HTML: 17 etiquetas visibles, en el orden y con el texto acordados", JSON.stringify(htmlFields.map((f) => f[1])) === JSON.stringify(EXPECTED), htmlFields.map((f) => f[1]).join(" | "));
check("HTML: identificadores campo-01 … campo-17 consecutivos y sin repetir", htmlFields.every((f, i) => f[0] === "campo-" + String(i + 1).padStart(2, "0")));
check("HTML: sin etiquetas antiguas de campos agrupados", !/Tfno|F\.Nac|póliza y compañía|padre y madre|Municipio y provincia/i.test(html));
check("HTML: sin la etiqueta «Sin cuenta»", !/Sin cuenta|privacy-pill/.test(html));
check("HTML: sin el apartado «Qué no controla esta aplicación» ni sus puntos", !/Qué no controla|<details|class="notice"|sugerencias|capturas de pantalla pueden|sus propias políticas|registrar datos técnicos/i.test(html));
check("HTML: se conserva el aviso de que los datos no se guardan ni se envían", /no los guarda ni los envía a ningún servidor/.test(html));
check("CSS: sin reglas de elementos eliminados", !/privacy-pill|\.notice/.test(src["css/styles.css"]));

const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1] || "";
const need = ["default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:", "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'none'"];
for (const d of need) check(`CSP contiene ${d}`, csp.split(";").map((s) => s.trim()).includes(d));
check("CSP sin unsafe-inline / unsafe-eval / comodines", !/unsafe-|\*/.test(csp));
check("meta referrer no-referrer", /name="referrer" content="no-referrer"/.test(html));
check("meta format-detection desactiva teléfono, fecha, dirección y correo", /format-detection" content="telephone=no, date=no, address=no, email=no"/.test(html));
check("metadatos iOS (capable, title, status-bar, apple-touch-icon)",
  /apple-mobile-web-app-capable" content="yes"/.test(html) && /apple-mobile-web-app-title/.test(html) &&
  /apple-mobile-web-app-status-bar-style/.test(html) && /rel="apple-touch-icon" href="icons\/apple-touch-icon.png"/.test(html));
check("viewport-fit=cover", /viewport-fit=cover/.test(html));

// Service Worker: lista cerrada de recursos y existencia en disco
const swList = [...src["service-worker.js"].matchAll(/^\s*"\.\/([^"]+)",?\s*$/gm)].map((m) => m[1]);
check("SW: lista estática definida", swList.length === 7, swList.join(", "));
check("SW: todos los recursos de la lista existen", swList.every((f) => fs.existsSync(path.join(root, f))));
const referenced = [...html.matchAll(/\b(?:src|href)="([^"#]+)"/g)].map((m) => m[1]);
check("SW: todo recurso local referenciado en index.html está en la lista",
  referenced.every((r) => swList.includes(r)), referenced.filter((r) => !swList.includes(r)).join(", "));
check("SW: sin skipWaiting automático", !/skipWaiting/.test(src["service-worker.js"]));
check("SW: bloquea otros orígenes y métodos distintos de GET", /url\.origin !== self\.location\.origin \|\| request\.method !== "GET"/.test(src["service-worker.js"]));
check("SW: solo borra cachés con su prefijo", /key\.startsWith\(CACHE_PREFIX\)/.test(src["service-worker.js"]));
check("SW: peticiones con redirect:error y credentials:omit", /redirect: "error"/.test(src["service-worker.js"]) && /credentials: "omit"/.test(src["service-worker.js"]));
check("SW: cache.put solo con recursos validados", (src["service-worker.js"].match(/cache\.put\(/g) || []).length === 2 && /isValidStatic/.test(src["service-worker.js"]));

// app.js: los avisos son constantes
check("app.js: setStatus solo recibe constantes MSG o cadena vacía",
  [...src["js/app.js"].matchAll(/setStatus\(([^)]*)\)/g)].map((m) => m[1].trim())
    .filter((a) => !/^(MSG\.\w+|"")$/.test(a) && a !== "message" && !/^error && error\.name === "AbortError" \? "" : MSG\.shareFailed$/.test(a)).length === 0);
check("app.js: share solo con { text }", /navigator\.share\(\{ text: currentText \}\)/.test(src["js/app.js"]));
check("app.js: etiquetas de salida exactas y en orden", [
  "Asunto", "Implicado", "Nombre", "DNI", "Teléfono", "Dirección", "Fecha de nacimiento", "Lugar de nacimiento", "Matrícula",
  "Correo electrónico", "N.º de póliza", "Compañía", "Validez permiso", "Nombre padre", "Nombre madre", "Municipio", "Provincia"
].every((l, i) => src["js/app.js"].includes(`"campo-${String(i + 1).padStart(2, "0")}", "${l}"`)));

// Manifest e iconos
const man = JSON.parse(src["manifest.json"]);
check("manifest: standalone, nombre, nombre corto, tema", man.display === "standalone" && man.name === "Ficha privada" && man.short_name && man.theme_color);
const png = (f) => { const b = fs.readFileSync(path.join(root, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] }; };
for (const [f, s] of [["icons/apple-touch-icon.png", 180], ["icons/icon-192.png", 192], ["icons/icon-512.png", 512]]) {
  const p = png(f);
  check(`${f} es ${s}x${s}`, p.w === s && p.h === s, `${p.w}x${p.h}`);
}
check("apple-touch-icon opaco (sin canal alfa)", png("icons/apple-touch-icon.png").colorType === 2);
check("manifest: iconos 192 y 512 existen", man.icons.every((i) => fs.existsSync(path.join(root, i.src))));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} comprobaciones correctas`);
process.exit(failed.length ? 1 : 0);
