# Arquitectura de Cicero

Bienvenido a la documentación de arquitectura de **Cicero**, la aplicación líder para el repaso de oratoria y detección de muletillas.

## 🏛️ Visión General del Proyecto
Cicero está diseñado como una plataforma multiplataforma moderna. Nuestra arquitectura prioriza la **mantenibilidad**, la **testabilidad** y la **rapidez de entrega** (MVP).

El sistema utiliza una arquitectura de servicios centralizada donde la lógica de negocio reside en una API robusta, permitiendo que las aplicaciones móviles y web sean clientes ligeros y consistentes.

### Secciones de Arquitectura
Explora los detalles técnicos de Cicero a través de las siguientes secciones:

- **[Diagrama de Contenedores (C4)](./contenedores)**: Visualiza la estructura del sistema y el flujo de datos entre los clientes, la API de **Nest.js** y la infraestructura.
- **[Decisiones de Diseño](./decisiones)**: Justificación técnica del uso de Nest.js, Vertical Slicing, Arquitectura Hexagonal y otras herramientas.

## 🔄 Flujo de Valor del MVP
El flujo principal de Cicero se centra en la inmediatez y el análisis centralizado:

1.  **Captura**: Grabación de voz local en el dispositivo (Móvil o Web).
2.  **Transmisión**: Envío del audio a la API central de Nest.js.
3.  **Análisis**: Procesamiento en el backend mediante el script de IA simulada.
4.  **Feedback**: Devolución instantánea del "Score" y persistencia en Supabase para sincronización multiplataforma.

## 🛠️ Stack Tecnológico Resumido
| Componente | Tecnología |
| :--- | :--- |
| **Monorepo** | pnpm + Turborepo |
| **Backend API** | Nest.js |
| **Mobile Client** | React Native (Expo) |
| **Web Client** | Next.js (Full App Extension) |
| **Database / Storage** | Supabase (PostgreSQL) |
| **Estado Local** | Zustand |
| **Tests** | Jest |
