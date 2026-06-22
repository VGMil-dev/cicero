---
slug: mocks-captura-audio
title: "Mocks y Fixtures del Flujo de Grabación (Fase Mock-First)"
authors: [vgmil_dev]
tags: [mocks, testing, audio, contratos, ui-development, docusaurus]
---

**Contexto:** El equipo de Front-end necesita implementaciones Fake de los contratos `IAudioModelBootstrap` e `IAudioRecorder` (definidos en la Issue #4) para construir la UI completa sin depender del Worker real (Transformers.js/ONNX).

**Decisión:** Implementar mocks configurables que permitan probar todos los estados de UI (carga, progreso, error, grabación) durante la Fase Mock-First del proyecto.

{/* truncate */}

### 💡 Detalles Técnicos

#### FakeAudioModelBootstrap
- Simula la descarga del modelo emitiendo 4 eventos de progreso (10%, 40%, 80%, 100%) mediante `setInterval`.
- Soporta múltiples suscriptores mediante un `Set<(p: ProgressDTO) => void>`.
- Se puede configurar para fallar intencionalmente en un porcentaje específico y probar el estado `MODEL_LOAD_FAILED` en la UI.

#### FakeAudioRecorder
- Simula la solicitud de permisos y la grabación sin acceder al hardware real.
- Configurable para denegar permisos (`PERMISSION_DENIED`) o fallar al iniciar (`RECORDING_FAILED`).
- **No gestiona estado interno** — el estado global de captura (`idle`, `loading-model`, `ready`, `recording`, `error`) lo orquesta un Hook/Store de React.
- Devuelve un `Blob([], { type: 'audio/webm' })` vacío al detener la grabación.

#### CaptureError
Se creó una clase `CaptureError extends Error` que envuelve un `ErrorDTO` y preserva el stack trace nativo de JavaScript. Se usa en ambos mocks para mantener consistencia en el manejo de errores.

#### Documentación
Se separó la documentación en dos archivos para mantener responsabilidades claras:
- `contratos-captura.md` → solo interfaces, DTOs y estados.
- `mocks-captura.md` → ejemplos de uso, inyección en componentes React y escenarios de error.

Además se creó un `README.md` dentro de la carpeta `mocks/` como guía rápida para desarrolladores juniors.

### 🔧 Problema Técnico Resuelto: Admonitions en Docusaurus

Durante la sesión descubrimos que las admonitions (`:::info Título`) no renderizaban en el servidor de Docusaurus debido a que el proyecto tiene habilitado `future: { v4: true }`, lo que activa el parser MDX v3. La sintaxis correcta para MDX v3 es `:::info[Título]` (con corchetes en el título).

### 📦 Archivos Creados

| Ruta | Propósito |
|------|-----------|
| `apps/web/.../mocks/FakeAudioModelBootstrap.ts` | Mock de carga de modelo |
| `apps/web/.../mocks/FakeAudioRecorder.ts` | Mock de grabadora |
| `apps/web/.../mocks/CaptureError` | Error nativo con DTO embebido |
| `apps/web/.../mocks/index.ts` | Barrel export |
| `apps/web/.../mocks/README.md` | Guía para juniors |
| `apps/docs/.../mocks-captura.md` | Documentación de uso |

### 🎯 Resultado
Tres commits en la rama `feature/5-capture-mocks` con validación pre-commit (typecheck + lint + smoke test) en cada fase. Los mocks están listos para ser inyectados en los componentes de React mediante el patrón de Puertos y Adaptadores.
