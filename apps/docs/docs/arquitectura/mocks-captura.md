---
title: "Mocks de Captura"
sidebar_label: "Mocks de Captura"
---

# Mocks: Inicialización y Captura

:::info[Objetivo]
Documentar el uso de las implementaciones Fake (`FakeAudioModelBootstrap` y
`FakeAudioRecorder`) durante la Fase 1 (Mock-First) del desarrollo, permitiendo
al equipo de Front-end construir y validar la UI sin depender del Worker real
ni del hardware del dispositivo.
:::

## Ubicación de los Mocks

Los archivos se encuentran en:
`apps/web/src/core/ports/audio/mocks/`

## Uso de los Mocks

Los mocks se exportan desde `@/core/ports/audio/mocks` y se inyectan en los
componentes de React mediante el patrón de dependencias.

### Carga de modelo (flujo normal)

```typescript
import { FakeAudioModelBootstrap } from '@/core/ports/audio/mocks';

const bootstrap = new FakeAudioModelBootstrap({ progressInterval: 300 });

bootstrap.onProgress((p) => {
  // Actualizar barra de progreso: p.progress (0-100), p.stage
  setProgress(p.progress);
  setStage(p.stage);
});

await bootstrap.initialize();
// bootstrap.getState() → 'ready'
```

### Carga de modelo (error simulado)

```typescript
import { FakeAudioModelBootstrap, CaptureError } from '@/core/ports/audio/mocks';

const bootstrap = new FakeAudioModelBootstrap({
  shouldFail: true,
  failAtProgress: 40,
});

try {
  await bootstrap.initialize();
} catch (err) {
  const error = err as CaptureError;
  // error.dto.code === 'MODEL_LOAD_FAILED'
  // error.dto.message → mensaje legible
  // error.stack → traza de depuración preservada
  mostrarError(error.dto);
}
```

### Grabación (flujo normal)

```typescript
import { FakeAudioRecorder } from '@/core/ports/audio/mocks';

const recorder = new FakeAudioRecorder();

const perms = await recorder.requestPermissions();
if (!perms.microphoneGranted) return;

await recorder.startRecording();
// Estado 'recording' gestionado por el Hook/Store

const blob = await recorder.stopRecording();
// blob.type === 'audio/webm', blob.size === 0
```

### Grabación (permiso denegado)

```typescript
import { FakeAudioRecorder } from '@/core/ports/audio/mocks';

const recorder = new FakeAudioRecorder({ grantPermission: false });

const perms = await recorder.requestPermissions();
// perms.microphoneGranted === false
```

### Grabación (fallo al iniciar)

```typescript
import { FakeAudioRecorder, CaptureError } from '@/core/ports/audio/mocks';

const recorder = new FakeAudioRecorder({
  shouldFailOnStart: true,
});

await recorder.requestPermissions();
try {
  await recorder.startRecording();
} catch (err) {
  const error = err as CaptureError;
  // error.dto.code === 'RECORDING_FAILED'
}
```

### Inyección en componentes React

Los mocks se inyectan típicamente desde el archivo de configuración del
inyector de dependencias o directamente en tests/Storybook:

```typescript
import { IAudioModelBootstrap } from '@/core/ports/audio/IAudioModelBootstrap';
import { IAudioRecorder } from '@/core/ports/audio/IAudioRecorder';
import { FakeAudioModelBootstrap, FakeAudioRecorder } from '@/core/ports/audio/mocks';

// Proveedor de dependencias para Fase 1
const bootstrap: IAudioModelBootstrap = new FakeAudioModelBootstrap();
const recorder: IAudioRecorder = new FakeAudioRecorder();

// Inyectar en el hook orquestador
const { state, start, stop } = useAudioCapture(bootstrap, recorder);
```

> **Nota:** `FakeAudioRecorder` no gestiona estado interno porque el contrato
> `IAudioRecorder` no expone `getState()`. El estado global de captura
> (`idle`, `loading-model`, `ready`, `recording`, `error`) lo orquesta un Hook
> o Store de React que consume ambas interfaces.

## Consideraciones Arquitectónicas

- Los mocks implementan **estrictamente** las interfaces definidas en los contratos.
- `CaptureError` extiende `Error` nativo para preservar stack traces, y expone
  un `dto: ErrorDTO` para consumo de la UI.
- El estado global de captura se gestiona en la capa de orquestación (Hook/Store),
  no dentro de los mocks.
- Para la Fase 2 (Integración Real), los mocks se reemplazan por adaptadores
  reales (`Transformers.js` Worker, `MediaRecorder` API) sin cambios en la UI.
