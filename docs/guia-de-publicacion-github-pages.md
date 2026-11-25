# Guía de publicación en GitHub Pages

> **La aplicación NO está publicada.** Esta guía describe cómo hacerlo cuando lo autorices. Los comandos
> no se han ejecutado desde aquí.

> La versión de pruebas lleva `noindex`. Registra la publicación en `registro-de-publicacion.md`.

## 0. Antes de empezar

- GitHub Pages solo entrega archivos estáticos: **nunca recibe el contenido del formulario**.
- GitHub puede registrar datos técnicos de acceso (IP, recursos solicitados). Esto no es anonimato.
- Pages en repositorios **privados** requiere un plan de pago; en el plan gratuito el repositorio es **público**.
  Aunque no se anuncie, la URL pública se puede visitar. Por eso el repositorio no debe contener nada sensible.
- El nombre del repositorio forma parte de la URL: `https://TU-USUARIO.github.io/NOMBRE-REPO/`.
  Elige un nombre que no revele su uso profesional.
- Activa la verificación en dos pasos en tu cuenta de GitHub.

## 1. Revisión previa (en tu PC con Windows 11)

1. Abre PowerShell en la carpeta `ficha-privada`.
2. Ejecuta las pruebas si tienes Node y Playwright: `node tests/static-audit.js` y `node tests/e2e.js`.
3. Comprueba que no hay datos reales en ningún archivo.
4. Opcional: elimina la carpeta `tests/` del repositorio publicado. No afecta a la aplicación, pero así no se publican.

## 2. Crear el repositorio

1. En GitHub: **New repository**, nombre elegido, **Public**, sin README, sin `.gitignore`, sin licencia.
2. En PowerShell:

```powershell
cd ficha-privada
git init
git add .
git commit -m "Ficha privada: versión inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/NOMBRE-REPO.git
git push -u origin main
```

Revisa con `git status` y `git ls-files` qué archivos se suben antes del `push`.

## 3. Activar Pages

1. Repositorio → **Settings → Pages**.
2. **Source:** *Deploy from a branch* · rama `main` · carpeta `/ (root)` → **Save**.
3. Espera uno o dos minutos y abre la URL que aparece.
4. Marca **Enforce HTTPS** si está disponible (necesario para el Service Worker).

## 4. Comprobaciones tras publicar

- La URL carga con candado HTTPS y se ve el formulario.
- `…/manifest.json` y `…/icons/apple-touch-icon.png` se descargan (no dan 404).
- Abre `…/service-worker.js`: debe mostrarse el código.
- Después sigue `guia-de-instalacion-iphone.md`, sección 5. **No marques la aplicación como validada hasta completarla.**

## 5. Actualizaciones futuras

1. Modifica los archivos.
2. **Cambia `CACHE_NAME` en `service-worker.js`** (por ejemplo, `v2` → `v3`). Sin esto, los iPhone seguirán usando la caché antigua.
3. Si añades o quitas archivos estáticos, actualiza también `STATIC_FILES`.
4. Vuelve a ejecutar las pruebas.
5. Publica:

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```

6. Espera a que Pages se actualice (puede tardar unos minutos; sirve los archivos con una caché de unos 10 minutos).
7. En el iPhone, **cierra la app por completo** (selector de apps) y ábrela; la versión nueva se activa cuando
   no queda ninguna ventana de la anterior. Puede hacer falta abrirla una segunda vez. Este comportamiento en iOS
   está **pendiente de verificar** (P9).

## 6. Despublicar

**Settings → Pages → Unpublish site**, o borra el repositorio. Los iPhone que ya la instalaron conservarán una copia de
los archivos estáticos hasta que se elimine la aplicación de la pantalla de inicio.

## 7. Limitaciones del hosting

- No se pueden fijar cabeceras HTTP propias: la CSP va en `<meta>`, y `frame-ancestors` no funciona desde `<meta>`
  (hay una comprobación en JavaScript como mitigación).
- La aplicación vive bajo una ruta (`/NOMBRE-REPO/`); todas las rutas son relativas, por lo que no hay que configurar nada más.
- Otros sitios del mismo dominio `github.io` comparten origen con tu usuario si usas varias páginas de proyecto;
  el Service Worker solo borra cachés con prefijo `ficha-privada-`.
