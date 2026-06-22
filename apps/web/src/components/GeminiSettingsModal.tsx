import React, { useState } from 'react';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string | null;
  validateApiKey: (key: string) => Promise<boolean>;
  saveApiKey: (key: string) => Promise<boolean>;
  clearApiKey: () => void;
  isValidating: boolean;
  validationError: string | null;
}

export function GeminiSettingsModal({
  isOpen,
  onClose,
  currentApiKey,
  validateApiKey,
  saveApiKey,
  clearApiKey,
  isValidating,
  validationError,
}: GeminiSettingsModalProps) {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevApiKey, setPrevApiKey] = useState(currentApiKey);
  const [inputKey, setInputKey] = useState(currentApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [isValidated, setIsValidated] = useState(!!currentApiKey);
  const [isTestRun, setIsTestRun] = useState(false);

  // Sync state with prop on open/change during render to avoid useEffect cascading renders
  if (isOpen !== prevIsOpen || currentApiKey !== prevApiKey) {
    setPrevIsOpen(isOpen);
    setPrevApiKey(currentApiKey);
    setInputKey(currentApiKey || '');
    setIsValidated(!!currentApiKey);
    setIsTestRun(false);
  }

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTestRun(true);
    const valid = await validateApiKey(inputKey);
    setIsValidated(valid);
  };

  const handleSave = async () => {
    const success = await saveApiKey(inputKey);
    if (success) {
      onClose();
    }
  };

  const handleDelete = () => {
    clearApiKey();
    setInputKey('');
    setIsValidated(false);
    setIsTestRun(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputKey(val);
    // Reset validation state if user starts typing a new key
    if (val !== currentApiKey) {
      setIsValidated(false);
      setIsTestRun(false);
    } else {
      setIsValidated(true);
      setIsTestRun(false);
    }
  };

  // Close on Escape key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-[#f5f4f0] border-4 border-black p-6 md:p-8 rounded-[2rem] max-w-md w-full relative shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Notebook grid line background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none rounded-[2rem]" />

        {/* Modal Header */}
        <div className="relative z-10 flex justify-between items-center border-b-4 border-black pb-4 mb-6">
          <h2 className="font-headline font-extrabold text-2xl uppercase tracking-tight text-black flex items-center gap-2">
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Ajustes Gemini
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-black bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_rgba(0,0,0,1)] cursor-pointer transition-all"
            title="Cerrar Ajustes"
            aria-label="Cerrar Ajustes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 flex flex-col gap-5">
          <div>
            <p className="text-sm font-semibold text-stone-700 mb-2">
              Configura tu propia API Key de Google Gemini para habilitar el procesamiento asíncrono en la nube.
            </p>
            <p className="text-[11px] font-semibold text-stone-500 italic">
              * La clave se almacena exclusivamente en tu navegador de forma local. Ingresa &quot;sandbox&quot; para simular inferencias sin conexión.
            </p>
          </div>

          {/* Key Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="gemini-key" className="font-headline font-bold text-xs uppercase tracking-wider text-black">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={handleInputChange}
                placeholder="AIzaSy..."
                className="w-full border-3 border-black p-3 pr-12 bg-white rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#DFFF00]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-black focus:outline-none font-bold text-xs uppercase"
              >
                {showKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          {isValidating && (
            <div className="bg-amber-100 border-2 border-black p-3 rounded-xl flex items-center gap-2.5 text-xs text-amber-950 font-bold animate-pulse shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <svg className="w-4 h-4 animate-spin text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-.73" />
              </svg>
              <span>Validando API Key con Gemini 3.5...</span>
            </div>
          )}

          {!isValidating && isTestRun && isValidated && (
            <div className="bg-[#DFFF00] border-2 border-black p-3 rounded-xl flex items-center gap-2 text-xs font-headline font-extrabold text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>¡Conexión verificada con éxito!</span>
            </div>
          )}

          {!isValidating && isTestRun && !isValidated && (
            <div className="bg-rose-100 border-2 border-black p-3 rounded-xl flex flex-col gap-1.5 text-xs text-red-950 font-semibold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-1.5 text-red-700 font-headline font-extrabold uppercase">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                </svg>
                <span>Fallo en la validación</span>
              </div>
              <p className="font-mono text-[10px] bg-white/50 p-2 border border-red-200 rounded-lg max-h-20 overflow-y-auto">
                {validationError || 'La clave proporcionada no es válida o hay un problema de conexión.'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4 mt-2">
            <div>
              {currentApiKey && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-rose-400 text-black font-extrabold border-3 border-black py-2 px-4 rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] hover:shadow-[4.5px_4.5px_0px_rgba(0,0,0,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-xs uppercase"
                >
                  Eliminar Clave
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isValidating || !inputKey.trim()}
                className={`bg-amber-300 text-black font-extrabold border-3 border-black py-2 px-4 rounded-xl text-xs uppercase transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)]
                  ${isValidating || !inputKey.trim() 
                    ? 'opacity-40 cursor-not-allowed shadow-none translate-x-0 translate-y-0' 
                    : 'hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] hover:shadow-[4.5px_4.5px_0px_rgba(0,0,0,1)] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] cursor-pointer'
                  }`}
              >
                Probar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isValidating || !isValidated || (inputKey !== currentApiKey && !isValidated)}
                className={`bg-[#DFFF00] text-black font-extrabold border-3 border-black py-2.5 px-5 rounded-xl text-xs uppercase transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]
                  ${isValidating || (!isValidated && inputKey !== currentApiKey)
                    ? 'opacity-45 cursor-not-allowed shadow-none translate-x-0 translate-y-0' 
                    : 'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer'
                  }`}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
