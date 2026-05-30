---
slug: web-workers-resiliencia-ia
title: "Aislamiento en Web Workers y Estrategia Zero Trust para IA"
authors: [lead_architect]
tags: [arquitectura, performance, web-workers, resiliencia, pwa]
---

**Contexto:** Integración del modelo de inferencia de Transformers.js (aprox. 50MB) en el cliente.

**Problema 1:** La carga e inicialización del modelo en el hilo principal bloqueaba la UI de React, afectando gravemente la experiencia de usuario.

**Problema 2:** En entornos de PWA, variables como conexiones inestables, límites de memoria (Out of Memory en móviles) y fallos del driver de WebGPU pueden provocar cierres silenciosos o corrupciones.

**Decisión:** 
1. Mover toda la lógica de inferencia a un **Web Worker** mediante un patrón Singleton.
2. Implementar una estrategia de **Desconfianza Total (Zero Trust)**: 
   - No depender de `navigator.onLine`, validando primero la `Cache API`.
   - Uso obligatorio de modelos cuantizados (`q8`, `q4`) y liberación explícita con `.dispose()`.
   - Validación de cuotas de almacenamiento previas a la descarga.
   - Monitoreo de `worker.onerror` para resucitación en caso de *crashes* de WASM.

**Resultado:** Una interfaz fluida (React no se congela), reportes precisos del progreso de carga de la IA, y un sistema resistente a errores de memoria y fallos de red silenciosos.
