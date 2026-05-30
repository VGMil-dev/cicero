---
slug: client-side-ai-supabase
title: "Client-Side AI y Supabase: Eliminación del Backend Centralizado"
authors: [vgmil_dev]
tags: [arquitectura, serverless, supabase, ia, backend]
---

**Contexto:** Procesar audio en tiempo real para múltiples usuarios simultáneos.

{/* truncate */}

**Problema:** Enviar streams de audio a Nest.js genera cuellos de botella en la red, alto consumo de CPU en el servidor y costos recurrentes en APIs de terceros.

**Decisión:** 
1. Mover el motor de inferencia de voz al dispositivo del usuario (Client-Side AI) descargando el modelo en la caché del navegador.
2. Eliminar el servidor Nest.js por completo, delegando la persistencia de datos (scores) a Supabase (Backend-as-a-Service).

**Resultado:** Latencia cero en el análisis de audio, concurrencia infinita y costo de infraestructura reducido a $0.
