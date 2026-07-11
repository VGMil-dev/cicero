---
slug: historias-usuario-gherkin
title: "Especificación de Historias de Usuario en Gherkin (MVP Cícero)"
sidebar_label: "Historias de Usuario (Gherkin)"
tags: [gherkin, specs, mvp, arquitectura, diseño, cliente-servidor]
---

# Especificación de Historias de Usuario (Gherkin)

Este documento sirve como **Guideline y Guía de Aceptación oficial** para la implementación de la transición de Cícero a una arquitectura cliente-servidor (frontend-backend). Define los comportamientos esperados en el cliente y el servidor bajo el enfoque de **Estado Híbrido (Hybrid State)** y autenticación de usuarios.

---

## 💡 Conceptos Clave de Arquitectura

1. **Segmentación y Almacenamiento Local**: El audio se graba y segmenta localmente en bloques de 3 minutos en `IndexedDB` (prefijado con el ID de usuario activo) sin enviar nada al backend durante la grabación.
2. **Procesamiento Diferido**: El procesamiento de audio y las llamadas HTTP al backend se inician *únicamente* cuando el usuario confirma voluntariamente que desea analizar su oratoria tras detener la grabación.
3. **Estado Híbrido (Hybrid State)**: El backend almacena temporalmente los fragmentos de audio e inferencias exitosas de una sesión en su base de datos. Si la red se cae, el frontend reanuda enviando únicamente los chunks pendientes tras validar el estado del servidor.
4. **Liberación de Recursos**: Si el usuario descarta o cancela la grabación, se envían peticiones `DELETE` para limpiar el almacenamiento en el servidor de inmediato.
5. **Notificaciones Push**: Para discursos largos, el usuario puede cerrar la app. El Service Worker recibirá un evento Web Push en segundo plano para notificarle cuando el reporte consolidado final esté listo.

---

## 📋 Especificaciones Gherkin

### Característica 1: Autenticación de Usuarios (Perfiles) y Evaluación Básica
```gherkin
# language: es
Requisito: Gestión de perfiles de usuario y evaluación de oratoria básica
  Como orador registrado en Cícero
  Quiero iniciar sesión y que mis evaluaciones de oratoria estén vinculadas a mi perfil
  Para proteger la privacidad de mis discursos y mantener mis datos aislados de otros usuarios del mismo equipo.

  Antecedentes:
    Dado que la conexión con el servidor API está disponible

  Escenario: Inicio de sesión exitoso y restauración de interfaz
    Dado que el usuario de ID "juan-123" abre la aplicación y no ha iniciado sesión
    Cuando introduce sus credenciales válidas y presiona "Iniciar Sesión"
    Entonces el frontend debe cargar el perfil de "juan-123"
    Y mostrar su historial de reportes de oratoria anteriores
    Y habilitar el panel de grabación para una nueva evaluación.

  Escenario: Cierre de sesión voluntario y advertencia de descarte de datos
    Dado que el usuario de ID "juan-123" ha iniciado sesión
    Y tiene una sesión de grabación local pendiente en IndexedDB (clave: "juan-123_session_chunks")
    Cuando presiona el botón "Cerrar Sesión"
    Entonces el frontend debe mostrar un diálogo de confirmación: "¿Deseas cerrar sesión? Las grabaciones locales pendientes en este dispositivo se perderán."
    Y si el usuario confirma que desea salir
    Entonces el frontend debe enviar una solicitud al backend para anular y eliminar el registro de su suscripción Web Push activa en este dispositivo
    Y el frontend debe limpiar de forma segura la caché de IndexedDB asociada a la clave "juan-123_session_chunks"
    Y destruir el token de sesión y redirigir a la pantalla de bienvenida vacía.

  Escenario: Aislamiento de caché local entre usuarios en el mismo dispositivo
    Dado que el usuario "juan-123" cerró la pestaña del navegador sin cerrar sesión voluntariamente (preservando su caché local "juan-123_session_chunks")
    Cuando otro usuario "pedro-456" inicia sesión en el mismo navegador y dispositivo
    Entonces el frontend no debe mostrar ningún diálogo de recuperación de sesión de Juan
    Y debe ignorar la clave "juan-123_session_chunks" en IndexedDB
    Y debe inicializar o cargar únicamente la clave "pedro-456_session_chunks".

  Escenario: Evaluación exitosa de un discurso grabado corto
    Dado que el usuario "juan-123" tiene la sesión activa
    Cuando inicia la grabación de audio
    Y habla durante la sesión diciendo "Hola, eh, bueno, hoy hablaremos de oratoria"
    Y detiene la grabación
    Y confirma que "Sí" desea evaluar su discurso en el cuadro de diálogo
    Entonces el frontend debe crear una sesión de oratoria en el backend vinculada a "juan-123" (creando un sessionId)
    Y el frontend debe enviar el único fragmento de audio al backend asociado a la sesión de usuario
    Y el frontend debe enviar la petición de finalización de la sesión
    Y el backend debe retornar el reporte consolidado
    Y el frontend debe mostrar la transcripción resaltando las muletillas y las métricas calculadas en la pantalla.

  Escenario: Intento de evaluar un audio vacío o muy corto
    Dado que el usuario "juan-123" tiene la sesión activa
    Cuando inicia la grabación de audio
    Y detiene la grabación después de 1 segundo sin emitir palabras
    Entonces el frontend debe validar que el audio no contiene suficiente duración
    Y no debe mostrar el diálogo de confirmación ni enviar peticiones al backend.
```

### Característica 2: Segmentación Inteligente y Procesamiento Lineal (Audios Largos)
```gherkin
# language: es
Requisito: Segmentación inteligente de audio y envío lineal para procesamiento de discursos largos
  Como orador que realiza un discurso largo (más de 3 minutos)
  Quiero que la aplicación fragmente mi audio de forma inteligente y lo guarde en caché vinculada a mi ID de usuario
  Para evitar gastar recursos del servidor y procesar todo secuencialmente una vez que yo autorice el análisis.

  Antecedentes:
    Dado que el usuario "juan-123" ha iniciado sesión
    Y el tamaño objetivo de cada fragmento es de 3 minutos (180 segundos)

  Escenario: Segmentación inteligente durante silencios con codificación de audio independiente
    Dado que la grabación en curso ha superado los 2 minutos y 45 segundos (límite inferior de tolerancia)
    Cuando el frontend detecta un silencio o pausa de habla de al menos 0.5 segundos antes de llegar a los 3 minutos y 15 segundos (límite superior de tolerancia)
    Entonces el frontend debe realizar el corte de fragmento (Chunk 1) en ese punto de silencio exacto
    Y el frontend debe codificar el Chunk 1 como un archivo de audio independiente con metadatos y cabeceras de inicialización completas (ej. WebM/Opus)
    Y el frontend debe almacenar el Chunk 1 en IndexedDB local prefijado con el ID del usuario ("juan-123_session_chunks"), sin enviar nada al backend
    Y el frontend debe continuar la grabación para el Chunk 2 de manera fluida y sin interrupción de audio.

  Escenario: Segmentación forzada por límite de tiempo con solapamiento
    Dado que la grabación en curso llega a los 3 minutos y 15 segundos sin detectar ningún silencio de 0.5 segundos
    Cuando se alcanza el tiempo límite superior de tolerancia
    Entonces el frontend debe forzar el corte del fragmento (Chunk 1) en la marca de 3 minutos y 15 segundos
    Y guardar el Chunk 1 en IndexedDB local prefijado con el ID de usuario activo ("juan-123_session_chunks")
    Y continuar la grabación para el Chunk 2 aplicando un solapamiento (overlap) de 2 segundos al inicio del Chunk 2 para no truncar la palabra actual.

  Escenario: Procesamiento de fragmento final residual
    Dado que el usuario detiene la grabación total del discurso
    Cuando el último fragmento de audio residual grabado tiene una duración menor a 3 minutos (ej. 15 segundos)
    Entonces el frontend no debe aplicar el algoritmo de búsqueda de silencios ni solapamientos
    Y debe almacenar este fragmento final en IndexedDB local bajo la clave del usuario ("juan-123_session_chunks").

  Escenario: Procesamiento lineal y secuencial de la cola de fragmentos
    Dado que el frontend tiene almacenados en IndexedDB local 3 fragmentos de audio de "juan-123"
    Y el usuario ha confirmado que desea analizar su discurso
    Cuando se inicializa la sesión en el backend y se inicia el despacho de la cola
    Entonces el frontend debe iniciar la subida secuencial del Chunk 1 en la cola
    Y esperar que el trabajo del backend sea completado
    Y despachar de forma lineal el Chunk 2, repitiendo el proceso secuencialmente hasta procesar el fragmento final.

  Escenario: Recombinación de resultados y actualización progresiva en la UI
    Dado que el frontend ya procesó el Chunk 1 (duración: 0 a 178 segundos)
    Cuando el frontend recibe la respuesta de evaluación del Chunk 2 (duración del fragmento: 0 a 182 segundos, con solapamiento de 2s)
    Entonces el frontend debe ajustar los timestamps del Chunk 2 restando el solapamiento e incrementando el desplazamiento del corte exacto del Chunk 1 (sumando 176 segundos)
    Y debe ajustar proporcionalmente las marcas de tiempo de todos los diagnósticos de IA asociados al Chunk 2 (muletillas, palabras de relleno y pausas)
    Y debe concatenar la transcripción, los diagnósticos etiquetados y las métricas del Chunk 2 al reporte existente del Chunk 1
    Y debe actualizar dinámicamente la UI con la transcripción unificada, los resaltados por colores correspondientes y la nueva puntuación recalculada.
```

### Característica 3: Estrategias de Reintento y Gestión de Errores de API
```gherkin
# language: es
Requisito: Tolerancia a fallos y reintentos ante fallos de conexión y límites de API
  Como usuario del sistema
  Quiero que la aplicación intente recuperar las peticiones fallidas automáticamente y reporte claramente los fallos definitivos
  Para no perder mi progreso y entender si el servicio de IA se quedó sin créditos o está saturado.

  Escenario: Reintentos en el frontend ante errores temporales del backend
    Dado que el frontend envía el Chunk 2 a la API del backend
    Cuando el backend retorna un error temporal de red (ej. HTTP 503 o Timeout)
    Entonces el frontend debe reintentar el envío del Chunk 2 de forma automática hasta 3 veces utilizando una espera exponencial (2s, 4s, 8s)
    Y si el backend responde con éxito en el segundo intento, la cola lineal debe continuar procesando el Chunk 3 normalmente.

  Escenario: Timeout dinámico de subida de fragmento comprimido
    Dado que el frontend está subiendo el Chunk 2 (comprimido en formato Opus, ~540 KB)
    Cuando el tiempo de subida excede el límite del timeout (el cual se incrementa dinámicamente mientras haya bytes enviándose activamente)
    Entonces el frontend debe abortar la petición HTTP activa si ocurre inactividad de red
    Y tratar el timeout de inactividad como un fallo temporal de red, iniciando la secuencia de reintentos exponenciales automáticos.

  Escenario: Agotamiento de reintentos en el frontend
    Dado que el frontend ha intentado enviar el Chunk 2 un máximo de 3 veces sin éxito
    Cuando falla el último reintento
    Entonces el frontend debe pausar la cola de procesamiento lineal
    Y debe mostrar una alerta en la UI "Error de conexión temporal. El procesamiento del discurso se ha pausado"
    Y debe habilitar un botón de "Reintentar envío" para reanudar el procesamiento desde el Chunk 2 usando los datos locales de audio grabados en IndexedDB.

  Escenario: Reintentos en el backend ante límites de tasa (Rate Limits) de la API de IA
    Dado que el backend recibe un chunk de audio y lo envía a la API de Inteligencia Artificial externa
    Cuando la API de IA externa responde con un error de límite de tasa (HTTP 429 Too Many Requests)
    Entonces el backend debe reintentar la solicitud automáticamente hasta 3 veces con una breve espera
    Y si la API de IA procesa con éxito la petición en uno de los reintentos, el backend debe retornar el resultado HTTP 200 normal al frontend.

  Escenario: Error definitivo de la API de IA por falta de créditos
    Dado que el backend intenta invocar la API de IA externa
    Cuando la API de IA externa responde con un error definitivo indicando "Créditos agotados o Facturación inactiva" (ej. HTTP 402 Payment Required)
    Entonces el backend no debe realizar reintentos adicionales
    Y debe retornar una respuesta con código HTTP 402 al frontend detallando el error en el payload JSON
    Y el frontend debe capturar esta respuesta y notificar al usuario "Servicio de transcripción suspendido temporalmente por mantenimiento o límites de cuota del proveedor".
```

### Característica 4: Resiliencia de Sesión y Persistencia en Caché Local
```gherkin
# language: es
Requisito: Persistencia en caché local IndexedDB vinculada al usuario, resiliencia de sesión y portabilidad de reportes
  Como orador registrado
  Quiero que mi progreso de sesión local y reportes terminados se almacenen de forma segura e independiente en el cliente y en el servidor
  Para poder consultar mis informes de evaluación consolidados desde cualquier dispositivo y evitar pérdidas accidentales de datos.

  Antecedentes:
    Dado que el usuario "juan-123" grabó un discurso largo que se dividió en 5 fragmentos (Chunk 1 a Chunk 5)
    Y la aplicación procesó con éxito el Chunk 1 y el Chunk 2 (duración acumulada: 360 segundos)
    Y la sesión quedó interrumpida por red

  Escenario: Persistencia automática en caché IndexedDB vinculada a userId ante error definitivo
    Cuando la cola de procesamiento lineal se detiene por el error definitivo en el Chunk 3 en el Dispositivo A
    Entonces el frontend debe guardar en la caché de IndexedDB local de ese dispositivo:
      | Tipo de Elemento | Rango / Identificador | Estado |
      | Archivo de Audio | Chunks 1, 2, 3, 4, 5  | Grabado localmente |
      | Respuesta API    | Chunk 1               | Procesado con éxito |
      | Respuesta API    | Chunk 2               | Procesado con éxito |
    Y debe mantener guardados estos datos de forma local.

  Escenario: Reanudación optimizada del procesamiento (omitir chunks procesados con validación de estado)
    Dado que el frontend del Dispositivo A tiene almacenados en IndexedDB los audios de los Chunks 1 a 5 y los resultados de Chunk 1 y Chunk 2
    Cuando el usuario presiona el botón "Reintentar procesamiento" en el Dispositivo A
    Entonces el frontend debe realizar una petición de validación de estado al backend enviando el ID de la sesión "sesion-123" (GET /api/v1/sessions/sesion-123/status)
    Y si el backend responde con la lista exacta de chunks ya procesados exitosamente: `[1, 2]`
      Entonces el frontend debe omitir el envío de los Chunks 1 y 2
      Y debe reanudar la cola lineal enviando únicamente los Chunks 3, 4 y 5 al backend de forma secuencial.

  Escenario: Portabilidad de reportes multidispositivo
    Dado que el usuario "juan-123" completó una evaluación de oratoria y generó el reporte consolidado final para la sesión "sesion-123" desde su Laptop
    Y el reporte consolidado final está guardado con éxito en la base de datos de su perfil en el backend
    Cuando el usuario "juan-123" inicia sesión en Cícero desde su Teléfono Móvil
    Entonces el frontend del Teléfono Móvil debe consultar el historial de reportes de "juan-123" en el backend
    Y el backend debe retornar el historial que incluye el informe unificado de la sesión "sesion-123"
    Y el frontend del Teléfono Móvil debe mostrar en pantalla y habilitar la lectura y descarga del reporte consolidado final.

  Escenario: Recuperación de sesión incompleta al iniciar sesión
    Dado que el usuario "juan-123" inicia sesión en la aplicación Cícero en un dispositivo
    Cuando el frontend detecta en IndexedDB que existe la clave "juan-123_session_chunks" con grabaciones y respuestas parciales de la sesión "sesion-123"
    Entonces el frontend debe mostrar un diálogo modal informativo: "Hola Juan, tienes una sesión de evaluación pendiente. ¿Deseas reanudarla o descartarla?"
    Y si selecciona "Reanudar", el frontend debe cargar los resultados parciales en pantalla y habilitar la cola de envíos pendientes
    Y si selecciona "Descartar", el frontend debe enviar una solicitud de eliminación HTTP DELETE al backend indicando el ID de sesión "sesion-123"
    Y la aplicación debe borrar los registros locales "juan-123_session_chunks" de IndexedDB.

  Escenario: Intento de iniciar nueva grabación con sesión incompleta pendiente
    Dado que el frontend tiene almacenados en IndexedDB los audios y respuestas de la clave "juan-123_session_chunks"
    Cuando el usuario presiona el botón "Grabar" para iniciar una nueva sesión de audio sin haber resuelto (reanudado o descartado) la sesión anterior
    Entonces el frontend debe impedir el inicio de la grabación
    Y debe mostrar una alerta: "Tienes una sesión de evaluación pendiente en este dispositivo. Por favor, reanúdala o descártala antes de iniciar una nueva."

  Escenario: Limpieza total de caché al iniciar una nueva sesión
    Dado que el frontend tiene almacenados en IndexedDB los audios y respuestas de la clave "juan-123_session_chunks"
    Cuando el usuario presiona el botón "Nueva Sesión"
    Entonces el frontend debe borrar todos los datos asociados a "juan-123_session_chunks"
    Y debe restablecer el panel de grabación y la interfaz a sus valores vacíos iniciales.
```

### Característica 5: Control de Estado y Cancelación
```gherkin
# language: es
Requisito: Control de estado ante interrupciones, cancelaciones y optimización de procesamiento
  Como usuario de Cícero
  Quiero poder detener, cancelar o confirmar si deseo procesar mi evaluación en cualquier momento
  Para que los procesos asíncronos pendientes no afecten la interfaz y el servidor no procese audios de forma innecesaria.

  Escenario: Cancelación de sesión con solicitudes de fragmentos en curso
    Dado que el frontend está procesando linealmente la cola de fragmentos (ej. esperando respuesta de Chunk 2 de 3) de "juan-123"
    Cuando el usuario decide presionar el botón "Cancelar Sesión"
    Entonces el frontend debe vaciar inmediatamente la cola de fragmentos pendientes por enviar
    Y debe ignorar y descartar la respuesta HTTP del Chunk 2 una vez que llegue
    Y el frontend debe enviar una solicitud de eliminación HTTP DELETE al backend indicando el ID de sesión "sesion-123" y autenticación de "juan-123"
    Y el backend debe borrar inmediatamente todos los audios y las transcripciones parciales asociadas a esa sesión de su base de datos temporal
    Y el frontend debe limpiar la pantalla, vaciar la caché "juan-123_session_chunks" en IndexedDB y restablecer la UI al estado inicial.

  Escenario: Confirmación interactiva al terminar de grabar
    Dado que el usuario ha presionado el botón "Detener Grabación"
    Cuando la grabación de audio se detiene
    Entonces el frontend no debe enviar nada al backend
    Y debe presentar un diálogo interactivo: "¿Deseas analizar esta oratoria para generar el reporte de fluidez?"
    Y proporcionar las opciones de "Sí, analizar" y "No, descartar".

  Escenario: Descarte local voluntario de la grabación
    Dado que se presenta el diálogo interactivo post-grabación
    Cuando el usuario selecciona la opción "No, descartar"
    Entonces el frontend debe borrar la caché "juan-123_session_chunks" de IndexedDB, eliminando los fragmentos de audio locales
    Y restablecer la UI al estado inicial sin realizar ninguna llamada HTTP al backend.

  Escenario: Aprobación voluntaria del análisis de oratoria
    Dado que se presenta el diálogo interactivo post-grabación
    Cuando el usuario selecciona la opción "Sí, analizar"
    Entonces el frontend debe iniciar la sesión de oratoria en el backend vinculada a "juan-123" (POST /sessions)
    Y empezar a despachar secuencialmente de forma lineal la cola de fragmentos locales grabados en IndexedDB ("juan-123_session_chunks") hacia el backend
    Y enviar la llamada HTTP POST al endpoint "/finalize" al procesar el último fragmento local
    Y cambiar el indicador de estado a "Evaluación Completada" al recibir el reporte final consolidado.
```

### Característica 6: Identificación de Cliente y Gestión de Carga en el Backend
```gherkin
# language: es
Requisito: Identificación de la aplicación de origen y administración de procesamiento concurrente
  Como administrador del sistema de Cícero
  Quiero que la API de backend identifique la aplicación de origen de cada petición y gestione de manera controlada los procesos concurrentes
  Para proteger el servidor contra sobrecargas, evitar timeouts y procesar peticiones en paralelo de forma balanceada.

  Antecedentes:
    Dado que el backend expone un puerto API público
    Y el límite máximo de procesamiento de audio en paralelo configurado en el backend es de 5 hilos simultáneos

  Escenario: Identificación y autorización de aplicaciones cliente
    Dado que el frontend de Cícero tiene configurada una clave de aplicación "X-App-Origin-Key" válida
    Cuando envía una petición de procesamiento de audio al backend
    Entonces el backend debe leer y verificar la cabecera "X-App-Origin-Key"
    Y debe autorizar la petición y continuar con el procesamiento.

  Escenario: Petición sin credenciales o con credenciales inválidas
    Cuando una aplicación envía una petición al backend sin la cabecera "X-App-Origin-Key" o con un valor inválido
    Entonces el backend debe rechazar inmediatamente la petición con un error HTTP 401 Unauthorized
    Y no debe gastar tiempo de procesamiento ni recursos en la API de IA.

  Escenario: Procesamiento concurrente paralelo en el backend
    Dado que el backend recibe solicitudes de procesamiento de 3 aplicaciones diferentes al mismo tiempo (Sesión A, Sesión B y Sesión C)
    Cuando el total de hilos en uso es de 3 (menor al límite configurado de 5)
    Entonces el backend debe instanciar 3 hilos de procesamiento en paralelo
    Y enviar los datos a la API de IA concurrente y retornar las respuestas asíncronas individualmente a cada cliente en cuanto finalice cada análisis.

  Escenario: Encolamiento asíncrono y despacho no bloqueante de fragmento
    Dado que el frontend tiene almacenado el Chunk 1 en IndexedDB y el usuario aprobó el análisis
    Cuando el frontend envía el Chunk 1 al backend (POST /api/v1/sessions/sesion-123/chunks)
    Entonces el backend debe guardar el audio en su almacenamiento temporal, encolar el trabajo de procesamiento y responder de inmediato con un código HTTP 202 Accepted y un Job ID "job-789"
    Y el frontend debe iniciar la monitorización del estado de "job-789" mediante Server-Sent Events (SSE) o polling de bajo consumo
    Y el frontend no debe bloquear el hilo de red principal durante la espera del resultado de la cola.

  Escenario: Procesamiento con prioridad para chunks subsecuentes de la misma sesión
    Dado que la sesión de "juan-123" ya ha procesado con éxito el Chunk 1
    Cuando el frontend envía el Chunk 2 al backend para encolamiento
    Entonces el backend debe colocar el trabajo de procesamiento del Chunk 2 en la cola de prioridad del backend (ej: BullMQ) con nivel de "Alta Prioridad"
    Y el backend debe procesar el Chunk 2 omitiendo el tiempo de espera de la cola estándar de nuevas sesiones para garantizar una UX continua y progresiva.

  Escenario: Retroalimentación en el frontend de la posición de espera en cola
    Dado que el backend ha encolado la petición de análisis del Chunk 1 del Cliente D en la posición 3
    Cuando el frontend recibe la confirmación de estado pendiente con los detalles de encolado
    Entonces el frontend debe mostrar un indicador visual "En cola: esperando procesamiento (Posición 3)..."
    Y cuando el backend notifique al frontend (a través de SSE/polling) la actualización de su posición conforme avanza (ej. posición 2, luego posición 1)
    Entonces el frontend debe actualizar dinámicamente la UI con la posición actual
    Y una vez que el hilo empiece el procesamiento real del audio, el frontend debe cambiar el mensaje a "Procesando fragmento..." antes de mostrar el resultado final.

  Escenario: Desconexión durante la monitorización de la posición en la cola
    Dado que el frontend está conectado mediante polling o eventos para seguir su puesto en la cola (ej. posición 3)
    Cuando la conexión de red se pierde momentáneamente y se corta el flujo de actualización
    Entonces el frontend debe intentar reconectar el canal de estado de forma silenciosa cada 3 segundos
    Y si la conexión no se restablece en 15 segundos, debe mostrar un mensaje "Conexión de cola inestable. Reintentando conectar..."
    Y una vez reestablecido el canal, debe recuperar la última posición reportada por el servidor sin interrumpir el encolamiento del audio.
```

### Característica 7: Flujo Híbrido de Análisis Progresivo y Consolidación Final
```gherkin
# language: es
Requisito: Retroalimentación progresiva en tiempo real y generación del reporte unificado de cierre
  Como orador que realiza un discurso
  Quiero ver los resultados parciales de mi discurso a medida que se procesa cada fragmento y recibir el reporte analítico global al finalizar la sesión
  Para mantener una UX viva e interactiva durante la grabación y obtener un análisis holístico de mi desempeño al concluir.

  Antecedentes:
    Dado que el usuario ha iniciado una sesión de oratoria en el frontend con el ID de sesión "sesion-123"
    Y ha confirmado voluntariamente que desea evaluar su discurso en el diálogo interactivo

  Escenario: Retroalimentación e interactividad en tiempo real con resultados parciales
    Cuando el frontend sube el Chunk 1 de audio a la API del backend
    Entonces el backend debe procesar y guardar localmente la transcripción del Chunk 1
    Y el backend debe retornar de inmediato una respuesta parcial con la transcripción y muletillas del Chunk 1
    Y el frontend debe mostrar progresivamente la transcripción del Chunk 1 en pantalla con las muletillas resaltadas.

  Escenario: Clasificación de muletillas y pausas con visualización por código de colores
    Dado que el backend procesa un fragmento de audio e identifica diversas anomalías en la fluidez del habla
    Cuando retorna los resultados parciales de la transcripción etiquetados al frontend
    Entonces el frontend debe mapear visualmente cada palabra y marcador de tiempo en el editor de texto siguiendo el código de colores establecido:
      | Categoría de Diagnóstico | Explicación / Ejemplos | Resaltado visual en UI |
      | Muletillas Acústicas     | Sonidos de relleno vocal: "eh", "mmm", "ah", "uh" | Subrayado en Rojo (Severo) |
      | Palabras de Relleno      | Muletillas verbales de transición: "este", "bueno", "tipo", "o sea", "nada" | Subrayado en Naranja/Amarillo (Transición) |
      | Pausas Prolongadas       | Silencios o brechas sin habla superiores a 2.5 segundos | Etiqueta [Pausa: Xs] en Azul en la línea de tiempo |
    Y el frontend debe habilitar tooltips sobre cada elemento resaltado mostrando el tipo de diagnóstico y la marca de tiempo de ocurrencia.

  Escenario: Consolidación final de reporte con filtros avanzados al finalizar la sesión
    Dado que la sesión de grabación ha finalizado
    Cuando el frontend envía una petición de finalización de sesión "POST /api/v1/sessions/sesion-123/finalize"
    Entonces el backend debe recuperar todos los chunks almacenados de la sesión "sesion-123"
    Y el backend debe calcular las métricas agregadas globales (puntuación unificada de fluidez, WPM consolidado)
    Y el backend debe aplicar filtros de IA avanzados de análisis global (coherencia semántica, estructura del discurso y feedback motivacional)
    Y el backend debe retornar el reporte consolidado final
    Y el frontend debe ocultar los indicadores parciales y renderizar en pantalla el reporte integral definitivo, habilitando la descarga del documento completo.
```

### Característica 8: Notificaciones Push Web para Reportes en Segundo Plano
```gherkin
# language: es
Requisito: Envío de notificaciones push web al finalizar el procesamiento en segundo plano
  Como orador registrado en Cícero
  Quiero recibir una notificación push en mi dispositivo cuando mi reporte de oratoria esté listo si decidí cerrar la aplicación
  Para no tener que esperar activamente con la pantalla abierta mientras finaliza el procesamiento de discursos largos.

  Antecedentes:
    Dado que el usuario "juan-123" ha iniciado sesión en la PWA de Cícero
    Y la aplicación cuenta con permisos concedidos para mostrar notificaciones push del navegador

  Escenario: Registro de suscripción push
    Cuando el Service Worker de Cícero se inicializa en el navegador de "juan-123"
    Entonces el frontend debe solicitar una suscripción al servicio Web Push del navegador
    Y enviar el objeto Subscription al backend para guardarlo asociado al perfil de "juan-123" en el servidor.

  Escenario: Gestión inteligente de Push en el cliente (Service Worker)
    Dado que el backend emite un evento Web Push para el usuario "juan-123" con el reporte de la sesión "sesion-456"
    Cuando el Service Worker del navegador recibe el evento en segundo plano
    Entonces el Service Worker debe comprobar si la pestaña de la aplicación Cícero está abierta y visible en ese navegador
    Y si la pestaña no está abierta o enfocada, debe mostrar la notificación del sistema en el dispositivo operativo del usuario
    Y si la pestaña está activa y enfocada, debe emitir un evento interno de actualización de la UI en tiempo real en la pantalla y omitir la alerta del sistema.

  Escenario: Redirección post-autenticación al interactuar con la notificación
    Dado que el usuario hace clic en la notificación del sistema para ver el reporte de la sesión "sesion-456"
    Y la sesión de autenticación del usuario ha caducado
    Cuando el Service Worker redirige al usuario a la aplicación de Cícero
    Entonces el frontend debe almacenar la ruta de redirección destino `/reports/sesion-456`
    Y debe mostrar la pantalla de inicio de sesión
    Y al introducir credenciales válidas, el frontend debe redirigir al usuario directamente al reporte de la sesión "sesion-456" en lugar del dashboard general.
```
