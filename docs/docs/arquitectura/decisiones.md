# Decisiones de Diseño

En esta sección se detallan las decisiones arquitectónicas clave tomadas para el proyecto **Cicero**, justificando el uso de patrones modernos para garantizar la escalabilidad y mantenibilidad.

## 📐 Patrones Arquitectónicos

### Vertical Slicing (Rebanado Vertical)
A diferencia de la arquitectura de capas tradicional, en Cicero optamos por **Vertical Slicing**. Cada funcionalidad (ej. `recording`) es un "slice" independiente que contiene sus propios modelos, lógica y controladores, lo que reduce el acoplamiento y facilita el crecimiento del sistema.

### Arquitectura Hexagonal (Ports & Adapters)
Aplicamos los principios de arquitectura hexagonal para aislar el núcleo de negocio de las tecnologías externas. Esto es especialmente visible en el backend con **Nest.js**, donde el dominio permanece puro y los adaptadores manejan la comunicación con Supabase o servicios de IA.

## 🚀 Nest.js como Core Backend
Hemos decidido implementar una API dedicada con **Nest.js** en lugar de conectar los clientes directamente a Supabase:
- **Centralización**: La lógica de cálculo de "scores" y análisis de muletillas reside en un solo lugar, asegurando consistencia entre la App Web y Mobile.
- **Seguridad**: Permite manejar credenciales sensibles y lógica compleja del lado del servidor.
- **Abstracción**: Los clientes (Next.js y Expo) actúan como *Thin Clients*, encargándose solo de la interacción con el usuario.

## 🧠 Gestión de Estado con Zustand
Elegimos **Zustand** por su simplicidad y bajo boilerplate. Es ideal para sincronizar el estado de la grabación y los resultados de forma reactiva en ambas plataformas frontend.

## 🧪 Estrategia de Testing (Jest)
La arquitectura está diseñada para ser **test-friendly**:
- **Domain Services**: Pruebas unitarias puras.
- **Use Cases**: Pruebas con inyección de mocks para los puertos (Ports).
- **Adapters**: Tests de integración para verificar la persistencia y la comunicación con servicios externos.
