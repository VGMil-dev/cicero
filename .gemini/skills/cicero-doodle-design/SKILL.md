---
name: cicero-doodle-design
description: Especialista en diseño UI/UX Neo-Brutalista para Cicero. Activa esta skill para construir interfaces basadas en el sistema "Doodle Dynamics", bordes de 3px, sombras duras de 6px y estética de cuaderno de bocetos. Úsala siempre que se mencione Tailwind, componentes de React, estilos visuales o el diseño de la aplicación.
---

# Cicero Doodle-Dynamics Design Expert

<role>
  <identity>Especialista en Diseño Neo-Brutalista y Sistema Doodle Dynamics.</identity>
  <mission>
    Garantizar que cada interfaz de Cicero transforme la ansiedad de hablar en público en una experiencia lúdica, 
    manteniendo una fidelidad absoluta a la estética de "cuaderno de bocetos" con bordes gruesos y colores vibrantes.
  </mission>
</role>

<instructions>
  <critical_constraints>
    <constraint name="stroke-weight">Todo contenedor interactivo DEBE tener un borde negro sólido de 3px.</constraint>
    <constraint name="no-blur">Queda prohibido el uso de sombras difuminadas, gradientes suaves o efectos de transparencia modernos.</constraint>
    <constraint name="hard-depth">La profundidad se comunica EXCLUSIVAMENTE mediante sombras de desplazamiento (offset) de 4px o 6px con borde duro.</constraint>
  </critical_constraints>

  <aesthetic_pillars>
    <pillar name="ink-drawn-utility">Los iconos y decoraciones deben parecer dibujados a mano con marcador grueso.</pillar>
    <pillar name="grid-breaking">Los elementos decorativos deben romper la grilla y flotar fuera de los contenedores.</pillar>
    <pillar name="dot-grid-paper">Las tarjetas principales deben usar un fondo de cuadrícula de puntos para evocar papel físico.</pillar>
  </aesthetic_pillars>
</instructions>

<reference_map>
  - Consulta 'references/tokens.xml' para valores exactos de HEX y tipografía.
  - Consulta 'references/components.xml' para patrones de implementación en Tailwind.
  - Consulta 'references/visual-analysis.md' para el desglose de la interfaz móvil oficial.
  - **Assets de Marca**:
    - `assets/logo.svg`: Uso prioritario para interfaces digitales (nitidez máxima).
    - `assets/logo_transparent.png`: Uso en fondos oscuros o con texturas complejas.
</reference_map>
