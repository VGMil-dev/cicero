import { IAudioModelBootstrap } from '../IAudioModelBootstrap';
import { AudioCaptureState, ErrorCode, ErrorDTO, ProgressDTO } from '../types';
import { CaptureError } from '../CaptureError';

/**
 * Configuration options for {@link FakeAudioModelBootstrap}.
 */
export interface FakeAudioModelBootstrapOptions {
  /**
   * When `true`, {@link FakeAudioModelBootstrap.initialize} will reject with
   * `MODEL_LOAD_FAILED` once the progress reaches {@link failAtProgress}.
   * @default false
   */
  shouldFail?: boolean;
  /**
   * Progress threshold (0-100) at which the simulated failure triggers.
   * Only applies when {@link shouldFail} is `true`.
   * @default 50
   */
  failAtProgress?: number;
  /**
   * Milliseconds between each simulated progress event.
   * @default 1000
   */
  progressInterval?: number;
}

type ProgressStage = { progress: number; stage: string };

const DEFAULT_STAGES: ProgressStage[] = [
  { progress: 10, stage: 'downloading' },
  { progress: 40, stage: 'downloading' },
  { progress: 80, stage: 'extracting' },
  { progress: 100, stage: 'loading' },
];

/**
 * Fake implementation of {@link IAudioModelBootstrap} for UI development.
 *
 * Simulates the model download/initialization process by emitting
 * progressive {@link ProgressDTO} events at regular intervals.
 * Can be configured to fail at a specific progress point to test
 * error states in the UI.
 *
 * @example
 * ```typescript
 * const model = new FakeAudioModelBootstrap();
 * model.onProgress((p) => console.log(`${p.stage}: ${p.progress}%`));
 * await model.initialize();
 * ```
 *
 * @example
 * ```typescript
 * const failing = new FakeAudioModelBootstrap({ shouldFail: true });
 * try {
 *   await failing.initialize();
 * } catch (err) {
 *   console.error(err.code); // 'MODEL_LOAD_FAILED'
 * }
 * ```
 */
export class FakeAudioModelBootstrap implements IAudioModelBootstrap {
  private state: AudioCaptureState = 'idle';
  private progressCallbacks = new Set<(progress: ProgressDTO) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private options: Required<FakeAudioModelBootstrapOptions>;

  /**
   * @param options - Configuration for progress timing and error simulation.
   */
  constructor(options: FakeAudioModelBootstrapOptions = {}) {
    this.options = {
      shouldFail: options.shouldFail ?? false,
      failAtProgress: options.failAtProgress ?? 50,
      progressInterval: options.progressInterval ?? 1000,
    };
  }

  /**
   * Starts the simulated model initialization.
   *
   * Emits progress events (10%, 40%, 80%, 100%) at the configured
   * {@link FakeAudioModelBootstrapOptions.progressInterval} and resolves
   * when complete. If {@link FakeAudioModelBootstrapOptions.shouldFail}
   * is `true`, rejects with a `MODEL_LOAD_FAILED` error.
   *
   * @throws {ErrorDTO} With code `MODEL_LOAD_FAILED` when simulated failure is enabled.
   */
  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.state = 'loading-model';

      let index = 0;
      this.timer = setInterval(() => {
        if (index >= DEFAULT_STAGES.length) {
          this.clearTimer();
          this.state = 'ready';
          resolve();
          return;
        }

        const current = DEFAULT_STAGES[index];

        if (this.options.shouldFail && current.progress >= this.options.failAtProgress) {
          this.clearTimer();
          this.state = 'error';
          reject(new CaptureError('MODEL_LOAD_FAILED', 'Simulated model load failure for UI testing'));
          return;
        }

        this.emitProgress(current);
        index++;
      }, this.options.progressInterval);
    });
  }

  /**
   * Subscribes to model loading progress events.
   *
   * Supports multiple listeners — each registered callback will receive
   * every progress event.
   *
   * @param callback - Function called with each simulated {@link ProgressDTO} update.
   */
  onProgress(callback: (progress: ProgressDTO) => void): void {
    this.progressCallbacks.add(callback);
  }

  getState(): AudioCaptureState {
    return this.state;
  }

  private emitProgress(current: ProgressStage): void {
    const dto: ProgressDTO = {
      progress: current.progress,
      stage: current.stage,
    };

    for (const cb of this.progressCallbacks) {
      cb(dto);
    }
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
