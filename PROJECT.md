# Project: Cicero Codebase Restructuring

## Architecture
Restructuring the Cicero core library from a tech-layered architecture (ports, adapters, usecases) to a flat feature-based Vertical Slices architecture.
Following HEX / Ports & Adapters, but organized by domain feature:
- `core/shared/`: Shared domain models, types, and error classes (CaptureError, types).
- `core/Recorder/`: Capturing microphone input (IAudioRecorder, BrowserMediaRecorder, FakeAudioRecorder).
- `core/AudioDecoder/`: Decoding audio binary formats (IAudioDecoder, BrowserAudioDecoder, FakeAudioDecoder).
- `core/SpeechToText/`: Transcribing PCM to text (IAudioAnalyzer, IAudioModelBootstrap, TransformersSpeechAdapter, WorkerAudioModelBootstrap, Transformers.worker, Transformers.engine, FakeAudioAnalyzer, FakeAudioModelBootstrap).
- `core/OratoryAnalysis/`: Fluency scoring and analytics (ICalculateScoreUseCase, CalculateScoreUseCase).

No nested `ports`, `adapters` or `usecases` subfolders will exist inside these feature folders.

## Code Layout
Existing code layout:
- `apps/web/src/core/ports/`
- `apps/web/src/core/adapters/`
- `apps/web/src/core/usecases/`

Target code layout:
- `apps/web/src/core/shared/`
- `apps/web/src/core/Recorder/`
- `apps/web/src/core/AudioDecoder/`
- `apps/web/src/core/SpeechToText/`
- `apps/web/src/core/OratoryAnalysis/`

## Interface Contracts & File Renaming
- Interfaces: `<Name>.port.ts`
- Real adapters: `<Name>.adapter.ts`
- Mock adapters: `<Name>.mock.ts`
- Use cases: `<Name>.usecase.ts`
- Web worker and engine: `Transformers.worker.ts`, `Transformers.engine.ts`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Investigation & Planning | Codebase analysis, PROJECT.md and plan.md creation | None | DONE |
| 2 | Core Files Restructure | Move/rename files to new domain folders with suffixes | M1 | IN_PROGRESS |
| 3 | Imports and Reference Updates | Update imports in core, hooks, app, and tests | M2 | PLANNED |
| 4 | Verification & Quality Gate | Verify clean compilation and 100% test success | M3 | PLANNED |
