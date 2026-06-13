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

