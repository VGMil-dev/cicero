import { useState, useCallback } from 'react';

/**
 * Hook to manage Gemini API Key configuration.
 * Handles storage in localStorage, API key validation via ping, and validation states.
 */
export function useGeminiSettings() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key');
    }
    return null;
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isConfigured = !!apiKey;

  /**
   * Performs a connection validation ping directly to the Gemini 3.5 Flash API.
   * If the key is 'sandbox', bypasses network and returns true immediately.
   */
  const validateApiKey = useCallback(async (key: string): Promise<boolean> => {
    setIsValidating(true);
    setValidationError(null);

    const trimmedKey = key.trim();

    if (!trimmedKey) {
      setIsValidating(false);
      setValidationError('La clave API no puede estar vacía.');
      return false;
    }

    if (trimmedKey === 'sandbox') {
      // Simulate quick validation latency for neobrutalist UX feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsValidating(false);
      return true;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${trimmedKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'ping',
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP ${response.status}: Error al conectar con Gemini`;
        throw new Error(message);
      }

      setIsValidating(false);
      return true;
    } catch (err: unknown) {
      setIsValidating(false);
      const message = err instanceof Error ? err.message : 'Error de red al conectar con Gemini';
      setValidationError(message);
      return false;
    }
  }, []);

  /**
   * Validates and saves the API key if successful.
   */
  const saveApiKey = useCallback(async (key: string): Promise<boolean> => {
    const trimmedKey = key.trim();
    const isValid = await validateApiKey(trimmedKey);
    if (isValid) {
      localStorage.setItem('gemini_api_key', trimmedKey);
      setApiKey(trimmedKey);
      return true;
    }
    return false;
  }, [validateApiKey]);

  /**
   * Clears the saved API key.
   */
  const clearApiKey = useCallback(() => {
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
    setValidationError(null);
  }, []);

  return {
    apiKey,
    isConfigured,
    validateApiKey,
    saveApiKey,
    clearApiKey,
    isValidating,
    validationError,
  };
}
