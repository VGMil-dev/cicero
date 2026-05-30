# Arquitectura de Cicero

Bienvenido a la documentacion de arquitectura de **Cicero**.

Esta seccion describe la arquitectura objetivo del proyecto y, cuando aplica, senala las decisiones que todavia estan en transicion dentro del repositorio.

## 🏛️ Visión General del Proyecto
Cicero está diseñado como una plataforma multiplataforma moderna. Nuestra arquitectura prioriza la **precisión en la transcripción (verbatim)**, el **cero costo de inferencia**, y un ecosistema de desarrollo fuertemente tipado.

El sistema utiliza una arquitectura **Serverless y Client-Side AI**, donde la PWA es autónoma para procesar el audio localmente utilizando redes neuronales en el navegador, interactuando directamente con una base de datos como servicio (BaaS) para la persistencia.

### Secciones de Arquitectura
Explora los detalles técnicos de Cicero a través de las siguientes secciones:

- **[Diagrama de Contenedores (C4)](./contenedores)**: Visualiza la estructura del sistema y el flujo de datos entre el cliente PWA (Next.js) y la infraestructura BaaS (Supabase).
- **[Diagrama de Componentes (Hexagonal)](./componentes)**: Detalla la estructura interna de la aplicación Next.js aplicando principios de Arquitectura Limpia (Ports & Adapters).
- **[Diagrama de Secuencia](./secuencia)**: Ilustra el flujo paso a paso del caso de uso de análisis de audio local y almacenamiento.
- **[Casos de Uso (Gherkin)](./casos-de-uso)**: Especificación detallada de los criterios de aceptación del MVP utilizando BDD.
- **[Decisiones de Diseño](./decisiones)**: Justificacion tecnica del uso de una estrategia web-first, Transformers.js y una reduccion del backend tradicional.

## 🔄 Flujo de Valor del MVP
El flujo principal de Cicero se centra en la inmediatez, procesando la información directamente en el dispositivo del usuario:

1.  **Captura**: Grabación de voz local en el cliente PWA (Móvil o Web).
2.  **Transcripcion Literal**: Procesamiento instantaneo en un Web Worker del navegador utilizando **Transformers.js** y el modelo **CrisperWhisper** para obtener el texto completo, incluyendo tartamudeos y muletillas.
3.  **Evaluación**: Detección algorítmica de muletillas (basada en los timestamps generados por la IA) y cálculo del "Score" ejecutados en la capa de Casos de Uso del frontend.
4.  **Feedback y Persistencia**: Devolución instantánea de resultados y envío ligero de metadatos a Supabase mediante Server Actions.

## 🛠️ Stack Tecnológico Resumido
| Componente | Tecnología |
| :--- | :--- |
| **Frontend & Server Actions** | Next.js (App Router) |
| **PWA Tooling** | Serwist + `manifest.ts` |
| **Motor de Reconocimiento Local** | `Transformers.js` (WebGPU / WASM) |
| **Modelo Acústico** | `onnx-community/CrisperWhisper-ONNX` |
| **Database / Auth (BaaS)** | Supabase (PostgreSQL) |
| **Estado Local** | Zustand |
| **Arquitectura Interna** | Clean Architecture (Ports & Adapters) |
