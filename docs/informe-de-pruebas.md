# Informe de pruebas — Ficha privada

Fecha: 24-11-2026 · Versión: Hito 2

> **Estado global: la aplicación NO está completamente validada.** Las pruebas ejecutadas se hicieron en
> **Chromium** (Playwright, contenedor Linux). **No se ha probado nada en Safari ni en un iPhone.**
> Las pruebas pendientes no se dan por superadas.

## 1. Entorno de las pruebas ejecutadas

- Chromium headless con Playwright; WebKit **no** estaba disponible.
- Servidor estático propio (`tests/server.js`), con `Cache-Control: max-age=600` y sin cabeceras de seguridad,
  para imitar un hosting estático.
- Datos exclusivamente ficticios. Cadena marcadora: `ZZSENTINEL-4F7K-n`.
- Comandos: `node tests/static-audit.js` y `node tests/e2e.js` (repetibles).

## 2. Resultado resumido

| Bloque | Resultado |
|---|---|
| Auditoría estática (`static-audit.js`) | **121 de 121** correctas |
| Pruebas de navegador (`e2e.js`) | **58 de 58** correctas, 0 fallidas |
| Pruebas en iPhone real | **0 ejecutadas, 3 comprobaciones críticas + extras pendientes** |

## 3. Pruebas EJECUTADAS (en Chromium)

### Funcionales
| ID | Prueba | Resultado |
|---|---|---|
| F0 | Las 17 etiquetas visibles coinciden en texto y orden con la lista acordada | Correcto |
| F1, F1b | Formulario vacío: finaliza y muestra las 17 etiquetas sin contenido | Correcto |
| F2c, F2d | Exactamente 17 campos de texto; sin «Sin cuenta» ni «Qué no controla»; se conserva el aviso de que los datos no se guardan ni se envían | Correcto |
| F2e | Los 4 pares de campos separados (fecha/lugar de nacimiento, póliza/compañía, padre/madre, municipio/provincia) son independientes, en ambos sentidos | Correcto |
| F2, F2b | Formulario parcial; al volver a modificar se conservan los datos | Correcto |
| F3, F3b | Formulario completo con tildes, ñ, símbolos y HTML (se muestra como texto) | Correcto |
| F4, F4b, F4c | Copiar con Clipboard API: contenido exacto, confirmación visual, sin afirmar borrado | Correcto |
| F4d, F4e | Copiar con alternativa (`execCommand`); no deja texto en el DOM | Correcto |
| F5–F5d | Compartir con `navigator.share` **simulado**: solo `{ text }`; cancelar sin error; error genérico sin datos; sin API se ofrece copiar | Correcto (simulado) |
| F6, F6b | «Nueva ficha»: rechazar conserva, aceptar vacía todo y vuelve al formulario | Correcto |
| F6c, F6d | «Vaciar formulario»: aceptar vacía, rechazar conserva | Correcto |

### Privacidad, red y almacenamiento
| ID | Prueba | Resultado |
|---|---|---|
| R1a | Recargar: campos vacíos | Correcto |
| R1b | Navegar a otra página y volver atrás: campos vacíos | Correcto |
| R1c | Evento `pageshow persisted` **simulado**: vacía los campos | Correcto (simulado; no es bfcache real) |
| C1 | Control: una página normal sí restaura al volver atrás | Correcto (valida R1b) |
| N0, N1, N1b | Sin enlaces; enlaces inyectados no navegan; sin peticiones externas en uso normal | Correcto |
| N2–N6 | La CSP bloquea fetch (incluso al propio origen), WebSocket, imágenes, iframes, scripts y formularios externos | Correcto |
| N7, N8 | Las peticiones externas provocadas se bloquean por CSP y ninguna se completa; la página no sale de la app | Correcto |
| S1–S3 | `localStorage`, `sessionStorage`, cookies e IndexedDB vacíos | Correcto |
| S4–S6 | Cache API: solo `ficha-privada-estatico-v3` con exactamente los 7 recursos; sin datos en URL ni cuerpo | Correcto |
| S7–S9 | Rutas no incluidas y parámetros de URL: ni se cachean ni llegan al servidor con datos | Correcto |
| S10, S11 | Ninguna petición recibida por el servidor contiene datos; todas son GET estáticas | Correcto |
| S12, U1 | Consola, errores y 14 textos de aviso/botón sin datos | Correcto |
| D1 | Rastreo de 85 archivos del perfil de Chromium (caché HTTP, Cache Storage, IndexedDB, sesión…): sin rastro | Correcto |
| C2 | Control: el rastreo detecta localStorage, cookies, Cache API e IndexedDB cuando existen | Correcto (valida D1) |

### PWA
| ID | Prueba | Resultado |
|---|---|---|
| O1 | Con el servidor detenido la app carga y funciona desde el Service Worker | Correcto (en Chromium) |
| A1, A2 | Actualización: la versión nueva espera sin forzarse; al reabrir se activa, se borra la caché antigua propia y no se toca otra ajena | Correcto |

### Estáticas (resumen de los 114 controles)
Sin APIs de red ni de almacenamiento, sin `console`, `eval` ni `innerHTML`; `fetch` solo en el Service Worker;
sin scripts, estilos, manejadores ni enlaces inline; 17 campos con `autocomplete="off"`, etiquetas y orden exactos, sin los elementos eliminados; CSP completa y sin `unsafe-*`;
metadatos iOS; lista del Service Worker coincide con los archivos y con lo que carga `index.html`;
iconos de 180, 192 y 512 px, con el de 180 opaco; manifest correcto.

### Adaptaciones por la actualización a 17 campos
- Las pruebas existentes se adaptaron (13 → 17 campos y nuevas etiquetas); **no se eliminó ninguna**. Se añadieron F2c–F2e y 7 controles estáticos.
- La caché del Service Worker pasa de `v2` a `v3` (y las pruebas de actualización de `v3`/`v4`), para que los dispositivos con la 0.2.0 reciban los cambios.
- Comprobado en Chromium: un cliente con la 0.2.0 instalada (13 campos, caché `v2`) pasa a 17 campos y a la caché `v3`, y se elimina la `v2`.
- Estos resultados corresponden a Chromium; **las pruebas de iOS (P1–P10) siguen pendientes**.

### Defectos hallados durante las pruebas (corregidos)
- Un comentario del Service Worker disparó un falso positivo de la auditoría: reformulado.
- La prueba N7 contaba intentos bloqueados como peticiones: se corrigió para exigir fallo por CSP y que no se completen.
- Los controles iniciales (recargar) no eran concluyentes en Chromium: se rehicieron con «ir atrás» y con almacenamiento real.

## 4. Pruebas PENDIENTES (no ejecutadas)

Estas no tienen resultado. Se completan con la guía `guia-de-instalacion-iphone.md`, sección 5.

> **Método previsto:** parte de estas pruebas puede hacerse en un iPhone real remoto con BrowserStack Live y parte solo en un
> iPhone propio (modo avión real, actualización del Service Worker, teclado). Ver `guia-browserstack-live.md`, sección 4.
> **Ninguna ha sido ejecutada todavía.** Al ejecutarlas se anotará método, dispositivo, versión de iOS y fecha.

### Críticas (las tres solicitadas)
| ID | Comprobación | Estado |
|---|---|---|
| P1 | Compartir y volver a la aplicación | **PENDIENTE** |
| P2 | Cierre y reapertura | **PENDIENTE** |
| P3 | Funcionamiento en modo avión | **PENDIENTE** |

### Otras pendientes en iOS
| ID | Comprobación | Estado |
|---|---|---|
| P4 | Instalación desde Safari y apertura desde la pantalla de inicio en modo independiente | PENDIENTE |
| P5 | Menú nativo de compartir con Telegram / WhatsApp: se entrega solo texto, sin destinatario | PENDIENTE |
| P6 | Restauración de formularios de Safari (incluida la caché de páginas) | PENDIENTE |
| P7 | Sugerencias y aprendizaje del teclado de iOS; autodetección de teléfonos | PENDIENTE |
| P8 | Barra de estado, áreas seguras y ausencia de zoom al enfocar campos | PENDIENTE |
| P9 | Actualización del Service Worker en iOS tras una publicación | PENDIENTE |
| P10 | Copiar y pegar en otra app | PENDIENTE |

### No realizables aquí, sin planificar
Cierre brusco del navegador con rastreo de disco (solo se probó cierre normal); pruebas en otros
navegadores (Firefox, WebKit).

## 5. Criterios de aceptación

| # | Criterio | Estado |
|---|---|---|
| 1 | Se puede instalar desde Safari en el iPhone | **Pendiente** (P4) |
| 2 | Se puede abrir desde la pantalla de inicio | **Pendiente** (P4) |
| 3 | Funcionan los 17 campos | Verificado en Chromium |
| 4 | Todos los campos son opcionales | Verificado en Chromium |
| 5 | Se muestran los campos vacíos | Verificado en Chromium |
| 6 | Se puede copiar el texto | Verificado en Chromium; **iOS pendiente** (P10) |
| 7 | Se puede compartir mediante el menú nativo de iOS | **Pendiente** (P1, P5); solo simulado |
| 8 | Funciona sin conexión tras la instalación | Verificado en Chromium; **iOS pendiente** (P3) |
| 9 | No existe almacenamiento persistente de formularios | Verificado en Chromium y por código; iOS pendiente (P2, P6) |
| 10 | No se transmiten datos a ningún servidor | Verificado en Chromium y por código |

## 6. Conclusión

Los criterios 1, 2 y 7 no se han podido comprobar y 6, 8 y 9 solo en Chromium. **El proyecto no puede darse por terminado.**
Cuando las pruebas P1 a P10 estén ejecutadas y anotadas, se actualizará este informe.
