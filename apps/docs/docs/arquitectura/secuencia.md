# Diagramas de Secuencia

:::note Arquitectura de Transición a Gemini
Estos diagramas detallan la orquestación asíncrona y la resiliencia en el cliente al utilizar la API de **Google Gemini 3.5 Flash** (esquema BYOK). Se contemplan el flujo exitoso con segmentación, el flujo de error y recuperación con IndexedDB, y el flujo de simulación fuera de línea (Sandbox).

---

## 1. Flujo Normal: Segmentación, Subida Resumible e Inferencia

Este diagrama detalla cómo se procesa un audio de presentación dividiéndolo en fragmentos de 3 minutos, subiéndolos en paralelo con control de concurrencia y transcribiéndolos mediante la API de Google sin costos de servidor.

```mermaid
sequenceDiagram
    autonumber
    
    actor User as Estudiante
    participant UI as React UI (Page / Modal)
    participant Adapter as GeminiSpeechAdapter
    participant DB as IndexedDB (Cache)
    participant GoogleAPI as Google Gemini API (Files & AI)
    participant UC as CalculateScoreUseCase
    participant Supabase as Supabase BaaS

    User->>UI: Detiene grabación de presentación
    activate UI
    UI->>Adapter: analyzeAudio(pcmData: Float32Array)
    activate Adapter
    
    Note over Adapter: 1. Segmentación en bloques de 3 minutos<br/>2. Codificación PCM a WAV (wavEncoder)
    
    loop Por cada segmento (Concurrencia máx: 3)
        Adapter->>DB: Guarda segmento WAV en IndexedDB
        
        Note over Adapter, GoogleAPI: Subida Resumible (Resumable Upload)
        Adapter->>GoogleAPI: 1. POST /v1beta/files (Inicia subida resumible)
        GoogleAPI-->>Adapter: 200 OK con Upload URI
        
        Adapter->>GoogleAPI: 2. PUT [Upload URI] (Envía WAV Blob)
        GoogleAPI-->>Adapter: 201 Created con URI del archivo
        
        Adapter->>GoogleAPI: 3. POST /v1beta/models/gemini-3.5-flash:generateContent
        GoogleAPI-->>Adapter: 200 OK (JSON con transcripción estructurada)
        
        Adapter->>GoogleAPI: 4. DELETE /v1beta/files/[fileID] (Limpieza inmediata)
        GoogleAPI-->>Adapter: 200 OK (Archivo eliminado)
        
        Note over Adapter: Interpolación Lineal de timestamps<br/>para cada palabra del segmento
        Adapter->>DB: Elimina segmento WAV de IndexedDB
    end
    
    Note over Adapter: Une resultados de todos los segmentos
    Adapter-->>UI: Retorna Transcripción completa y timestamps
    deactivate Adapter
    
    UI->>UC: execute(transcriptionData)
    activate UC
    Note over UC: Calcula Score y detecta muletillas
    UC->>Supabase: Server Action: saveSession(Score)
    Supabase-->>UC: Confirmación
    UC-->>UI: Resultados de Oratoria
    deactivate UC
    
    UI-->>User: Renderiza feedback neobrutalista y resalta muletillas
    deactivate UI
```

---

## 2. Flujo de Error y Reintento: Resiliencia con IndexedDB y Mitigación 429

Si ocurre un corte de internet o se excede el límite de solicitudes (HTTP 429), los fragmentos WAV permanecen a salvo en la base de datos local `IndexedDB`. El estudiante puede reintentar el proceso sin perder la grabación, incluso cambiando su API Key.

```mermaid
sequenceDiagram
    autonumber
    
    actor User as Estudiante
    participant UI as React UI (Page / Modal)
    participant Adapter as GeminiSpeechAdapter
    participant DB as IndexedDB (Cache)
    participant GoogleAPI as Google Gemini API (Files & AI)

    UI->>Adapter: analyzeAudio(pcmData)
    activate Adapter
    Note over Adapter: Divide en segmentos y codifica a WAV
    Adapter->>DB: Guarda Segmento 1 y 2 en IndexedDB
    
    Adapter->>GoogleAPI: Sube Segmento 1
    GoogleAPI-->>Adapter: 201 Created (Éxito)
    
    Adapter->>GoogleAPI: Sube Segmento 2 (Corte de red o HTTP 429)
    GoogleAPI-->>Adapter: Error de Red / 429 Too Many Requests
    
    Note over Adapter: Detiene el procesamiento restante
    Adapter-->>UI: Lanza error de subida (con ID de sesión)
    deactivate Adapter
    activate UI
    
    Note over UI: Alerta al usuario de forma no destructiva.<br/>Los fragmentos siguen en caché.
    UI-->>User: Muestra "Error de conexión/límite de cuota. Reintentar o Cambiar clave"
    
    opt Cambiar API Key
        User->>UI: Introduce nueva clave en GeminiSettingsModal
        UI->>UI: Guarda nueva clave en localStorage
    end
    
    User->>UI: Presiona "Reintentar Análisis"
    UI->>Adapter: retryAnalysis(sessionId)
    activate Adapter
    
    Adapter->>DB: Recupera segmentos no procesados (WAV 2)
    DB-->>Adapter: WAV Blobs
    
    Adapter->>GoogleAPI: Sube Segmento 2 (usando nueva clave si aplica)
    GoogleAPI-->>Adapter: 201 Created (Éxito)
    Adapter->>GoogleAPI: Inferencia Segmento 2
    GoogleAPI-->>Adapter: Transcripción
    Adapter->>GoogleAPI: DELETE /files/[fileID]
    
    Adapter->>DB: Limpia IndexedDB
    Adapter-->>UI: Retorna Transcripción completa
    deactivate Adapter
    UI-->>User: Muestra resultados finales
    deactivate UI
```

---

## 3. Flujo Sandbox: Simulación Local Offline

Cuando la clave configurada es exactamente `"sandbox"`, el adaptador entra en modo simulación local. No realiza llamadas de red ni consume tokens, ideal para pruebas de desarrollo rápidas y demostraciones offline.

```mermaid
sequenceDiagram
    autonumber
    
    actor User as Estudiante
    participant UI as React UI (Page / Modal)
    participant Adapter as GeminiSpeechAdapter
    participant UC as CalculateScoreUseCase

    User->>UI: Configura API Key a "sandbox"
    UI->>User: Confirmación instantánea (Ping de simulación exitoso)
    
    User->>UI: Detiene grabación de presentación
    activate UI
    UI->>Adapter: analyzeAudio(pcmData)
    activate Adapter
    
    Note over Adapter: Detecta API Key === "sandbox"
    Note over Adapter: Simula segmentación e inferencia localmente<br/>(Cero llamadas de red, cero costo de tokens)
    
    Adapter-->>UI: Retorna transcripción simulada y timestamps ficticios
    deactivate Adapter
    
    UI->>UC: execute(transcriptionData)
    activate UC
    UC-->>UI: Resultados de Oratoria (Score simulado)
    deactivate UC
    
    UI-->>User: Muestra feedback de simulación
    deactivate UI
```

