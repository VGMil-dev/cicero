# Prueba Técnica: Lead Architect / Senior Mobile Developer 
## Proyecto: 'SpeechMaster' - App de Repaso de Oratoria

### 📌 Contexto
Se requiere construir el MVP (Minimum Viable Product) de **SpeechMaster**, una aplicación móvil híbrida diseñada para ayudar a los usuarios a mejorar sus habilidades de oratoria. La característica principal de la app es permitir al usuario grabar su discurso, analizar el audio y detectar el uso excesivo de 'muletillas' (palabras de relleno como *'ehh', 'este', 'bueno', 'digamos'*).

### 🎯 Objetivo
Diseñar la arquitectura de la solución y desarrollar un MVP funcional de la aplicación utilizando un framework híbrido (**React Native** o **Flutter**, a tu elección).

### ⚙️ Requerimientos Funcionales
1. **Gestión de Permisos:** La app debe solicitar y manejar correctamente los permisos de micrófono del dispositivo.
2. **Grabación de Audio:** Interfaz sencilla con un botón para Iniciar/Detener la grabación de voz de un discurso de prueba.
3. **Análisis de Voz (Simulado o Real):** 
   - *Opción A (Real):* Integrar un servicio de Speech-to-Text (ej. Google Cloud Speech, OpenAI Whisper API, Apple Speech/Android Speech) para transcribir el texto.
   - *Opción B (Mock):* Si prefieres no usar APIs de pago, puedes simular la latencia de red y devolver un texto predefinido con muletillas después de procesar el audio.
4. **Detección de Muletillas:** Algoritmo en el frontend (o backend forzado si decides hacer un pequeño BFF) que analice el texto transcrito y cuente las ocurrencias de una lista predefinida de muletillas.
5. **Dashboard de Resultados:** Una pantalla de resumen que muestre:
   - Duración de la grabación.
   - Texto transcrito (resaltando las muletillas detectadas).
   - Métricas clave: Total de palabras, Total de muletillas detectadas, Porcentaje de 'limpieza' del discurso.

### 🏗️ Requerimientos Arquitectónicos y Técnicos (Evaluación principal)
Al ser un perfil de Arquitecto/Lead, se prestará especial atención a:
1. **Patrones de Arquitectura:** Uso de Clean Architecture, MVVM, BLoC, o similar. Separación clara entre la capa de presentación, casos de uso (dominio) y acceso a datos/dispositivo.
2. **State Management:** Implementación eficiente del estado global y local de la aplicación.
3. **Inyección de Dependencias:** Gestión de las dependencias para hacer el código altamente testable.
4. **Testing:** Al menos pruebas unitarias para el algoritmo de detección de muletillas y la lógica de presentación (ViewModels/Controllers).
5. **UI/UX:** Diseño responsivo, manejo de estados de carga (loading, error, success) y feedback visual durante la grabación.

### 📦 Entregables Esperados
1. **Documento de Arquitectura (Markdown):** Un breve 'ARCHITECTURE.md' explicando la estructura y decisiones técnicas.
2. **Código Fuente:** Repositorio estructurado y limpio.
3. **Instrucciones:** Un 'README.md' detallado con los pasos para compilar, ejecutar la app y correr los tests.