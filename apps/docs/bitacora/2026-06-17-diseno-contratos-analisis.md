---
slug: diseno-contratos-analisis
title: "Diseño de Contratos para Decodificación, Transcripción y Puntuación de Voz"
authors: [vgmil_dev]
tags: [audio, contratos, arquitectura-hexagonal, types, docusaurus]
---

**Contexto:** Tras cerrar exitosamente el Hito 1 enfocado en la grabación de audio y la configuración del Web Worker, iniciamos el Hito 2 para procesar ese audio. El paso fundamental es el desacoplamiento mediante contratos (Puertos) de las etapas subsiguientes: decodificar el audio, realizar la inferencia y calcular el puntaje de oratoria.

**Decisión:** Diseñar y publicar las interfaces y DTOs en TypeScript siguiendo Arquitectura Hexagonal. Dividimos el pipeline de procesamiento en puertos primarios (Driver) y secundarios (Driven). Esto permite desarrollar en paralelo la lógica de negocio (scoring) e infraestructura (decodificador y modelo de transcripción) bajo un enfoque Mock-First.

{/* truncate */}

### 💡 Detalles Técnicos Implementados

#### 1. Extensión de DTOs en `types.ts`
*   **RawAudioChunk**: Definido para encapsular la estructura base de cada palabra transcrita (`word`, `start`, `end`) antes de que el dominio evalúe si es o no una muletilla.
*   **TranscriptionResultDTO**: Estructura que acopla el texto final de la transcripción y el listado de `RawAudioChunk`s, actuando como el contrato de salida de la etapa de transcripción de IA.
*   **Mensajería del Web Worker**: Se añadieron la acción `'ANALYZE_AUDIO'` enviada desde el hilo principal con un búfer `Float32Array` y la respuesta `'ANALYSIS_SUCCESS'` del Worker transportando el `TranscriptionResultDTO`.

#### 2. Puertos Secundarios (Driven / Infraestructura)
*   **IAudioDecoder**: Define el puerto para normalizar el binario del audio (`Blob`) a PCM mono muestreado a 16kHz (`Float32Array`).
*   **IAudioAnalyzer**: Define el puerto para tomar ese PCM y retornar la transcripción de texto con timestamps de forma asíncrona.

#### 3. Puerto Primario (Driver / Dominio)
*   **ICalculateScoreUseCase**: Representa el caso de uso principal del dominio. Recibe la transcripción bruta y calcula el `ScoreResult` final, el cual contiene las métricas computadas (`SessionMetricsDTO`) y las palabras marcadas individualmente como muletillas (`AudioChunkDTO[]`).

---

### 📦 Archivos Afectados

| Ruta de Archivo | Propósito |
| :--- | :--- |
| `apps/web/src/core/ports/audio/types.ts` | Extensión de DTOs, códigos de error y mensajería del Web Worker |
| `apps/web/src/core/ports/audio/IAudioDecoder.ts` | Puerto secundario para decodificar Blobs a PCM 16kHz mono |
| `apps/web/src/core/ports/audio/IAudioAnalyzer.ts` | Puerto secundario para la transcripción ASR a partir de PCM |
| `apps/web/src/core/ports/analysis/ICalculateScoreUseCase.ts` | Puerto primario (Driver) para evaluar fluidez y calcular puntuación |
| `apps/docs/docs/arquitectura/contratos-analisis.md` | Documentación oficial de los contratos de análisis en Docusaurus |
| `apps/docs/sidebars.ts` | Registro del nuevo documento en la estructura de menús laterales |
