# Arquitectura de Cicero

Bienvenido a la documentacion de arquitectura de **Cicero**.

Esta seccion describe la arquitectura objetivo del proyecto y, cuando aplica, senala las decisiones que todavia estan en transicion dentro del repositorio.

:::note Como leer esta seccion
Las paginas de arquitectura describen principalmente la **vision objetivo** del producto. Usalas junto con la [introduccion](../intro) y la [bitacora](/bitacora) para distinguir con claridad entre direccion tecnica, estado actual y decisiones en consolidacion.
:::

## 🏛️ Visión General del Proyecto
Cicero está diseñado como una plataforma multiplataforma moderna. Nuestra arquitectura prioriza la **precisión en la transcripción (verbatim)**, el **cero costo de inferencia**, y un ecosistema de desarrollo fuertemente tipado.

El sistema utiliza una arquitectura **Serverless e Inferencia Híbrida/Client-Side**, donde la PWA gestiona localmente la captura, codificación WAV y segmentación del audio, realizando solicitudes directas de inferencia a la API de **Google Gemini 3.5 Flash** (esquema BYOK) sin costos para el servidor de Cicero, interactuando directamente con Supabase para la persistencia de métricas.

### Secciones de Arquitectura
Explora los detalles técnicos de Cicero a través de las siguientes secciones:

- **[Diagrama de Contenedores (C4)](./contenedores)**: Visualiza la estructura del sistema y el flujo de datos entre el cliente PWA (Next.js) y la infraestructura BaaS (Supabase) e IA de Google.
- **[Diagrama de Componentes (Hexagonal)](./componentes)**: Detalla la estructura interna de la aplicación Next.js aplicando principios de Arquitectura Limpia (Ports & Adapters).
- **[Diagrama de Secuencia](./secuencia)**: Ilustra el flujo paso a paso del caso de uso de análisis de audio local y almacenamiento.
- **[Casos de Uso (Gherkin)](./casos-de-uso)**: Especificación detallada de los criterios de aceptación del MVP utilizando BDD.
- **[Decisiones de Diseño](./decisiones)**: Justificacion tecnica del uso de una estrategia web-first, Transformers.js/Gemini y una reduccion del backend tradicional.

## 🔄 Flujo de Valor del MVP
El flujo principal de Cicero se centra en la inmediatez, procesando la información directamente en el dispositivo del usuario:

1.  **Captura**: Grabación de voz local en el cliente PWA (Móvil o Web).
2.  **Segmentación y Transcripción**: Conversión local de fragmentos PCM a WAV de 3 minutos, caché temporal en IndexedDB y subida mediante protocolo resumible a la API de **Google Gemini 3.5 Flash** (BYOK) para transcripción paralela y estructurada.
3.  **Evaluación**: Detección algorítmica de muletillas (basada en la interpolación lineal de timestamps en el cliente) y cálculo del "Score" ejecutados en la capa de Casos de Uso del frontend.
4.  **Feedback y Persistencia**: Devolución instantánea de resultados, eliminación inmediata de archivos temporales en Google Cloud, y envío ligero de metadatos a Supabase mediante Server Actions.

## 🛠️ Stack Tecnológico Resumido
| Componente | Tecnología |
| :--- | :--- |
| **Frontend & Server Actions** | Next.js (App Router) |
| **PWA Tooling** | Serwist + `manifest.ts` |
| **Motor de Inferencia** | `Google Gemini 3.5 Flash` (Cloud API via BYOK client-side) |
| **Caché Temporal de Audio** | `IndexedDB` (para fragmentos WAV y tolerancia a fallos) |
| **Database / Auth (BaaS)** | Supabase (PostgreSQL) |
| **Estado Local** | Zustand |
| **Arquitectura Interna** | Clean Architecture (Ports & Adapters) |

