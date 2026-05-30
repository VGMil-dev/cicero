# Decisiones de Diseño

En esta sección se detallan las decisiones arquitectónicas clave tomadas para el proyecto **Cicero**, justificando el pivote estratégico para garantizar escalabilidad, costo cero en inferencia y alta precisión en la detección de disfluencias.

## 🤖 Transformers.js sobre Vosk (El Motor de IA)
Inicialmente se evaluó `vosk-browser` por su bajísima latencia. Sin embargo, se decidió pivotar hacia **Transformers.js (Hugging Face)** por tres razones arquitectónicas críticas:
1.  **Soporte TypeScript y Ecosistema Moderno:** Transformers.js es nativo de la web moderna, permitiendo un código limpio, fuertemente tipado y fácil de integrar en Web Workers dentro de Next.js, a diferencia de la API más arcaica de Kaldi/Vosk.
2.  **Transcripción Verbatim (El problema de Whisper):** Los modelos tradicionales de Speech-to-Text limpian el audio (borran los "eh" y "mmm"). Al usar Transformers.js, podemos cargar **CrisperWhisper**, un modelo ONNX especializado específicamente en transcripción literal que *retiene* las muletillas y provee timestamps precisos por palabra, lo cual es el core de nuestra aplicación.
3.  **Aceleración de Hardware:** Transformers.js (v3) soporta **WebGPU**, lo que permite delegar la inferencia a la tarjeta gráfica del usuario en lugar de bloquear la CPU, logrando velocidades de procesamiento muy superiores.

## 📱 Estrategia PWA sobre App Nativa (React Native/Flutter)
El requerimiento original sugería un framework híbrido móvil tradicional. Pivotamos hacia una **Progressive Web App (PWA)** en Next.js.
- **Justificación**: Las apps híbridas enfrentan enormes dificultades para compilar modelos acústicos complejos (C++) en iOS/Android. La PWA nos permite descargar el modelo ONNX en la caché del navegador de forma transparente, logrando procesamiento $0 en servidor y sin depender de APIs de terceros (No Vendor Lock-in de OpenAI).

## 🚀 Eliminación del Backend Tradicional (Serverless / BaaS)
Se descartó el diseño inicial de usar una API centralizada (Nest.js).
- **Cero Cuellos de Botella**: Procesar audio en un backend central genera altos costos de CPU. Al delegar la inferencia al dispositivo del usuario (Client-Side AI), el backend es redundante.
- **Supabase directo**: Usamos Supabase interactuando de forma segura a través de **Server Actions** nativas de Next.js.

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
- **Configuración Webpack**: Se ajusta la configuración de Next.js para ignorar binarios de servidor (`onnxruntime-node`) en el bundle del cliente, garantizando la compatibilidad total con el entorno del navegador.

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


