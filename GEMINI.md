# Instrucciones y Estándares del Proyecto (Cicero Blueprint)

Estas reglas dictan el estándar de trabajo, arquitectura y gobernanza para el desarrollo. Deben ser respetadas en todas las sesiones.

## 1. Flujo de Trabajo: "Plan-First" e Issues
- **Creación de Issues (Obligatorio)**: Antes de realizar cualquier cambio, se debe abrir un Issue usando GitHub CLI (`gh issue create`) o la UI, seleccionando la plantilla de Roadmap (`.github/ISSUE_TEMPLATE/roadmap.yml`).
- **Planificación**: Antes de tocar código para una Issue, se debe redactar un plan formal en un archivo Markdown (ej. `issue-X.md` o `plan.md` en la carpeta de planes del workspace).
- **Contenido del Plan**: Debe incluir Objetivo, Estrategia de Ramas, Archivos a Modificar, Fases de Ejecución (Micro-commits) y Protocolo de Verificación.
- **Aprobación**: El código no se toca hasta que el plan esté revisado y acordado.

## 2. Estrategia de Git y Gobernanza de Pull Requests
- **Integración Limpia hacia `development`**: Toda integración se realiza **exclusivamente** mediante Pull Requests hacia la rama `development`. Está prohibido hacer pushes o merges locales directos a esta rama.
- **Flujo de Ramas Terceras**: El trabajo se realiza en ramas de feature, bugfix o refactor asociadas al Issue (`feature/issue-X-*`). Los PRs se abren desde estas ramas hacia `development`.
- **Plantilla de PR**: Todo Pull Request debe crearse utilizando la plantilla del proyecto (`.github/pull_request_template.md`), completando detalladamente la descripción y la checklist de verificación.
- **Gestión con `gh-cli`**: Para interactuar con GitHub (crear issues, abrir PRs, o hacer merge), se deben usar las herramientas oficiales de GitHub CLI (ej. `gh pr create --template ...` y `gh pr merge <id> --squash`).
- **Micro-commits y Squash**: El trabajo se divide en fases lógicas (Preparación, Implementación, Documentación). Cada fase requiere su propio commit con Conventional Commits. Al fusionar el PR, se debe utilizar **Squash** para comprimir los micro-commits iterativos en un único commit atómico en `development`.

## 3. Arquitectura (Hexagonal + Slices + React DI + Atomic Design)
Este proyecto utiliza una arquitectura desacoplada y orientada a dominios:

- **Vertical Slices en el Core**: La lógica de negocio reside bajo `core/` y se organiza en rodajas verticales por característica de dominio (ej. `core/Recorder/`, `core/SpeechToText/`) en lugar de carpetas técnicas horizontales (`ports/`, `adapters/`).
- **Puertos y Adaptadores (Hexagonal)**:
  - **Puertos (`*.port.ts`)**: Interfaces de TypeScript que definen el contrato y las reglas de dominio. Son la fuente de verdad.
  - **Adaptadores Reales (`*.adapter.ts`)**: Implementaciones de infraestructura (Workers, APIs, APIs de navegador) que satisfacen el puerto.
  - **Mocks/Fakes (`*.mock.ts`)**: Implementaciones simuladas para desarrollo rápido en local y testing sin dependencias físicas.
- **Fidelidad al Contrato**: Los adaptadores deben ser *stateless* respecto a estados de orquestación externa que no pertenezcan al puerto (ej. si el puerto no expone `getState()`, el adaptador no maneja ese estado interno).
- **Composition Root (React DI Context)**: Las dependencias se resuelven en un punto central (ej. `DIContext.tsx`) usando Contextos de React para inyectar dinámicamente mocks o adaptadores de producción según la configuración o el entorno.
- **Atomic Design (UI)**: La interfaz de usuario en `components/` se divide estrictamente en `atoms/` (componentes básicos), `molecules/` (combinaciones de átomos) y `organisms/` (estructuras complejas con lógica de presentación).
- **Hooks Coordinadores**: El estado de la aplicación y la orquestación entre múltiples puertos/adaptadores se gestiona mediante React Hooks o Stores, manteniendo la UI desacoplada del flujo de dominio.

## 4. Estándares de Código y Calidad
- **TSDoc Obligatorio**: Interfaces, tipos y clases base deben estar documentadas con TSDoc completo (`@link`, `@example`, parámetros y retornos).
- **Manejo de Errores**: Se usan clases de error de dominio personalizadas que extienden de `Error` (ej. `CaptureError`), envolviendo los DTOs de error y preservando el *Stack Trace*.
- **Pruebas de Humo (Pre-commit)**: Validación estática o scripts temporales antes de realizar un commit para asegurar que el código compila y funciona.

## 5. Documentación Continua
- **Documentación Centralizada**: Decisiones de arquitectura y contratos se reflejan en la documentación (usando herramientas como Docusaurus en `apps/docs` o READMEs locales).
- **Guías de Mentoría**: Los módulos complejos deben incluir un `README.md` explicativo con ejemplos claros de integración (Fixtures).
