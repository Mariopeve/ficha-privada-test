# Guía de instalación y uso en iPhone

> Estado: **pendiente de validar en un iPhone real.** Los nombres exactos de los menús pueden variar según la versión de iOS.
> Cuando la guía y la realidad no coincidan, anótalo en la tabla de la sección 5.

## 1. Requisitos

- iPhone con Safari y conexión a Internet **solo para la primera apertura**.
- La URL HTTPS de la aplicación (ver `guia-de-publicacion-github-pages.md`).

## 2. Instalar

1. Abre la URL en **Safari**.
2. Espera a que cargue por completo el formulario.
3. Pulsa **Compartir** (cuadrado con flecha) → **Añadir a pantalla de inicio**.
4. Deja el nombre «Ficha privada» y pulsa **Añadir**.
5. Cierra Safari. **Abre la aplicación desde su icono, con conexión, al menos una vez**, para que se guarden los archivos.

## 3. Uso

1. Rellena los campos que necesites (todos son opcionales; puedes finalizar vacío).
2. Pulsa **Finalizar**: verás el texto completo, con los campos vacíos como `Etiqueta:`.
3. **Volver al formulario** para corregir; los datos se conservan mientras no salgas de la aplicación.
4. **Copiar texto:** copia al portapapeles. El texto permanece allí hasta que lo sustituyas.
5. **Compartir:** abre el menú de iOS; elige Telegram, WhatsApp u otra app y **comprueba el destinatario antes de enviar**.
6. **Nueva ficha · borrar datos** y **Vaciar formulario** piden confirmación antes de borrar.

## 4. Recomendaciones de privacidad

- No hagas capturas de pantalla de la ficha.
- Borra o sustituye el portapapeles cuando termines (por ejemplo, copiando una palabra cualquiera).
- Revisa los ajustes del teclado (predicción, aprendizaje) si trabajas con datos sensibles.
- Recuerda que lo que compartes lo gestiona la app receptora según sus políticas.
- Cierra la aplicación desde el selector de apps al terminar.

## 5. Comprobaciones pendientes en un iPhone real

> Alternativa o complemento: `guia-browserstack-live.md` (iPhone real remoto desde Windows 11). Anota siempre el **método**
> (BrowserStack / iPhone propio). El modo avión real y la actualización del Service Worker solo se comprueban en un iPhone propio.

Usa **datos ficticios**, no reales. Anota fecha, modelo, versión de iOS y resultado. Hasta completar P1–P3 y el resto,
la aplicación **no se considera validada**.

Datos de la prueba: Dispositivo: ________ · iOS: ________ · Fecha: ________ · Versión de la app (caché): v2

### P1 · Compartir y volver a la aplicación
1. Abre la app desde el icono. Rellena al menos Nombre y DNI con datos inventados.
2. **Finalizar → Compartir**. Elige una app (p. ej. «Notas» o un chat de Telegram contigo mismo).
3. Comprueba en la app receptora que llega **solo el texto** y que no hay destinatario predefinido.
4. Vuelve a la aplicación (selector de apps o cerrando el menú).
5. Anota qué ocurre: ¿sigue la vista de resultado con los datos, o se ha recargado vacía?

| Comprobación | Resultado esperado | Obtenido (OK / Falla / Notas) |
|---|---|---|
| Llega solo texto, sin título ni enlace | Sí | |
| No hay destinatario predeterminado | Sí | |
| Cancelar el menú no muestra error | Sí | |
| Al volver, la app funciona (datos presentes o vacía, **anotar cuál**) | Sin errores ni datos duplicados | |
| La confirmación no incluye datos personales | Sí | |

### P2 · Cierre y reapertura
1. Rellena campos con datos inventados y pulsa **Finalizar**.
2. Cierra la app por completo (selector de apps, desliza hacia arriba).
3. Ábrela de nuevo desde el icono.

| Comprobación | Resultado esperado | Obtenido |
|---|---|---|
| El formulario aparece vacío | Sí | |
| No aparece la vista de resultado ni datos previos | Sí | |
| No hay sugerencias del sistema con los datos al empezar a escribir | Idealmente no (anotar si las hay) | |
| Repetir: rellenar sin finalizar, cerrar y reabrir | Formulario vacío | |

### P3 · Modo avión
1. Con conexión, abre la app desde el icono y comprueba que carga. Ciérrala del todo.
2. Activa el **modo avión** (y desactiva el Wi-Fi si queda activo).
3. Abre la app desde el icono.

| Comprobación | Resultado esperado | Obtenido |
|---|---|---|
| Se abre desde el icono sin conexión, con diseño correcto e icono | Sí | |
| Se pueden rellenar los campos y **Finalizar** | Sí | |
| **Copiar texto** funciona y se puede pegar en Notas | Sí | |
| **Compartir** abre el menú (el envío fallará sin red, es normal) | Menú visible | |
| No aparecen errores de red ni mensajes con datos | Sí | |

Al terminar, desactiva el modo avión.

### Otras comprobaciones (P4–P10)
| ID | Comprobación | Obtenido |
|---|---|---|
| P4 | Se instala desde Safari y se abre a pantalla completa, sin barras de Safari | |
| P6 | Al volver desde otra pestaña o app Safari no se restauran campos antiguos | |
| P7 | Sin sugerencias del teclado con datos previos; teléfonos y fechas no se convierten en enlaces | |
| P8 | Sin zoom al tocar un campo; contenido no tapado por la barra de estado ni la barra inferior | |
| P9 | Tras publicar una versión nueva (cambio de `CACHE_NAME`), la app pasa a la nueva al cerrarla y reabrirla | |
| P10 | Copiar y pegar en otra app: el texto es exacto, con tildes y la ñ | |

## 6. Si algo falla

- No carga sin conexión: ábrela con conexión desde el icono y espera unos segundos; cierra y repite.
- Parece una versión antigua: cierra la app del todo y ábrela con conexión; si persiste, elimínala de la pantalla
  de inicio y vuelve a instalarla desde Safari.
- Anota el fallo y la versión de iOS y comunícalo antes de dar la aplicación por válida.

## 7. Desinstalar

Mantén pulsado el icono → **Eliminar app**. Se borran los archivos guardados. La aplicación no guarda fichas.
