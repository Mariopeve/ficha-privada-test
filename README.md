# Ficha privada (PWA para iPhone)

Formulario de 13 campos opcionales que genera un texto plano para copiar o compartir.
HTML, CSS y JavaScript vanilla. Sin backend, sin dependencias, sin compilación.

> Estado: **Hito 2** (código, pruebas automáticas y documentación). **No está completamente validada:**
> faltan las pruebas en un iPhone real (compartir y volver, cierre y reapertura, modo avión, instalación…).
> **Versión de pruebas 0.2.0-test: preparada, aún no publicada** (ver `docs/registro-de-publicacion.md`).

## Documentación

- `docs/informe-de-privacidad.md`
- `docs/informe-de-pruebas.md` (pruebas ejecutadas y pendientes)
- `docs/guia-de-publicacion-github-pages.md`
- `docs/guia-de-instalacion-iphone.md` (incluye el protocolo de pruebas en iPhone)
- `docs/guia-browserstack-live.md` (pruebas en iPhone real remoto desde Windows 11)
- `docs/registro-de-publicacion.md` (versión, fecha y despublicación)

## Probar en local

```bash
python -m http.server 8000     # desde esta carpeta; abrir http://localhost:8000
```

## Pruebas automáticas (datos ficticios)

```bash
node tests/static-audit.js     # auditoría estática del código
node tests/e2e.js              # pruebas en Chromium (requiere Playwright)
```

Las pruebas dinámicas se ejecutan en Chromium, **no en Safari/iOS**. Ver «Pendiente de verificar en iPhone» y `docs/informe-de-pruebas.md`.

## Privacidad: cómo está construida

- Los datos solo existen en memoria (variables y campos del DOM). No se usan `localStorage`,
  `sessionStorage`, IndexedDB, cookies ni Cache API para valores del formulario.
- CSP restrictiva en `<meta>`: `connect-src 'none'`, `form-action 'none'`, sin scripts ni estilos inline.
- El Service Worker guarda solo una lista cerrada de 7 archivos estáticos, rechaza otros orígenes y
  métodos distintos de GET, e ignora parámetros de URL.
- Se vacían los campos al cargar, al recargar y al salir de la página (`pageshow`/`pagehide`), además
  de `autocomplete="off"` y nombres de campo neutros.
- Avisos y errores son textos fijos: nunca incluyen datos de la ficha.
- Compartir usa `navigator.share({ text })`: solo texto, sin título, URL ni destinatario.

## Límites que la aplicación no controla

- El teclado de iOS puede tener sus propias sugerencias.
- Las capturas de pantalla pueden mostrar los datos.
- El portapapeles conserva el texto copiado hasta que se sustituya.
- Telegram, WhatsApp y otras aplicaciones gestionan lo recibido según sus políticas; no se puede
  garantizar el borrado una vez entregado el texto.
- JavaScript no permite garantizar el borrado físico de la memoria; solo se descartan las referencias.
- El hosting puede registrar IP y recursos solicitados (nunca el contenido del formulario).
- `frame-ancestors` no funciona desde `<meta>` ni se puede enviar como cabecera en GitHub Pages;
  se mitiga con una comprobación en JavaScript.
- Con GitHub Pages no se pueden fijar cabeceras HTTP propias (p. ej. `Cache-Control`).

## Pendiente de verificar en iPhone

Instalación desde Safari, apertura desde la pantalla de inicio, modo avión, menú nativo de compartir,
comportamiento real del teclado y de la restauración de formularios, y estado de la barra de estado.

## Estructura

```
index.html · manifest.json · service-worker.js
css/styles.css · js/app.js · icons/ · tests/ · docs/
```

Al cambiar cualquier archivo estático, incrementa `CACHE_NAME` en `service-worker.js`.
No incluyas datos reales en este repositorio.
