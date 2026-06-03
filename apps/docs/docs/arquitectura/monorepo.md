# Estructura del Monorepo

Cicero utiliza un monorepo gestionado por **Turborepo** y **pnpm workspaces** para organizar el código y la documentación en un solo lugar, facilitando la consistencia de tipos y configuraciones.

## Organización de Carpetas

- **`apps/web`**: Aplicación principal construida con Next.js (App Router). Es una PWA que utiliza **Serwist** para el manejo de Service Workers y cacheo de modelos de IA.
- **`apps/docs`**: Sitio de documentación técnica construido con Docusaurus.
- **`packages/eslint-config`**: Configuraciones compartidas de ESLint y Prettier.
- **`packages/typescript-config`**: Configuraciones base de TypeScript (`tsconfig.json`).

## Comandos Principales (Atajos)

Para facilitar el desarrollo, el `package.json` de la raíz incluye atajos (shortcuts) que orquestan Turborepo y pnpm de forma transparente. Siempre debes ejecutarlos desde la **raíz del proyecto**.

### Flujo de Desarrollo (Dev)
- `pnpm dev`: **(Recomendado)** Levanta todas las aplicaciones en paralelo (Next.js en el puerto 3000, Docusaurus en el 3001).
- `pnpm dev:web`: Levanta *solo* la aplicación web.
- `pnpm dev:docs`: Levanta *solo* la documentación.

### Calidad y Testing
- `pnpm test`: Ejecuta la suite de pruebas (Jest) en todo el monorepo.
- `pnpm test:web`: Ejecuta los tests solo en la aplicación web.
- `pnpm test:watch`: Corre los tests de la web en modo observación (ideal para TDD).
- `pnpm lint`: Ejecuta ESLint en todos los proyectos para garantizar el estándar de código.
- `pnpm typecheck`: Ejecuta el typecheck de los workspaces que lo soportan.
- `pnpm typecheck:docs`: Ejecuta el typecheck solo de la documentación.
- `pnpm typecheck:web`: Ejecuta el typecheck solo de la aplicación web.

### Compilación (Build)
- `pnpm build`: Compila todas las aplicaciones para producción.
- `pnpm build:web`: Compila solo la aplicación web.
- `pnpm build:docs`: Compila solo la documentación.

### 🚨 El "Botón de Pánico" (Clean)
Si notas comportamientos extraños (cambios que no se reflejan, errores incomprensibles de compilación), es probable que las agresivas cachés de Next.js o Turborepo estén corruptas. 

Utiliza este comando para purgar todas las cachés y forzar un estado limpio:
```bash
pnpm clean
```
*(Tras ejecutarlo, simplemente vuelve a correr `pnpm dev`)*.

## Integración Continua (CI)

El proyecto cuenta con un workflow de **GitHub Actions** (`.github/workflows/ci.yml`) que valida automáticamente cada Push o Pull Request, asegurando que el código siempre cumpla con los estándares de calidad y sea compilable.

## Consideraciones Técnicas (Next.js 16)

Debido al uso de Serwist, la aplicación web está configurada para usar **Webpack** durante el build (`next build --webpack`) para garantizar la generación correcta del Service Worker, mientras que en desarrollo puede aprovechar Turbopack.
