# Decisiones de Diseño

En esta seccion se detallan las decisiones arquitectonicas clave para **Cicero**. Estas paginas describen la direccion tecnica preferida del proyecto y el estado de transicion del repositorio; no todas las piezas deben leerse como implementacion cerrada.

## 🤖 Transformers.js sobre Vosk (El Motor de IA)
Inicialmente se evaluó `vosk-browser` por su bajísima latencia. Sin embargo, se decidió pivotar hacia **Transformers.js (Hugging Face)** por tres razones arquitectónicas críticas:
1.  **Soporte TypeScript y Ecosistema Moderno:** Transformers.js es nativo de la web moderna, permitiendo un código limpio, fuertemente tipado y fácil de integrar en Web Workers dentro de Next.js, a diferencia de la API más arcaica de Kaldi/Vosk.
2.  **Transcripción Verbatim (El problema de Whisper):** Los modelos tradicionales de Speech-to-Text limpian el audio (borran los "eh" y "mmm"). Al usar Transformers.js, podemos cargar **CrisperWhisper**, un modelo ONNX especializado específicamente en transcripción literal que *retiene* las muletillas y provee timestamps precisos por palabra, lo cual es el core de nuestra aplicación.
3.  **Aceleración de Hardware:** Transformers.js (v3) soporta **WebGPU**, lo que permite delegar la inferencia a la tarjeta gráfica del usuario en lugar de bloquear la CPU, logrando velocidades de procesamiento muy superiores.

## 🌐 Estrategia Web-First con PWA
El requerimiento original exploro una app movil hibrida tradicional. En la etapa actual priorizamos una **Progressive Web App (PWA)** en Next.js como frente principal de validacion.
- **Justificacion**: La web nos permite iterar mas rapido sobre el flujo central, descargar el modelo ONNX en la cache del navegador y aprovechar APIs modernas del cliente sin duplicar complejidad desde el inicio.
- **Nota de transicion**: Esto no impide una experiencia movil futura, pero evita abrir dos frentes de implementacion antes de validar el camino principal.

## 🚀 Reduccion del Backend Tradicional (Serverless / BaaS)
Se reduce el diseno inicial de una API centralizada dedicada.
- **Menos cuellos de botella**: Procesar audio en un backend central genera costos altos de CPU y red. Al delegar la inferencia al dispositivo del usuario (Client-Side AI), la necesidad de una capa backend propia disminuye de forma importante.
- **Supabase directo**: La direccion objetivo es apoyarse en Supabase y capacidades serverless o **Server Actions** para persistencia y coordinacion ligera.
- **Nota de transicion**: Si aparecen requisitos que lo justifiquen, una capa backend dedicada podria reintroducirse de forma acotada. La preferencia actual es no hacerla el centro de la arquitectura.

## 📐 Patrones Arquitectónicos (Clean Architecture)
Para evitar quedar atados a Supabase y cumplir con los estándares de mantenibilidad, aplicamos **Clean Architecture (Ports & Adapters)**:
- **Separación**: Los componentes UI solo renderizan el texto y los timestamps generados por la IA.
- **Puertos**: El dominio se comunica a través de interfaces (`ISpeechEngine`, `ISessionRepository`).
- **Adaptadores**: Implementamos adaptadores como el `TransformersSpeechAdapter` que orquesta la comunicación con el Web Worker.

## ⚙️ Aislamiento de IA y Carga Asíncrona (Web Workers)
Para evitar que la descarga y procesamiento de modelos de ~50MB congelen la interfaz de usuario, se ha decidido externalizar toda la lógica de Transformers.js a un **Web Worker**.

- **Patrón Singleton**: El Worker implementa un Singleton para asegurar que el modelo se descargue e inicialice una sola vez por sesión, optimizando el uso de memoria y CPU.
- **Carga en Segundo Plano**: Al ejecutarse en un hilo del procesador independiente, la UI de React permanece reactiva incluso durante procesos intensivos de inferencia (transcripción).
- **Feedback de Usuario (Progress Events)**: El Web Worker envía mensajes de estado al hilo principal mediante `progress_callback`, permitiendo mostrar barras de carga precisas ("Descargando modelo... 45%").
- **Optimización de Caché**: Se utiliza la Cache API del navegador de forma transparente a través de Transformers.js, garantizando que tras la primera descarga, el acceso al modelo sea casi instantáneo y offline.
- **Configuracion Webpack**: Se ajusta la configuracion de la aplicacion web para ignorar binarios de servidor (`onnxruntime-node`) en el bundle del cliente, garantizando compatibilidad con el entorno del navegador.

## 🛡️ Resiliencia y Manejo de Errores Críticos (Zero Trust)
Dado que la inferencia ocurre en el dispositivo del usuario, el entorno es impredecible. Se implementa una política de "Desconfianza Total" para garantizar la estabilidad de la PWA.

- **Mitigación de Falso Positivo Offline**: No se confía exclusivamente en `navigator.onLine`. El sistema intenta primero resolver el modelo mediante `caches.match` (Cache API). Si no existe localmente, se manejan Timeouts explícitos y errores de red para informar al usuario sobre la necesidad de una conexión real para la descarga inicial.
- **Prevención de Out of Memory (OOM)**: 
    - Se exige el uso de **modelos cuantizados** (ej. `dtype: 'q8'` o `'q4'`) para reducir la huella en RAM de ~500MB a `<100MB`, permitiendo la ejecución en dispositivos móviles de gama media/baja.
    - Se implementa la liberación manual de memoria mediante `.dispose()` en el pipeline antes de cerrar hilos o sesiones prolongadas.
- **Gestión de Cuota de Almacenamiento**: Antes de iniciar descargas de modelos, se consulta `navigator.storage.estimate()`. Si el espacio disponible es insuficiente para el modelo y su caché, se bloquea la descarga y se solicita limpieza de disco al usuario, evitando corrupciones de archivos.
- **Estrategia de Fallback y Resucitación**:
    - **Hardware Fallback**: Si el acceso a WebGPU falla o el driver de video crashea, el sistema debe reintentar automáticamente la carga usando WASM (CPU).
    - **Fatal Error Monitor**: React monitorea `worker.onerror` para detectar pánicos de WASM que no son capturados por el `try/catch` tradicional. Ante un crash, la UI aplica `worker.terminate()` y ofrece un mecanismo de reinicio limpio ("IA Reset").

## 🎭 Desarrollo Desacoplado: Estrategia "Mock-First"
Para evitar que el desarrollo de la Interfaz de Usuario (Front-end) quede bloqueado esperando la implementación compleja de los Web Workers de IA o la integración con hardware real (Micrófonos), se adopta una política de desarrollo **Mock-First** guiada por contratos.

- **Puertos Estrictos**: Toda interacción con hardware o IA se define mediante interfaces TypeScript (Puertos) en la capa Core (ej. `IAudioModelBootstrap`, `IAudioRecorder`).
- **Fakes Controlables**: Se implementan clases `Fake` que respetan estos contratos pero no tocan APIs reales. Estas clases exponen configuraciones (Fixtures) para simular escenarios específicos (ej. forzar un error de red al 50% de la carga del modelo, o simular que el usuario deniega permisos).
- **Inyección de Dependencias**: La UI consume estas dependencias mediante inyección en Hooks o Stores. Cuando los adaptadores reales (Worker, MediaRecorder) estén listos en una Fase 2, se intercambiarán por los Fakes sin requerir **ninguna** modificación en el código de los componentes visuales de React.
- **Gobernanza de Estado**: Los adaptadores (Fakes o Reales) deben ser fieles a su contrato. Si la interfaz no define un estado global, el adaptador no debe gestionarlo internamente, delegando esa orquestación a la capa de aplicación.

## 🔑 Pivot de Inferencia: Gemini 3.5 Flash (BYOK & Resiliencia en Cliente)

En la etapa de escalabilidad de **Cicero**, se identificó que la inferencia puramente local con Transformers.js y CrisperWhisper presentaba limitantes para audios largos (de 15 a 60 minutos):
1.  **Límites de Hardware en Clientes:** Dispositivos móviles y computadoras de baja gama experimentaban bloqueos de pestaña y tiempos de procesamiento inviables (CPU al 100% durante varios minutos).
2.  **Tiempos de Carga del Modelo:** Descargar ~50MB a 100MB de modelo ONNX penalizaba la primera experiencia de uso bajo conexiones inestables.

Para resolver esto manteniendo el principio de **cero costo de servidor**, se decidió pivotar a **Google Gemini 3.5 Flash** mediante un esquema **BYOK (Bring Your Own Key)**:
- **API Key del Cliente:** Cada estudiante introduce su clave gratuita de Google AI Studio, la cual se almacena localmente en `localStorage`. Las peticiones viajan directamente desde el navegador a la API de Google, sin intermediación de servidores propios.
- **Segmentación Matemática a 3 Minutos:** Un audio de 60 minutos (a 16kHz 16-bit mono WAV) pesa ~115MB. Para evitar fallas de red en conexiones móviles y optimizar el procesamiento, el buffer PCM se fragmenta localmente en bloques de 3 minutos (~5.7MB por WAV).
- **Subida Resumible (Resumable Upload):** Se implementa el protocolo en dos fases de Google Files API para soportar reconexiones y reanudaciones parciales.
- **Caché en IndexedDB:** Cada fragmento WAV procesado se almacena temporalmente en IndexedDB. Si el proceso falla por red o límites de cuota (HTTP 429), el usuario no pierde su grabación y puede reanudarla desde el fragmento exacto donde falló, incluso cambiando la API Key en caliente.
- **Concurrencia de Cola:** Las subidas se orquestan con un semáforo de concurrencia máxima de 3 para respetar los límites de la cuota gratuita (15 RPM) sin bloquear la UI.
- **Limpieza Post-Inferencia:** Tras completarse la transcripción de un fragmento, se envía de inmediato un request HTTP `DELETE` a la Files API de Google para garantizar la privacidad y no acumular archivos en el almacenamiento temporal de Google (que expira a las 48h).
- **Interpolación Temporal Lineal:** Para evitar el consumo excesivo de tokens de salida solicitando timestamps exactos por cada palabra a Gemini (lo que rompería el límite de 8192 tokens en audios largos), Gemini solo retorna el texto transcrito de cada segmento. En el cliente se interpolan linealmente los tiempos de las palabras dentro del segmento basándose en la duración del mismo, lo que preserva la funcionalidad de visualización y el cálculo del `CalculateScoreUseCase`.
- **Patrón de Inyección Desacoplado:** El adaptador `GeminiSpeechAdapter` recibe un `apiKeyProvider: () => string | null` en su constructor, abstrayéndose por completo de la reactividad de React o de la persistencia directa en `localStorage`.



