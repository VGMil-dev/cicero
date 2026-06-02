---
slug: infraestructura-monorepo-pwa
title: "Estableciendo las Bases: Monorepo, PWA y CI/CD"
authors: [vgmil_dev]
tags: [arquitectura, turborepo, pwa, serwist, ci-cd, jest]
---

**Contexto:** Necesitábamos una infraestructura que soportara nuestra nueva estrategia Web-First (PWA) y la documentación técnica actual, sin crear un caos de dependencias.

{/* truncate */}

### 🚧 Los Retos

*   **Estructura:** Mezclar el código de la app PWA con el sitio de Docusaurus en la misma carpeta era insostenible a largo plazo.
*   **El Choque (Next.js vs PWA):** Para guardar los modelos de IA offline necesitamos un Service Worker (**Serwist**). El problema es que Next.js 16 usa el nuevo compilador *Turbopack* por defecto, el cual aún **no es compatible** con la inyección de Service Workers que hace Serwist (que depende de Webpack).
*   **Calidad:** Queríamos evitar deuda técnica desde el día 1, unificando reglas de código y testing.

### 🛠️ Las Soluciones

1.  **Arquitectura Monorepo (Turborepo + pnpm):** 
    Separamos el proyecto limpiamente en `apps/web` (Next.js) y `apps/docs` (Docusaurus). Turborepo ahora orquesta ambos, dándonos compilaciones súper rápidas gracias a su caché.
2.  **Forzar Webpack en Next.js:** 
    Ajustamos los scripts de la app (`next dev --webpack` y `next build --webpack`). Esto "apaga" Turbopack temporalmente, permitiendo que Serwist genere la PWA sin errores.
3.  **Calidad y CI Automatizado:** 
    *   Configuraciones unificadas en la carpeta `packages/`.
    *   **Jest** listo para pruebas unitarias.
    *   **GitHub Actions** configurado para correr lint, tests y build automáticamente en cada Pull Request.

### 🎯 Resultado
Con un simple `pnpm dev` en la raíz, ahora levantamos la App y la Documentación al mismo tiempo (sin choques de puertos). Tenemos un entorno empresarial sólido, listo para empezar a integrar la Inteligencia Artificial.
