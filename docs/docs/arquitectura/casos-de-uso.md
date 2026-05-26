# Casos de Uso y Criterios de Aceptación (Gherkin)

En esta sección se detallan los comportamientos esperados del sistema (MVP de Cicero) utilizando el formato BDD (Behavior-Driven Development) con sintaxis **Gherkin**. Esto servirá como base para nuestras pruebas unitarias e integración en el frontend y backend.

---

## 🎙️ Feature 1: Grabación de Discurso
**Como** usuario que desea mejorar su oratoria,
**Quiero** poder grabar mi voz de forma fluida a través de la aplicación (Web o Mobile),
**Para** someter mi discurso a un análisis de limpieza.

### Scenario: El usuario concede permisos e inicia la grabación
> **Given** que el usuario abre la pantalla de grabación por primera vez
> **When** presiona el botón de "Iniciar Grabación"
> **Then** el sistema solicita permisos de acceso al micrófono del dispositivo
> **And** si el permiso es concedido, la grabación comienza inmediatamente
> **And** se muestra un indicador visual de grabación en progreso (con temporizador)

### Scenario: El usuario deniega los permisos de micrófono
> **Given** que el usuario presiona "Iniciar Grabación"
> **When** el sistema solicita permisos de acceso al micrófono
> **And** el usuario deniega el permiso
> **Then** el sistema muestra un mensaje de error explicativo
> **And** la grabación no se inicia
> **And** se ofrece un atajo para ir a la configuración del dispositivo

### Scenario: Finalización y envío de la grabación
> **Given** que una grabación está en progreso
> **When** el usuario presiona el botón de "Detener Grabación"
> **Then** el sistema detiene la captura de audio
> **And** el archivo de audio se guarda temporalmente en local
> **And** el sistema inicia automáticamente el proceso de envío a la API (Nest.js)
> **And** la interfaz muestra un estado de "Carga/Análisis en curso"

---

## 🤖 Feature 2: Análisis de Voz (Core Backend)
**Como** sistema central (API Nest.js),
**Quiero** procesar el audio recibido y ejecutar el algoritmo de detección,
**Para** transcribir el texto y contabilizar las muletillas.

### Scenario: Análisis exitoso de un audio válido
> **Given** que el backend recibe un archivo de audio temporal y válido
> **When** el `AnalyzeAudioUseCase` procesa la solicitud
> **Then** el sistema invoca al `Mock IA Adapter` para simular la transcripción a texto
> **And** contabiliza las ocurrencias basándose en un diccionario de muletillas (ej. "ehh", "este", "bueno", "digamos")
> **And** genera una entidad "Score" con: duración, total de palabras, total de muletillas y porcentaje de limpieza
> **And** responde al cliente con los resultados detallados

---

## 📊 Feature 3: Visualización de Resultados y Persistencia
**Como** usuario final o administrador,
**Quiero** ver los resultados del análisis y auditar el historial,
**Para** evaluar el desempeño del discurso a lo largo del tiempo.

### Scenario: Visualización inmediata del Score en la App
> **Given** que el análisis del audio ha finalizado exitosamente
> **When** la API devuelve el objeto "Score" y el texto transcrito al cliente
> **Then** la aplicación (Mobile/Web) muestra la pantalla de resumen
> **And** se visualiza la duración y el porcentaje de "limpieza" del discurso
> **And** el texto transcrito se renderiza resaltando visualmente las muletillas detectadas

### Scenario: Persistencia del registro para auditoría
> **Given** que se ha generado un nuevo "Score" y transcripción
> **When** el caso de uso de análisis en el backend concluye
> **Then** la API invoca al `Supabase DB Adapter`
> **And** se guarda de forma segura el registro (Score, texto, fecha y usuario/sesión) en la base de datos PostgreSQL
> **And** el backend descarta el archivo de audio temporal (para ahorrar almacenamiento en el MVP)
> **And** los datos quedan disponibles de inmediato para su consulta histórica en la Web App
