# Diagrama de Contenedores (C4)

Este diagrama representa los contenedores de software que componen el sistema **Cicero**. Se ha optado por centralizar la lógica de negocio en una API dedicada, manteniendo los clientes lo más ligeros posible y asegurando una comunicación estructurada.

```mermaid
%%{init: {'flowchart': {'curve': 'step'}}}%%
flowchart TD
    User((Usuario))
    Admin((Administrador))

    subgraph Clients [Capa de Clientes]
        PWA[PWA Client<br/>Next.js]
    end

    subgraph Backend [Core Backend]
        NestAPI[API REST<br/>Nest.js]
        MockIA[Mock IA Script<br/>TypeScript]
    end

    subgraph Infra [Infraestructura]
        Supabase[(Supabase<br/>PostgreSQL & Storage)]
    end

    %% Relaciones de Usuario a Clientes
    User -->|Graba voz y consulta scores| PWA
    Admin -->|Audita métricas| PWA

    %% Relaciones de Clientes a API
    PWA -->|Envía audio / Pide datos| NestAPI

    %% Relaciones Internas del Backend
    NestAPI -->|Delega procesamiento| MockIA
    MockIA -->|Devuelve Score y Transcripción| NestAPI

    %% Relaciones de API a Infraestructura
    NestAPI -->|Persiste datos y consulta| Supabase
```

## Descripción de Contenedores

1.  **Capa de Clientes (PWA)**: Aplicación Web Progresiva responsable de la captura de audio (UI/UX) y visualización de resultados. Funciona tanto en dispositivos móviles como de escritorio, permitiendo la instalación en la pantalla de inicio. Consume la API centralizada para todas las operaciones de negocio.
2.  **API REST (Nest.js)**: Orquestador principal del sistema. Recibe el audio de los clientes, invoca el módulo de análisis, calcula los scores y maneja la persistencia de manera segura.
3.  **Mock IA Script (TypeScript)**: Módulo interno de la API que simula el procesamiento de voz a texto y la detección de muletillas.
4.  **Supabase**: Proveedor de infraestructura (BD relacional y Storage) accedido exclusivamente a través del backend para garantizar la integridad y seguridad de los datos.
