"use strict";
// Pruebas en Chromium (Playwright) con datos ficticios. Uso: node tests/e2e.js
// Variable opcional FP_TMP: carpeta para temporales.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");
const { start } = require("./server");

const ROOT = path.resolve(__dirname, "..");
const TMP = process.env.FP_TMP || os.tmpdir();
const LABELS = [
  "Asunto", "Implicado", "Nombre", "DNI", "Teléfono", "Dirección", "Fecha de nacimiento", "Lugar de nacimiento", "Matrícula",
  "Correo electrónico", "N.º de póliza", "Compañía", "Validez permiso", "Nombre padre", "Nombre madre", "Municipio", "Provincia"
];
const SENT = "ZZSENTINEL-4F7K";
const FULL = LABELS.map((_, i) => `${SENT}-${i + 1} Ñandú Çü ª º € “q” <b>&amp;</b> ¿?¡!`);
FULL[2] = `   ${FULL[2]}   `; // comprobar recorte de espacios
const DATE_IDX = [6, 12];
FULL[6] = "1990-05-17";
FULL[12] = "2030-12-31";
const ids = LABELS.map((_, i) => `#campo-${String(i + 1).padStart(2, "0")}`);
const CACHE_NAME = "ficha-privada-estatico-v4";
const STATIC = ["index.html", "css/styles.css", "js/app.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  [" + detail + "]" : ""}`);
};
const note = (name, detail) => { results.push({ name, ok: null, detail }); console.log(`INFO  ${name}  [${detail}]`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shown = (vals, i) => (DATE_IDX.includes(i) ? vals[i].split("-").reverse().join("/") : vals[i].trim());
const expectedText = (vals) => LABELS.map((l, i) => (shown(vals, i) ? `${l}: ${shown(vals, i)}` : `${l}:`)).join("\n");

async function fillAll(page, vals) { for (let i = 0; i < ids.length; i++) await page.fill(ids[i], vals[i]); }
const resultText = (page) => page.$eval("#result-text", (e) => e.textContent);
const allValues = (page) => page.$$eval("input", (els) => els.map((e) => e.value));
const visible = (page, sel) => page.$eval(sel, (e) => !e.hidden);

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.isFile()) out.push(p);
  }
  return out;
}
function scanDisk(dir) {
  const needles = [Buffer.from(SENT, "utf8"), Buffer.from(SENT, "utf16le")];
  const hits = [];
  for (const f of walk(dir)) {
    let b; try { b = fs.readFileSync(f); } catch { continue; }
    if (needles.some((n) => b.includes(n))) hits.push(path.relative(dir, f));
  }
  return hits;
}

async function main() {
  const seenText = []; // todo texto de aviso o botón que ha visto el usuario
  const profile = fs.mkdtempSync(path.join(TMP, "fp-profile-"));
  let srv = await start(ROOT);
  const base = srv.base;
  const ctx = await chromium.launchPersistentContext(profile, { headless: true });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  const requests = [];
  const failedReq = new Map();
  const finishedReq = new Set();
  ctx.on("request", (r) => requests.push(r.url()));
  ctx.on("requestfailed", (r) => failedReq.set(r.url(), (r.failure() || {}).errorText || ""));
  ctx.on("requestfinished", (r) => finishedReq.add(r.url()));
  const isOwn = (u) => u.startsWith(base) || /^(data|about|blob):/.test(u);
  const consoleMsgs = [];
  const page = await ctx.newPage();
  page.on("console", (m) => consoleMsgs.push(m.text()));
  page.on("pageerror", (e) => consoleMsgs.push(String(e.message)));
  let popups = 0;
  ctx.on("page", (p) => { if (p !== page) popups++; });
  const snapshotUi = async () => {
    seenText.push(await page.$eval("#status", (e) => e.textContent));
    seenText.push(await page.$eval("#copy-button", (e) => e.textContent));
  };

  await page.goto(base + "/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // la primera carga no está controlada por el SW

  // --- Funcionales ---------------------------------------------------------------
  const labelsInHtml = await page.$$eval(".field > span", (els) => els.map((e) => e.textContent));
  check("F0 Las 17 etiquetas visibles (orden y texto) coinciden exactamente con la lista", JSON.stringify(labelsInHtml) === JSON.stringify(LABELS), labelsInHtml.join(" | "));

  await page.click("button[type=submit]");
  let t = await resultText(page);
  check("F1 Formulario vacío: se puede finalizar y salen las 17 etiquetas sin contenido", t === expectedText(Array(LABELS.length).fill("")) && t.split("\n").length === LABELS.length, JSON.stringify(t.split("\n").slice(0, 3)) + "…");
  check("F1b Se muestra la vista de resultado y se oculta el formulario", (await visible(page, "#result-view")) && !(await visible(page, "#form-view")));

  await page.click("#edit-button");
  await page.fill(ids[2], "Ficticio Ejemplo");
  await page.fill(ids[3], "00000000T");
  await page.click("button[type=submit]");
  t = await resultText(page);
  const partial = Array(LABELS.length).fill(""); partial[2] = "Ficticio Ejemplo"; partial[3] = "00000000T";
  check("F2 Formulario parcial: campos rellenos y vacíos en su sitio", t === expectedText(partial));

  await page.click("#edit-button");
  check("F2b Al volver a modificar se conservan los datos", (await page.inputValue(ids[2])) === "Ficticio Ejemplo");
  check("F2c Exactamente 17 campos de entrada: 15 de texto y 2 de fecha (campo-07 y campo-13)",
  (await page.$$("input")).length === 17 && (await page.$$("input[type=text]")).length === 15 &&
  (await page.$$("#campo-07[type=date], #campo-13[type=date]")).length === 2);
  check("F2d Se han eliminado la etiqueta «Sin cuenta» y el apartado «Qué no controla»; se conserva el aviso de datos",
    !/Sin cuenta|Qué no controla|sugerencias de iOS|políticas/.test(await page.content()) && (await page.$$("details")).length === 0 &&
    (await page.$eval(".local-note", (e) => e.textContent)).includes("no los guarda ni los envía a ningún servidor"));
  // Campos separados: cada uno funciona de forma independiente del otro
  page.once("dialog", (d) => d.accept());
  await page.click("#clear-form");
  const PAIRS = [[6, 7], [10, 11], [13, 14], [15, 16]];
  for (const [a, b] of PAIRS) {
    let ok = true;
    const vals = Array(LABELS.length).fill("");
    for (const [x, y] of [[a, b], [b, a]]) {
      vals.fill("");
      vals[x] = DATE_IDX.includes(x) ? "1990-05-17" : "Valor ficticio " + LABELS[x];
      await page.fill(ids[x], vals[x]);
      const otherEmpty = (await page.inputValue(ids[y])) === "";
      await page.click("button[type=submit]");
      const txt = await resultText(page);
      ok = ok && otherEmpty && txt === expectedText(vals) && txt.split("\n")[y] === LABELS[y] + ":";
      await page.click("#edit-button");
      await page.fill(ids[x], "");
    }
    check(`F2e «${LABELS[a]}» y «${LABELS[b]}» son independientes (cada uno aparece solo y el otro sale vacío)`, ok);
  }
  await fillAll(page, FULL);
  await page.click("button[type=submit]");
  t = await resultText(page);
  check("F3 Formulario completo con tildes, ñ, símbolos y HTML como texto", t === expectedText(FULL));
  check("F3b El HTML escrito no se interpreta (sin elementos <b> en el resultado)", (await page.$$("#result-text b")).length === 0);
  await snapshotUi();

  // Copiar (API real)
  await page.evaluate(() => navigator.clipboard.writeText("ANTERIOR"));
  await page.click("#copy-button");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check("F4 Copiar con Clipboard API: el portapapeles contiene exactamente el texto", clip === expectedText(FULL));
  check("F4b Confirmación visual en el botón y mensaje", (await page.$eval("#copy-button", (e) => e.textContent)) === "Copiado ✓" && (await page.$eval("#status", (e) => e.textContent)).startsWith("Texto copiado."));
  check("F4c El mensaje no afirma borrar el portapapeles", !/borr|elimin|limpi/i.test(await page.$eval("#status", (e) => e.textContent)));
  await snapshotUi();

  // Copiar (alternativa execCommand)
  await page.evaluate(() => navigator.clipboard.writeText("ANTERIOR2"));
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { get: () => undefined, configurable: true }));
  await page.click("#copy-button");
  await page.evaluate(() => { delete navigator.clipboard; });
  const clip2 = await page.evaluate(() => navigator.clipboard.readText());
  check("F4d Copiar con la alternativa (sin Clipboard API) funciona", clip2 === expectedText(FULL));
  check("F4e La alternativa no deja el texto en el DOM", (await page.$$(".clip-helper")).length === 0);
  await snapshotUi();

  // Compartir (navigator.share simulado: el menú nativo de iOS NO se puede probar aquí)
  await page.evaluate(() => { window.__shared = []; navigator.share = async (d) => { window.__shared.push(JSON.parse(JSON.stringify(d))); }; });
  await page.click("#share-button");
  const shared = await page.evaluate(() => window.__shared);
  check("F5 navigator.share se llama una vez, solo con { text } y el texto exacto (share simulado)",
    shared.length === 1 && JSON.stringify(Object.keys(shared[0])) === '["text"]' && shared[0].text === expectedText(FULL));
  await snapshotUi();
  await page.evaluate(() => { navigator.share = async () => { throw new DOMException("x", "AbortError"); }; });
  await page.click("#share-button");
  check("F5b Cancelar el menú de compartir no muestra error", (await page.$eval("#status", (e) => e.textContent)) === "");
  await page.evaluate(() => { navigator.share = async () => { throw new Error("falla " + document.getElementById("result-text").textContent); }; });
  await page.click("#share-button");
  const errStatus = await page.$eval("#status", (e) => e.textContent);
  check("F5c Un error al compartir muestra un aviso genérico, sin datos ni detalles del error", errStatus.startsWith("No se ha podido abrir") && !errStatus.includes(SENT));
  await snapshotUi();
  await page.evaluate(() => { navigator.share = undefined; });
  await page.click("#share-button");
  check("F5d Sin Web Share API se ofrece copiar", (await page.$eval("#status", (e) => e.textContent)).includes("Copiar texto"));
  await snapshotUi();

  // Nueva ficha / vaciar
  page.once("dialog", (d) => d.dismiss());
  await page.click("#new-button");
  check("F6 Rechazar la confirmación de «Nueva ficha» conserva los datos", (await resultText(page)) === expectedText(FULL));
  page.once("dialog", (d) => d.accept());
  await page.click("#new-button");
  const afterNew = await allValues(page);
  check("F6b «Nueva ficha» vacía los 17 campos, el texto del resultado y vuelve al formulario",
    afterNew.every((v) => v === "") && (await page.$eval("#result-text", (e) => e.textContent)) === "" && (await visible(page, "#form-view")));
  await fillAll(page, FULL);
  page.once("dialog", (d) => d.accept());
  await page.click("#clear-form");
  check("F6c «Vaciar formulario» (aceptando) deja los campos vacíos", (await allValues(page)).every((v) => v === ""));
  await fillAll(page, FULL);
  page.once("dialog", (d) => d.dismiss());
  await page.click("#clear-form");
  check("F6d «Vaciar formulario» (rechazando la confirmación) conserva los datos", JSON.stringify(await allValues(page)) === JSON.stringify(FULL));
  page.once("dialog", (d) => d.accept());
  await page.click("#clear-form");

  // --- Requisito 1: restauración de formularios --------------------------------
  await fillAll(page, FULL);
  await page.reload();
  check("R1a Tras recargar, los campos están vacíos", (await allValues(page)).every((v) => v === ""));
  await fillAll(page, FULL);
  await page.goto(base + "/tests/control.html");
  await page.goBack();
  check("R1b Tras navegar a otra página y volver atrás, los campos están vacíos", (await allValues(page)).every((v) => v === ""));
  await fillAll(page, FULL);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  check("R1c Evento pageshow persisted (SIMULADO, no es bfcache real) vacía los campos", (await allValues(page)).every((v) => v === ""));

  // --- Requisito 2: navegación externa -----------------------------------------
  const before = page.url();
  check("N0 La aplicación no contiene ningún enlace <a>", (await page.$$("a")).length === 0);
  await page.evaluate(() => {
    for (const [id, target] of [["x1", ""], ["x2", "_blank"]]) {
      const a = document.createElement("a");
      a.id = id; a.href = "https://example.com/ext"; a.textContent = id; if (target) a.target = target;
      document.body.appendChild(a);
    }
  });
  await page.click("#x1"); await page.click("#x2"); await sleep(500);
  check("N1 Un enlace externo inyectado no navega ni abre ventanas", page.url() === before && popups === 0);
  const externalBefore = requests.filter((u) => !isOwn(u));
  check("N1b Hasta este punto (uso normal y enlaces inyectados) no se intentó ninguna petición a otro origen", externalBefore.length === 0, externalBefore.join(" "));
  await page.evaluate(() => {
    window.__v = [];
    document.addEventListener("securitypolicyviolation", (e) => window.__v.push(e.effectiveDirective));
    fetch("https://example.com/x").catch(() => {});
    fetch("/css/styles.css").catch(() => {});
    new Image().src = "https://example.com/p.png";
    try { new WebSocket("wss://example.com/"); } catch (_) {}
    const f = document.createElement("form"); f.action = "https://example.com/post"; f.method = "post";
    document.body.appendChild(f); f.requestSubmit ? f.requestSubmit() : f.submit();
    const fr = document.createElement("iframe"); fr.src = "https://example.com/"; document.body.appendChild(fr);
    const s = document.createElement("script"); s.textContent = "window.__inline = 1"; document.body.appendChild(s);
    const s2 = document.createElement("script"); s2.src = "https://example.com/x.js"; document.body.appendChild(s2);
  });
  await sleep(700);
  const viol = await page.evaluate(() => window.__v);
  const has = (re) => viol.some((d) => re.test(d));
  check("N2 CSP bloquea fetch (también al propio origen) y WebSocket: connect-src", has(/^connect-src$/) && viol.filter((d) => d === "connect-src").length >= 3, viol.join(","));
  check("N3 CSP bloquea imágenes externas", has(/^img-src$/));
  check("N4 CSP bloquea el envío de formularios a otro destino: form-action", has(/^form-action$/));
  check("N5 CSP bloquea iframes externos", has(/^frame-src$|^default-src$/));
  check("N6 CSP bloquea scripts inline y externos", has(/^script-src(-elem)?$/) && (await page.evaluate(() => window.__inline)) === undefined);
  const externalAfter = requests.filter((u) => !isOwn(u));
  check("N7 Las peticiones externas provocadas a propósito fueron bloqueadas por la CSP y ninguna se completó",
    externalAfter.length > 0 && externalAfter.every((u) => /csp/i.test(failedReq.get(u) || "") && !finishedReq.has(u)),
    externalAfter.map((u) => `${u} → ${failedReq.get(u) || "sin fallo registrado"}`).join(" ; "));
  check("N8 Tras todo lo anterior la página sigue en la aplicación", page.url() === before);

  // --- Requisitos 4, 5, 6: almacenamiento, SW y memoria --------------------------
  await page.reload();
  await fillAll(page, FULL);
  await page.click("button[type=submit]");
  await page.click("#copy-button");
  const store = await page.evaluate(async () => {
    const dbs = indexedDB.databases ? await indexedDB.databases() : [];
    const cacheInfo = {};
    for (const k of await caches.keys()) {
      const c = await caches.open(k);
      cacheInfo[k] = [];
      for (const r of await c.keys()) {
        const body = await (await c.match(r)).clone().text().catch(() => "");
        cacheInfo[k].push({ url: r.url, hasSentinel: body.includes("ZZSENTINEL") || r.url.includes("ZZSENTINEL") });
      }
    }
    return { ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie, dbs: dbs.length, cacheInfo };
  });
  check("S1 localStorage y sessionStorage vacíos", store.ls === 0 && store.ss === 0);
  check("S2 Sin cookies (document.cookie y contexto)", store.cookie === "" && (await ctx.cookies()).length === 0);
  check("S3 Sin bases IndexedDB", store.dbs === 0);
  const keys = Object.keys(store.cacheInfo);
  check("S4 Cache API: una sola caché con el nombre versionado esperado", JSON.stringify(keys) === JSON.stringify([CACHE_NAME]), keys.join(","));
  const cachedUrls = (store.cacheInfo[CACHE_NAME] || []).map((e) => e.url.replace(base + "/", "")).sort();
  check("S5 La caché contiene exactamente los 7 recursos estáticos definidos y nada más", JSON.stringify(cachedUrls) === JSON.stringify([...STATIC].sort()), cachedUrls.join(","));
  check("S6 Ninguna entrada de la caché contiene los datos (URL ni cuerpo)", (store.cacheInfo[CACHE_NAME] || []).every((e) => !e.hasSentinel));

  // El SW no cachea rutas no previstas ni peticiones con parámetros
  const logLenBefore = srv.log.length;
  const probe = await page.evaluate(() => new Promise((resolve) => {
    const out = {};
    const test = (name, src) => new Promise((r) => { const i = new Image(); i.onload = () => { out[name] = "ok"; r(); }; i.onerror = () => { out[name] = "error"; r(); }; i.src = src; });
    Promise.all([
      test("noPermitida", "/tests/control.html?dato=ZZSENTINEL-4F7K"),
      test("permitidaConQuery", "/icons/icon-192.png?dato=ZZSENTINEL-4F7K")
    ]).then(() => resolve(out));
  }));
  const cacheAfter = await page.evaluate(async () => (await (await caches.open("ficha-privada-estatico-v4")).keys()).map((r) => r.url));
  check("S7 Ruta no incluida en la lista: el SW responde sin ir a la red ni guardarla", probe.noPermitida === "error" && !srv.log.slice(logLenBefore).some((l) => l.includes("control.html")));
  check("S8 Recurso estático con parámetros: se sirve de caché, no llega al servidor y no se guarda con el parámetro",
    probe.permitidaConQuery === "ok" && !srv.log.slice(logLenBefore).some((l) => l.includes("ZZSENTINEL")) && cacheAfter.length === 7 && cacheAfter.every((u) => !u.includes("?")));
  await page.goto(base + "/?q=" + SENT);
  check("S9 Navegar a la raíz con parámetros sirve la app desde caché (sin petición al servidor con el parámetro)",
    (await page.title()) === "Ficha privada" && !srv.log.some((l) => l.includes("ZZSENTINEL")));
  check("S10 Ninguna petición recibida por el servidor contiene datos de la ficha",
    !srv.log.some((l) => l.includes("ZZSENTINEL") || /%C3%91|Nandu|and%C3%BA/i.test(l)), srv.log.length + " peticiones");
  check("S11 Todas las peticiones al servidor son GET de recursos estáticos",
    srv.log.every((l) => l.startsWith("GET ")) , [...new Set(srv.log.map((l) => l.split("?")[0]))].join(" | "));
  check("S12 Ni la consola ni los errores de página contienen datos", consoleMsgs.every((m) => !m.includes(SENT)), `${consoleMsgs.length} mensajes`);

  // --- Offline -----------------------------------------------------------------
  await fillAll(page, FULL);
  await srv.close(); // servidor detenido: solo puede responder el Service Worker
  await page.goto(base + "/").catch(() => {});
  let offlineOk = false;
  try {
    offlineOk = (await page.title()) === "Ficha privada" && (await allValues(page)).length === LABELS.length;
    await fillAll(page, FULL);
    await page.click("button[type=submit]");
    offlineOk = offlineOk && (await resultText(page)) === expectedText(FULL);
  } catch (_) { offlineOk = false; }
  check("O1 Con el servidor detenido la app carga y funciona (desde Service Worker)", offlineOk);
  await snapshotUi();

  check("U1 Ningún texto de aviso ni de botón visto por el usuario contiene datos", seenText.every((s) => !s.includes(SENT) && !/Ñandú/.test(s)), `${seenText.length} textos revisados`);

  // Cerrar con datos aún en pantalla y rastrear el disco
  await ctx.close();
  const hits = scanDisk(profile);
  check("D1 Rastreo del perfil del navegador (caché HTTP, Cache Storage, IndexedDB, sesión, etc.): sin rastro de los datos", hits.length === 0, hits.length ? hits.join(", ") : "perfil: " + walk(profile).length + " archivos revisados");

  // Controles: demuestran que las pruebas R1 y D1 detectarían datos si existieran
  const srv2 = await start(ROOT);
  const profile2 = fs.mkdtempSync(path.join(TMP, "fp-control-"));
  const ctx2 = await chromium.launchPersistentContext(profile2, { headless: true });
  const p2 = await ctx2.newPage();
  await p2.goto(srv2.base + "/tests/control.html");
  await p2.fill("#c1", SENT + "-control");
  await p2.goto(srv2.base + "/index.html");
  await p2.goBack();
  const restored = await p2.inputValue("#c1");
  await p2.evaluate(async () => {
    localStorage.setItem("k", "ZZSENTINEL-4F7K-ls");
    document.cookie = "c=ZZSENTINEL-4F7K-ck; max-age=3600";
    await (await caches.open("control")).put("/x", new Response("ZZSENTINEL-4F7K-cache"));
    await new Promise((res) => { const r = indexedDB.open("control"); r.onupgradeneeded = () => r.result.createObjectStore("s").put("ZZSENTINEL-4F7K-idb", 1); r.onsuccess = () => { r.result.close(); res(); }; });
  });
  await ctx2.close();
  const hits2 = scanDisk(profile2);
  check("C1 Control: una página normal SÍ restaura el campo al volver atrás (R1b detectaría una restauración)", restored === SENT + "-control", restored ? "restaurado" : "no restaurado");
  check("C2 Control: el rastreo de disco SÍ detecta datos guardados en localStorage/cookies/Cache API/IndexedDB (D1 es capaz de detectarlos)", hits2.length > 0, hits2.join(", ") || "no detectó nada");
  await srv2.close();

  // --- Actualización del Service Worker --------------------------------------------
  const upd = fs.mkdtempSync(path.join(TMP, "fp-upd-"));
  fs.cpSync(ROOT, upd, { recursive: true, filter: (s) => !/[\\/]tests([\\/]|$)/.test(s) });
  const srv3 = await start(upd);
  const br = await chromium.launch();
  const c3 = await br.newContext();
  let p3 = await c3.newPage();
  await p3.goto(srv3.base + "/");
  await p3.evaluate(() => navigator.serviceWorker.ready);
  await p3.reload();
  await p3.evaluate(() => caches.open("otra-app-cache"));
  const swFile = path.join(upd, "service-worker.js");
  fs.writeFileSync(swFile, fs.readFileSync(swFile, "utf8").replace("estatico-v4", "estatico-v5"));
  await p3.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  let waiting = false;
  for (let i = 0; i < 30 && !waiting; i++) { waiting = await p3.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()).waiting); if (!waiting) await sleep(300); }
  const keysDuring = await p3.evaluate(() => caches.keys());
  check("A1 Una versión nueva del SW queda en espera sin forzar la activación mientras la app está abierta", waiting && keysDuring.includes("ficha-privada-estatico-v4") && keysDuring.includes("ficha-privada-estatico-v5"), keysDuring.join(","));
  await p3.close();
  p3 = await c3.newPage();
  let keysAfter = [];
  for (let i = 0; i < 50; i++) { await p3.goto(srv3.base + "/"); keysAfter = (await p3.evaluate(() => caches.keys())).sort(); if (!keysAfter.includes("ficha-privada-estatico-v4")) break; await sleep(300); }
  check("A2 Al reabrir se activa la versión nueva y se borra la caché antigua propia, sin tocar cachés ajenas",
    JSON.stringify(keysAfter) === JSON.stringify(["ficha-privada-estatico-v5", "otra-app-cache"]), keysAfter.join(","));
  await br.close(); await srv3.close();

  const failed = results.filter((r) => r.ok === false);
  const passed = results.filter((r) => r.ok === true).length;
  console.log(`\n${passed} correctas, ${failed.length} fallidas, ${results.filter((r) => r.ok === null).length} informativas`);
  if (process.env.FP_OUT) fs.writeFileSync(process.env.FP_OUT, JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}
main().catch((e) => { console.error("ERROR DE EJECUCIÓN:", e.message); process.exit(2); });
