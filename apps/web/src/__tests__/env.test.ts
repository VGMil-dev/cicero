describe("Environment Configuration Validator", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should return configuration using fallback default values when running in CI or test mode", async () => {
    // When CI is set or in test mode, missing env variables shouldn't throw.
    process.env.CI = "true";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_AI_MODEL_DTYPE;

    // Use dynamic import to re-evaluate the module with the modified process.env
    const { getEnv } = await import("../config/env");
    const config = getEnv();

    expect(config.supabaseUrl).toBe("https://placeholder-project.supabase.co");
    expect(config.supabaseAnonKey).toBe("placeholder-anon-key-for-testing-purposes-only");
    expect(config.aiModelDtype).toBe("q8");
  });

  it("should strictly validate and throw errors in non-CI development/production mode when missing variables", async () => {
    // Emulate non-CI/production env
    delete process.env.CI;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    
    // Scenario: Missing everything
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    await expect(import("../config/env")).rejects.toThrow(/Missing required environment variables/);
  });

  it("should throw error if NEXT_PUBLIC_SUPABASE_URL is not a valid URL in non-CI environment", async () => {
    delete process.env.CI;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "invalid-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "valid-key";

    await expect(import("../config/env")).rejects.toThrow(
      /Invalid configuration: NEXT_PUBLIC_SUPABASE_URL is not a valid URL/
    );
  });

  it("should throw error if NEXT_PUBLIC_AI_MODEL_DTYPE is invalid", async () => {
    delete process.env.CI;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://valid-supabase.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "valid-key";
    process.env.NEXT_PUBLIC_AI_MODEL_DTYPE = "invalid-dtype";

    await expect(import("../config/env")).rejects.toThrow(/Invalid value for NEXT_PUBLIC_AI_MODEL_DTYPE/);
  });

  it("should succeed and return the correct config when all variables are valid", async () => {
    delete process.env.CI;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://valid-supabase.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "valid-key";
    process.env.NEXT_PUBLIC_AI_MODEL_DTYPE = "q4";

    const { getEnv } = await import("../config/env");
    const config = getEnv();
    expect(config.supabaseUrl).toBe("https://valid-supabase.supabase.co");
    expect(config.supabaseAnonKey).toBe("valid-key");
    expect(config.aiModelDtype).toBe("q4");
  });
});


