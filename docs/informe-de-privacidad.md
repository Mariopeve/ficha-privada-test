# Informe de privacidad — Ficha privada

Fecha: 24-11-2026 · Versión evaluada: Hito 2 (caché `ficha-privada-estatico-v3`)

> **Estado de validación: NO completamente validada.** Los controles descritos están implementados y
> verificados en Chromium y por revisión de código. Falta confirmar en un iPhone real el comportamiento
> de Safari/iOS (ver `informe-de-pruebas.md`, sección «Pendientes»).

## 1. Alcance

La aplicación es un formulario de 17 campos que genera un texto plano para copiar o compartir.
Puede contener datos personales de terceros (DNI, direcciones, teléfonos, fechas de nacimiento,
datos familiares, pólizas). Este informe describe adónde pueden llegar esos datos y qué controles existen.

## 2. Flujo de datos

```
Teclado de iOS → campos del formulario (memoria de la página)
              → texto generado (variable en memoria + vista previa)
              → [acción expresa] Copiar  → portapapeles de iOS
              → [acción expresa] Compartir → menú nativo de iOS → app elegida (Telegram, WhatsApp…)
```

- La aplicación **no envía** los datos a ningún servidor: no hay backend, endpoint, `fetch` de la
  aplicación, XMLHttpRequest, WebSocket ni beacon.
- El único tráfico de red es la descarga de los archivos estáticos de la aplicación y de las
  actualizaciones del Service Worker. Ninguna petición lleva datos del formulario.
- No hay envío automático, ni destinatarios predeterminados, ni bots.

## 3. Controles implementados y su verificación

| # | Control | Implementación | Verificación |
|---|---|---|---|
| 1 | Sin transmisión | Sin APIs de red en `app.js`; CSP `connect-src 'none'`, `form-action 'none'` | Auditoría estática; en Chromium la CSP bloqueó fetch (incluso al propio origen), WebSocket y formularios externos |
| 2 | Sin almacenamiento persistente | Sin `localStorage`, `sessionStorage`, IndexedDB, cookies ni Cache API para formularios | Auditoría estática; almacenamiento y cookies vacíos tras el uso; rastreo del perfil de Chromium sin rastro de los datos |
| 3 | Solo memoria | Estado en variables y DOM; vaciado al cargar, `pageshow` y `pagehide` | Pruebas R1a–R1c en Chromium. **iOS pendiente** |
| 4 | Sin restauración por el navegador | `autocomplete="off"` en formulario y campos, campos sin `name`, vaciado en `pageshow` | Chromium: recarga e «ir atrás». **Safari/iOS pendiente** |
| 5 | CSP restrictiva | `<meta http-equiv>` con `default-src 'self'`, `script-src 'self'`, `style-src 'self'`, `img-src 'self' data:`, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`; sin JS ni estilos inline | Auditoría estática y bloqueos observados en Chromium |
| 6 | Sin navegación externa | La app no contiene enlaces; los `<a>` inyectados se bloquean; formatos de detección de iOS desactivados (`telephone`, `date`, `address`, `email`); `referrer: no-referrer` | Chromium: enlaces inyectados no navegan. **iOS pendiente** (autodetección de teléfonos) |
| 7 | Service Worker acotado | Lista cerrada de 7 archivos; rechaza otros orígenes y métodos distintos de GET; ignora parámetros de URL; rechaza redirecciones | Chromium: la caché contiene exactamente esos 7 archivos; rutas no previstas no se cachean |
| 8 | Avisos sin datos | Los mensajes son constantes; los errores no muestran detalles | Revisión de código y comprobación de 14 textos vistos por el usuario más la consola |
| 9 | Compartir solo texto | `navigator.share({ text })`, sin título, URL ni ficheros | Chromium con `share` simulado. **Menú real de iOS pendiente** |
| 10 | Sin telemetría ni recursos remotos | Sin analítica, fuentes ni iconos remotos | Auditoría estática (sin URLs `http(s)` en el código) |
| 11 | Protección ante accidentes | Confirmación en «Nueva ficha» y en «Vaciar formulario» | Pruebas F6, F6b–F6d |

## 4. Lo que la aplicación NO controla (riesgos residuales)

> Desde la actualización de 17 campos, la aplicación ya **no muestra** estos avisos en pantalla (conserva solo el aviso breve de
> que los datos no se guardan ni se envían). Los riesgos siguen existiendo y se documentan solo aquí y en el README.

1. **Teclado de iOS:** puede tener sugerencias o aprendizaje propios. Se reducen con `autocomplete`,
   `autocorrect` y `spellcheck` desactivados y sin `name`, pero no se pueden garantizar. *Sin verificar en iPhone.*
2. **Capturas de pantalla y grabación:** pueden mostrar los datos.
3. **Portapapeles:** conserva el texto copiado hasta que se sustituya. La aplicación no lo borra
   y no afirma hacerlo. iOS puede avisar cuando una app lee el portapapeles; el contenido es accesible
   para otras apps y, si está activo, para el portapapeles universal entre dispositivos del mismo Apple ID.
4. **Aplicaciones receptoras:** Telegram, WhatsApp y similares tratan los datos según sus propias políticas.
   Una vez entregado el texto no se puede garantizar su borrado.
5. **Memoria:** JavaScript no permite garantizar el borrado físico de cadenas en memoria; la aplicación solo
   vacía los campos y descarta las referencias.
6. **Cierre brusco / cambios de aplicación:** el vaciado se produce al salir de la página (`pagehide`), no al
   pasar la app a segundo plano; mientras tanto los datos siguen en pantalla. Esto es deliberado para no
   perder la ficha al cambiar a Telegram, y debe confirmarse en iPhone.
7. **Hosting:** quien aloje los archivos (p. ej. GitHub Pages) puede registrar información técnica de las visitas
   (IP, recursos solicitados, fechas, agente de usuario). Eso es la visita a la web, **no el contenido del
   formulario**, pero tampoco es anonimato. Con una VPN o red distinta se puede reducir la exposición de la IP.
8. **Cabeceras HTTP:** GitHub Pages no permite cabeceras propias. `frame-ancestors` no funciona desde `<meta>`
   (se mitiga con una comprobación en JavaScript) y `Cache-Control` no es configurable. Como ninguna petición
   contiene datos, la caché HTTP no puede guardarlos.
9. **Dispositivo:** copias de seguridad, bloqueo de pantalla, malware o acceso físico quedan fuera del alcance.
10. **Modificación del código:** quien controle el repositorio podría publicar una versión distinta. Mantén
    acceso protegido (2FA) y revisa los cambios antes de publicar.

## 5. Datos en el repositorio

El repositorio no debe contener datos reales. Las pruebas usan datos ficticios (`ZZSENTINEL-…`, «Ficticio Ejemplo»).
La carpeta `tests/` es opcional para el despliegue.

## 6. Consideraciones legales (informativo, no es asesoramiento jurídico)

Para datos personales de terceros en uso profesional, comprueba con tu organización que el tratamiento y el
canal de envío (p. ej. mensajería) están autorizados y cumplen el RGPD y la LOPDGDD. Que la aplicación no
almacene datos no sustituye esa valoración, porque el uso de Telegram o WhatsApp sí implica transferir los datos a
esos servicios.

## 7. Conclusión

El diseño impide por construcción que la aplicación transmita o guarde los datos, y esto se ha verificado en Chromium.
La conclusión **«privacidad validada en iOS» no puede darse** hasta completar las comprobaciones de la guía en un iPhone real.
