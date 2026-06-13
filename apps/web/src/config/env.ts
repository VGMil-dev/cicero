/**
 * Application environment configuration interface.
 */
export interface EnvConfig {
  /** The public Supabase URL for data persistence */
  supabaseUrl: string;
  /** The anonymous public key for Supabase API requests */
  supabaseAnonKey: string;
  /** Quantization level for the AI Whisper model client-side inference */
  aiModelDtype: 'q8' | 'q4' | 'fp32';
}

/**
 * Default placeholder values used in CI, automated tests, or build environments
 * to prevent pipeline failures when variables are not configured.
 */
const DEFAULT_CONFIG: EnvConfig = {
  supabaseUrl: 'https://placeholder-project.supabase.co',
  supabaseAnonKey: 'placeholder-anon-key-for-testing-purposes-only',
  aiModelDtype: 'q8',
};

/**
 * Validates and retrieves the application environment variables from `process.env`.
 * 
 * - In testing (`NODE_ENV === 'test'`) and CI (`CI=true`) environments, it falls back
 *   to mock placeholders if variables are not declared, ensuring tests and builds can run.
 * - In local development and production runtime, it enforces presence and format strictly,
 *   throwing descriptive errors to avoid running the application in a misconfigured state.
 * 
 * @returns The validated {@link EnvConfig} object.
 * @throws {Error} If required variables are missing or have invalid formats in dev/prod.
 */
export function getEnv(): EnvConfig {
  const isCI = !!process.env.CI || process.env.NODE_ENV === 'test';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const aiModelDtype = process.env.NEXT_PUBLIC_AI_MODEL_DTYPE;

  // In CI or test environments, use fallback placeholders for missing configuration
  if (isCI) {
    return {
      supabaseUrl: supabaseUrl || DEFAULT_CONFIG.supabaseUrl,
      supabaseAnonKey: supabaseAnonKey || DEFAULT_CONFIG.supabaseAnonKey,
      aiModelDtype: (aiModelDtype as 'q8' | 'q4' | 'fp32') || DEFAULT_CONFIG.aiModelDtype,
    };
  }

  const missingVars: string[] = [];

  if (!supabaseUrl) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  } else {
    try {
      new URL(supabaseUrl);
    } catch {
      throw new Error(
        `Invalid configuration: NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Received: "${supabaseUrl}"`
      );
    }
  }

  if (!supabaseAnonKey) {
    missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
      missingVars.map((v) => `  - ${v}`).join('\n') +
      `\n\nPlease create a '.env.local' file in 'apps/web' based on '.env.example' and configure these variables.`
    );
  }

  const validDtypes = ['q8', 'q4', 'fp32'];
  const dtype = aiModelDtype || 'q8';

  if (!validDtypes.includes(dtype)) {
    throw new Error(
      `Invalid value for NEXT_PUBLIC_AI_MODEL_DTYPE: "${dtype}". Must be one of: ${validDtypes.join(', ')}`
    );
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
    aiModelDtype: dtype as 'q8' | 'q4' | 'fp32',
  };
}

/**
 * Validated environment configuration singleton.
 * Loaded on startup to fail-fast if configuration is invalid.
 */
export const env = getEnv();
