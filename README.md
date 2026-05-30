<p align="center">
  <img src="./assets/logo.png" alt="Cicero" width="140" />
</p>

<h1 align="center">Cicero</h1>

<p align="center">
  Analisis de oratoria y deteccion de muletillas a partir de audio grabado localmente.
</p>

<p align="center">
  <a href="./docs/docs/intro.md"><strong>Introduccion</strong></a>
  ·
  <a href="./docs/docs/arquitectura/index.md"><strong>Arquitectura</strong></a>
  ·
  <a href="./docs/bitacora"><strong>Bitacora</strong></a>
</p>

---

## Que representa este repositorio

Este repositorio concentra la documentacion tecnica de **Cicero** y el contexto de una arquitectura que sigue en consolidacion. La carpeta `docs/` es la referencia principal para entender tres capas que ahora estan separadas de forma explicita:

| Capa | Que responde |
| --- | --- |
| **Vision objetivo** | Hacia donde va el producto |
| **Estado actual** | Que refleja hoy el repositorio |
| **Transicion** | Que decisiones ya fueron tomadas y siguen aterrizando |

> [!IMPORTANT]
> La fuente de verdad para la direccion tecnica actual vive en `docs/`.

## Direccion tecnica actual

| Frente | Decision actual |
| --- | --- |
| **Experiencia principal** | Web-first con Next.js y capacidades PWA |
| **Procesamiento de audio** | Analisis local en el dispositivo del usuario |
| **Persistencia** | Supabase |
| **Arquitectura** | Hexagonal + Vertical Slicing |
| **Estrategia movil** | Linea futura, subordinada a validar primero la experiencia web |

## Estado del repo

La implementacion sigue consolidandose. Por eso algunas decisiones historicas todavia aparecen en la bitacora o en documentos previos; el punto de partida correcto para entender el proyecto hoy es la documentacion central.

## Por donde empezar

1. **[`docs/docs/intro.md`](./docs/docs/intro.md)** para entender el marco general del proyecto.
2. **[`docs/docs/arquitectura/index.md`](./docs/docs/arquitectura/index.md)** para revisar la direccion tecnica objetivo.
3. **[`docs/bitacora/`](./docs/bitacora)** para ver el historial de decisiones y pivotes.

## Documentacion local

```bash
cd docs
pnpm install
pnpm start
```

La configuracion del sitio vive en `docs/docusaurus.config.ts`.
