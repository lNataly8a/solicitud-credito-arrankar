/* =========================================================
   ARRANKAR - FLUJO PRINCIPAL
   Prototipo de solicitud de crédito
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     ELEMENTOS DEL DOM
  ======================================================= */

  const screen = document.getElementById("screen");
  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const progressSteps = document.querySelectorAll(".step");

  /* =======================================================
     ESTADO
  ======================================================= */

  let flow = "welcome";

  let simulationStep = 0;
  let qualificationStep = 0;

  let simulation = {
    vehicleType: "",
    vehicleCondition: "",
    vehicleValue: 0,
    downPayment: 0,
    term: 0,
    financedAmount: 0,
    monthlyPayment: 0
  };

  let answers = {};
  let participantEmail = "";

let qualificationResult = null;

/* =======================================================
   IDENTIFICACIÓN SANDBOX
======================================================= */

let participantId = "";
let sessionId = "";

function generateId(prefix) {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 8)
  );
}

function initializeSandboxSession() {
  participantId = generateId("P");
  sessionId = generateId("S");
}

initializeSandboxSession();

/* =======================================================
   SANDBOX - GOOGLE SHEETS
======================================================= */

const SANDBOX_URL =
  "https://script.google.com/macros/s/AKfycbwfqywiKBaOLgFAL1laYxih7PaU7xESXY04pF_wLrq4sD1hqxvfXGQsPbOTdKkcINOR/exec";

/* =======================================================
   COLA DE ENVÍO SANDBOX
   Mantiene los eventos en el mismo orden en que ocurren
======================================================= */

let sandboxQueue = Promise.resolve();

function sendSandboxData(data) {
  sandboxQueue = sandboxQueue
    .then(() => {
      return fetch(SANDBOX_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(data)
      });
    })
    .catch(error => {
      console.warn(
        "No fue posible enviar datos al sandbox:",
        error
      );
    });

  return sandboxQueue;
}


/* =======================================================
   REGISTRAR EVENTOS
======================================================= */

function logSandboxEvent(etapa, accion) {

  sendSandboxData({
    type: "event",
    participant_id: participantId,
    session_id: sessionId,
    fecha: new Date().toISOString(),
    etapa: etapa,
    accion: accion
  });

}


/* =======================================================
   GUARDAR PARTICIPANTE COMPLETADO
======================================================= */

function saveSandboxParticipant() {

  sendSandboxData({
    type: "participant",

    participant_id: participantId,

    email: participantEmail,

    fecha: new Date().toISOString(),

    vehicle: simulation.vehicleType,

    condition: simulation.vehicleCondition,

    value: simulation.vehicleValue,

    downPayment: simulation.downPayment,

    term: simulation.term,

    income:
      answers.monthly_income || 0,

    history:
      answers.credit_history || "",

    result:
      qualificationResult?.status || "",

    template:
      qualificationResult?.template || ""
  });

}

  /* =======================================================
     CONFIGURACIÓN DEL PROTOTIPO
  ======================================================= */

  /*
    IMPORTANTE:
    Esta tasa es solamente para la demostración del prototipo.
    NO representa todavía la tasa definitiva de Arrankar.
  */
  const PROVISIONAL_MONTHLY_RATE = 0.0143;

  /*
    Estos plazos son provisionales.
    Los límites definitivos de automóvil/moto,
    nuevo/usado y demás políticas deben validarse
    antes de llevar esto a producción.
  */
  const TERM_OPTIONS = [
    12,
    24,
    36,
    48,
    60,
    72,
    84
  ];

  /* =======================================================
     OPCIONES DE ANTIGÜEDAD
  ======================================================= */

  /* Rangos visibles para el usuario y su valor interno
     provisional en meses para las reglas actuales. */
  const ACTIVITY_OPTIONS = [
    { value: "under_1_year", label: "Menos de 1 año", months: 0 },
    { value: "1_to_2_years", label: "Entre 1 y 2 años", months: 12 },
    { value: "2_to_3_years", label: "Entre 2 y 3 años", months: 24 },
    { value: "over_3_years", label: "Más de 3 años", months: 36 }
  ];

  /* =======================================================
     UTILIDADES
  ======================================================= */

  function formatCOP(value) {

    const number = Number(value) || 0;

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(number);

  }


  function parseCOP(value) {

    if (typeof value === "number") {
      return value;
    }

    return Number(
      String(value)
        .replace(/\D/g, "")
    ) || 0;

  }


  function formatInputCurrency(input) {

    const value = parseCOP(input.value);

    if (!value) {
      input.value = "";
      return;
    }

    input.value = new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0
    }).format(value);

  }


  function getInputValue(id) {

    const input = document.getElementById(id);

    if (!input) {
      return "";
    }

    return input.value;

  }


  function setInfoVisibility(show) {

    const infoSection = document.querySelector(".info-section");

    if (!infoSection) {
      return;
    }

    infoSection.hidden = !show;

  }


/* =========================================================
   PROGRESO
========================================================= */

function updateProgress(stage, completedUntil = -1) {

  progressSteps.forEach((step, index) => {

    step.classList.remove(
      "active",
      "completed"
    );

    /*
      Pasos anteriores:
      quedan completados.
    */
    if (index < stage) {
      step.classList.add("completed");
    }

    /*
      Paso actual:
      queda activo.
    */
    if (index === stage) {
      step.classList.add("active");
    }

    /*
      En el resultado final queremos
      mostrar todos los pasos completados.
    */
    if (
      completedUntil >= 0 &&
      index <= completedUntil
    ) {
      step.classList.remove("active");
      step.classList.add("completed");
    }

  });


  /*
    La barra representa la posición actual
    dentro de las 6 etapas.

    0 = 0%
    1 = 20%
    2 = 40%
    3 = 60%
    4 = 80%
    5 = 100%
  */

  let percentage =
    (stage / 5) * 100;

  /*
    Si estamos en el resultado final,
    forzamos 100%.
  */

  if (stage === 5) {
    percentage = 100;
  }

  progressFill.style.width =
    `${percentage}%`;


  const labels = [
    "Inicio",
    "Vehículo",
    "Financiación",
    "Perfil",
    "Precalificación",
    "Resultado"
  ];

  progressText.textContent =
    labels[stage] || "Inicio";

}


  /* =======================================================
     ESTADO DE LOS BOTONES
  ======================================================= */

  function updateButtons() {

    backBtn.hidden = flow === "welcome";

    nextBtn.hidden = false;

    if (flow === "welcome") {

      nextBtn.textContent = "Comenzar →";

    }

    else if (flow === "simulation") {

      nextBtn.textContent =
        simulationStep === 4
          ? "Calcular →"
          : "Continuar →";

    }

    else if (flow === "simulation-result") {

      nextBtn.textContent =
        "Continuar con mi solicitud →";

    }

    else if (flow === "qualification") {

      nextBtn.textContent =
        qualificationStep === QUESTIONS.length - 1
          ? "Ver resultado →"
          : "Continuar →";

    }

    else if (flow === "final-result") {

      nextBtn.textContent = "Nueva solicitud";

    }

  }


  /* =======================================================
     BIENVENIDA
  ======================================================= */

  function renderWelcome() {

    flow = "welcome";

    updateProgress(0, -1);

    setInfoVisibility(true);

    screen.innerHTML = `

      <div class="intro">

        <span class="eyebrow">
          SOLICITUD DE CRÉDITO
        </span>

        <h1>
          Adquiere tu financiación
        </h1>

        <p>
          Empieza con un formulario sencillo para tu vehículo,
          el valor que deseas financiar y el plazo que tienes
          en mente.
        </p>

        <div class="email-field">
  <label for="participantEmail">
    Antes de empezar, necesitamos tu correo electrónico
  </label>

  <input
    id="participantEmail"
    type="email"
    placeholder="tu correo electrónico"
    autocomplete="email"
    value="${participantEmail}"
  >
</div>

<div class="privacy-link">
  <span>🔒</span>
  <button type="button" id="openPrivacyModal">
    Política de Tratamiento de Datos Personales y Privacidad
  </button>
</div>

        <div class="welcome-points">

          <div class="welcome-point">
            <span class="welcome-number">01</span>
            <span>
              Selecciona tu vehículo y sus condiciones.
            </span>
          </div>

          <div class="welcome-point">
            <span class="welcome-number">02</span>
            <span>
              Define el valor de entrada y el plazo.
            </span>
          </div>

          <div class="welcome-point">
            <span class="welcome-number">03</span>
            <span>
              Conoce una cuota mensual referencial.
            </span>
          </div>

        </div>

        <p class="prototype-note">
          Esto es referencial y no constituye una
          aprobación de crédito. Las condiciones finales estarán
          sujetas a validación.
        </p>

      </div>

    `;

    updateButtons();

  }


/* =========================================================
   SIMULACIÓN
========================================================= */

function renderSimulation() {

  flow = "simulation";

  setInfoVisibility(false);


  /*
    Mapeo de las preguntas internas
    a las 6 etapas visuales.
  */

  let stage = 0;

  if (simulationStep === 0) {
    stage = 0;
  }

  else if (simulationStep === 1) {
    stage = 1;
  }

  else if (
    simulationStep === 2 ||
    simulationStep === 3 ||
    simulationStep === 4
  ) {
    stage = 2;
  }


  updateProgress(stage);


  /*
    IMPORTANTE:
    Actualizamos también los botones
    cada vez que se redibuja la pantalla.
  */

  updateButtons();


  if (simulationStep === 0) {

    renderVehicleType();
    return;

  }


  if (simulationStep === 1) {

    renderVehicleCondition();
    return;

  }


  if (simulationStep === 2) {

    renderVehicleValue();
    return;

  }


  if (simulationStep === 3) {

    renderDownPayment();
    return;

  }


  if (simulationStep === 4) {

    renderTerm();
    return;

  }

}


  /* =======================================================
     1. TIPO DE VEHÍCULO
  ======================================================= */

  function renderVehicleType() {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          INICIO
        </span>

        <h2>
          ¿Qué vehículo quieres financiar?
        </h2>

        <p>
          Selecciona el tipo de vehículo que desead adquirir.
        </p>

        <div class="options">

          <button
            type="button"
            class="option ${
              simulation.vehicleType === "car"
                ? "selected"
                : ""
            }"
            data-value="car"
          >
            Automóvil
          </button>

          <button
            type="button"
            class="option ${
              simulation.vehicleType === "motorcycle"
                ? "selected"
                : ""
            }"
            data-value="motorcycle"
          >
            Moto
          </button>

        </div>

      </div>

    `;

    bindOptionButtons(
      ".option",
      value => {
        simulation.vehicleType = value;
      }
    );

  }


  /* =======================================================
     2. NUEVO / USADO
  ======================================================= */

  function renderVehicleCondition() {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          VEHÍCULO
        </span>

        <h2>
          ¿El vehículo es nuevo o usado?
        </h2>

        <p>
          Indica la condición del vehículo que quieres financiar.
        </p>

        <div class="options">

          <button
            type="button"
            class="option ${
              simulation.vehicleCondition === "new"
                ? "selected"
                : ""
            }"
            data-value="new"
          >
            Nuevo
          </button>

          <button
            type="button"
            class="option ${
              simulation.vehicleCondition === "used"
                ? "selected"
                : ""
            }"
            data-value="used"
          >
            Usado
          </button>

        </div>

      </div>

    `;

    bindOptionButtons(
      ".option",
      value => {
        simulation.vehicleCondition = value;
      }
    );

  }


  /* =======================================================
     3. VALOR VEHÍCULO
  ======================================================= */

  function renderVehicleValue() {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          FINANCIACIÓN
        </span>

        <h2>
          ¿Cuál es el valor del vehículo?
        </h2>

        <p>
          Ingresa un valor aproximado del vehículo que deseas
          financiar.
        </p>

        <div class="field">

          <label for="vehicleValue">
            Valor del vehículo
          </label>

          <input
            id="vehicleValue"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Ej. 60.000.000"
            value="${
              simulation.vehicleValue
                ? new Intl.NumberFormat("es-CO").format(
                    simulation.vehicleValue
                  )
                : ""
            }"
          >

        </div>

      </div>

    `;

    bindCurrencyInput("vehicleValue");

  }


  /* =======================================================
     4. CUOTA INICIAL
  ======================================================= */

  function renderDownPayment() {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          FINANCIACIÓN
        </span>

        <h2>
          ¿Cuánto quieres dar de entrada?
        </h2>

        <p>
          Indica el valor que aportarías como cuota inicial.
        </p>

        <div class="field">

          <label for="downPayment">
            Cuota inicial
          </label>

          <input
            id="downPayment"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Ej. 15.000.000"
            value="${
              simulation.downPayment
                ? new Intl.NumberFormat("es-CO").format(
                    simulation.downPayment
                  )
                : ""
            }"
          >

        </div>

      </div>

    `;

    bindCurrencyInput("downPayment");

  }


  /* =======================================================
     5. PLAZO
  ======================================================= */

  function renderTerm() {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          FINANCIACIÓN
        </span>

        <h2>
          ¿En cuánto tiempo quieres financiarlo?
        </h2>

        <p>
          Seleccione el plazo que desea.
        </p>

        <div class="options term-options">

          ${TERM_OPTIONS.map(term => `

            <button
              type="button"
              class="option ${
                simulation.term === term
                  ? "selected"
                  : ""
              }"
              data-value="${term}"
            >
              ${term} meses
            </button>

          `).join("")}

        </div>

      </div>

    `;

    bindOptionButtons(
      ".option",
      value => {
        simulation.term = Number(value);
      }
    );

  }


  /* =======================================================
     INPUT DE MONEDA
  ======================================================= */

  function bindCurrencyInput(id) {

    const input = document.getElementById(id);

    if (!input) {
      return;
    }

    input.addEventListener("input", () => {

      input.value =
        input.value.replace(/\D/g, "");

    });

    input.addEventListener("blur", () => {

      formatInputCurrency(input);

    });

  }


  /* =======================================================
     OPCIONES
  ======================================================= */

  function bindOptionButtons(selector, callback) {

    const buttons =
      document.querySelectorAll(selector);

    buttons.forEach(button => {

      button.addEventListener("click", () => {

        buttons.forEach(item => {
          item.classList.remove("selected");
        });

        button.classList.add("selected");

        callback(button.dataset.value);

      });

    });

  }


  /* =======================================================
     VALIDACIÓN SIMULACIÓN
  ======================================================= */

  function validateSimulationStep() {

    if (simulationStep === 0) {

      if (!simulation.vehicleType) {

        showValidation(
          "Selecciona si quieres financiar un automóvil o una moto."
        );

        return false;
      }

    }


    if (simulationStep === 1) {

      if (!simulation.vehicleCondition) {

        showValidation(
          "Selecciona si el vehículo es nuevo o usado."
        );

        return false;
      }

    }


    if (simulationStep === 2) {

      const value =
        parseCOP(
          getInputValue("vehicleValue")
        );

      if (value <= 0) {

        showValidation(
          "Ingresa el valor del vehículo."
        );

        return false;
      }

      simulation.vehicleValue = value;

    }


    if (simulationStep === 3) {

      const downPayment =
        parseCOP(
          getInputValue("downPayment")
        );

      if (downPayment < 0) {

        showValidation(
          "La cuota inicial no puede ser negativa."
        );

        return false;
      }

      if (
        downPayment >
        simulation.vehicleValue
      ) {

        showValidation(
          "La cuota inicial no puede ser mayor al valor del vehículo."
        );

        return false;
      }

      simulation.downPayment = downPayment;

    }


    if (simulationStep === 4) {

      if (!simulation.term) {

        showValidation(
          "Selecciona un plazo para continuar."
        );

        return false;
      }

    }


    return true;

  }


  /* =======================================================
     VALIDACIÓN VISUAL
  ======================================================= */

  function showValidation(message) {

    let notice =
      document.querySelector(".validation-message");

    if (!notice) {

      notice =
        document.createElement("div");

      notice.className =
        "validation-message";

      screen.appendChild(notice);

    }

    notice.textContent = message;

  }


  function clearValidation() {

    const notice =
      document.querySelector(".validation-message");

    if (notice) {
      notice.remove();
    }

  }


  /* =======================================================
     CÁLCULO
  ======================================================= */

  function calculateSimulation() {

    const financed =
      Math.max(
        0,
        simulation.vehicleValue -
        simulation.downPayment
      );

    const months =
      simulation.term;

    const monthlyRate =
      PROVISIONAL_MONTHLY_RATE;

    let monthlyPayment = 0;

    if (financed > 0 && months > 0) {

      monthlyPayment =
        financed *
        (
          monthlyRate *
          Math.pow(
            1 + monthlyRate,
            months
          )
        ) /
        (
          Math.pow(
            1 + monthlyRate,
            months
          ) - 1
        );

    }

    simulation.financedAmount =
      Math.round(financed);

    simulation.monthlyPayment =
      Math.round(monthlyPayment);

  }


  /* =======================================================
     RESULTADO DE SIMULACIÓN
  ======================================================= */

  function renderSimulationResult() {

    flow = "simulation-result";

    setInfoVisibility(false);

    updateProgress(2);

    screen.innerHTML = `

      <div class="simulation-result">

        <span class="eyebrow">
          RESULTADO
        </span>

        <h2>
          Esta sería tu financiación aproximada
        </h2>

        <p>
          Estos valores son referenciales y sirven para que
          conozcas el escenario antes de iniciar la
          precalificación.
        </p>

        <div class="summary-grid">

          <div class="summary-item">

            <span class="summary-label">
              Vehículo
            </span>

            <strong>
              ${
                simulation.vehicleType === "car"
                  ? "Automóvil"
                  : "Moto"
              }
            </strong>

          </div>


          <div class="summary-item">

            <span class="summary-label">
              Condición
            </span>

            <strong>
              ${
                simulation.vehicleCondition === "new"
                  ? "Nuevo"
                  : "Usado"
              }
            </strong>

          </div>


          <div class="summary-item">

            <span class="summary-label">
              Valor vehículo
            </span>

            <strong>
              ${formatCOP(simulation.vehicleValue)}
            </strong>

          </div>


          <div class="summary-item">

            <span class="summary-label">
              Cuota inicial
            </span>

            <strong>
              ${formatCOP(simulation.downPayment)}
            </strong>

          </div>


          <div class="summary-item">

            <span class="summary-label">
              Monto a financiar
            </span>

            <strong>
              ${formatCOP(simulation.financedAmount)}
            </strong>

          </div>


          <div class="summary-item">

            <span class="summary-label">
              Plazo
            </span>

            <strong>
              ${simulation.term} meses
            </strong>

          </div>

        </div>


        <div class="summary-payment">

          <span>
            Cuota mensual referencial
          </span>

          <strong>
            ${formatCOP(simulation.monthlyPayment)}
          </strong>

        </div>


        <div class="notice">

          <strong>
            Cálculo referencial
          </strong>

          <p>
            Para este prototipo se está utilizando una tasa
            mensual provisional. La tasa y condiciones
            definitivas de Arrankar deben definirse antes de
            la integración productiva.
          </p>

        </div>


        <div class="simulation-next-message">

          <p>
            Si este escenario te interesa, podemos continuar
            con unas preguntas para conocer tu perfil.
          </p>

        </div>

      </div>

    `;

    updateButtons();

  }


  /* =======================================================
     PREGUNTAS DE PRECALIFICACIÓN
  ======================================================= */

/* =========================================================
   PREGUNTAS DE PRECALIFICACIÓN
========================================================= */

function renderQualification() {

  flow = "qualification";

  setInfoVisibility(false);

  const question =
    QUESTIONS[qualificationStep];


  /*
    Las preguntas de perfil corresponden
    a la etapa 4 visual.
    
    La última pregunta lleva visualmente
    a Precalificación.
  */

  let stage = 3;

  if (
    qualificationStep === QUESTIONS.length - 1
  ) {
    stage = 4;
  }


  updateProgress(stage);


  /*
    MUY IMPORTANTE:
    Actualizar el texto del botón cada vez
    que cambiamos de pregunta.
  */

  updateButtons();


  if (!question) {

    finishQualification();
    return;

  }


  if (question.type === "choice") {

    renderChoiceQuestion(question);
    return;

  }


  renderInputQuestion(question);

}


  /* =======================================================
     PREGUNTA DE OPCIONES
  ======================================================= */

  function renderChoiceQuestion(question) {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          PRECALIFICACIÓN
        </span>

        <h2>
          ${question.title}
        </h2>

        <p>
          ${question.text}
        </p>

        <div class="options">

          ${question.options.map(option => `

            <button
              type="button"
              class="option ${
                answers[question.id] === option.value
                  ? "selected"
                  : ""
              }"
              data-value="${option.value}"
            >
              ${option.label}
            </button>

          `).join("")}

        </div>

      </div>

    `;

    bindOptionButtons(
      ".option",
      value => {
        answers[question.id] = value;
      }
    );

  }


  /* =======================================================
     PREGUNTA DE TEXTO / NÚMERO / MONEDA
  ======================================================= */

  function renderInputQuestion(question) {

    const existingValue =
      answers[question.id] ?? "";

    const isCurrency =
      question.type === "currency";

    const value =
      isCurrency && existingValue
        ? new Intl.NumberFormat("es-CO").format(
            existingValue
          )
        : existingValue;

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          PRECALIFICACIÓN
        </span>

        <h2>
          ${question.title}
        </h2>

        <p>
          ${question.text}
        </p>

        <div class="field">

          <label for="qualificationInput">
            ${question.title}
          </label>

          <input
            id="qualificationInput"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="${
              question.placeholder || ""
            }"
            value="${value}"
          >

        </div>

      </div>

    `;

    const input =
      document.getElementById(
        "qualificationInput"
      );

    if (
      question.type === "currency" ||
      question.type === "number"
    ) {

      input.addEventListener("input", () => {

        input.value =
          input.value.replace(/\D/g, "");

      });

    }


    if (isCurrency) {

      input.addEventListener("blur", () => {
        formatInputCurrency(input);
      });

    }

  }


  /* =======================================================
     VALIDACIÓN DE PRECALIFICACIÓN
  ======================================================= */

  function validateQualificationStep() {

    const question =
      QUESTIONS[qualificationStep];

    if (!question) {
      return true;
    }


    if (question.type === "choice") {

      if (!answers[question.id]) {

        showValidation(
          "Selecciona una opción para continuar."
        );

        return false;
      }

      return true;

    }


    const input =
      document.getElementById(
        "qualificationInput"
      );

    if (!input) {
      return false;
    }

    const raw =
      input.value.trim();

    if (!raw) {

      showValidation(
        "Completa este campo para continuar."
      );

      return false;
    }


    const numericValue =
      parseCOP(raw);


    if (question.type === "number") {

      if (numericValue < 0) {

        showValidation(
          "Ingresa un valor válido."
        );

        return false;
      }

      if (
        question.min !== undefined &&
        numericValue < question.min
      ) {

        showValidation(
          "Ingresa un valor válido."
        );

        return false;
      }

    }


    if (question.type === "currency") {

      if (numericValue <= 0) {

        showValidation(
          "Ingresa tus ingresos mensuales."
        );

        return false;
      }

    }


    answers[question.id] =
      numericValue;

    return true;

  }


 /* =======================================================
   REGLAS DE NEGOCIO ARRANKAR
======================================================= */

/*
  IMPORTANTE:

  Este bloque concentra las reglas que pueden cambiar
  durante el proyecto.

  La idea es que si tu jefe modifica una condición,
  normalmente solo tengas que cambiar este objeto.

  Los valores de financiación de automóvil toman como
  referencia funcional las condiciones públicas de
  Occiauto de Banco de Occidente.

  Las reglas de precalificación son las definidas
  actualmente para el prototipo de Arrankar.
*/

const BUSINESS_RULES = {

  /* -------------------------------------------------------
     SIMULACIÓN
  ------------------------------------------------------- */

  simulation: {

    /*
      Tasa provisional del prototipo.

      Cambiar solamente cuando Arrankar defina
      la tasa real.
    */
    monthlyRate: 0.0143,

    rateIsProvisional: true,

    /*
      Plazos generales disponibles.

      Los límites específicos por vehículo se aplican
      automáticamente mediante getAvailableTermOptions().
    */
    termOptions: [
      12,
      24,
      36,
      48,
      60,
      72,
      84
    ],

    /* -----------------------------------------------------
       FINANCIACIÓN POR TIPO DE VEHÍCULO
    ----------------------------------------------------- */

    financing: {

      automobile: {

        new: {
          maxTermMonths: 84,
          maxFinancingPercent: 100
        },

        used: {
          maxTermMonths: 72,
          maxFinancingPercent: 90
        }

      },

      /*
        Para motos todavía no fijamos límites definitivos,
        porque no tenemos una regla de Arrankar confirmada.

        null significa:
        "no aplicar todavía esta restricción".
      */

      motorcycle: {

        new: {
          maxTermMonths: null,
          maxFinancingPercent: null
        },

        used: {
          maxTermMonths: null,
          maxFinancingPercent: null
        }

      }

    }

  },


  /* -------------------------------------------------------
     PRECALIFICACIÓN
  ------------------------------------------------------- */

  qualification: {

    /*
      RED:
      Reporte negativo activo.
    */
    red: {

      activeNegativeReport: true

    },


    /*
      YELLOW:
      El perfil puede continuar, pero requiere codeudor.
    */
    yellow: {

      /*
        Ingreso igual o inferior a este valor:
        YELLOW.
      */
      maxIncome: 1500000,

      /*
        Reporte negativo ya pagado:
        YELLOW.
      */
      paidReport: true,

      /*
        Menos de 6 meses de actividad:
        YELLOW.
      */
      minActivityMonths: 6

    },


    /*
      Plantillas que posteriormente utilizaremos
      para ZapSign.
    */
    templates: {

      green: "A",
      yellow: "B",
      red: null

    }

  }

};


/* =======================================================
   UTILIDADES
======================================================= */

function formatCOP(value) {

  const number =
    Number(value) || 0;

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(number);

}


function parseCOP(value) {

  if (typeof value === "number") {
    return value;
  }

  return Number(
    String(value)
      .replace(/\D/g, "")
  ) || 0;

}


function formatInputCurrency(input) {

  const value =
    parseCOP(input.value);

  if (!value) {

    input.value = "";

    return;

  }

  input.value =
    new Intl.NumberFormat("es-CO", {
      maximumFractionDigits: 0
    }).format(value);

}


function getInputValue(id) {

  const input =
    document.getElementById(id);

  if (!input) {
    return "";
  }

  return input.value;

}


function setInfoVisibility(show) {

  const infoSection =
    document.querySelector(".info-section");

  if (!infoSection) {
    return;
  }

  infoSection.hidden = !show;

}


/* =======================================================
   POLÍTICAS DE FINANCIACIÓN
======================================================= */

function getVehicleRule() {

  const vehicleType =
    simulation.vehicleType === "car"
      ? "automobile"
      : "motorcycle";

  const condition =
    simulation.vehicleCondition;

  return (
    BUSINESS_RULES
      .simulation
      .financing?.[vehicleType]?.[condition]
    || {}
  );

}


function getAvailableTermOptions() {

  const rule =
    getVehicleRule();

  const options =
    BUSINESS_RULES.simulation.termOptions;

  /*
    Si todavía no existe una restricción,
    devolvemos todos los plazos.
  */
  if (
    rule.maxTermMonths === null ||
    rule.maxTermMonths === undefined
  ) {

    return options;

  }

  return options.filter(
    term =>
      term <= rule.maxTermMonths
  );

}


function getMinimumDownPayment() {

  const rule =
    getVehicleRule();

  /*
    Si no existe un porcentaje máximo
    de financiación, todavía no aplicamos
    una cuota inicial mínima.
  */
  if (
    rule.maxFinancingPercent === null ||
    rule.maxFinancingPercent === undefined
  ) {

    return 0;

  }

  const maximumFinanced =
    simulation.vehicleValue *
    (rule.maxFinancingPercent / 100);

  return Math.max(
    0,
    simulation.vehicleValue -
    maximumFinanced
  );

}


/* =======================================================
   PROGRESO
======================================================= */

function updateProgress(
  stage,
  completedUntil = -1
) {

  progressSteps.forEach(
    (step, index) => {

      step.classList.remove(
        "active",
        "completed"
      );


      /*
        Pasos anteriores:
        quedan completados.
      */
      if (index < stage) {

        step.classList.add(
          "completed"
        );

      }


      /*
        Paso actual:
        queda activo.
      */
      if (index === stage) {

        step.classList.add(
          "active"
        );

      }


      /*
        En el resultado final queremos
        mostrar todos los pasos completados.
      */
      if (
        completedUntil >= 0 &&
        index <= completedUntil
      ) {

        step.classList.remove(
          "active"
        );

        step.classList.add(
          "completed"
        );

      }

    }
  );


  /*
    La barra representa la posición actual
    dentro de las 6 etapas.

    0 = 0%
    1 = 20%
    2 = 40%
    3 = 60%
    4 = 80%
    5 = 100%
  */

  let percentage =
    (stage / 5) * 100;


  if (stage === 5) {
    percentage = 100;
  }


  progressFill.style.width =
    `${percentage}%`;


  const labels = [
    "Inicio",
    "Vehículo",
    "Financiación",
    "Perfil",
    "Precalificación",
    "Resultado"
  ];


  progressText.textContent =
    labels[stage] || "Inicio";

}


/* =======================================================
   ESTADO DE LOS BOTONES
======================================================= */

function updateButtons() {

  backBtn.hidden =
    flow === "welcome";

  nextBtn.hidden = false;


  if (flow === "welcome") {

    nextBtn.textContent =
      "Comenzar →";

  }


  else if (flow === "simulation") {

    nextBtn.textContent =
      simulationStep === 4
        ? "Calcular →"
        : "Continuar →";

  }


  else if (
    flow === "simulation-result"
  ) {

    nextBtn.textContent =
      "Continuar con mi solicitud →";

  }


  else if (
    flow === "qualification"
  ) {

    nextBtn.textContent =
      qualificationStep ===
      QUESTIONS.length - 1
        ? "Ver resultado →"
        : "Continuar →";

  }


  else if (
    flow === "final-result"
  ) {

    nextBtn.textContent =
      "Nueva solicitud";

  }

}


/* =======================================================
   BIENVENIDA
======================================================= */

function renderWelcome() {

  flow = "welcome";

  updateProgress(
    0,
    -1
  );

  setInfoVisibility(true);


  screen.innerHTML = `

    <div class="intro">

      <span class="eyebrow">
        SOLICITUD DE CRÉDITO
      </span>

      <h1>
        Adquiere tu financiación
      </h1>

      <p>
          Empieza con un formulario sencillo para tu vehículo,
          el valor que deseas financiar y el plazo que tienes
          en mente.
      </p>

      <div class="email-field">
  <label for="participantEmail">
    Antes de empezar, necesitamos tu correo electrónico
  </label>

  <input
    id="participantEmail"
    type="email"
    placeholder="tu correo electrónico"
    autocomplete="email"
    value="${participantEmail}"
  >
</div>

<div class="privacy-link">
  <span>🔒</span>
  <button type="button" id="openPrivacyModal">
    Política de Tratamiento de Datos Personales y Privacidad
  </button>
</div>

      <div class="welcome-points">

        <div class="welcome-point">

          <span class="welcome-number">
            01
          </span>

          <span>
            Selecciona tu vehículo y sus condiciones.
          </span>

        </div>


        <div class="welcome-point">

          <span class="welcome-number">
            02
          </span>

          <span>
            Define el valor de entrada y el plazo.
          </span>

        </div>


        <div class="welcome-point">

          <span class="welcome-number">
            03
          </span>

          <span>
            Conoce una cuota mensual referencial.
          </span>

        </div>

      </div>


      <p class="prototype-note">
        Esto es referencial y no constituye una
        aprobación de crédito. Las condiciones finales estarán
        sujetas a validación.
      </p>

    </div>

  `;


  updateButtons();

}


/* =======================================================
   SIMULACIÓN
======================================================= */

function renderSimulation() {

  flow = "simulation";

  setInfoVisibility(false);


  /*
    Mapeo de las preguntas internas
    a las 6 etapas visuales.
  */

  let stage = 0;


  if (simulationStep === 0) {

    stage = 0;

  }

  else if (simulationStep === 1) {

    stage = 1;

  }

  else if (
    simulationStep === 2 ||
    simulationStep === 3 ||
    simulationStep === 4
  ) {

    stage = 2;

  }


  updateProgress(stage);

  updateButtons();


  if (simulationStep === 0) {

    renderVehicleType();

    return;

  }


  if (simulationStep === 1) {

    renderVehicleCondition();

    return;

  }


  if (simulationStep === 2) {

    renderVehicleValue();

    return;

  }


  if (simulationStep === 3) {

    renderDownPayment();

    return;

  }


  if (simulationStep === 4) {

    renderTerm();

    return;

  }

}


/* =======================================================
   1. TIPO DE VEHÍCULO
======================================================= */

function renderVehicleType() {

  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        INICIO
      </span>

      <h2>
        ¿Qué vehículo quieres financiar?
      </h2>

      <p>
        Selecciona el tipo de vehículo que desea adquirir.
      </p>


      <div class="options">

        <button
          type="button"
          class="option ${
            simulation.vehicleType === "car"
              ? "selected"
              : ""
          }"
          data-value="car"
        >
          Automóvil
        </button>


        <button
          type="button"
          class="option ${
            simulation.vehicleType === "motorcycle"
              ? "selected"
              : ""
          }"
          data-value="motorcycle"
        >
          Moto
        </button>

      </div>

    </div>

  `;


  bindOptionButtons(
    ".option",
    value => {

      simulation.vehicleType =
        value;

      /*
        Si posteriormente cambiamos de automóvil
        a moto o viceversa, verificamos que el plazo
        anterior siga siendo válido.
      */
      const availableTerms =
        getAvailableTermOptions();

      if (
        simulation.term &&
        !availableTerms.includes(
          Number(simulation.term)
        )
      ) {

        simulation.term = 0;

      }

    }
  );

}


/* =======================================================
   2. NUEVO / USADO
======================================================= */

function renderVehicleCondition() {

  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        VEHÍCULO
      </span>

      <h2>
        ¿El vehículo es nuevo o usado?
      </h2>

      <p>
        Indica la condición del vehículo que quieres financiar.
      </p>


      <div class="options">

        <button
          type="button"
          class="option ${
            simulation.vehicleCondition === "new"
              ? "selected"
              : ""
          }"
          data-value="new"
        >
          Nuevo
        </button>


        <button
          type="button"
          class="option ${
            simulation.vehicleCondition === "used"
              ? "selected"
              : ""
          }"
          data-value="used"
        >
          Usado
        </button>

      </div>

    </div>

  `;


  bindOptionButtons(
    ".option",
    value => {

      simulation.vehicleCondition =
        value;


      /*
        Si el nuevo límite de plazo ya no permite
        el plazo seleccionado anteriormente,
        lo limpiamos.
      */
      const availableTerms =
        getAvailableTermOptions();

      if (
        simulation.term &&
        !availableTerms.includes(
          Number(simulation.term)
        )
      ) {

        simulation.term = 0;

      }

    }
  );

}


/* =======================================================
   3. VALOR VEHÍCULO
======================================================= */

function renderVehicleValue() {

  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        FINANCIACIÓN
      </span>

      <h2>
        ¿Cuál es el valor del vehículo?
      </h2>

      <p>
        Ingresa un valor aproximado del vehículo que deseas
        financiar.
      </p>


      <div class="field">

        <label for="vehicleValue">
          Valor del vehículo
        </label>

        <input
          id="vehicleValue"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="Ej. 60.000.000"
          value="${
            simulation.vehicleValue
              ? new Intl.NumberFormat(
                  "es-CO"
                ).format(
                  simulation.vehicleValue
                )
              : ""
          }"
        >

      </div>

    </div>

  `;


  bindCurrencyInput(
    "vehicleValue"
  );

}


/* =======================================================
   4. CUOTA INICIAL
======================================================= */

function renderDownPayment() {

  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        FINANCIACIÓN
      </span>

      <h2>
        ¿Cuánto quieres dar de entrada?
      </h2>

      <p>
        Indica el valor que aportarías como cuota inicial.
      </p>


      <div class="field">

        <label for="downPayment">
          Cuota inicial
        </label>

        <input
          id="downPayment"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="Ej. 15.000.000"
          value="${
            simulation.downPayment
              ? new Intl.NumberFormat(
                  "es-CO"
                ).format(
                  simulation.downPayment
                )
              : ""
          }"
        >

      </div>

    </div>

  `;


  bindCurrencyInput(
    "downPayment"
  );

}


/* =======================================================
   5. PLAZO
======================================================= */

function renderTerm() {

  const availableTerms =
    getAvailableTermOptions();


  /*
    Si el plazo guardado ya no está disponible
    para la combinación actual, lo eliminamos.
  */
  if (
    simulation.term &&
    !availableTerms.includes(
      Number(simulation.term)
    )
  ) {

    simulation.term = 0;

  }


  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        FINANCIACIÓN
      </span>

      <h2>
        ¿En cuánto tiempo quieres financiarlo?
      </h2>

      <p>
        Seleccione el plazo.
      </p>


      <div class="options term-options">

        ${availableTerms.map(
          term => `

            <button
              type="button"
              class="option ${
                simulation.term === term
                  ? "selected"
                  : ""
              }"
              data-value="${term}"
            >
              ${term} meses
            </button>

          `
        ).join("")}

      </div>

    </div>

  `;


  bindOptionButtons(
    ".option",
    value => {

      simulation.term =
        Number(value);

    }
  );

}


/* =======================================================
   INPUT DE MONEDA
======================================================= */

function bindCurrencyInput(id) {

  const input =
    document.getElementById(id);

  if (!input) {
    return;
  }


  input.addEventListener(
    "input",
    () => {

      input.value =
        input.value.replace(
          /\D/g,
          ""
        );

    }
  );


  input.addEventListener(
    "blur",
    () => {

      formatInputCurrency(
        input
      );

    }
  );

}


/* =======================================================
   OPCIONES
======================================================= */

function bindOptionButtons(
  selector,
  callback
) {

  const buttons =
    document.querySelectorAll(
      selector
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          buttons.forEach(
            item => {

              item.classList.remove(
                "selected"
              );

            }
          );


          button.classList.add(
            "selected"
          );


          callback(
            button.dataset.value
          );

        }
      );

    }
  );

}


/* =======================================================
   VALIDACIÓN SIMULACIÓN
======================================================= */

function validateSimulationStep() {

  if (simulationStep === 0) {

    if (!simulation.vehicleType) {

      showValidation(
        "Selecciona si quieres financiar un automóvil o una moto."
      );

      return false;

    }

  }


  if (simulationStep === 1) {

    if (!simulation.vehicleCondition) {

      showValidation(
        "Selecciona si el vehículo es nuevo o usado."
      );

      return false;

    }

  }


  if (simulationStep === 2) {

    const value =
      parseCOP(
        getInputValue(
          "vehicleValue"
        )
      );


    if (value <= 0) {

      showValidation(
        "Ingresa el valor del vehículo."
      );

      return false;

    }


    simulation.vehicleValue =
      value;

  }


  if (simulationStep === 3) {

    const downPayment =
      parseCOP(
        getInputValue(
          "downPayment"
        )
      );


    if (
      downPayment >
      simulation.vehicleValue
    ) {

      showValidation(
        "La cuota inicial no puede ser mayor al valor del vehículo."
      );

      return false;

    }


    const minimumDownPayment =
      getMinimumDownPayment();


    if (
      downPayment <
      minimumDownPayment
    ) {

      showValidation(
        `Para este vehículo la cuota inicial mínima es de ${formatCOP(
          minimumDownPayment
        )}.`
      );

      return false;

    }


    simulation.downPayment =
      downPayment;

  }


  if (simulationStep === 4) {

    if (!simulation.term) {

      showValidation(
        "Selecciona un plazo para continuar."
      );

      return false;

    }


    const availableTerms =
      getAvailableTermOptions();


    if (
      !availableTerms.includes(
        Number(simulation.term)
      )
    ) {

      showValidation(
        "El plazo seleccionado no está disponible para este vehículo."
      );

      return false;

    }

  }


  return true;

}


/* =======================================================
   VALIDACIÓN VISUAL
======================================================= */

function showValidation(message) {

  let notice =
    document.querySelector(
      ".validation-message"
    );


  if (!notice) {

    notice =
      document.createElement(
        "div"
      );

    notice.className =
      "validation-message";

    screen.appendChild(
      notice
    );

  }


  notice.textContent =
    message;

}


function clearValidation() {

  const notice =
    document.querySelector(
      ".validation-message"
    );


  if (notice) {
    notice.remove();
  }

}


/* =======================================================
   CÁLCULO
======================================================= */

function calculateSimulation() {

  const financed =
    Math.max(
      0,
      simulation.vehicleValue -
      simulation.downPayment
    );


  const months =
    Number(
      simulation.term
    );


  const monthlyRate =
    Number(
      BUSINESS_RULES
        .simulation
        .monthlyRate
    );


  let monthlyPayment = 0;


  if (
    financed > 0 &&
    months > 0
  ) {

    /*
      Si la tasa fuera 0,
      simplemente dividimos el capital
      entre los meses.

      Esto evita una división entre cero
      si Arrankar cambia la tasa posteriormente.
    */
    if (monthlyRate === 0) {

      monthlyPayment =
        financed / months;

    }

    else {

      const factor =
        Math.pow(
          1 + monthlyRate,
          months
        );


      monthlyPayment =
        financed *
        (
          monthlyRate *
          factor
        ) /
        (
          factor - 1
        );

    }

  }


  simulation.financedAmount =
    Math.round(
      financed
    );


  simulation.monthlyPayment =
    Math.round(
      monthlyPayment
    );

}


/* =======================================================
   RESULTADO DE SIMULACIÓN
======================================================= */

function renderSimulationResult() {

  flow =
    "simulation-result";

  setInfoVisibility(false);

  updateProgress(2);


  screen.innerHTML = `

    <div class="simulation-result">

      <span class="eyebrow">
        RESULTADO
      </span>

      <h2>
        Esta sería tu financiación aproximada
      </h2>

      <p>
        Estos valores son referenciales y sirven para que
        conozcas el escenario antes de iniciar la
        precalificación.
      </p>


      <div class="summary-grid">

        <div class="summary-item">

          <span class="summary-label">
            Vehículo
          </span>

          <strong>
            ${
              simulation.vehicleType === "car"
                ? "Automóvil"
                : "Moto"
            }
          </strong>

        </div>


        <div class="summary-item">

          <span class="summary-label">
            Condición
          </span>

          <strong>
            ${
              simulation.vehicleCondition === "new"
                ? "Nuevo"
                : "Usado"
            }
          </strong>

        </div>


        <div class="summary-item">

          <span class="summary-label">
            Valor vehículo
          </span>

          <strong>
            ${formatCOP(
              simulation.vehicleValue
            )}
          </strong>

        </div>


        <div class="summary-item">

          <span class="summary-label">
            Cuota inicial
          </span>

          <strong>
            ${formatCOP(
              simulation.downPayment
            )}
          </strong>

        </div>


        <div class="summary-item">

          <span class="summary-label">
            Monto a financiar
          </span>

          <strong>
            ${formatCOP(
              simulation.financedAmount
            )}
          </strong>

        </div>


        <div class="summary-item">

          <span class="summary-label">
            Plazo
          </span>

          <strong>
            ${simulation.term} meses
          </strong>

        </div>

      </div>


      <div class="summary-payment">

        <span>
          Cuota mensual referencial
        </span>

        <strong>
          ${formatCOP(
            simulation.monthlyPayment
          )}
        </strong>

      </div>


      <div class="notice">

        <strong>
          Cálculo referencial
        </strong>

        <p>
          ${
            BUSINESS_RULES
              .simulation
              .rateIsProvisional

              ? "La cuota utiliza una tasa mensual provisional para este prototipo. Las condiciones definitivas estarán sujetas a validación de Arrankar."

              : "La cuota utiliza la tasa configurada para el producto. Las condiciones definitivas estarán sujetas a validación."
          }
        </p>

      </div>


      <div class="simulation-next-message">

        <p>
          Si este escenario te interesa, podemos continuar
          con unas preguntas para conocer tu perfil.
        </p>

      </div>

    </div>

  `;


  updateButtons();

}


/* =======================================================
   PREGUNTAS DE PRECALIFICACIÓN
======================================================= */

function renderQualification() {

  flow =
    "qualification";

  setInfoVisibility(false);


  const question =
    QUESTIONS[
      qualificationStep
    ];


  /*
    Las preguntas de perfil corresponden
    a la etapa 4 visual.

    La última pregunta lleva visualmente
    a Precalificación.
  */

  let stage = 3;


  if (
    qualificationStep ===
    QUESTIONS.length - 1
  ) {

    stage = 4;

  }


  updateProgress(stage);

  updateButtons();


  if (!question) {

    finishQualification();

    return;

  }


  if (
    question.type === "choice"
  ) {

    renderChoiceQuestion(
      question
    );

    return;

  }


  renderInputQuestion(
    question
  );

}


/* =======================================================
   PREGUNTA DE OPCIONES
======================================================= */

function renderChoiceQuestion(
  question
) {

  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        PRECALIFICACIÓN
      </span>

      <h2>
        ${question.title}
      </h2>

      <p>
        ${question.text}
      </p>


      <div class="options">

        ${question.options.map(
          option => `

            <button
              type="button"
              class="option ${
                answers[question.id] ===
                option.value
                  ? "selected"
                  : ""
              }"
              data-value="${option.value}"
            >
              ${option.label}
            </button>

          `
        ).join("")}

      </div>

    </div>

  `;


  bindOptionButtons(
    ".option",
    value => {

      answers[
        question.id
      ] = value;

    }
  );

}


/* =======================================================
   PREGUNTA DE TEXTO / NÚMERO / MONEDA
======================================================= */

function renderInputQuestion(
  question
) {

  const existingValue =
    answers[
      question.id
    ] ?? "";


  /* Antigüedad: mostramos rangos en años para que
     el usuario no tenga que interpretar meses. */
  if (question.id === "activity_months") {

    screen.innerHTML = `

      <div class="question">

        <span class="eyebrow">
          PRECALIFICACIÓN
        </span>

        <h2>
          ${question.title}
        </h2>

        <p>
          ${question.text}
        </p>

        <div class="field">

          <label for="qualificationInput">
            ${question.title}
          </label>

          <select
            id="qualificationInput"
            autocomplete="off"
          >

            <option value="">
              Selecciona una opción
            </option>

            ${ACTIVITY_OPTIONS.map(option => `
              <option
                value="${option.value}"
                ${answers.activity_months_range === option.value ? "selected" : ""}
              >
                ${option.label}
              </option>
            `).join("")}

          </select>

        </div>

      </div>

    `;

    return;

  }


  const isCurrency =
    question.type === "currency";


  const value =
    isCurrency &&
    existingValue
      ? new Intl.NumberFormat(
          "es-CO"
        ).format(
          existingValue
        )
      : existingValue;


  screen.innerHTML = `

    <div class="question">

      <span class="eyebrow">
        PRECALIFICACIÓN
      </span>

      <h2>
        ${question.title}
      </h2>

      <p>
        ${question.text}
      </p>


      <div class="field">

        <label for="qualificationInput">
          ${question.title}
        </label>

        <input
          id="qualificationInput"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="${
            question.placeholder || ""
          }"
          value="${value}"
        >

      </div>

    </div>

  `;


  const input =
    document.getElementById(
      "qualificationInput"
    );


  if (
    question.type === "currency" ||
    question.type === "number"
  ) {

    input.addEventListener(
      "input",
      () => {

        input.value =
          input.value.replace(
            /\D/g,
            ""
          );

      }
    );

  }


  if (isCurrency) {

    input.addEventListener(
      "blur",
      () => {

        formatInputCurrency(
          input
        );

      }
    );

  }

}


/* =======================================================
   VALIDACIÓN DE PRECALIFICACIÓN
======================================================= */

function validateQualificationStep() {

  const question =
    QUESTIONS[
      qualificationStep
    ];


  if (!question) {
    return true;
  }


  /* Antigüedad usa un selector por rangos. Guardamos la
     respuesta visible y un valor interno provisional en meses. */
  if (question.id === "activity_months") {

    const select =
      document.getElementById("qualificationInput");

    const selectedValue =
      select?.value || "";

    const selectedOption =
      ACTIVITY_OPTIONS.find(
        option => option.value === selectedValue
      );

    if (!selectedOption) {

      showValidation(
        "Selecciona tu antigüedad para continuar."
      );

      return false;

    }

    answers.activity_months_range =
      selectedOption.value;

    answers.activity_months_label =
      selectedOption.label;

    answers.activity_months =
      selectedOption.months;

    return true;

  }


  if (
    question.type === "choice"
  ) {

    if (
      !answers[
        question.id
      ]
    ) {

      showValidation(
        "Selecciona una opción para continuar."
      );

      return false;

    }


    return true;

  }


  const input =
    document.getElementById(
      "qualificationInput"
    );


  if (!input) {
    return false;
  }


  const raw =
    input.value.trim();


  if (!raw) {

    showValidation(
      "Completa este campo para continuar."
    );

    return false;

  }


  const numericValue =
    parseCOP(raw);


  if (
    question.type === "number"
  ) {

    if (
      question.min !== undefined &&
      numericValue <
      question.min
    ) {

      showValidation(
        "Ingresa un valor válido."
      );

      return false;

    }

  }


  if (
    question.type === "currency"
  ) {

    if (
      numericValue <= 0
    ) {

      showValidation(
        "Ingresa tus ingresos mensuales."
      );

      return false;

    }

  }


  answers[
    question.id
  ] = numericValue;


  return true;

}


/* =======================================================
   REGLAS DE NEGOCIO
======================================================= */

function evaluateQualification() {

  const rules =
    BUSINESS_RULES
      .qualification;


  const history =
    answers.credit_history;



  const months =
    Number(
      answers.activity_months || 0
    );


  const income =
    Number(
      answers.monthly_income || 0
    );


  /* =====================================================
     RED
  ===================================================== */

  if (
    rules.red.activeNegativeReport &&
    history === "current_arrears"
  ) {

    return {

      status: "red",

      title:
        "No podemos continuar con esta solicitud",

      message:
        "Actualmente registras un reporte negativo activo.",

      reason:
        "En este escenario la solicitud se detiene y no se habilita la firma.",

      template:
        rules.templates.red

    };

  }


  /* =====================================================
     YELLOW
  ===================================================== */

  const hasPaidReport =
    rules.yellow.paidReport &&
    history === "paid_report";



  const lowIncome =
    income <=
    rules.yellow.maxIncome;


  const insufficientActivity =
    months <
    rules.yellow.minActivityMonths;


  if (
    hasPaidReport ||
    lowIncome ||
    insufficientActivity
  ) {

    return {

      status: "yellow",

      title:
        "Tu solicitud requiere un codeudor",

      message:
        "Tu perfil puede continuar bajo una condición adicional.",

      reason:
        "Para este escenario se requiere un codeudor antes de continuar con la firma.",

      template:
        rules.templates.yellow

    };

  }


  /* =====================================================
     GREEN
  ===================================================== */

  return {

    status: "green",

    title:
      "¡Tu perfil puede continuar!",

    message:
      "Tu información cumple las condiciones del escenario ideal del prototipo.",

    reason:
      "Puedes continuar con el proceso principal de solicitud.",

    template:
      rules.templates.green

  };

}

/* =======================================================
   GUARDAR RESULTADO - SANDBOX
======================================================= */

function saveSandboxResult() {

  const SANDBOX_URL =
    "https://script.google.com/macros/s/AKfycbwfqywiKBaOLgFAL1laYxih7PaU7xESXY04pF_wLrq4sD1hqxvfXGQsPbOTdKkcINOR/exec"; 


  const data = {

    email:
  participantEmail,

    fecha:
      new Date().toISOString(),

    vehicleType:
      simulation.vehicleType,

    vehicleCondition:
      simulation.vehicleCondition,

    vehicleValue:
      simulation.vehicleValue,

    downPayment:
      simulation.downPayment,

    financedAmount:
      simulation.financedAmount,

    term:
      simulation.term,

    monthlyPayment:
      simulation.monthlyPayment,

    employment:
      answers.employment || "",

    creditHistory:
      answers.credit_history || "",

    activityMonthsRange:
      answers.activity_months_range || "",

    activityMonthsLabel:
      answers.activity_months_label || "",

    activityMonths:
      answers.activity_months || 0,

    monthlyIncome:
      answers.monthly_income || 0,

    result:
      qualificationResult?.status || "",

    template:
      qualificationResult?.template || ""

  };


  fetch(
    SANDBOX_URL,
    {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify(data)

    }
  )
  .catch(error => {

    console.error(
      "Error guardando resultado sandbox:",
      error
    );

  });

}

/* =======================================================
   FINALIZAR PRECALIFICACIÓN
======================================================= */

function finishQualification() {

  qualificationResult =
    evaluateQualification();

  saveSandboxParticipant();

  logSandboxEvent(
    "resultado",
    "completó - " +
      qualificationResult.status
  );

  renderFinalResult();
}


/* =======================================================
   RESULTADO FINAL
======================================================= */

function renderFinalResult() {

  flow =
    "final-result";

  setInfoVisibility(false);

  updateProgress(
    5,
    5
  );


  const result =
    qualificationResult;


  let extraContent = "";


  if (
    result.status === "red"
  ) {

    extraContent = `

      <ul>

        <li>
          La solicitud se detiene en este punto.
        </li>

        <li>
          Puedes considerar que un familiar solicite
          el crédito si cumple las condiciones.
        </li>

        <li>
          No se habilita la firma electrónica.
        </li>

      </ul>

    `;

  }


  if (
    result.status === "yellow"
  ) {

    extraContent = `

      <ul>

        <li>
          Se requiere un codeudor.
        </li>

        <li>
          En la integración con ZapSign se utilizaría
          la plantilla ${result.template}
          para dos personas.
        </li>

        <li>
          La firma electrónica todavía no está conectada
          en este prototipo.
        </li>

      </ul>

    `;

  }


  if (
    result.status === "green"
  ) {

    extraContent = `

      <ul>

        <li>
          El perfil puede continuar con la solicitud.
        </li>

        <li>
          En la integración con ZapSign se utilizaría
          la plantilla ${result.template}.
        </li>

        <li>
          La firma electrónica todavía no está conectada
          en este prototipo.
        </li>

      </ul>

    `;

  }


  screen.innerHTML = `

    <div class="final-result">

        <div class="final-thanks">
      <h2>Gracias por participar</h2>
      <p>Estaremos en contacto.</p>
    </div>

      <span class="eyebrow">
        RESULTADO
      </span>


      <h2>
        ${result.title}
      </h2>


      <div class="result ${result.status}">

        <p>
          ${result.message}
        </p>

        <p>
          ${result.reason}
        </p>

        ${extraContent}

      </div>


      <div class="result-followup">

        ${
          result.status === "red"

            ? `

              <p>
                Por ahora el proceso de firma permanece
                bloqueado.
              </p>

            `

            : result.status === "yellow"

            ? `

              <p>
                Próximo paso del prototipo:
                preparar la información para el codeudor
                y posteriormente integrar la plantilla
                ${result.template} de ZapSign.
              </p>

            `

            : `

              <p>
                Próximo paso del prototipo:
                preparar la información para integrar
                la plantilla ${result.template}
                de ZapSign.
              </p>

            `
        }

      </div>

    </div>

  `;


  updateButtons();

}


/* =======================================================
   SIGUIENTE
======================================================= */

function next() {

  clearValidation();


  /* -------------------------------------------------------
     BIENVENIDA
  ------------------------------------------------------- */

if (
  flow === "welcome"
) {

  const emailInput =
  document.getElementById("participantEmail");

if (!emailInput) {
  return;
}

const email =
  emailInput.value.trim();

if (!email) {
  showValidation(
    "Ingresa tu correo electrónico para continuar."
  );
  return;
}

if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
) {
  showValidation(
    "Ingresa un correo electrónico válido."
  );
  return;
}

participantEmail = email;

  simulationStep = 0;

  logSandboxEvent(
    "bienvenida",
    "inició"
  );

  flow = "simulation";

  renderSimulation();

  return;
}


  /* -------------------------------------------------------
     SIMULACIÓN
  ------------------------------------------------------- */

  if (
    flow === "simulation"
  ) {

    if (
      !validateSimulationStep()
    ) {

      return;

    }


if (
  simulationStep < 4
) {

  logSandboxEvent(
    "simulación",
    "completó paso " +
      (simulationStep + 1)
  );

  simulationStep++;

  renderSimulation();

  return;
}


calculateSimulation();

logSandboxEvent(
  "simulación",
  "completó simulación"
);

renderSimulationResult();

return;

  }


  /* -------------------------------------------------------
     RESULTADO SIMULACIÓN
  ------------------------------------------------------- */

if (
  flow === "simulation-result"
) {

  logSandboxEvent(
    "resultado_simulación",
    "continuó a precalificación"
  );

  qualificationStep = 0;

  answers = {};

  renderQualification();

  return;
}


  /* -------------------------------------------------------
     PRECALIFICACIÓN
  ------------------------------------------------------- */

if (
  flow === "qualification"
) {

  if (
    !validateQualificationStep()
  ) {
    return;
  }

  const currentQuestion =
    QUESTIONS[qualificationStep];

  if (currentQuestion) {

    logSandboxEvent(
      "precalificación",
      "respondió: " +
        currentQuestion.id
    );

  }

  if (
    qualificationStep <
    QUESTIONS.length - 1
  ) {

    qualificationStep++;

    renderQualification();

    return;
  }

  finishQualification();

  return;
}


  /* -------------------------------------------------------
     RESULTADO FINAL
  ------------------------------------------------------- */

  if (
    flow === "final-result"
  ) {

    resetFlow();

  }

}


/* =======================================================
   VOLVER
======================================================= */

function back() {

  clearValidation();


  if (
    flow === "welcome"
  ) {

    return;

  }


  if (
    flow === "simulation"
  ) {

    if (
      simulationStep === 0
    ) {

      renderWelcome();

      return;

    }


    simulationStep--;

    renderSimulation();

    return;

  }


  if (
    flow === "simulation-result"
  ) {

    simulationStep = 4;

    renderSimulation();

    return;

  }


  if (
    flow === "qualification"
  ) {

    if (
      qualificationStep === 0
    ) {

      renderSimulationResult();

      return;

    }


    qualificationStep--;

    renderQualification();

    return;

  }


  if (
    flow === "final-result"
  ) {

    qualificationStep =
      QUESTIONS.length - 1;

    renderQualification();

    return;

  }

}


/* =======================================================
   REINICIAR
======================================================= */

function resetFlow() {

  flow =
    "welcome";

  simulationStep =
    0;

  qualificationStep =
    0;

  answers = {};

  qualificationResult =
    null;

    initializeSandboxSession();


  simulation = {

    vehicleType: "",

    vehicleCondition: "",

    vehicleValue: 0,

    downPayment: 0,

    term: 0,

    financedAmount: 0,

    monthlyPayment: 0

  };


  renderWelcome();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =======================================================
   EVENTOS
======================================================= */

nextBtn.addEventListener(
  "click",
  next
);


backBtn.addEventListener(
  "click",
  back
);

/* =======================================================
   MODAL - POLÍTICA DE PRIVACIDAD
======================================================= */

function openPrivacyPolicy() {
  const privacyModal =
    document.getElementById("privacyModal");

  if (!privacyModal) return;

  privacyModal.classList.add("is-open");
  privacyModal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.style.overflow = "hidden";
}


function closePrivacyPolicy() {
  const privacyModal =
    document.getElementById("privacyModal");

  if (!privacyModal) return;

  privacyModal.classList.remove("is-open");
  privacyModal.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.style.overflow = "";
}


/*
   Usamos delegación de eventos porque
   #openPrivacyModal se crea dinámicamente
   dentro de renderWelcome().
*/

document.addEventListener("click", (event) => {

  if (
    event.target.closest("#openPrivacyModal")
  ) {
    openPrivacyPolicy();
    return;
  }


  if (
    event.target.closest("#closePrivacyModal") ||
    event.target.closest("#closePrivacyModalButton") ||
    event.target.closest("#privacyModalOverlay")
  ) {
    closePrivacyPolicy();
  }

});


document.addEventListener("keydown", (event) => {

  if (event.key !== "Escape") {
    return;
  }

  const privacyModal =
    document.getElementById("privacyModal");

  if (
    privacyModal &&
    privacyModal.classList.contains("is-open")
  ) {
    closePrivacyPolicy();
  }

});

/* =======================================================
   INICIO
======================================================= */

renderWelcome();

});