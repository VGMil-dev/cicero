---
slug: pivot-arquitectura-pwa-transformers
title: "Pivote Arquitectónico: PWA, WebAssembly y Supabase"
authors: [lead_architect]
tags: [arquitectura, nextjs, pwa, ia, supabase, wasm]
---

# Evolución del Proyecto: El camino hacia la latencia cero

En esta primera entrada de nuestra Bitácora de Decisiones Arquitectónicas (ADR), documentamos uno de los pivotes más significativos en la historia técnica de **Cicero**.

El requerimiento original planteaba un desafío clásico: construir una aplicación de oratoria híbrida (React Native/Flutter) capaz de grabar audio, detectar muletillas y guardar resultados.

## El Problema con el Diseño Original (Nest.js + Móvil Híbrido)

Nuestra primera iteración contemplaba un frontend en **Expo** y un backend centralizado en **Nest.js**. Sin embargo, esto presentaba un "trilema" arquitectónico:
1. **Latencia**: Enviar audio al servidor para procesamiento genera retrasos notables.
2. **Costo**: Depender de un backend para procesar redes neuronales o usar APIs de terceros (como Whisper de OpenAI) dispara los costos operativos con cada nuevo usuario.
3. **Complejidad Nativa**: Intentar compilar modelos acústicos en C++ dentro de React Native para correrlos offline es extremadamente complejo y propenso a errores en distintas plataformas (iOS vs Android).

## La Solución: Client-Side AI y Serverless

Como arquitectos, decidimos tomar una ruta más audaz y eficiente:

### 1. Progressive Web App (PWA) con Next.js
Eliminamos la separación web/móvil y Turborepo. Una PWA construida en Next.js nos da un solo código base, instalable en dispositivos móviles, y lo más importante: **acceso pleno a los estándares modernos de la web (WebAssembly y WebGPU)**.

### 2. Transformers.js y el Modelo CrisperWhisper
Descartamos enviar el audio al servidor. Usaremos `@huggingface/transformers` en un **Web Worker**. 
* Por qué es vital: Descargamos el modelo `CrisperWhisper-ONNX` directamente en la caché del navegador. Este modelo es especial porque hace una **transcripción verbatim**, es decir, captura cada "eh", "mmm" y tartamudeo (al contrario de Whisper normal que limpia el texto).
* El resultado: Latencia cero, inferencia 100% gratuita y privada.

### 3. Supabase como BaaS (Adiós Nest.js)
Si la IA ya corre en el teléfono del usuario, mantener un servidor de Nest.js solo para guardar datos es sobreingeniería. Conectamos Next.js directamente a **Supabase** (PostgreSQL) aprovechando sus Row Level Security (RLS) y Next.js Server Actions para una persistencia rápida y segura.

## Conclusión

Este pivote no solo simplifica nuestra base de código (reduciéndola a un repositorio de Next.js), sino que crea un modelo de negocio ultra-escalable donde **cada usuario trae su propio procesador para la IA**, reduciendo nuestros costos de servidor prácticamente a cero.