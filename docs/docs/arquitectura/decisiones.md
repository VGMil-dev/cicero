# Decisiones de Diseño

En esta sección se detallan las decisiones arquitectónicas clave tomadas para el proyecto **Cicero**, justificando el pivote estratégico para garantizar escalabilidad, costo cero en inferencia y alta precisión en la detección de disfluencias.

## 🤖 Transformers.js sobre Vosk (El Motor de IA)
Inicialmente se evaluó `vosk-browser` por su bajísima latencia. Sin embargo, se decidió pivotar hacia **Transformers.js (Hugging Face)** por tres razones arquitectónicas críticas:
1.  **Soporte TypeScript y Ecosistema Moderno:** Transformers.js es nativo de la web moderna, permitiendo un código limpio, fuertemente tipado y fácil de integrar en Web Workers dentro de Next.js, a diferencia de la API más arcaica de Kaldi/Vosk.
2.  **Transcripción Verbatim (El problema de Whisper):** Los modelos tradicionales de Speech-to-Text limpian el audio (borran los "eh" y "mmm"). Al usar Transformers.js, podemos cargar **CrisperWhisper**, un modelo ONNX especializado específicamente en transcripción literal que *retiene* las muletillas y provee timestamps precisos por palabra, lo cual es el core de nuestra aplicación.
3.  **Aceleración de Hardware:** Transformers.js (v3) soporta **WebGPU**, lo que permite delegar la inferencia a la tarjeta gráfica del usuario en lugar de bloquear la CPU, logrando velocidades de procesamiento muy superiores.

## 📱 Estrategia PWA sobre App Nativa (React Native/Flutter)
El requerimiento original sugería un framework híbrido móvil tradicional. Pivotamos hacia una **Progressive Web App (PWA)** en Next.js.
- **Justificación**: Las apps híbridas enfrentan enormes dificultades para compilar modelos acústicos complejos (C++) en iOS/Android. La PWA nos permite descargar el modelo ONNX en la caché del navegador de forma transparente, logrando procesamiento $0 en servidor y sin depender de APIs de terceros (No Vendor Lock-in de OpenAI).

## 🚀 Eliminación del Backend Tradicional (Serverless / BaaS)
Se descartó el diseño inicial de usar una API centralizada (Nest.js).
- **Cero Cuellos de Botella**: Procesar audio en un backend central genera altos costos de CPU. Al delegar la inferencia al dispositivo del usuario (Client-Side AI), el backend es redundante.
- **Supabase directo**: Usamos Supabase interactuando de forma segura a través de **Server Actions** nativas de Next.js.

## 📐 Patrones Arquitectónicos (Clean Architecture)
Para evitar quedar atados a Supabase y cumplir con los estándares de mantenibilidad, aplicamos **Clean Architecture (Ports & Adapters)**:
- **Separación**: Los componentes UI solo renderizan el texto y los timestamps generados por la IA.
- **Puertos**: El dominio se comunica a través de interfaces (`ISpeechEngine`, `ISessionRepository`).
- **Adaptadores**: Implementamos adaptadores como el `TransformersSpeechAdapter` que orquesta la comunicación con el Web Worker.
