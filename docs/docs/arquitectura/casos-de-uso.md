# Casos de Uso y Criterios de Aceptación (Gherkin)

En esta sección se detallan los comportamientos esperados del sistema (MVP de Cicero) utilizando formato BDD (Behavior-Driven Development). Estos escenarios reflejan nuestra arquitectura basada en **Transformers.js** para procesamiento verbatim local.

---

## 🎙️ Feature 1: Carga de Modelo de IA y Grabación
**Como** usuario que desea mejorar su oratoria,
**Quiero** que la aplicación grabe mi voz y la procese localmente de forma privada,
**Para** no depender de APIs de terceros ni pagar costos por el análisis de mi discurso.

### Scenario: Inicialización del Web Worker y caché del modelo
> **Given** que el usuario abre la aplicación PWA
> **When** el componente de grabación se monta
> **Then** la app instancia un Web Worker en segundo plano
> **And** `Transformers.js` descarga el modelo `CrisperWhisper-ONNX` (si no existe) y lo guarda en IndexedDB
> **And** el indicador de "Modelo Listo" se activa para permitir la grabación

### Scenario: El usuario graba su discurso
> **Given** que el modelo de IA está listo en el cliente
> **When** el usuario presiona "Iniciar Grabación"
> **Then** el navegador solicita permisos de acceso al micrófono
> **And** comienza la captura del `MediaRecorder`
> **And** se muestra un indicador visual de grabación en progreso

---

## 🤖 Feature 2: Transcripción Verbatim y Detección Algorítmica
**Como** sistema de evaluación (Capa de Dominio),
**Quiero** recibir una transcripción absoluta (incluyendo tartamudeos) producida por la IA,
**Para** poder identificar computacionalmente dónde ocurrieron las fallas de oratoria.

### Scenario: Procesamiento del audio y extracción de texto completo
> **Given** que el usuario finaliza la grabación (detiene el `MediaRecorder`)
> **When** la UI envía el Blob de audio al Web Worker
> **Then** el modelo ONNX realiza la inferencia utilizando WebGPU o WASM
> **And** devuelve un objeto JSON que contiene el `texto completo` y un arreglo de `chunks` (palabras individuales con sus timestamps de inicio y fin)

### Scenario: Cálculo del Score en el Caso de Uso
> **Given** que la UI recibe el JSON de transcripción del Worker
> **When** el adaptador invoca al `CalculateScoreUseCase`
> **Then** la lógica de negocio itera sobre el arreglo de `chunks`
> **And** compara cada palabra contra un diccionario de disfluencias ("eh", "mmm", "bueno", "este")
> **And** cuenta las coincidencias y calcula el Porcentaje de Limpieza (Score)
> **And** genera una entidad de Dominio `ScoreResult`

---

## 📊 Feature 3: Visualización de Resultados y Persistencia BaaS
**Como** usuario,
**Quiero** leer exactamente lo que dije, ver mis muletillas resaltadas y guardar el historial,
**Para** auditar mi progreso a largo plazo.

### Scenario: Renderizado del texto con muletillas resaltadas
> **Given** que el Caso de Uso generó la entidad `ScoreResult`
> **When** la UI renderiza la pantalla de resultados
> **Then** se muestra el texto completo de la transcripción
> **And** la aplicación utiliza los timestamps identificados en el paso anterior para envolver las palabras defectuosas en estilos visuales de advertencia (color rojo)
> **And** se grafican los contadores totales de limpieza

### Scenario: Persistencia eficiente mediante Server Actions
> **Given** que la aplicación tiene los resultados finales calculados en el cliente
> **When** el sistema procede a guardar el registro
> **Then** la PWA ejecuta una `Server Action` de Next.js de forma transparente
> **And** la acción inserta los metadatos (texto, puntaje, fecha) en Supabase PostgreSQL de manera segura
> **And** los datos quedan disponibles para el dashboard histórico del usuario