# Instrucciones del Proyecto (Cicero)

Estas reglas dictan el estándar de trabajo, arquitectura y gobernanza para este proyecto. Deben ser respetadas en todas las sesiones.

## 1. Flujo de Trabajo: "Plan-First"
- **Obligatorio**: Antes de modificar código para una Issue, se debe redactar un plan formal en un archivo Markdown (ej. `issue-X.md`).
- **Contenido del Plan**: Debe incluir Objetivo, Estrategia de Ramas, Archivos a Modificar, Fases de Ejecución (Micro-commits) y Protocolo de Verificación.
- **Aprobación**: El código no se toca hasta que el plan esté revisado y acordado.

## 2. Estrategia de Git y Gobernanza
- **Integración por PR (Strict)**: Está terminantemente prohibido hacer merges o rebases locales hacia ramas protegidas o pivote. Toda integración se hace **exclusivamente** mediante Pull Requests.
- **Gestión con `gh-cli`**: Para aprobar y fusionar PRs desde la terminal, el asistente (IA) debe usar siempre las herramientas oficiales de GitHub CLI (ej. `gh pr merge <id> --squash`), garantizando que la plataforma registre la transacción correctamente.
- **Micro-commits**: El trabajo se divide en fases lógicas (Preparación, Implementación A, Implementación B, Documentación). Cada fase requiere su propio commit siguiendo Conventional Commits (ej. `feat(core): ...`, `docs(arquitectura): ...`).
- **Historial Lineal**: Los commits deben contar una historia clara y secuencial para facilitar la revisión del Pull Request.
- **Squash en Micro-features**: Al fusionar un PR de una micro-feature hacia su rama padre, se debe utilizar siempre la estrategia de **Squash**. Esto comprime los micro-commits iterativos en un único commit atómico, manteniendo el historial a largo plazo estrictamente lineal y limpio.

## 3. Arquitectura (Hexagonal / Puertos y Adaptadores)
- **Puertos (Core)**: Las interfaces residen en la capa central (`apps/web/src/core/ports/`). Son la fuente de la verdad para el dominio.
- **Adaptadores (Infraestructura)**: Ya sean Mocks (Fakes para UI) o implementaciones Reales (Workers, APIs), se adaptan estrictamente al Puerto.
- **Fidelidad al Contrato**: Las clases (Adaptadores) **no deben mantener estados internos** que no estén expuestos u orquestados por sus interfaces correspondientes. Si la interfaz no expone un método `getState()`, la clase debe ser "stateless" en ese aspecto.

## 4. Estándares de Código y Calidad
- **TSDoc Obligatorio**: Todas las interfaces, tipos y clases base deben estar documentadas con TSDoc completo, incluyendo descripciones detalladas, enlaces a tipos (`{@link ...}`) y ejemplos de uso (`@example`).
- **Manejo de Errores**: Los errores de dominio deben preservar el *Stack Trace*. Se deben usar clases de error personalizadas (ej. `CaptureError extends Error`) que envuelvan los DTOs de error.
- **Pruebas de Humo (Pre-commit)**: Se debe asegurar que el código funciona (ej. que los mocks emiten intervalos correctos) mediante validación estática o scripts temporales antes de realizar un commit.

## 5. Documentación Continua
- **Docusaurus**: Todo contrato o decisión arquitectónica importante debe reflejarse en la documentación oficial (`apps/docs`). Diagramas Mermaid son altamente recomendados para gobernanza visual.
- **Guías de Mentoría**: Los módulos complejos deben incluir un `README.md` local que explique el *por qué* de la arquitectura y proporcione ejemplos (Fixtures) de cómo usar el código en diferentes escenarios.
