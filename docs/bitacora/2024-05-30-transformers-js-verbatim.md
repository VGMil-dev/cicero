---
slug: transformers-js-verbatim
title: "Migración de Vosk a Transformers.js"
authors: [lead_architect]
tags: [arquitectura, ia, transformersjs, typescript, webgpu]
---

**Contexto:** Implementación del motor de voz local (Client-Side) en un entorno TypeScript.

{/* truncate */}

**Problema 1:** `vosk-browser` carece de soporte robusto para TypeScript, dificultando su integración limpia.

**Problema 2:** Los modelos estándar filtran y limpian el texto por defecto, eliminando las muletillas ("eh", "mmm") que la aplicación necesita contabilizar.

**Decisión:** Migrar a **Transformers.js** utilizando el modelo `CrisperWhisper-ONNX`.

**Resultado:** Soporte TypeScript nativo, aceleración de hardware mediante WebGPU y, crucialmente, soporte para transcripción *verbatim* (literal), lo que garantiza la captura exacta de muletillas con sus respectivos *timestamps*.
