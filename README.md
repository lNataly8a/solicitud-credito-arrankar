# MVP Crédito Vehicular

Prototipo inicial del flujo:

Frontend HTML/CSS/JavaScript
→ reglas RED/YELLOW/GREEN
→ Supabase
→ n8n
→ ZapSign
→ webhook
→ Supabase

## Estado actual

Esta primera versión funciona localmente y permite recorrer las preguntas y evaluar la solicitud.

Todavía NO están conectados:
- Supabase
- n8n
- ZapSign

## Reglas provisionales

- Mora actual → RED → no ZapSign.
- Reporte pagado/paz y salvo → YELLOW → Template B.
- Estudiante/hogar → YELLOW → Template B.
- Menos de 6 meses → YELLOW → Template B.
- Ingreso menor a un umbral provisional de $2.600.000 COP → YELLOW → Template B.
- 0% de cuota inicial → muestra advertencia.
- 10%+ de cuota inicial → condición favorable, sin sobrescribir otras condiciones.

IMPORTANTE:
Las reglas ambiguas y el umbral de ingresos deben confirmarse antes de convertirlas en reglas definitivas.

## Cómo abrirlo

Puedes abrir `index.html` directamente en el navegador.

Para una experiencia de desarrollo más cómoda, también puedes usar la extensión Live Server de VS Code.
