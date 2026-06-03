# Diagramas de Secuencia

:::note Arquitectura objetivo
Este flujo muestra la orquestacion **esperada** para el MVP. Sirve como referencia de comportamiento deseado y puede adelantarse al estado actual del repositorio.
:::

El siguiente diagrama detalla la orquestacion asincrona objetivo entre el hilo principal (UI), el hilo secundario (Web Worker) y la base de datos externa.

## 🎙️ Caso de Uso: Transcripción Verbatim y Generación de Score

Este escenario muestra como se espera que el audio capturado se procese usando Transformers.js sin bloquear la experiencia del usuario.

```mermaid
sequenceDiagram
    autonumber
    
    actor User as Usuario
    
    box Main Thread (Browser)
        participant UI as React UI<br/>(Presentation)
        participant UC as CalculateScoreUseCase<br/>(Domain)
    end
    
    box Web Worker
        participant Worker as Transformers.js<br/>Adapter
    end
    
    box Server/BaaS
        participant Action as Next.js Server Action
        participant DB as Supabase
    end

    User->>UI: Presiona "Iniciar Grabación"
    activate UI
    UI->>UI: Captura audio con MediaRecorder
    
    User->>UI: Presiona "Detener"
    Note right of UI: Se genera Blob de Audio
    
    UI->>Worker: postMessage({ audio: audioBlob })
    activate Worker
    Note right of Worker: Inferencia pesada (WebGPU/WASM)<br/>sobre modelo CrisperWhisper
    
    Worker-->>UI: { text: "Todo el texto", chunks: [{word, timestamp}] }
    deactivate Worker
    
    UI->>UC: execute(transcriptionData)
    activate UC
    
    Note right of UC: Ejecuta algoritmo que cruza el texto<br/>con el diccionario de muletillas.
    
    UC->>Action: saveSession(ScoreEntity)
    activate Action
    
    Action->>DB: INSERT /sessions
    activate DB
    DB-->>Action: Confirmación
    deactivate DB
    
    Action-->>UC: Record ID
    deactivate Action
    
    UC-->>UI: Resultado Final (Métricas y texto analizado)
    deactivate UC
    
    UI-->>User: Renderiza texto. Resalta muletillas usando timestamps.
    deactivate UI
```

### Explicación del Flujo
1.  **Carga Aislada**: El modelo de IA residiria en el hilo secundario (`Web Worker`). Esto evita que el navegador se congele mientras procesa redes neuronales.
2.  **Inferencia Literal**: El worker utilizaria `CrisperWhisper` via Transformers.js. No filtraria el audio; transcribiria todo, devolviendo un JSON con la cadena de texto completa y los metadatos precisos (tiempos de inicio/fin) de cada palabra pronunciada.
3.  **Analisis (Casos de Uso)**: La UI pasaria esta metadata al Caso de Uso puro. Este modulo actuaria como el "cerebro evaluador": detectaria cuales palabras del JSON son muletillas y formularia el score general de la presentacion.
4.  **Persistencia (Server Action)**: El resultado se enviaria de forma segura a traves de una Server Action a Supabase, aprovechando la infraestructura de Next.js.
