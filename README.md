# Cicero

Proyecto para analizar oratoria y detectar muletillas a partir de audio grabado localmente.

## Que representa este repositorio

Este repositorio concentra la documentacion tecnica y la arquitectura en transicion de Cicero. La carpeta `docs/` es la referencia principal para entender:

- la vision objetivo del producto;
- el estado actual del proyecto;
- las decisiones tecnicas tomadas durante la transicion.

## Direccion tecnica actual

- **Experiencia principal:** web-first con Next.js y capacidades PWA.
- **Procesamiento de audio:** analisis local en el dispositivo del usuario.
- **Persistencia:** Supabase.
- **Arquitectura:** Hexagonal + Vertical Slicing.
- **Estrategia movil:** linea futura, subordinada a validar primero el flujo principal en la experiencia web.

## Estado actual

El proyecto sigue consolidando su implementacion. Por eso algunas decisiones historicas del stack todavia aparecen en la bitacora o en documentos previos; la fuente de verdad para la direccion tecnica actual vive en `docs/`.

## Empezar por aqui

- `docs/docs/intro.md`
- `docs/docs/arquitectura/index.md`
- `docs/bitacora/`
