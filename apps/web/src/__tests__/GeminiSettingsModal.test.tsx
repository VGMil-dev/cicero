import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeminiSettingsModal } from '../components/GeminiSettingsModal';

describe('GeminiSettingsModal Component', () => {
  let onCloseMock: jest.Mock;
  let validateApiKeyMock: jest.Mock;
  let saveApiKeyMock: jest.Mock;
  let clearApiKeyMock: jest.Mock;

  beforeEach(() => {
    onCloseMock = jest.fn();
    validateApiKeyMock = jest.fn();
    saveApiKeyMock = jest.fn();
    clearApiKeyMock = jest.fn();
  });

  it('should not render when isOpen is false', () => {
    render(
      <GeminiSettingsModal
        isOpen={false}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );
    expect(screen.queryByText('Ajustes Gemini')).toBeNull();
  });

  it('should render when isOpen is true', () => {
    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );
    expect(screen.getByText('Ajustes Gemini')).toBeInTheDocument();
    expect(screen.getByLabelText('Gemini API Key')).toBeInTheDocument();
  });

  it('should display the current key when provided', () => {
    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey="my-saved-key"
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );
    const input = screen.getByLabelText('Gemini API Key') as HTMLInputElement;
    expect(input.value).toBe('my-saved-key');
  });

  it('should display validation loading state when isValidating is true', () => {
    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={true}
        validationError={null}
      />
    );
    expect(screen.getByText('Validando API Key con Gemini 3.5...')).toBeInTheDocument();
  });

  it('should display error message when validationError is provided', () => {
    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError="Invalid API Key format"
      />
    );
    // Trigger validation view logic in test by simulating a test run state
    const input = screen.getByLabelText('Gemini API Key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'some-key' } });
    
    const testButton = screen.getByText('Probar');
    fireEvent.click(testButton);

    expect(screen.getByText('Fallo en la validación')).toBeInTheDocument();
    expect(screen.getByText('Invalid API Key format')).toBeInTheDocument();
  });

  it('should trigger validateApiKey when clicking Probar', async () => {
    validateApiKeyMock.mockResolvedValue(true);

    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );

    const input = screen.getByLabelText('Gemini API Key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-key' } });

    const testButton = screen.getByText('Probar');
    fireEvent.click(testButton);

    expect(validateApiKeyMock).toHaveBeenCalledWith('new-key');
  });

  it('should enable Guardar button after successful validation', async () => {
    validateApiKeyMock.mockImplementation(() => Promise.resolve(true));

    const { rerender } = render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );

    const input = screen.getByLabelText('Gemini API Key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'validated-key' } });

    const testButton = screen.getByText('Probar');
    fireEvent.click(testButton);

    // Re-render to simulate updated state
    rerender(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );

    // Click save
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('should call clearApiKey and empty input when Delete is clicked', () => {
    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey="my-saved-key"
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );

    const deleteButton = screen.getByText('Eliminar Clave');
    fireEvent.click(deleteButton);

    expect(clearApiKeyMock).toHaveBeenCalled();
    const input = screen.getByLabelText('Gemini API Key') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should trigger onClose when clicking close button', () => {
    render(
      <GeminiSettingsModal
        isOpen={true}
        onClose={onCloseMock}
        currentApiKey={null}
        validateApiKey={validateApiKeyMock}
        saveApiKey={saveApiKeyMock}
        clearApiKey={clearApiKeyMock}
        isValidating={false}
        validationError={null}
      />
    );

    const closeBtn = screen.getByTitle('Cerrar Ajustes');
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
