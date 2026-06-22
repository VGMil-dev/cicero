# Diagrama de Componentes (Hexagonal)

:::note Arquitectura objetivo
Esta pagina describe la estructura interna **objetivo** de la aplicacion. Algunas piezas todavia pueden estar en transicion dentro del repositorio actual, asi que debe leerse como direccion preferida y no como inventario cerrado de implementacion.
:::

Este diagrama presenta la estructura interna objetivo de la aplicacion Next.js aplicando **Arquitectura Limpia (Ports & Adapters)**, de modo que la IA y la base de datos funcionen como plugins del nucleo de negocio.

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart LR
    subgraph Presentation [Capa de Presentación - Drivers]
        UIComponents[UI Components<br/>React Hooks / Zustand]
    end

    subgraph Core [Núcleo de Negocio]
        direction TB
        subgraph Ports_In [Puertos de Entrada]
            RecordPort_In[IAnalyzeDisfluenciesUseCase]
        end
        subgraph Domain [Dominio]
            UseCase[CalculateScoreUseCase]
            Entities[Session & Score Entities]
        end
        subgraph Ports_Out [Puertos de Salida]
            Audio_Port[IAudioAnalyzer]
            Repo_Port[ISessionRepository]
        end
    end

    subgraph Infrastructure [Adaptadores de Infraestructura - Driven]
        TransformersAdapter[Transformers.js Adapter<br/>Web Worker]
        GeminiAdapter[Gemini 3.5 Flash Adapter<br/>Resumable Upload & Cache]
        SupabaseAdapter[Supabase Server Action Adapter]
    end

    %% Relaciones UI -> Core
    UIComponents -->|Invoca| RecordPort_In
    RecordPort_In -->|Implementado por| UseCase
    UseCase -->|Maneja| Entities

    %% Relaciones Core -> Infraestructura
    UseCase -->|Llama| Audio_Port
    UseCase -->|Llama| Repo_Port

    Audio_Port -->|Implementado por| TransformersAdapter
    Audio_Port -->|Implementado por| GeminiAdapter
    Repo_Port -->|Implementado por| SupabaseAdapter
```

## Descripción de Componentes

### 1. Capa de Presentación (Drivers)
Incluye los componentes de Next.js, hooks personalizados (como `useGeminiSettings`), el modal neobrutalista `GeminiSettingsModal` y el store de Zustand. Su responsabilidad es inicializar la grabación, gestionar la API Key del usuario de manera segura en local, e instanciar el adaptador de audio correspondiente.

### 2. Núcleo (Dominio y Casos de Uso)
- **Dominio**: Contiene la lógica de negocio pura (`CalculateScoreUseCase` y entidades). Recibe los datos de la transcripción y ejecuta el algoritmo de puntuación basándose en el conteo de muletillas.
- **Puertos de Salida**: `IAudioAnalyzer` define el contrato del motor de inferencia (recibe `Float32Array` y devuelve texto e interpolación lineal de timestamps).

### 3. Adaptadores de Infraestructura (Driven)
- **Gemini 3.5 Flash Adapter**: Implementación que segmenta el audio en fragmentos de 3 minutos, codifica a WAV localmente, gestiona la subida resumible y concurrente mediante Google Files API y realiza la inferencia mediante el modelo `gemini-3.5-flash` con posterior limpieza de los archivos subidos. Soporta caché offline en IndexedDB.
- **Transformers.js Adapter**: Adaptador local alternativo para inferencia en el cliente mediante ONNX y WebGPU/WASM.
- **Supabase Adapter**: Adaptador para persistir métricas de sesión de oratoria en la base de datos externa a través de Server Actions.

