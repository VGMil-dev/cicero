# Plan de Implementación: Hito 1 - Configuración de compilación Next.js y testing para Web Worker (Issue #22)

Este plan formal detalla los objetivos, la estrategia de desarrollo y los pasos para adaptar el empaquetado de Next.js y las configuraciones de Jest/Mocks en el repositorio para evitar errores con dependencias nativas y simular APIs de audio y workers.

---

## 📋 Información General

*   **Objetivo:** Configurar Next.js para excluir dependencias nativas del backend durante la compilación y configurar mocks de Jest para soportar Web Workers y la API de MediaRecorder de manera global.
*   **Estrategia de Ramas:** Se implementará directamente sobre la rama de trabajo y se integrará mediante Pull Request tras pasar verificación local.
*   **Archivos a Modificar:**
    *   [MODIFY] `apps/web/next.config.ts`
    *   [MODIFY] `apps/web/jest.setup.ts`

---

## 🛠️ Fases de Ejecución y Tareas Jerárquicas

### 1. Configuración de Next.js para Webpack y Dependencias Nativas (Transformers.js)
*   **1.1. Modificación de `next.config.ts`**
    *   **1.1.1.** Agregar `@huggingface/transformers` y `onnxruntime-node` a la propiedad `serverExternalPackages` del archivo `nextConfig` para evitar que el compilador del servidor Next.js intente empaquetar módulos con binarios nativos de node.
    *   **1.1.2.** Validar que los alias para el cliente en `config.resolve.alias` para `'onnxruntime-node'` y `'sharp'` estén debidamente configurados a `false` cuando `!isServer`.

### 2. Configuración de Entorno Jest (Mocks Globales)
*   **2.1. Adaptación de `jest.setup.ts` para MediaRecorder**
    *   **2.1.1.** Definir la clase `MockMediaRecorder` con las propiedades nativas de estado (`state`), flujo de datos (`stream`), y opciones de grabación (`options`).
    *   **2.1.2.** Añadir el método estático `isTypeSupported(mimeType)` mockeado por Jest (`jest.fn()`) para que retorne `true` por defecto.
    *   **2.1.3.** Implementar el método de instancia `start` que transicione el estado a `'recording'`.
    *   **2.1.4.** Implementar el método de instancia `stop` que transicione el estado a `'inactive'`, emita un evento simulado `ondataavailable` con un Blob ficticio, y llame al callback `onstop`.
    *   **2.1.5.** Implementar los métodos de instancia `pause` y `resume` para soportar la manipulación de estados de grabación.
    *   **2.1.6.** Implementar `addEventListener` y `removeEventListener` mapeando correctamente `'dataavailable'`, `'stop'` y `'error'` a los callbacks internos de la instancia.
    *   **2.1.7.** Registrar globalmente la clase mediante `global.MediaRecorder` y `window.MediaRecorder`.
*   **2.2. Robustez del Web Worker Mock**
    *   **2.2.1.** Adaptar `MockWorker.addEventListener` para manejar el registro del evento `'message'` (además de `'error'`), facilitando la comunicación bidireccional en pruebas más complejas.

---

## 🔍 Protocolo de Verificación y Estrategia de Pruebas

### 3. Fase de Verificación y Compilación
*   **3.1. Pruebas de Integración y Regresión**
    *   **3.1.1.** Ejecutar las pruebas del cliente `@cicero/web` mediante `pnpm test:web`.
    *   **3.1.2.** Validar que la suite `BrowserMediaRecorder.test.ts` pase correctamente, confirmando la compatibilidad de los mocks locales con los globales.
    *   **3.1.3.** Validar que la suite `WorkerAudioModelBootstrap.test.ts` pase correctamente, confirmando el comportamiento correcto del Web Worker simulado.
*   **3.2. Pruebas de Compilación de Next.js**
    *   **3.2.1.** Ejecutar el proceso de compilación `pnpm build:web` con la variable de entorno `CI=true` establecida para emular el flujo de despliegue y asegurar que no existan errores por carga de módulos nativos.
*   **3.3. Verificación de Tipado Estático y Linter**
    *   **3.3.1.** Correr el validador de tipos TypeScript `pnpm typecheck:web` y `pnpm --filter @cicero/web lint` en busca de inconsistencias o tipos faltantes tras las modificaciones.
