---
slug: unificacion-pwa
title: "De Monorepo a PWA: Unificación del Frontend"
authors: [lead_architect]
tags: [arquitectura, nextjs, pwa, frontend]
---

**Contexto:** El requerimiento original sugería React Native (Expo) y un backend en Nest.js.

**Problema:** Mantener un ecosistema móvil nativo separado de la web para un MVP añade sobrecarga de desarrollo y mantenimiento (Turborepo).

**Decisión:** Pivotar a una Progressive Web App (PWA) construida con Next.js.

**Resultado:** Un único código base instalable en móviles que simplifica el desarrollo y expone APIs web modernas (WebAssembly) esenciales para los siguientes pasos.