/* =========================================================
   ESTADO DE LA SOLICITUD
========================================================= */

let currentStep = -1;

const answers = {};


/* =========================================================
   ELEMENTOS DEL DOM
========================================================= */

const screen = document.getElementById("screen");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

const progressText =
  document.getElementById("progressText");

const progressFill =
  document.getElementById("progressFill");


/* =========================================================
   EVENTOS
========================================================= */

nextBtn.addEventListener("click", next);
backBtn.addEventListener("click", back);


/* =========================================================
   INICIO
========================================================= */

renderWelcome();


/* =========================================================
   ACTUALIZAR PROGRESO VISUAL
========================================================= */

function updateProgress() {

  const steps =
    document.querySelectorAll(".step");

  /*
   * currentStep:
   *
   * -1 = pantalla inicial
   *  0 = pregunta 1
   *  1 = pregunta 2
   *  2 = pregunta 3
   * etc.
   */

  steps.forEach((step, index) => {

    step.classList.remove("active");
    step.classList.remove("completed");

    /*
     * En la pantalla inicial:
     * todos los pasos permanecen blancos.
     */

    if (currentStep === -1) {
      return;
    }

    /*
     * Los pasos anteriores al actual
     * ya fueron completados.
     */

    if (index < currentStep) {

      step.classList.add("completed");

    }

    /*
     * El paso actual permanece BLANCO.
     * No le ponemos "active".
     */

  });


  /*
   * ======================================================
   * BARRA DE PROGRESO
   * ======================================================
   *
   * Ejemplo:
   *
   * Inicio       = 0%
   * Paso 1       = 0%
   * Paso 2       = 20%
   * Paso 3       = 40%
   * Paso 4       = 60%
   * Paso 5       = 80%
   * Paso 6       = 100%
   *
   */

  let percent = 0;

  if (currentStep >= 0) {

    percent =
      (currentStep / (QUESTIONS.length - 1)) * 100;

  }

  /*
   * Evitar valores fuera de 0 - 100
   */

  percent =
    Math.max(0, Math.min(100, percent));


  progressFill.style.width =
    `${percent}%`;


  /*
   * Texto de progreso
   */

  if (currentStep === -1) {

    progressText.textContent = "Inicio";

  } else {

    progressText.textContent =
      `Paso ${currentStep + 1} de ${QUESTIONS.length}`;

  }
}


/* =========================================================
   PANTALLA DE BIENVENIDA
========================================================= */

function renderWelcome() {

  currentStep = -1;

  screen.innerHTML = `
    <h1>Solicita tu crédito vehicular</h1>

    <p>
      Te haremos unas preguntas para conocer qué opción
      se adapta mejor a tu situación.
    </p>
  `;

  backBtn.hidden = true;

  nextBtn.hidden = false;

  nextBtn.textContent = "Comenzar";

  /*
   * Todos los pasos vuelven a blanco.
   */

  updateProgress();
}


/* =========================================================
   MOSTRAR PREGUNTA
========================================================= */

function renderQuestion() {

  const q = QUESTIONS[currentStep];

  /*
   * Actualizar progreso
   */

  updateProgress();


  /*
   * Botón volver
   */

  backBtn.hidden =
    currentStep === 0;


  /*
   * Texto del botón siguiente
   */

  nextBtn.hidden = false;

  nextBtn.textContent =
    currentStep === QUESTIONS.length - 1
      ? "Evaluar solicitud"
      : "Continuar";


  /*
   * Construir contenido
   */

  let body = `
    <h2>${q.title}</h2>

    <p>
      ${q.text}
    </p>
  `;


  /* ======================================================
     PREGUNTA DE OPCIONES
  ====================================================== */

  if (q.type === "choice") {

    body += `
      <div class="options">
    `;

    for (const option of q.options) {

      const selected =
        answers[q.id] === option.value
          ? "selected"
          : "";

      body += `
        <button
          type="button"
          class="option ${selected}"
          data-value="${option.value}"
        >
          ${option.label}
        </button>
      `;
    }

    body += `
      </div>
    `;

  }


  /* ======================================================
     PREGUNTA NUMÉRICA
  ====================================================== */

  else {

    const value =
      answers[q.id] ?? "";

    body += `
      <div class="field">

        <label for="answer">
          ${
            q.type === "currency"
              ? "Valor en COP"
              : "Cantidad"
          }
        </label>

        <input
          id="answer"
          type="number"
          min="${q.min ?? 0}"
          value="${value}"
          placeholder="${q.placeholder ?? ""}"
        >

      </div>
    `;
  }


  /*
   * Insertar HTML
   */

  screen.innerHTML = body;


  /* ======================================================
     EVENTOS DE LAS OPCIONES
  ====================================================== */

  document
    .querySelectorAll(".option")
    .forEach(button => {

      button.addEventListener("click", () => {

        answers[q.id] =
          button.dataset.value;


        /*
         * Quitar selección anterior
         */

        document
          .querySelectorAll(".option")
          .forEach(b => {

            b.classList.remove("selected");

          });


        /*
         * Marcar selección actual
         */

        button.classList.add("selected");

      });

    });
}


/* =========================================================
   SIGUIENTE
========================================================= */

function next() {

  /*
   * Desde bienvenida
   */

  if (currentStep === -1) {

    currentStep = 0;

    renderQuestion();

    return;
  }


  /*
   * Guardar respuesta actual
   */

  if (!saveCurrentAnswer()) {

    return;
  }


  /*
   * Si estamos en la última pregunta,
   * evaluar solicitud.
   */

  if (currentStep === QUESTIONS.length - 1) {

    renderResult(
      evaluateApplication()
    );

    return;
  }


  /*
   * Avanzar
   */

  currentStep++;

  renderQuestion();
}


/* =========================================================
   VOLVER
========================================================= */

function back() {

  /*
   * Si estamos en la primera pregunta,
   * volver al inicio.
   */

  if (currentStep <= 0) {

    renderWelcome();

    return;
  }


  /*
   * Retroceder una pregunta.
   */

  currentStep--;

  renderQuestion();
}


/* =========================================================
   GUARDAR RESPUESTA
========================================================= */

function saveCurrentAnswer() {

  const q =
    QUESTIONS[currentStep];


  /* ======================================================
     OPCIONES
  ====================================================== */

  if (q.type === "choice") {

    if (!answers[q.id]) {

      alert(
        "Selecciona una opción para continuar."
      );

      return false;
    }

    return true;
  }


  /* ======================================================
     CAMPOS NUMÉRICOS
  ====================================================== */

  const input =
    document.getElementById("answer");

  const value =
    Number(input.value);


  if (
    !Number.isFinite(value) ||
    value < (q.min ?? 0)
  ) {

    alert(
      "Ingresa un valor válido."
    );

    return false;
  }


  answers[q.id] =
    value;

  return true;
}


/* =========================================================
   EVALUAR SOLICITUD
========================================================= */

function evaluateApplication() {

  const result = {

    status: "GREEN",

    template: "A",

    reasons: [],

    downPaymentPercentage: null

  };


  /* ======================================================
     RED
     Mora actual
  ====================================================== */

  if (
    answers.credit_history ===
    "current_arrears"
  ) {

    return {

      status: "RED",

      template: null,

      reasons: [
        "Mora actual en obligaciones crediticias."
      ]

    };
  }


  /* ======================================================
     YELLOW
     Reporte anterior pagado
  ====================================================== */

  if (
    answers.credit_history ===
    "paid_report"
  ) {

    result.status = "YELLOW";

    result.template = "B";

    result.reasons.push(
      "Reporte anterior pagado / paz y salvo."
    );
  }


  /* ======================================================
     YELLOW
     Estudiante / hogar
  ====================================================== */

  if (
    answers.employment ===
    "student_household"
  ) {

    result.status = "YELLOW";

    result.template = "B";

    result.reasons.push(
      "Perfil estudiante / hogar."
    );
  }


  /* ======================================================
     YELLOW
     Menos de 6 meses
  ====================================================== */

  if (
    answers.activity_months < 6
  ) {

    result.status = "YELLOW";

    result.template = "B";

    result.reasons.push(
      "Menos de 6 meses de actividad."
    );
  }


  /* ======================================================
     INGRESOS
  ====================================================== */

  /*
   * IMPORTANTE:
   * Este valor sigue siendo PROVISIONAL.
   * Debemos confirmarlo con tu jefe antes de
   * usarlo como regla definitiva.
   */

  const provisionalIncomeThreshold =
    2600000;


  if (
    answers.monthly_income <
    provisionalIncomeThreshold
  ) {

    result.status = "YELLOW";

    result.template = "B";

    result.reasons.push(
      "Ingreso inferior al umbral provisional de 2 SMMLV."
    );
  }


  /* ======================================================
     VEHÍCULO Y CUOTA INICIAL
  ====================================================== */

  const vehicle =
    answers.vehicle_value;

  const downPayment =
    answers.down_payment;


  result.downPaymentPercentage =
    vehicle > 0
      ? (downPayment / vehicle) * 100
      : 0;


  /* ======================================================
     CUOTA INICIAL 0%
  ====================================================== */

  if (
    result.downPaymentPercentage === 0
  ) {

    result.reasons.push(
      "Cuota inicial de 0%: requiere advertencia de mayor tasa y validación estricta de ingresos."
    );
  }


  /* ======================================================
     CUOTA INICIAL 10%+
  ====================================================== */

  if (
    result.downPaymentPercentage >= 10 &&
    result.status === "GREEN"
  ) {

    result.reasons.push(
      "Cuota inicial de 10% o más."
    );
  }


  return result;
}


/* =========================================================
   MOSTRAR RESULTADO
========================================================= */

function renderResult(result) {

  /*
   * En resultado todos los pasos están completados.
   */

  const steps =
    document.querySelectorAll(".step");


  steps.forEach(step => {

    step.classList.remove("active");

    step.classList.add("completed");

  });


  /*
   * Barra completa
   */

  progressFill.style.width =
    "100%";


  progressText.textContent =
    "Resultado";


  /*
   * Ocultar botones
   */

  backBtn.hidden = true;

  nextBtn.hidden = true;


  /* ======================================================
     TÍTULO
  ====================================================== */

  const label =
    result.status === "GREEN"

      ? "Solicitud preclasificada"

      : result.status === "YELLOW"

        ? "Solicitud para revisión"

        : "Solicitud detenida";


  /* ======================================================
     MENSAJE
  ====================================================== */

  const message =
    result.status === "RED"

      ? "Por tus reportes actuales no podemos procesar la solicitud a tu nombre. ¿Deseas que un familiar sin reportes tome el crédito por ti?"

      : result.status === "YELLOW"

        ? "Puedes continuar, pero la solicitud requiere condiciones adicionales o revisión manual."

        : "Puedes continuar con la solicitud estándar.";


  /* ======================================================
     RESULTADO
  ====================================================== */

  screen.innerHTML = `

    <h1>${label}</h1>

    <div class="result ${result.status.toLowerCase()}">

      <strong>
        Resultado: ${result.status}
      </strong>

      <p>
        ${message}
      </p>

      ${
        result.template
          ? `
            <p>
              <strong>Plantilla:</strong>
              ${result.template}
            </p>
          `
          : ""
      }

      ${
        result.downPaymentPercentage !== null
          ? `
            <p>
              <strong>Cuota inicial:</strong>
              ${result.downPaymentPercentage.toFixed(1)}%
            </p>
          `
          : ""
      }

      ${
        result.reasons.length
          ? `
            <ul>
              ${
                result.reasons
                  .map(
                    reason =>
                      `<li>${reason}</li>`
                  )
                  .join("")
              }
            </ul>
          `
          : ""
      }

    </div>

    <p class="small">

      Prototipo local.

    </p>

  `;
}