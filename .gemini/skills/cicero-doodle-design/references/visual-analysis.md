# Análisis Visual de Referencia (Stitch Screen)

## Mobile Analysis
1. **Header Speaker**: El nivel y el nombre del speaker usan un peso de fuente medio con un icono de huella a la izquierda, encerrado en un círculo con borde de 2px.
2. **Weekly Progress Card**:
   - Fondo de rejilla de puntos (Dot-grid).
   - "Highlight" de 'Sat' con un óvalo dibujado a mano.
   - Badge "Top 10%" con fondo neón y bordes redondeados tipo píldora.
3. **Logros (Achievements)**: Círculos perfectos con bordes gruesos e iconografía minimalista.
4. **Recent Sessions**: Tarjetas con bordes negros gruesos y "Highlighter effect" en puntuación.

## Desktop Analysis (PWA View)
1. **Persistent Sidebar**: Una barra lateral izquierda fija que contiene la navegación principal. Está separada del contenido por un borde negro sólido vertical de 3px.
2. **Sidebar Active State**: El botón activo (ej: Stats) se resalta con fondo neón sólido y sombra de desplazamiento dura, rompiendo la linealidad del menú.
3. **Multi-Column Grid**: 
   - La sección central se expande para mostrar la gráfica de progreso semanal con mayor detalle.
   - Los "Achievements" y el "Stat Summary" se mueven a una columna lateral derecha.
4. **Stat Summary Card (Dark Variant)**: 
   - Uso de fondo oscuro (#303030) con texto en Neon Lime y blanco.
   - Botón de acción principal "Generate Report" en neón sólido.
5. **Session Grid**: Las sesiones recientes se organizan en una rejilla de 3 columnas (en lugar de la lista vertical de móvil).
6. **Start New Session Card**: Un contenedor especial con **borde discontinuo (dashed)** negro de 2px, indicando una acción de creación disponible.
7. **Header Responsivo**: Incluye una barra de progreso de nivel ("Next Level") segmentada y horizontal al lado del icono de ajustes.
