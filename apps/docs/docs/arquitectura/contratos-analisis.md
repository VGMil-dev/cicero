---
title: "Contratos de Análisis"
sidebar_label: "Contratos de Análisis"
---

# Contratos: Decodificación, Transcripción y Puntuación

:::info[Objetivo]
Definir los contratos base del slice de análisis para estandarizar la integración de las etapas de decodificación de audio, inferencia/transcripción de voz y evaluación algorítmica de fluidez.
:::

## Ubicación de los Contratos

*   **Audio (Decodificación e Inferencia):** `apps/web/src/core/ports/audio/`
*   **Análisis (Casos de Uso):** `apps/web/src/core/ports/analysis/`

---

## Objetos de Transferencia de Datos (DTOs)

### Fragmentos Simples (`RawAudioChunk`)
Representa una palabra detectada por el motor de inferencia con sus tiempos correspondientes, pero sin clasificación de muletilla.

```typescript
export interface RawAudioChunk {
  word: string;
  start: number; // En segundos
  end: number;   // En segundos
}
```

### Resultado de Transcripción (`TranscriptionResultDTO`)
Agrupa el texto bruto total y la lista de fragmentos simples de audio obtenidos tras el proceso de transcripción de la IA.

```typescript
export interface TranscriptionResultDTO {
  text: string;
  chunks: RawAudioChunk[];
}
```

### Resultados de Evaluación (`ScoreResult`)
El objeto final devuelto por el caso de uso del dominio, que contiene las métricas computadas (`SessionMetricsDTO`) y la lista de fragmentos anotados con la clasificación de muletillas (`AudioChunkDTO[]`).

```typescript
export interface ScoreResult {
  metrics: SessionMetricsDTO;
  chunks: AudioChunkDTO[];
}
```

---

## Puertos (Interfaces)

### IAudioDecoder (Secundario / Driven)
Responsable de normalizar los archivos de audio binarios recibidos en la UI a un arreglo lineal de PCM a 16kHz mono.

```typescript
export interface IAudioDecoder {
  decodeTo16kHzMono(audioBlob: Blob): Promise<Float32Array>;
}
```

### IAudioAnalyzer (Secundario / Driven)
Responsable de tomar el PCM decodificado y delegar la inferencia (usualmente mediante el Web Worker que ejecuta Transformers.js) para obtener la transcripción verbatim con timestamps.

```typescript
export interface IAudioAnalyzer {
  analyzeAudio(audioPCM: Float32Array): Promise<TranscriptionResultDTO>;
}
```

### ICalculateScoreUseCase (Primario / Driver)
Caso de uso del Core de dominio que analiza la transcripción verbatim comparándola contra el diccionario de muletillas/disfluencias configurado, computando el puntaje de fluidez y las estadísticas de oratoria.

```typescript
export interface ICalculateScoreUseCase {
  execute(transcription: TranscriptionResultDTO): ScoreResult;
}
```

---

## Arquitectura Hexagonal y Flujo de Datos

El siguiente diagrama Mermaid ilustra la interacción entre los puertos del sistema durante la fase de análisis de audio:

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f4f4f4', 'edgeLabelBackground':'#ffffff'}}}%%
flowchart LR
    subgraph UI ["Presentación / UI"]
        Component["Resultados / Record UI"]
    end

    subgraph Core ["Dominio / Core (Puertos)"]
        UseCase["ICalculateScoreUseCase (Driver)"]
        Decoder["IAudioDecoder (Driven)"]
        Analyzer["IAudioAnalyzer (Driven)"]
    end

    subgraph Infra ["Infraestructura (Adaptadores)"]
        AudioCtx["WebAudioDecoder (AudioContext)"]
        WorkerASR["WorkerAudioAnalyzer (Web Worker)"]
        DomainEval["CalculateScoreUseCase (Domain Logic)"]
    end

    %% Flujo de ejecución
    Component -->|1. Envía Blob| Decoder
    Decoder -.->|Implementa| AudioCtx
    AudioCtx -->|2. Retorna PCM| Component
    Component -->|3. Envía PCM| Analyzer
    Analyzer -.->|Implementa| WorkerASR
    WorkerASR -->|4. Retorna TranscriptionResultDTO| Component
    Component -->|5. Invoca execute()| UseCase
    UseCase -.->|Implementa| DomainEval
    DomainEval -->|6. Retorna ScoreResult| Component
```
