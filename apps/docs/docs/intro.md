# Introduccion a Cicero

Bienvenido a la documentacion tecnica de **Cicero**, un proyecto enfocado en analizar oratoria y detectar muletillas a partir de audio grabado localmente.

## Que representa esta documentacion

Esta documentacion combina tres capas que ahora estan separadas de forma explicita:

- **Vision objetivo:** hacia donde va el producto.
- **Estado actual:** que refleja hoy el repositorio.
- **Transicion:** decisiones ya tomadas que todavia se estan consolidando.

La meta es que puedas entender el proyecto sin confundir arquitectura objetivo con implementacion cerrada.

## El problema

Muchos oradores, tanto principiantes como experimentados, sufren del uso excesivo de muletillas como "eh", "este", "bueno" o "digamos". Estas palabras reducen claridad, confianza y profesionalismo al comunicar una idea.

## La propuesta de Cicero

Cicero prioriza una experiencia web-first para:

1. **Capturar** audio de forma local.
2. **Analizar** el discurso para identificar muletillas y patrones de fluidez.
3. **Devolver** feedback util y persistir resultados relevantes.

## Estado actual

El repositorio sigue en transicion. La documentacion de arquitectura describe la direccion preferida del proyecto, mientras que la bitacora registra las decisiones y pivotes que llevaron hasta aqui.

## Vision objetivo

La direccion tecnica documentada hoy prioriza:

- una experiencia principal en Next.js con capacidades PWA;
- procesamiento local de audio en el dispositivo del usuario;
- persistencia ligera con Supabase;
- una arquitectura hexagonal organizada por vertical slices.

## Por donde empezar

Si llegas por primera vez al proyecto, este es el orden recomendado:

1. **[Arquitectura](./arquitectura/)** para entender el modelo tecnico general.
2. **[Decisiones de diseno](./arquitectura/decisiones)** para ver que partes son vision objetivo y que partes siguen en transicion.
3. **[Bitacora](/bitacora)** para revisar el historial de decisiones y pivotes.
