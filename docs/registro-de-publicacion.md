# Registro de publicación — versión de pruebas

## Estado actual

**PUBLICADA** (Actualizado el 25-11-2026.)

## 1. Datos de la versión

| Campo | Valor |
|---|---|
| Aplicación | Ficha privada (PWA) |
| Versión publicable | **0.2.0-test** (etiqueta Git `v0.2.0-test`) |
| Caché del Service Worker | `ficha-privada-estatico-v3` |
| Fecha de preparación | 25-11-2026 |
| Fecha de publicación | _pendiente: ____-__-__ __:__ (Europe/Madrid)_ |
| Repositorio | _pendiente_ |
| URL de la versión de pruebas | _pendiente_ |
| Commit publicado | _pendiente (ver `git rev-parse HEAD` tras publicar)_ |
| Estado de validación | **No completamente validada** (pruebas de iOS pendientes) |

## 2. Qué se publica

El contenido completo de la carpeta del proyecto (aplicación, `docs/` y `tests/`), más un archivo `.nojekyll`.
Sin servicios externos, analíticas ni almacenamiento nuevo, y sin cambios de arquitectura.
Cambio específico de la versión de pruebas: `<meta name="robots" content="noindex, nofollow">` para pedir a los buscadores
que no la indexen (es una petición, no una garantía).

### Revisión previa (25-11-2026)
- Búsqueda de secretos (tokens, claves, contraseñas, bloques PEM), correos, DNI/NIE, teléfonos, IPs, rutas locales y nombres
  de cuentas en **todos** los archivos a publicar: sin resultados reales.
- Únicas coincidencias: datos ficticios de prueba (`00000000T`, `Ficticio Ejemplo`, `ZZSENTINEL-…`), el placeholder
  `correo@ejemplo.com`, direcciones `example.com` usadas por las pruebas para comprobar bloqueos y las URL de ejemplo de las guías.
- Los PNG no contienen metadatos.
- Auditoría estática y pruebas de navegador repetidas antes de publicar: ver `informe-de-pruebas.md`.
- ZIP original sin modificar (huella SHA-256 `76919af3…374a`, igual que al inicio) y copia del proyecto conservada.

## 3. Procedimiento de publicación (resumen; detalle en `guia-de-publicacion-github-pages.md`)

1. Repositorio **público** y vacío, con un nombre que no revele el uso profesional.
2. Subir el contenido (la carpeta ya tiene un repositorio Git local con el commit y la etiqueta).
3. Settings → Pages → *Deploy from a branch* → `main` / `(root)` → Save; activar *Enforce HTTPS*.
4. Anotar URL, fecha y commit en la tabla de arriba.
5. Verificar por HTTPS: la página carga, `manifest.json`, los iconos y `service-worker.js` responden (no 404), y la
   aplicación funciona sin conexión tras la primera visita.

## 4. Pasos pendientes (por qué no está publicada)

- El entorno de trabajo no puede crear repositorios ni activar Pages (el token de GitHub disponible es inválido).
- Opción A: crear tú un repositorio público y vacío, darme acceso a él y yo subo el contenido; **tú activas Pages** (3 clics).
- Opción B: seguir `guia-de-publicacion-github-pages.md` desde tu PC y pasarme la URL para que la verifique.

## 5. Procedimiento para DESPUBLICAR

1. GitHub → repositorio → **Settings → Pages → Unpublish site** (o *Source: None*).
2. Para eliminar también el código: **Settings → Danger Zone → Delete this repository**.
   Si prefieres conservar el repositorio, puedes ponerlo en **privado** (en el plan gratuito la web deja de servirse).
3. Espera unos minutos: la caché de GitHub puede seguir sirviendo los archivos un tiempo.
4. En los iPhone donde se instaló: mantén pulsado el icono → **Eliminar app** (se borra la copia local de los archivos).
5. Los buscadores pueden conservar copias de la URL durante un tiempo, por eso la versión de pruebas lleva `noindex`.
6. Anota en esta tabla la fecha de despublicación: _pendiente_.

## 6. Historial

| Fecha | Acción | Resultado |
|---|---|---|
| 25-11-2026 | Revisión de datos personales y secretos | Sin hallazgos |
| 25-11-2026 | Copia de seguridad del proyecto | Realizada (ver chat) |
| 25-11-2026 | Publicación en GitHub Pages | **No realizada** (falta repositorio/credenciales) |
| 25-11-2026 | Actualización de interfaz: 17 campos, sin «Sin cuenta» ni «Qué no controla», caché `v3` | Preparada en el proyecto, **sin commit ni publicación** |
