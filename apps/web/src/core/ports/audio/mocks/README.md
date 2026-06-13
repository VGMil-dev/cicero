# Mocks de Captura de Audio

## ¿Por qué usamos Mocks?

Los mocks (implementaciones falsas o "Fake") nos permiten desarrollar la interfaz de usuario
sin depender de componentes reales como el modelo de IA (Transformers.js/ONNX) o el micrófono
del navegador. Esto evita bloqueos entre equipos: Front-end puede construir y validar la UI
mientras el equipo de IA integra el Worker real.

## Arquitectura

Cada mock implementa fielmente un contrato (interfaz TypeScript) definido en
`apps/web/src/core/ports/audio/`:

```
Interfaz (Contrato)          Implementación Fake
─────────────────────────────────────────────────
IAudioModelBootstrap  ─────  FakeAudioModelBootstrap
IAudioRecorder        ─────  FakeAudioRecorder
```

Gracias al patrón de Puertos y Adaptadores, la UI se inyecta la implementación
que necesita sin cambiar su código. En Fase 1 usamos Fakes; en Fase 2 se
reemplazan por adaptadores reales.

> **Nota:** `FakeAudioRecorder` **no** gestiona estado interno (`idle`, `recording`, etc.)
> porque `IAudioRecorder` no expone `getState()`. El estado global de captura
> es orquestado por un Hook o Store de React que consume ambas interfaces
> (`IAudioModelBootstrap` + `IAudioRecorder`).

## Cómo usar

```typescript
import {
  FakeAudioModelBootstrap,
  FakeAudioRecorder,
} from '@/core/ports/audio/mocks';

// ── Modelo (carga simulada) ──
const model = new FakeAudioModelBootstrap();
model.onProgress((p) => console.log(`${p.stage}: ${p.progress}%`));
await model.initialize();
console.log(model.getState()); // 'ready'

// ── Grabación (hardware simulado) ──
const recorder = new FakeAudioRecorder();
const perms = await recorder.requestPermissions();
if (perms.microphoneGranted) {
  await recorder.startRecording();
  // ... el usuario graba ...
  const blob = await recorder.stopRecording();
  console.log('Audio size:', blob.size);
}
```

## Cómo simular errores

### Error de carga del modelo
```typescript
import { CaptureError, FakeAudioModelBootstrap } from '@/core/ports/audio/mocks';

const model = new FakeAudioModelBootstrap({ shouldFail: true });
try {
  await model.initialize();
} catch (err) {
  const error = err as CaptureError;
  console.error(error.dto); // { code: 'MODEL_LOAD_FAILED', message: '...' }
  console.error(error.stack); // Stack trace preservado
}
```

### Permiso denegado
```typescript
import { FakeAudioRecorder } from '@/core/ports/audio/mocks';

const recorder = new FakeAudioRecorder({ grantPermission: false });
const perms = await recorder.requestPermissions();
console.log(perms.microphoneGranted); // false
```

### Error al iniciar grabación
```typescript
import { CaptureError, FakeAudioRecorder } from '@/core/ports/audio/mocks';

const recorder = new FakeAudioRecorder({
  grantPermission: true,
  shouldFailOnStart: true,
});
await recorder.requestPermissions();
try {
  await recorder.startRecording();
} catch (err) {
  const error = err as CaptureError;
  console.error(error.dto); // { code: 'RECORDING_FAILED', message: '...' }
}
```

## Cómo extender

1. Añade una nueva propiedad en las `*Options` del constructor.
2. Implementa la lógica en el método correspondiente.
3. Si necesitas un nuevo código de error, agrégalo a `ErrorCode` en `types.ts`.

Mantén los mocks simples: su propósito es probar estados de UI, no replicar
la lógica real del Worker o del hardware.
