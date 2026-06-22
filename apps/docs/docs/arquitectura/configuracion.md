# Configuración y Variables de Entorno

Este documento describe la arquitectura de configuración, la gestión de variables de entorno y la estrategia de seguridad para secretos dentro de **Cicero**.

---

## 🚀 Filosofía de Configuración

Cicero adopta un enfoque **Fail-Fast** y **Zero-Configuration-Out-Of-The-Box** para CI/CD:
1.  **Validación en Arranque:** La aplicación valida la presencia y el formato de todas las variables requeridas en el momento en que se importa el módulo de configuración principal (`apps/web/src/config/env.ts`), previniendo errores silenciosos en tiempo de ejecución.
2.  **Resiliencia en CI y Tests:** El validador detecta automáticamente entornos de integración continua (CI) o ejecución de pruebas unitarias (`process.env.CI` o `process.env.NODE_ENV === 'test'`) y provee valores de respaldo (fallbacks) seguros para evitar romper los pipelines de compilación automatizados si no se proveen secretos reales.

---

## 📋 Variables de Entorno Definidas

### Entorno Público (Client-Side)
Todas las variables que el cliente (PWA / Service Worker) requiere consumir en producción deben llevar el prefijo `NEXT_PUBLIC_`. Estas variables son inyectadas estáticamente en el bundle de Next.js durante la compilación.

| Variable | Tipo / Valores | Descripción | Obligatoria en Dev/Prod |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL | Endpoint API REST de tu instancia en Supabase. | **Sí** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | String | Clave anónima para solicitudes de cliente con políticas RLS. | **Sí** |
| `NEXT_PUBLIC_AI_MODEL_DTYPE` | `q8` \| `q4` \| `fp32` | Nivel de cuantización cargado en Transformers.js. | No (Defecto: `q8`) |

---

## 🔑 Estrategia de Secretos y Seguridad

Para proteger la integridad de los datos de la aplicación y evitar la filtración de credenciales sensibles, Cicero implementa las siguientes reglas operativas estrictas:

### 1. Gobernanza en Git
*   **Prohibición de Credenciales:** Queda estrictamente prohibido subir cualquier archivo de configuración real (`.env`, `.env.local`, etc.) al repositorio Git.
*   **Plantilla Controlada:** Solo se mantiene y actualiza [.env.example](file:///d:/Dev/Personal/Cicero/apps/web/.env.example) para guiar la configuración a otros desarrolladores.
*   **Exclusiones:** El archivo `.gitignore` del proyecto incluye explícitamente exclusiones para archivos de variables locales:
    ```bash
    # local env files
    .env*.local
    .env
    ```

### 2. Gestión de Entornos Cloud
*   **Entornos de Staging / Producción:** Los secretos de producción (como claves de bases de datos o tokens administrativos) nunca se exponen al cliente. Si en el futuro se requiere una clave administrativa (como `SUPABASE_SERVICE_ROLE_KEY`), esta debe configurarse exclusivamente en el servidor (p. ej. en Server Actions) y no llevar el prefijo `NEXT_PUBLIC_`.
*   **Inyección en CI/CD:** Para los despliegues automáticos o ejecuciones especiales en GitHub Actions, las variables necesarias se inyectan a través de **GitHub Repository Secrets** en el workflow de despliegue, protegiendo las credenciales reales de visualización pública.

---

## 🛠️ Configuración en Desarrollo Local

Para iniciar el flujo de desarrollo local de Cicero:

1.  Dirígete al directorio del frontend:
    ```bash
    cd apps/web
    ```
2.  Crea una copia de la plantilla:
    ```bash
    cp .env.example .env.local
    ```
3.  Abre `.env.local` y actualiza los valores según tus credenciales de Supabase.
4.  Inicia la aplicación desde la raíz del monorepo:
    ```bash
    pnpm dev
    ```

Si olvidas configurar alguna variable obligatoria en el entorno de desarrollo, el servidor Next.js fallará inmediatamente con un error explícito en consola al intentar renderizar la aplicación:

```text
Error: Missing required environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

Please create a '.env.local' file in 'apps/web' based on '.env.example' and configure these variables.
```

---

## 🔍 Ejecución y Validación de Pipeline en CI

El pipeline de Integración Continua (`.github/workflows/ci.yml`) ejecuta de forma automática:
- **Build:** `pnpm build` (con inyección automática de fallbacks seguros de compilación).
- **Lint:** `pnpm lint` (validación de reglas estilísticas y de calidad).
- **Test:** `pnpm test` (pruebas unitarias e integrales con Jest).
- **Typecheck:** `pnpm typecheck` (verificación estática de tipos de TypeScript).

> [!NOTE]
> Gracias a la caché configurada para Turborepo (`.turbo`) y `pnpm`, las compilaciones repetidas no válidas o sin modificaciones críticas consumirán una fracción mínima del tiempo original.
