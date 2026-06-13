# Plan de Implementación: Hito 1 - Web Worker e Inferencia Local (Issue #20)

Este plan detalla el diseño técnico, la estructura de tareas jerárquicas y los pasos para implementar el Web Worker (`audio.worker.ts`) y el adaptador `WorkerAudioModelBootstrap` utilizando `@huggingface/transformers` en el frontend, garantizando aceleración por WebGPU con fallback a CPU (WASM), verificación de almacenamiento y un patrón Singleton.

---

## 📋 Información General

*   **Objetivo:** Crear el Web Worker que encapsule la lógica de inferencia local con Transformers.js / ONNX y desarrollar el adaptador `WorkerAudioModelBootstrap` para orquestar la comunicación.
*   **Estrategia de Ramas:** Se trabajará sobre la rama actual `build-hierarchical-planning-flow`. Las integraciones y avances se consolidarán mediante Pull Requests locales/remotos según las reglas del proyecto.
*   **Archivos a Modificar:**
    *   [NEW] `apps/web/src/core/adapters/audio/audio.worker.ts`
    *   [NEW] `apps/web/src/core/adapters/audio/WorkerAudioModelBootstrap.ts`
    *   [MODIFY] `apps/web/next.config.ts`
    *   [MODIFY] `apps/web/package.json`
    *   [MODIFY] `apps/web/src/app/page.tsx`
    *   [MODIFY] `apps/web/jest.setup.ts`
    *   [NEW] `apps/web/src/__tests__/WorkerAudioModelBootstrap.test.ts`

---

## 🛠️ Fases de Ejecución y Tareas Jerárquicas

### 1. Fase de Preparación y Dependencias
*   **1.1. Instalación de la biblioteca Transformers.js**
    *   **1.1.1.** Instalar `@huggingface/transformers` en el workspace `@cicero/web` usando `pnpm`.
*   **1.2. Configuración de Bundling en Next.js**
    *   **1.2.1.** Modificar `apps/web/next.config.ts` para habilitar el soporte de Web Workers y excluir dependencias específicas de Node.js de ONNX Runtime (`onnxruntime-node`) durante el empaquetado del cliente.

### 2. Desarrollo del Web Worker (Inferencia y Singleton)
*   **2.1. Implementación de `audio.worker.ts`**
    *   **2.1.1. Creación del patrón Singleton:** Asegurar que la instancia del pipeline de transcripción se cargue una sola vez en el ámbito global del Worker para evitar fugas de memoria y descargas redundantes.
    *   **2.1.2. Verificación de cuota de almacenamiento:** Implementar una llamada previa a `navigator.storage.estimate()` antes de iniciar cualquier descarga de modelos. Validar que la cuota disponible sea superior a 150 MB (margen de seguridad para `CrisperWhisper-ONNX` cuantizado). Lanzar un error controlado de cuota insuficiente si no hay espacio.
    *   **2.1.3. Carga y caché del modelo:** Configurar `@huggingface/transformers` para descargar y cachear localmente (usando Cache API del navegador de forma nativa) el modelo `onnx-community/CrisperWhisper-ONNX`. Forzar el uso del dtype `q8` o `q4` según la configuración.
    *   **2.1.4. Mapeo de progreso:** Suscribirse al `progress_callback` de la API de descarga de Transformers.js, calcular los porcentajes y etapas detalladas, y mapearlos a la estructura `ProgressDTO` definida en `types.ts`.
    *   **2.1.5. Aceleración WebGPU y fallback a CPU (WASM):** Intentar instanciar el pipeline con el dispositivo de ejecución `webgpu`. Si la inicialización falla por falta de soporte de hardware, atrapar el error, reportar la etapa a la UI e intentar cargar con el dispositivo `wasm`.
    *   **2.1.6. Receptor de mensajes (Main Thread Message Listener):** Implementar la escucha de eventos `message` manejando mensajes del tipo `LOAD_MODEL` y `TERMINATE`.

### 3. Desarrollo del Adaptador Core
*   **3.1. Implementación de `WorkerAudioModelBootstrap`**
    *   **3.1.1. Cumplimiento de la interfaz `IAudioModelBootstrap`:** Crear la clase implementando los métodos `initialize()`, `onProgress()` y `getState()`.
    *   **3.1.2. Gestión de Ciclo de Vida del Web Worker:** Instanciar el Web Worker usando la sintaxis nativa de Next.js (`new Worker(new URL('./audio.worker.ts', import.meta.url))`).
    *   **3.1.3. Envío y Recepción de Mensajes:** Enviar mensajes de tipo `LOAD_MODEL` con los parámetros correspondientes de cuantización y modelo. Escuchar los mensajes del Worker (`READY`, `PROGRESS`, `ERROR`) y actualizar el estado interno.
    *   **3.1.4. Propagación de Errores y Stack Traces:** Garantizar que si el Worker emite un error/pánico, este sea envuelto adecuadamente en un `CaptureError` con su respectivo `ErrorDTO` (preservando el stack trace).

### 4. Integración en la UI
*   **4.1. Conexión del Adaptador Real en `page.tsx`**
    *   **4.1.1.** Modificar el punto de entrada de la UI en `apps/web/src/app/page.tsx` para permitir inyectar `WorkerAudioModelBootstrap` y alternar entre la implementación Mock y la Real mediante controles de desarrollo/variables de entorno.
    *   **4.1.2. Gestión de pánicos (`worker.onerror`):** Implementar una suscripción a nivel de componente para capturar crashes fatales del Worker que evadan los callbacks del adaptador, ejecutando un reinicio limpio (`worker.terminate()`).

### 5. Pruebas y Aseguramiento de Calidad
*   **5.1. Implementación de Pruebas Unitarias**
    *   **5.1.1. Pruebas para `WorkerAudioModelBootstrap`:** Crear mock del constructor global de `Worker` en `jest.setup.ts` para simular las respuestas del Worker (`PROGRESS`, `READY`, `ERROR`) y validar la lógica del adaptador en aislamiento.
    *   **5.1.2. Ejecución de suites:** Validar que `pnpm test:web` y `pnpm typecheck:web` pasen exitosamente antes de proceder con micro-commits.

---

## 🔍 Protocolo de Verificación y Estrategia de Pruebas

Para garantizar que no se escape ningún fallo del entorno web (WebGPU, almacenamiento, hilos en segundo plano), la estrategia de pruebas se compone de tres pilares:

### 1. Pruebas Unitarias Aisladas (Jest + JSDOM)

Dado que JSDOM carece de soporte nativo para Web Workers, WebGPU y Storage APIs, se mockearán sistemáticamente estas interfaces en Jest para evaluar la robustez de la lógica de negocio y del adaptador:

*   **A. Simulación de Web Worker (`jest.setup.ts`):**
    *   Implementar un mock global para la clase `Worker` que intercepte el constructor y el método `postMessage`.
    *   Permitir que las pruebas unitarias simulen flujos del Worker enviando mensajes sintéticos (`PROGRESS`, `READY`, `ERROR`) para validar que el adaptador transiciona correctamente los estados (`idle` -> `loading-model` -> `ready` | `error`).
*   **B. Simulación de WebGPU y Fallback a WASM:**
    *   Mockear `navigator.gpu` en pruebas unitarias específicas:
        *   *Escenario 1 (WebGPU Soportado):* `navigator.gpu.requestAdapter()` resuelve con un adaptador válido.
        *   *Escenario 2 (WebGPU No Soportado / Fallback):* `navigator.gpu` es `undefined` o `requestAdapter()` resuelve a `null`. Verificar que el Worker no aborta, sino que transiciona de forma transparente a inicializar ONNX Runtime en modo WASM/CPU.
*   **C. Simulación de Cuota de Disco (`navigator.storage`):**
    *   Mockear `navigator.storage.estimate` para retornar valores deterministas de espacio:
        *   *Caso de Éxito:* Espacio libre superior a 150MB (`quota: 1000MB, usage: 100MB`). Comprobar que continúa la inicialización.
        *   *Caso de Error:* Espacio libre inferior al umbral (`quota: 200MB, usage: 195MB`). Comprobar que el adaptador arroja inmediatamente un `CaptureError` con código `MODEL_LOAD_FAILED` sin inicializar el worker.

### 2. Pruebas de Integración y Smoke Tests (Navegador Real)

Para asegurar el comportamiento óptimo de Transformers.js, la aceleración de hardware por GPU y la descarga en IndexedDB, se utilizará el siguiente protocolo en un navegador real (vía desarrollo local o herramientas de testing en vivo):

*   **A. Inspección de Caché ONNX:**
    *   Abrir Chrome DevTools -> Application -> Cache Storage.
    *   Comprobar que tras la primera carga del modelo `CrisperWhisper-ONNX`, los shards de pesos (.onnx y .json) se almacenan en la caché de origen local (`onnx-community/CrisperWhisper-ONNX`).
    *   Desconectar la red del navegador (Modo Offline) y recargar la página. El modelo debe inicializarse instantáneamente de forma local (Offline Ready).
*   **B. Verificación de Fugas de Memoria (Singleton):**
    *   Utilizar la pestaña *Memory* del navegador para realizar heap snapshots antes y después de interactuar con el botón de grabación/inicialización.
    *   Validar que al desmontar o volver a montar el componente en React, no se instancien múltiples Workers en segundo plano ni se vuelvan a descargar los pesos del modelo.
*   **C. Verificación de WebGPU / WebAssembly Fallback:**
    *   Abrir Chrome y verificar en consola de desarrollo el backend seleccionado por ONNX Runtime Web.
    *   Deshabilitar el flag de WebGPU en Chrome (`chrome://flags/#enable-unsafe-webgpu` o usar un perfil de simulación sin GPU) para confirmar que el Web Worker carga el backend de WebAssembly (WASM) sin caídas fatales de ejecución.

### 3. Comandos de Ejecución de Pruebas
*   Suite automatizada del cliente:
    ```bash
    pnpm test:web
    ```
*   Verificación estática de tipos:
    ```bash
    pnpm typecheck:web
    ```
*   Compilación de compilación y optimización (Smoke Build):
    ```bash
    pnpm build:web
    ```
