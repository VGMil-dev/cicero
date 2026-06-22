# Plan de Implementación - Issue #54: Interfaz de Configuración de Gemini API Key

Este plan detalla el diseño e implementación de la interfaz de usuario para configurar la Gemini API Key, incluyendo su almacenamiento en `localStorage`, la verificación de conexión (ping) directa y la conmutación transparente y reactiva del motor de voz.

---

## 📋 Información General

*   **Objetivo:** Desarrollar la interfaz visual (modal y botón de acceso) para configurar la Gemini API Key de forma segura y asociarla al ciclo de inicialización del modelo de audio. Esto incluye la persistencia en `localStorage`, un ping de validación directo con la API de Gemini, y la conmutación dinámica del motor de análisis entre Whisper local y Gemini.
*   **Estrategia de Ramas:** `feature/54-frontend-settings-modal` -> `epic/52-gemini-byok-integration`
*   **Archivos a Modificar / Crear:**
    *   [NEW] [useGeminiSettings.ts](file:///C:/Users/vgmil/.gemini/antigravity/brain/c368d9df-0f73-4fa7-833a-394c11ddaed1/.system_generated/worktrees/subagent-Frontend-Developer-frontend-developer-15eb4cce/apps/web/src/hooks/useGeminiSettings.ts)
    *   [NEW] [GeminiSettingsModal.tsx](file:///C:/Users/vgmil/.gemini/antigravity/brain/c368d9df-0f73-4fa7-833a-394c11ddaed1/.system_generated/worktrees/subagent-Frontend-Developer-frontend-developer-15eb4cce/apps/web/src/components/GeminiSettingsModal.tsx)
    *   [NEW] [GeminiSpeechAdapter.ts](file:///C:/Users/vgmil/.gemini/antigravity/brain/c368d9df-0f73-4fa7-833a-394c11ddaed1/.system_generated/worktrees/subagent-Frontend-Developer-frontend-developer-15eb4cce/apps/web/src/core/adapters/audio/GeminiSpeechAdapter.ts)
    *   [MOD] [page.tsx](file:///C:/Users/vgmil/.gemini/antigravity/brain/c368d9df-0f73-4fa7-833a-394c11ddaed1/.system_generated/worktrees/subagent-Frontend-Developer-frontend-developer-15eb4cce/apps/web/src/app/page.tsx)
    *   [NEW] [useGeminiSettings.test.ts](file:///C:/Users/vgmil/.gemini/antigravity/brain/c368d9df-0f73-4fa7-833a-394c11ddaed1/.system_generated/worktrees/subagent-Frontend-Developer-frontend-developer-15eb4cce/apps/web/src/__tests__/useGeminiSettings.test.ts)
    *   [NEW] [GeminiSettingsModal.test.tsx](file:///C:/Users/vgmil/.gemini/antigravity/brain/c368d9df-0f73-4fa7-833a-394c11ddaed1/.system_generated/worktrees/subagent-Frontend-Developer-frontend-developer-15eb4cce/apps/web/src/__tests__/GeminiSettingsModal.test.tsx)

---

## 🛠️ Fases de Ejecución (Micro-commits)

### 1. Fase 1: Hook Personalizado `useGeminiSettings.ts`
*   Desarrollar el hook en `apps/web/src/hooks/useGeminiSettings.ts`.
*   Encapsular el estado local de la API Key, sincronizado con `localStorage` bajo la clave `gemini_api_key`.
*   Implementar la función de validación `validateApiKey(key: string): Promise<boolean>` que:
    *   Si `key` es `"sandbox"`, retorne `true` de inmediato de manera offline.
    *   De lo contrario, realice un ping `POST` al endpoint de Gemini `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}` enviando una carga mínima `{ contents: [{ parts: [{ text: "ping" }] }] }`.
    *   Controle los errores devolviendo `false` o arrojando el mensaje específico de error de Gemini para mostrarlo en el modal.
*   Exportar `apiKey`, `isConfigured` (si la clave no está vacía), `saveApiKey`, `clearApiKey`, `isValidating`, `validationError`.
*   *Commit:* `feat(settings): create hook useGeminiSettings with localStorage sync and ping validation`

### 2. Fase 2: Adaptador Gemini Stub y Bootstrap No-Op
*   Crear `apps/web/src/core/adapters/audio/GeminiSpeechAdapter.ts` que implemente la interfaz `IAudioAnalyzer` como un stub básico que devuelva `[]` temporalmente. Esto evita fallos de compilación en `page.tsx` hasta que la Issue #53 sea completada e integrada.
*   Crear una clase en `page.tsx` o archivo específico `GeminiModelBootstrap` que implemente `IAudioModelBootstrap` y resuelva de inmediato en `initialize()` con progreso 100%, evitando la descarga innecesaria del modelo local de Whisper en IndexedDB cuando Gemini esté configurado.
*   *Commit:* `feat(audio): create stub GeminiSpeechAdapter and GeminiModelBootstrap`

### 3. Fase 3: Componente Visual `GeminiSettingsModal.tsx`
*   Crear el componente en `apps/web/src/components/GeminiSettingsModal.tsx`.
*   Estilo Neobrutalista completo:
    *   Bordes negros gruesos (`border-4 border-black`), fondo claro (`bg-[#f5f4f0]`), y sombra fuerte (`shadow-[8px_8px_0px_rgba(0,0,0,1)]`).
    *   Botones con transformaciones activas (`hover:-translate-x-0.5 hover:-translate-y-0.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all`).
*   Características:
    *   Input seguro con opción de revelar/ocultar la API Key.
    *   Indicador de estado de validación (cargando, éxito en verde neón, error en rojo/rosa neobrutalista).
    *   Botón de validación de conexión ("Probar Conexión").
    *   Botón de guardado, habilitado únicamente después de una validación exitosa (o si el valor ingresado coincide con el guardado previamente).
    *   Botón de limpieza para eliminar la clave almacenada.
    *   Accesibilidad básica y cierre al hacer clic en el backdrop o presionar `Escape`.
*   *Commit:* `feat(settings): develop Neobrutalist GeminiSettingsModal component`

### 4. Fase 4: Integración en Home (`page.tsx`) y Conmutación Dinámica
*   Importar `useGeminiSettings` y `GeminiSettingsModal`.
*   Añadir el botón "Ajustes Gemini" en la sección derecha del header de la página utilizando el diseño y colores neobrutalistas (`bg-amber-300`).
*   Implementar la lógica reactiva de conmutación:
    *   Si `isConfigured` es `true` (Gemini configurado):
        *   Usar la instancia de `GeminiModelBootstrap` como `bootstrap`.
        *   Usar `GeminiSpeechAdapter` como `analyzer` (con el callback de API Key).
    *   Si `isConfigured` es `false` (Whisper local):
        *   Usar `WorkerAudioModelBootstrap` como `bootstrap`.
        *   Usar `TransformersSpeechAdapter` como `analyzer`.
*   Agregar un indicador badge de motor activo en la barra de estado: `"Motor: Whisper Local"` o `"Motor: Gemini 3.5"` con sus respectivos colores para dar visibilidad clara.
*   *Commit:* `feat(settings): integrate Gemini settings in home page and enable dynamic engine switching`

### 5. Fase 5: Pruebas Unitarias e Integración
*   Crear `apps/web/src/__tests__/useGeminiSettings.test.ts` para testear el comportamiento del hook con mock de fetch y localStorage.
*   Crear `apps/web/src/__tests__/GeminiSettingsModal.test.tsx` para testear el renderizado neobrutalista, interacciones de modal, validación exitosa/fallida e integración con el estado de la página.
*   *Commit:* `test(settings): add unit and integration tests for Gemini settings modal and hook`

### 6. Fase 6: Aseguramiento de Calidad Estática
*   Ejecutar linters y TypeScript typecheck para asegurar cero regresiones.
*   *Commit:* `chore(settings): clean lints and verify typecheck`

---

## 🔍 Protocolo de Verificación

### Pruebas Automatizadas
*   Correr la suite de pruebas:
    ```bash
    pnpm --filter @cicero/web test
    ```
*   Correr typecheck:
    ```bash
    pnpm --filter @cicero/web typecheck
    ```

### Pruebas Manuales
1.  **Modo Sandbox:** Introducir `"sandbox"` en el modal de ajustes, presionar "Probar Conexión" y verificar el éxito instantáneo sin llamadas de red. Guardar y verificar que el motor cambie a `"Gemini 3.5"`.
2.  **Ping Real:** Introducir una clave Gemini válida (o inválida para forzar error) y verificar el feedback del modal (ej. mensaje de error de cuota o clave incorrecta devuelto por la API).
3.  **Persistencia y Conmutación:** Recargar la página con la clave guardada y verificar que no se inicie la descarga del modelo local de Whisper. Borrar la clave y comprobar que el motor vuelva de inmediato a Whisper local iniciando su descarga/inicialización.
