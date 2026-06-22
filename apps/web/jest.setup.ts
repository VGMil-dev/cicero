import "@testing-library/jest-dom";

// 1. Mock global de Web Worker
class MockWorker {
  url: string;
  options?: any;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  
  static instances: MockWorker[] = [];

  constructor(url: string, options?: any) {
    this.url = url;
    this.options = options;
    MockWorker.instances.push(this);
  }

  postMessage = jest.fn();
  terminate = jest.fn();
  
  addEventListener = jest.fn().mockImplementation((event, callback) => {
    if (event === 'error') {
      this.onerror = callback;
    }
    if (event === 'message') {
      this.onmessage = callback;
    }
  });

  removeEventListener = jest.fn();
}

(global as any).Worker = MockWorker;
(global as any).MockWorker = MockWorker;

// 2. Mock global de navigator.storage para estimación de cuota
if (typeof navigator !== 'undefined') {
  const mockStorage = {
    estimate: jest.fn().mockResolvedValue({
      quota: 1000 * 1024 * 1024, // 1GB
      usage: 100 * 1024 * 1024,  // 100MB
    }),
  };

  Object.defineProperty(navigator, 'storage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  });
}

// 3. Mock global de WebGPU (inicializado como undefined para simular fallback a WASM en tests)
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'gpu', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

// 4. Mock global de MediaRecorder (necesario en jsdom que no implementa APIs de audio nativas)
class MockMediaRecorder {
  stream: any;
  options?: any;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  static isTypeSupported = jest.fn().mockImplementation((mimeType: string) => {
    // Retorna true por defecto para pasar todas las validaciones de tipo en adaptadores y tests
    return true;
  });

  constructor(stream: any, options?: any) {
    this.stream = stream;
    this.options = options;
  }

  start = jest.fn().mockImplementation(() => {
    this.state = 'recording';
  });

  stop = jest.fn().mockImplementation(() => {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({
        data: new Blob(['audio-data-mock'], { type: this.options?.mimeType || 'audio/webm' }),
      });
    }
    if (this.onstop) {
      this.onstop();
    }
  });

  pause = jest.fn().mockImplementation(() => {
    this.state = 'paused';
  });

  resume = jest.fn().mockImplementation(() => {
    this.state = 'recording';
  });

  addEventListener = jest.fn().mockImplementation((event: string, callback: any) => {
    if (event === 'dataavailable') this.ondataavailable = callback;
    if (event === 'stop') this.onstop = callback;
    if (event === 'error') this.onerror = callback;
  });

  removeEventListener = jest.fn();
  dispatchEvent = jest.fn().mockReturnValue(true);
}

if (typeof window !== 'undefined') {
  (window as any).MediaRecorder = MockMediaRecorder;
}
(global as any).MediaRecorder = MockMediaRecorder;

