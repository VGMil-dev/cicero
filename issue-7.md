# Plan de la Issue #7: Payload Mínimo de Sesión de Audio

Este documento define la planificación formal para abordar el Spike de definición y diseño del payload de persistencia de sesión de audio.

## Objetivo
Definir los campos mínimos para almacenar una sesión de audio tras su transcripción y evaluación de fluidez (score de muletillas) sin alterar los DTOs de captura consumidos por el Frontend, sentando las bases contractuales para la futura integración con Supabase.

## Estrategia de Ramas
- **Rama actual**: `fix-cicero-issue-seven`
- **Integración**: Los commits se harán de manera incremental en esta rama y la integración final a `development` se realizará a través de un Pull Request con estrategia **Squash** tras completar las validaciones.

## Archivos a Modificar / Crear
- `[NEW]` [persistencia-sesion.md](file:///C:/Users/vgmil/.gemini/antigravity/worktrees/Cicero/fix-cicero-issue-seven/apps/docs/docs/arquitectura/persistencia-sesion.md)
- `[MODIFY]` [sidebars.ts](file:///C:/Users/vgmil/.gemini/antigravity/worktrees/Cicero/fix-cicero-issue-seven/apps/docs/sidebars.ts)
- `[MODIFY]` [types.ts](file:///C:/Users/vgmil/.gemini/antigravity/worktrees/Cicero/fix-cicero-issue-seven/apps/web/src/core/ports/audio/types.ts)

## Fases de Ejecución (Micro-commits)

1. **Fase de Preparación y Planeación**
   - Crear el plan formal `issue-7.md` en la raíz.
   - Commit: `docs(plan): planificacion inicial de issue 7`

2. **Fase de Definición de Contratos en Código**
   - Agregar las nuevas interfaces y tipos de la sesión persistida (`AudioSessionDTO`, `AudioChunkDTO`, `SessionMetricsDTO`) en `apps/web/src/core/ports/audio/types.ts` con TSDoc estructurado.
   - Commit: `feat(core): definir dtos y typos para la persistencia de sesiones de audio`

3. **Fase de Documentación Técnica**
   - Crear `apps/docs/docs/arquitectura/persistencia-sesion.md` con los detalles funcionales, obligatorios vs opcionales, restricciones, diagramas y referencias técnicas.
   - Registrar la página en `apps/docs/sidebars.ts`.
   - Commit: `docs(arquitectura): documentar propuesta de payload de persistencia de sesion`

4. **Fase de Verificación y Cierre**
   - Correr compilaciones del monorepo (`pnpm build`).
   - Validar que el servidor de Docusaurus levanta la documentación correctamente.
   - Commit: `chore(build): validar compilacion del monorepo y sidebars de docs`

## Protocolo de Verificación

- **Compilación**: Ejecución de `pnpm build` en la raíz para validar la consistencia de tipos.
- **Visualización**: Validar la generación y visualización de la barra lateral de Docusaurus corriendo el servidor local de documentación (`pnpm --filter docs build`).
