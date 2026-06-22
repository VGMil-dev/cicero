<p align="center">
  <img src="./assets/logo.png" alt="Cicero" width="140" />
</p>

<h1 align="center">Cicero</h1>

<p align="center">
  Análisis de oratoria y detección de muletillas a partir de audio grabado localmente.
</p>

<p align="center">
  <a href="./apps/docs/docs/intro.md"><strong>Introducción</strong></a>
  ·
  <a href="./apps/docs/docs/arquitectura/index.md"><strong>Arquitectura</strong></a>
  ·
  <a href="./apps/docs/bitacora"><strong>Bitácora</strong></a>
</p>

---

## Qué representa este repositorio

Este repositorio es un **Monorepo** (gestionado con Turborepo y pnpm workspaces) que concentra tanto la aplicación PWA principal como su documentación técnica.

| Directorio | Propósito |
| --- | --- |
| **`apps/web`** | Aplicación principal (Next.js PWA + Transformers.js). |
| **`apps/docs`** | Documentación técnica y bitácora de decisiones (Docusaurus). |
| **`packages/*`** | Configuraciones compartidas (ESLint, TypeScript). |

> [!IMPORTANT]
> La fuente de verdad para la dirección técnica actual vive en `apps/docs/`.

## Dirección técnica actual

| Frente | Decisión actual |
| --- | --- |
| **Experiencia principal** | Web-first con Next.js y capacidades PWA (Serwist) |
| **Procesamiento de audio** | Análisis local (Transformers.js / Web Workers) |
| **Persistencia** | Supabase |
| **Arquitectura interna** | Hexagonal + Vertical Slicing |
| **Infraestructura** | Turborepo, Jest, GitHub Actions |

## Por dónde empezar

1. **[`apps/docs/docs/intro.md`](./apps/docs/docs/intro.md)** para entender el marco general del proyecto.
2. **[`apps/docs/docs/arquitectura/monorepo.md`](./apps/docs/docs/arquitectura/monorepo.md)** para entender la infraestructura actual.
3. **[`apps/docs/bitacora/`](./apps/docs/bitacora)** para ver el historial de decisiones y pivotes.

## Desarrollo Local

Dado que es un monorepo, los comandos se ejecutan desde la **raíz del proyecto**:

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar PWA y Documentación en paralelo
pnpm dev
```

- La **PWA** estará disponible en `http://localhost:3000`
- La **Documentación** estará disponible en `http://localhost:3001`

Para ver otros comandos útiles (testing, linting, build), revisa la [Guía del Monorepo](./apps/docs/docs/arquitectura/monorepo.md) o el `package.json` de la raíz.
