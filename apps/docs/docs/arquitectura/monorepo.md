# Estructura del Monorepo

Cicero utiliza un monorepo gestionado por **Turborepo** y **pnpm workspaces** para organizar el código y la documentación en un solo lugar, facilitando la consistencia de tipos y configuraciones.

## Organización de Carpetas

- **`apps/web`**: Aplicación principal construida con Next.js (App Router). Es una PWA que utiliza **Serwist** para el manejo de Service Workers y cacheo de modelos de IA.
- **`apps/docs`**: Sitio de documentación técnica construido con Docusaurus.
- **`packages/eslint-config`**: Configuraciones compartidas de ESLint y Prettier.
- **`packages/typescript-config`**: Configuraciones base de TypeScript (`tsconfig.json`).

## Comandos Principales

Desde la raíz del proyecto, puedes usar los siguientes comandos orquestados por Turbo:

- `pnpm dev`: Inicia todos los entornos de desarrollo en paralelo.
- `pnpm build`: Compila todas las aplicaciones para producción.
- `pnpm lint`: Ejecuta el análisis estático de código.
- `pnpm test`: Ejecuta la suite de pruebas con Jest.

## Integración Continua (CI)

El proyecto cuenta con un workflow de **GitHub Actions** (`.github/workflows/ci.yml`) que valida automáticamente cada Push o Pull Request, asegurando que el código siempre cumpla con los estándares de calidad y sea compilable.

## Consideraciones Técnicas (Next.js 16)

Debido al uso de Serwist, la aplicación web está configurada para usar **Webpack** durante el build (`next build --webpack`) para garantizar la generación correcta del Service Worker, mientras que en desarrollo puede aprovechar Turbopack.
