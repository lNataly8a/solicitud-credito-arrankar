// Reglas y preguntas provisionales.
// Las reglas marcadas como "pendientes" deben confirmarse con el cliente
// antes de considerarlas definitivas.

const QUESTIONS = [
  {
    id: "credit_history",
    title: "Historial crediticio",
    text: "¿Cuál describe mejor tu situación actual?",
    type: "choice",
    options: [
      { value: "current_arrears", label: "Actualmente tengo deudas en mora" },
      { value: "paid_report", label: "Tuve un reporte, pero ya lo pagué / tengo paz y salvo" },
      { value: "none", label: "No tengo reportes / es mi primer crédito" }
    ]
  },
  {
    id: "employment",
    title: "Actividad actual",
    text: "¿Cuál es tu actividad principal?",
    type: "choice",
    options: [
      { value: "employee", label: "Empleado" },
      { value: "independent", label: "Independiente" },
      { value: "pensioner", label: "Pensionado" },
      { value: "student_household", label: "Estudiante / hogar" }
    ]
  },
  {
    id: "activity_months",
    title: "Antigüedad",
    text: "¿Cuántos meses llevas en tu actividad actual?",
    type: "number",
    min: 0,
    placeholder: "Ej. 18"
  },
  {
    id: "monthly_income",
    title: "Ingresos",
    text: "¿Cuánto puedes demostrar como ingreso mensual propio?",
    type: "currency",
    min: 0,
    placeholder: "Ej. 3500000"
  },
  {
    id: "vehicle_value",
    title: "Vehículo",
    text: "¿Cuál es el valor aproximado del vehículo?",
    type: "currency",
    min: 1,
    placeholder: "Ej. 50000000"
  },
  {
    id: "down_payment",
    title: "Cuota inicial",
    text: "¿Cuánto darías como cuota inicial?",
    type: "currency",
    min: 0,
    placeholder: "Ej. 5000000"
  }
];
