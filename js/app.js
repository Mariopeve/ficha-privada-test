(() => {
  "use strict";

  // Defensa adicional contra incrustación en marcos: la directiva CSP frame-ancestors
  // no funciona desde una etiqueta <meta>, así que se comprueba aquí.
  if (window.top !== window.self) {
    document.documentElement.hidden = true;
    return;
  }

  // Etiquetas de salida: tabla propia, independiente del HTML.
  const FIELDS = [
    ["campo-01", "Asunto"],
    ["campo-02", "Implicado"],
    ["campo-03", "Nombre"],
    ["campo-04", "DNI"],
    ["campo-05", "Tfno"],
    ["campo-06", "Dirección"],
    ["campo-07", "F.Nac y lugar nac"],
    ["campo-08", "Matrícula"],
    ["campo-09", "Correo electrónico"],
    ["campo-10", "N.º póliza y compañía"],
    ["campo-11", "Validez permiso"],
    ["campo-12", "Nombres padre y madre"],
    ["campo-13", "Municipio y provincia"]
  ];

  // Únicos textos que se muestran como aviso: constantes, sin datos de la ficha.
  const MSG = Object.freeze({
    copied: "Texto copiado. El portapapeles lo conserva hasta que lo sustituyas.",
    copyFailed: "No se ha podido copiar. Mantén pulsado el texto de la vista previa para seleccionarlo y copiarlo.",
    shared: "Texto entregado a la aplicación elegida. Comprueba que el destinatario es correcto.",
    shareFailed: "No se ha podido abrir el menú de compartir. Puedes copiar el texto.",
    noShare: "Este navegador no ofrece el menú de compartir. Utiliza «Copiar texto».",
    confirmClear: "¿Quieres vaciar todos los campos?",
    confirmNew: "¿Borrar todos los datos y empezar una ficha nueva?"
  });

  const form = document.getElementById("record-form");
  const formView = document.getElementById("form-view");
  const resultView = document.getElementById("result-view");
  const resultText = document.getElementById("result-text");
  const status = document.getElementById("status");
  const copyButton = document.getElementById("copy-button");
  const inputs = FIELDS.map(([id]) => document.getElementById(id));

  // Único estado de la aplicación: vive en memoria y en el DOM. Nunca se persiste.
  let currentText = "";
  let copyTimer = 0;
  const copyLabel = copyButton.textContent;

  function setStatus(message) {
    status.textContent = message;
  }

  function makeText() {
    return FIELDS.map(([, label], i) => {
      const value = inputs[i].value.trim();
      return value ? `${label}: ${value}` : `${label}:`;
    }).join("\n");
  }

  function clearSelection() {
    const sel = window.getSelection && window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  // Elimina cuanto puede la app: campos, texto generado y avisos.
  // (JavaScript no permite garantizar el borrado físico de la memoria.)
  function wipe() {
    form.reset();
    for (const input of inputs) input.value = "";
    currentText = "";
    resultText.textContent = "";
    setStatus("");
    clearTimeout(copyTimer);
    copyButton.textContent = copyLabel;
    clearSelection();
  }

  function show(view, title) {
    formView.hidden = view !== formView;
    resultView.hidden = view !== resultView;
    window.scrollTo(0, 0);
    title.focus({ preventScroll: true });
  }

  function showResult() {
    currentText = makeText();
    resultText.textContent = currentText;
    setStatus("");
    show(resultView, document.getElementById("result-title"));
  }

  function showForm() {
    setStatus("");
    show(formView, document.getElementById("form-title"));
  }

  function execCopyFallback(text) {
    const helper = document.createElement("textarea");
    helper.className = "clip-helper";
    helper.value = text;
    helper.readOnly = true;
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    helper.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } finally {
      helper.value = "";
      helper.remove();
      clearSelection();
    }
    return ok;
  }

  async function copyText() {
    const text = currentText;
    let ok = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function" && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (_) {
      ok = false;
    }
    if (!ok) {
      try {
        ok = execCopyFallback(text);
      } catch (_) {
        ok = false;
      }
    }
    if (ok) {
      setStatus(MSG.copied);
      copyButton.textContent = "Copiado ✓";
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { copyButton.textContent = copyLabel; }, 2500);
    } else {
      setStatus(MSG.copyFailed);
    }
  }

  async function shareText() {
    if (typeof navigator.share !== "function") {
      setStatus(MSG.noShare);
      return;
    }
    try {
      // Solo texto plano; sin título, URL, ficheros ni destinatarios.
      await navigator.share({ text: currentText });
      setStatus(MSG.shared);
    } catch (error) {
      setStatus(error && error.name === "AbortError" ? "" : MSG.shareFailed);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showResult();
  });
  document.getElementById("edit-button").addEventListener("click", showForm);
  copyButton.addEventListener("click", copyText);
  document.getElementById("share-button").addEventListener("click", shareText);
  document.getElementById("new-button").addEventListener("click", () => {
    if (!window.confirm(MSG.confirmNew)) return;
    wipe();
    showForm();
  });
  document.getElementById("clear-form").addEventListener("click", () => {
    if (window.confirm(MSG.confirmClear)) wipe();
  });

  // La aplicación no contiene enlaces; si apareciera alguno (por ejemplo, inyectado),
  // se bloquea cualquier navegación iniciada desde un <a>.
  const blockLinks = (event) => {
    const target = event.target instanceof Element ? event.target.closest("a") : null;
    if (target) event.preventDefault();
  };
  document.addEventListener("click", blockLinks, true);
  document.addEventListener("auxclick", blockLinks, true);

  // Safari/iOS puede restaurar campos al recargar o volver desde la caché de páginas (bfcache).
  // Además de autocomplete="off", se vacía todo en cada carga y al salir de la página.
  wipe();
  window.addEventListener("pageshow", wipe);
  window.addEventListener("pagehide", wipe);

  // Service Worker: solo en contexto seguro (HTTPS o localhost).
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(() => {});
    });
  }
})();
