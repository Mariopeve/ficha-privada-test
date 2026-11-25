# Guía de pruebas en iPhone real con BrowserStack Live (desde Windows 11)

> **Estado: preparada, NO ejecutada.** Ninguna prueba específica de iOS se da por superada hasta que se ejecute
> y se anote el resultado (con dispositivo, versión de iOS y método).
> Esta guía parte de la documentación oficial de BrowserStack consultada el 25-11-2026; compruébala de nuevo,
> porque la plataforma cambia.

## 1. Qué es y qué no es

BrowserStack Live te da acceso remoto, desde el navegador de tu PC, a un **iPhone real alojado en su nube** con Safari.
Sirve para comprobar el comportamiento de Safari/iOS (WebKit real). No sustituye a tu iPhone en todo.

### Advertencia de privacidad (importante)
- Todo lo que escribas pasa por servidores de un tercero y la sesión puede grabarse (BrowserStack ofrece grabación para informes de errores).
- **Usa solo datos ficticios.** No inicies sesión con tus cuentas personales (Apple ID, Telegram, WhatsApp, correo) en el dispositivo alquilado.
- BrowserStack indica que los dispositivos reales se restablecen de fábrica tras cada uso, por lo que no se conserva nada entre sesiones (ni instalaciones ni cachés).
- Esto no cambia el diseño de la aplicación: sigue sin enviar datos a ningún servidor. Es una precaución sobre la herramienta de pruebas.

## 2. Requisitos

- Cuenta de BrowserStack con acceso a **dispositivos reales iOS** en Live (comprueba que tu plan o periodo de prueba lo incluye).
- La URL HTTPS de la versión de pruebas (ver `registro-de-publicacion.md`). **No se necesita BrowserStack Local**, porque la aplicación estará en una URL pública.
- Recomendado: un iPhone con iOS 16.4 o superior (versión reciente), para acercarse al comportamiento actual de las aplicaciones web instaladas.

## 3. Cómo iniciar una sesión

1. En tu PC con Windows 11 abre `https://live.browserstack.com` e inicia sesión.
2. Elige **iOS** → un **iPhone** reciente → **Safari**.
3. Escribe la URL de la versión de pruebas y pulsa Ir.
4. Usa los controles de la barra de herramientas de Live para capturas, grabación y red.

## 4. Qué se puede probar y con qué limitaciones

La última columna indica lo que **debe confirmarse en la propia sesión**; no se da por hecho.

| ID | Comprobación | ¿En BrowserStack? | Notas / limitaciones |
|---|---|---|---|
| P4 | Instalar desde Safari y abrir desde la pantalla de inicio | **A comprobar** | Intentar Compartir → Añadir a pantalla de inicio. Si la sesión no lo permite, anotarlo y probar en tu iPhone |
| P1 | Compartir y volver a la aplicación | **A comprobar** | Probar que el menú de compartir se abre y qué apps hay (es posible que no estén Telegram ni WhatsApp: usar Notas, Mensajes o copiar) |
| P2 | Cierre y reapertura | Sí, **dentro de una sola sesión** | Cerrar la app con el selector de apps y reabrirla desde el icono. Si no se pudo instalar, cerrar la pestaña de Safari y reabrir la URL |
| P3 | Funcionamiento sin conexión | **Parcial: simulación, no modo avión real** | Usar **Throttle Network → Offline** (documentado; tarda 40–60 s; iOS 15 o superior). Abrir la app **con conexión primero**, esperar unos segundos a que el Service Worker guarde los archivos, y después pasar a Offline y abrirla/recargarla. El modo avión literal solo se puede comprobar en un iPhone propio |
| P5 | Menú nativo de compartir con Telegram/WhatsApp | Probablemente **no** | Esas apps probablemente no estén. Comprobar con Notas o Mensajes que llega solo el texto |
| P6 | Restauración de formularios de Safari | Sí | Rellenar → ir a otra página → atrás; recargar; cerrar y reabrir la pestaña |
| P7 | Sugerencias del teclado y autodetección de teléfonos | **Poco concluyente** | El dispositivo está limpio, sin historial aprendido: que no aparezcan sugerencias no demuestra que no vayan a aparecer en tu iPhone. La autodetección de teléfonos sí puede verse |
| P8 | Barra de estado, áreas seguras, ausencia de zoom al enfocar | Sí | Verificar en modo instalado si P4 funciona; si no, solo en Safari |
| P9 | Actualización del Service Worker | **No** | Los dispositivos se restablecen entre sesiones, así que no se conserva la versión anterior. Probar en tu iPhone |
| P10 | Copiar y pegar en otra app | **A comprobar** | Pegar en Notas o en la barra de direcciones; la integración del portapapeles con tu PC puede variar |

### Qué sigue requiriendo tu iPhone
- Modo avión real (P3 literal), actualización del Service Worker (P9), sugerencias reales del teclado (P7), Telegram/WhatsApp reales (P5).

## 5. Secuencia recomendada (una sola sesión, todo con datos ficticios)

1. Abrir la URL en Safari. Esperar a que cargue el formulario. Capturar pantalla.
2. Comprobar que **no hay zoom** al tocar un campo y que no hay desbordes. (P8)
3. Intentar **Añadir a pantalla de inicio**. Anotar si es posible. (P4)
4. Abrir la app desde el icono (o continuar en Safari). Esperar ~10 s con conexión.
5. Rellenar Nombre y DNI ficticios. **Finalizar**. Comprobar el texto, con los campos vacíos como `Etiqueta:`.
6. **Copiar texto** y pegar en Notas. Comprobar tildes y ñ. (P10)
7. **Compartir** → elegir Notas o Mensajes. Comprobar que llega solo el texto. Volver a la aplicación y anotar el estado. (P1)
8. Cerrar la app con el selector de apps y reabrirla: el formulario debe aparecer vacío. (P2, P6)
9. **Throttle Network → Offline**. Esperar a la confirmación del panel. Abrir la app: debe cargar y permitir Finalizar y Copiar. (P3 simulado)
10. Volver a poner la red en estado normal, cerrar sesión y descargar la grabación/capturas como evidencia.

## 6. Cómo registrar los resultados

En `informe-de-pruebas.md`, para cada prueba indica: **resultado**, **método** (BrowserStack Live / iPhone propio), **dispositivo**, **versión de iOS**, **fecha** y **evidencia**.
Regla de validación:
- Una prueba solo pasa a «ejecutada» cuando se hizo de verdad y con su método anotado.
- Las que BrowserStack no puede cubrir (ver tabla) se quedan como **pendientes** hasta probarlas en tu iPhone.
- La aplicación no se marca como completamente validada hasta que P1–P3 y el resto estén resueltos, o su limitación esté aceptada por ti por escrito en el informe.

## Fuentes
- [Modo sin conexión en iOS en BrowserStack Live](https://www.browserstack.com/docs/live/network/network-simulation/offline-mode/offline-mode-ios)
- [Funciones de BrowserStack Live](https://www.browserstack.com/live/features)
