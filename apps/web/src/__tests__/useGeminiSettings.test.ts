import { renderHook, act } from '@testing-library/react';
import { useGeminiSettings } from '../hooks/useGeminiSettings';

describe('useGeminiSettings Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
    jest.restoreAllMocks();
  });

  it('should initialize with null API key when localStorage is empty', () => {
    const { result } = renderHook(() => useGeminiSettings());
    expect(result.current.apiKey).toBeNull();
    expect(result.current.isConfigured).toBe(false);
  });

  it('should initialize with key from localStorage if preset', () => {
    localStorage.setItem('gemini_api_key', 'my-preset-key');
    const { result } = renderHook(() => useGeminiSettings());
    expect(result.current.apiKey).toBe('my-preset-key');
    expect(result.current.isConfigured).toBe(true);
  });

  it('should validate sandbox key instantly without network requests', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const { result } = renderHook(() => useGeminiSettings());

    let validationPromise: Promise<boolean>;
    act(() => {
      validationPromise = result.current.validateApiKey('sandbox');
    });

    expect(result.current.isValidating).toBe(true);

    let isValid = false;
    await act(async () => {
      isValid = await validationPromise;
    });

    expect(isValid).toBe(true);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should validate a real key successfully', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGeminiSettings());

    let validationPromise: Promise<boolean>;
    act(() => {
      validationPromise = result.current.validateApiKey('AIzaSyRealKey');
    });

    expect(result.current.isValidating).toBe(true);

    let isValid = false;
    await act(async () => {
      isValid = await validationPromise;
    });

    expect(isValid).toBe(true);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('gemini-3.5-flash:generateContent?key=AIzaSyRealKey'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should handle API validation failure correctly', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: 'API key not valid' },
      }),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGeminiSettings());

    let validationPromise: Promise<boolean>;
    act(() => {
      validationPromise = result.current.validateApiKey('InvalidKey');
    });

    let isValid = true;
    await act(async () => {
      isValid = await validationPromise;
    });

    expect(isValid).toBe(false);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBe('API key not valid');
  });

  it('should handle network fetch exceptions gracefully', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('Network disconnected'));
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGeminiSettings());

    let validationPromise: Promise<boolean>;
    act(() => {
      validationPromise = result.current.validateApiKey('SomeKey');
    });

    let isValid = true;
    await act(async () => {
      isValid = await validationPromise;
    });

    expect(isValid).toBe(false);
    expect(result.current.isValidating).toBe(false);
    expect(result.current.validationError).toBe('Network disconnected');
  });

  it('should save the key in state and localStorage if validation succeeds', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGeminiSettings());

    let savePromise: Promise<boolean>;
    act(() => {
      savePromise = result.current.saveApiKey('NewValidKey');
    });

    let isSaved = false;
    await act(async () => {
      isSaved = await savePromise;
    });

    expect(isSaved).toBe(true);
    expect(result.current.apiKey).toBe('NewValidKey');
    expect(result.current.isConfigured).toBe(true);
    expect(localStorage.getItem('gemini_api_key')).toBe('NewValidKey');
  });

  it('should not save the key if validation fails', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useGeminiSettings());

    let savePromise: Promise<boolean>;
    act(() => {
      savePromise = result.current.saveApiKey('NewInvalidKey');
    });

    let isSaved = true;
    await act(async () => {
      isSaved = await savePromise;
    });

    expect(isSaved).toBe(false);
    expect(result.current.apiKey).toBeNull();
    expect(result.current.isConfigured).toBe(false);
    expect(localStorage.getItem('gemini_api_key')).toBeNull();
  });

  it('should clear key from state and localStorage', () => {
    localStorage.setItem('gemini_api_key', 'some-stored-key');
    const { result } = renderHook(() => useGeminiSettings());

    act(() => {
      result.current.clearApiKey();
    });

    expect(result.current.apiKey).toBeNull();
    expect(result.current.isConfigured).toBe(false);
    expect(localStorage.getItem('gemini_api_key')).toBeNull();
  });
});
