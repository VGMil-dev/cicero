# Plan de Trabajo: Carga de Modelo y Grabación con Mocks (Issue #6)

## Objetivo
Construir el flujo visible del caso de uso 1 usando los contratos y mocks definidos en la capa de ports.

## Estrategia de Ramas
- Rama actual: `fix-cicero-issue-six` (ya creada e integrada localmente).
- Integración final: PR hacia `main` / `develop` (se gestionará mediante GitHub CLI).

## Archivos a Modificar / Crear
- `apps/web/src/app/layout.tsx` (modificar): Agregar tipografía del sistema de diseño.
- `apps/web/src/hooks/useAudioCapture.ts` (nuevo): Hook de estado y control del flujo de grabación.
- `apps/web/src/app/page.tsx` (modificar): UI interactiva del workbench de grabación con estética Doodle Neo-Brutalista y simulador de mocks.
- `apps/web/src/__tests__/audioCapture.test.tsx` (nuevo): Cobertura de pruebas para la interacción de los mocks y el hook.

## Fases de Ejecución (Micro-commits)

### Fase 1: Preparación y Tipografía
- Instalar/cargar las fuentes en `layout.tsx` (`Plus Jakarta Sans` y `Be Vietnam Pro`).
- Commit: `chore(web): setup brand fonts and theme layout`

### Fase 2: Hook del Caso de Uso (useAudioCapture)
- Desarrollar `useAudioCapture.ts` que implementa la lógica de inicialización del modelo, solicitud de permisos de micrófono, grabación y manejo de errores.
- Commit: `feat(web): implement useAudioCapture hook utilizing audio ports`

### Fase 3: UI Doodle Neo-Brutalista y Simulador de Mocks
- Modificar `page.tsx` con el diseño visual, micro-animaciones en botones, barra de progreso para la descarga, indicador en onda y panel interactivo para configurar los mocks.
- Commit: `feat(web): build doodle neo-brutalist recording workbench with mock simulator`

### Fase 4: Pruebas y Verificación
- Escribir e integrar la suite de pruebas unitarias para el hook y el flujo del componente en `audioCapture.test.tsx`.
- Commit: `test(web): add unit tests for audio capture flow and error states`

## Protocolo de Verificación
- Ejecución de `pnpm run typecheck` en `@cicero/web` para garantizar la integridad estática.
- Ejecución de `pnpm test` en `@cicero/web` para asegurar que todas las pruebas pasen.
- Verificación visual local corriendo `pnpm dev`.
