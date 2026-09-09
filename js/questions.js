// =========================================================
// PREGUNTAS DE PRECALIFICACIÓN ARRANKAR
// =========================================================
//
// La simulación del vehículo ocurre antes de estas preguntas.
// Las reglas GREEN / YELLOW / RED corresponden a la
// preclasificación inicial del solicitante.
//

const QUESTIONS = [

  {
    id: "credit_history",

    title: "Historial crediticio",

    text: "¿Cuál describe mejor tu situación actual?",

    type: "choice",

    options: [
      {
        value: "current_arrears",
        label: "Actualmente tengo un reporte negativo activo"
      },

      {
        value: "paid_report",
        label: "Tuve un reporte, pero ya lo pagué / tengo paz y salvo"
      },

      {
        value: "none",
        label: "No tengo reportes / es mi primer crédito"
      }
    ]
  },


{
  id: "employment",
  title: "Actividad u ocupación",
  text: "¿Cuál es tu actividad u ocupación principal?",
  type: "choice",
  options: [
    { value: "employee", label: "Empleado" },
    { value: "pensioner", label: "Pensionado" },
    { value: "independent", label: "Independiente" },
    { value: "rentier", label: "Rentista" },
    { value: "farmer", label: "Agricultor" },
    { value: "transporter", label: "Transportador" },
    { value: "partner", label: "Socio" }
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
  }

];