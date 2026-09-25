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
     ESTADO PRINCIPAL
  ======================================================= */

  let flow = "welcome";

  let simulationStep = 0;

  let qualificationStep = 0;


  /* =======================================================
     SIMULACIÓN
  ======================================================= */

  let simulation = {
    vehicleType: "",
    vehicleCondition: "",
    vehicleYear: "",
    vehicleValue: 0,
    downPayment: 0,
    term: 0,
    financedAmount: 0,
    monthlyPayment: 0
  };


  /* =======================================================
     PRECALIFICACIÓN
  ======================================================= */

  let answers = {};

  let participantEmail = "";

  let qualificationResult = null;

  let privacyAccepted = false;
  let privacyAcceptedAt = "";
  const PRIVACY_POLICY_VERSION = "v1.0";


  /* =======================================================
     CODEUDOR
  ======================================================= */

  /*
    Este objeto mantiene temporalmente la información
    del codeudor mientras se completa el flujo.

    Posteriormente esta información será enviada
    a Supabase mediante una Edge Function.
  */

  let codeudor = {
    name: "",
    documentType: "",
    documentNumber: "",
    phone: "",
    email: "",
    employment: "",
    relationship: ""
  };


  /* =======================================================
     IDENTIFICACIÓN
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


  /* =======================================================
     COLA SANDBOX
  ======================================================= */

  let sandboxQueue = Promise.resolve();


  /* =======================================================
     SUPABASE
  ======================================================= */

  const SUPABASE_URL =
    "https://abvexwzywrjjywhtzzik.supabase.co";


  /*
    Conserva aquí tu clave PUBLISHABLE actual.

    NO utilizar aquí:
    - secret key
    - service_role key
  */

  const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_FuodtXSpDR8DnJyC-Hs2rA_6HlqTLNf";


  const supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );


  let supabaseQueue = Promise.resolve();


  /* =======================================================
     ENVÍO SANDBOX
  ======================================================= */

function sendSandboxData(data) {

  // El antiguo sandbox de Google Sheets
  // ya no se utiliza.
  return Promise.resolve();

}


  /* =======================================================
     ENVÍO SUPABASE
  ======================================================= */

  function sendSupabaseData(data) {

    supabaseQueue =
      supabaseQueue.then(async () => {

        let error = null;


        /* ---------------------------------------------------
           PARTICIPANTE
        --------------------------------------------------- */

        if (
          data.type === "participant"
        ) {

          const result =
            await supabaseClient
              .from("participantes")
              .insert([
                {

                  participant_id:
                    data.participant_id,

                  correo:
                    data.email,

                  fecha:
                    data.fecha,

                  vehiculo:
                    data.vehicle,

                  condicion:
                    data.condition,

anio_vehiculo:
      data.vehicleYear
        ? Number(data.vehicleYear)
        : null,

                  valor:
                    data.value,

                  cuota_inicial:
                    data.downPayment,

                  plazo:
                    data.term,

                  ingresos:
                    data.income,

                  historial:
                    data.history,

                  empleo:
                    data.empleo,

                  antiguedad_meses:
                    data.antiguedad_meses,

                  antiguedad_rango:
                    data.antiguedad_rango,

                  resultado:
                    data.result,

                  plantilla:
                    data.template,

                  zapsign_status:
                    "pendiente",

                    politica_privacidad_aceptada:
  data.politica_privacidad_aceptada,

politica_privacidad_fecha:
  data.politica_privacidad_fecha,

politica_privacidad_version:
  data.politica_privacidad_version

                }
              ]);


          error = result.error;

        }


        /* ---------------------------------------------------
           EVENTO
        --------------------------------------------------- */

        if (
          data.type === "event"
        ) {

          const result =
            await supabaseClient
              .from("eventos")
              .insert([
                {

                  participant_id:
                    data.participant_id,

                  session_id:
                    data.session_id,

                  fecha:
                    data.fecha,

                  etapa:
                    data.etapa,

                  accion:
                    data.accion

                }
              ]);


          error = result.error;

        }


        if (error) {
          throw error;
        }

      })
      .catch(error => {

        console.warn(
          "No fue posible enviar datos a Supabase:",
          error
        );
        throw error;
      });


    return supabaseQueue;

  }


  /* =======================================================
     REGISTRAR EVENTOS
  ======================================================= */

  function logSandboxEvent(
    etapa,
    accion
  ) {

    const fecha =
      new Date().toISOString();


    sendSandboxData(
      {
        type: "event",

        participant_id:
          participantId,

        session_id:
          sessionId,

        fecha,

        etapa,

        accion
      }
    );


    sendSupabaseData(
      {
        type: "event",

        participant_id:
          participantId,

        session_id:
          sessionId,

        fecha,

        etapa,

        accion
      }
    );

  }


  /* =======================================================
     CONSTRUIR DATOS DEL PARTICIPANTE
  ======================================================= */

  function buildParticipantData() {

    return {

      type: "participant",

      participant_id:
        participantId,

      email:
        participantEmail,

      fecha:
        new Date().toISOString(),

      vehicle:
        simulation.vehicleType,

      condition:
        simulation.vehicleCondition,

      vehicleYear:
        simulation.vehicleYear,

      value:
        simulation.vehicleValue,

      downPayment:
        simulation.downPayment,

      term:
        simulation.term,

      income:
        answers.monthly_income || 0,

      history:
        answers.credit_history || "",

      result:
        qualificationResult?.status || "",

      template:
        qualificationResult?.template || "",

      empleo:
        answers.employment || "",

      antiguedad_meses:
        answers.activity_months || 0,

      antiguedad_rango:
        answers.activity_months_range || "",

        politica_privacidad_aceptada:
  privacyAccepted,

politica_privacidad_fecha:
  privacyAcceptedAt,

politica_privacidad_version:
  PRIVACY_POLICY_VERSION

    };

  }


  /* =======================================================
     GUARDAR PARTICIPANTE
  ======================================================= */

  async function saveSandboxParticipant() {

    const data =
      buildParticipantData();


    sendSandboxData(data);


    /*
      IMPORTANTE:

      Esperamos la cola de Supabase.

      Esto evita que la Edge Function intente
      buscar el participante antes de que el INSERT
      haya terminado.
    */

    await sendSupabaseData(data);

  }


  /* =======================================================
     CONFIGURACIÓN
  ======================================================= */

  const MONTHLY_RATE_NMV =
    0.018;


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
     OPCIONES ANTIGÜEDAD
  ======================================================= */

  const ACTIVITY_OPTIONS = [

    {
      value: "under_1_year",
      label: "Menos de 1 año",
      months: 0
    },

    {
      value: "1_to_2_years",
      label: "Entre 1 y 2 años",
      months: 12
    },

    {
      value: "2_to_3_years",
      label: "Entre 2 y 3 años",
      months: 24
    },

    {
      value: "over_3_years",
      label: "Más de 3 años",
      months: 36
    }

  ];


  /* =======================================================
     REGLAS DE NEGOCIO
  ======================================================= */

  const BUSINESS_RULES = {

    simulation: {

      monthlyRate:
        MONTHLY_RATE_NMV,

      termOptions:
        TERM_OPTIONS,

      financing: {

        automobile: {

          new: {

            maxTermMonths:
              84,


          },

          used: {

            maxTermMonths:
              null,


          }

        },

        motorcycle: {

          new: {

            maxTermMonths:
              null,


          },

          used: {

            maxTermMonths:
              null,


          }

        }

      }

    },


    qualification: {

      red: {

        activeNegativeReport:
          true

      },


      yellow: {

        maxIncome:
          1500000,

        paidReport:
          true,

        minActivityMonths:
          6

      },


      templates: {

        green:
          "A",

        yellow:
          "B",

        red:
          null

      }

    }

  };

    /* =======================================================
     REGLAS DE SIMULACIÓN
  ======================================================= */

  function getAvailableTermOptions() {

    const vehicleType =
      simulation.vehicleType;

    const vehicleCondition =
      simulation.vehicleCondition;


    /*
      Si todavía no se ha seleccionado
      vehículo o condición, mostramos
      todos los plazos disponibles.
    */

    if (
      !vehicleType ||
      !vehicleCondition
    ) {

      return [
        ...TERM_OPTIONS
      ];

    }


    const financingRules =
      BUSINESS_RULES
        .simulation
        .financing;


    const vehicleRules =
      financingRules[
        vehicleType
      ];


    /*
      Si el tipo de vehículo todavía
      no tiene una regla específica,
      no bloqueamos el prototipo.
    */

    if (!vehicleRules) {

      return [
        ...TERM_OPTIONS
      ];

    }


    const conditionRules =
      vehicleRules[
        vehicleCondition
      ];


    if (!conditionRules) {

      return [
        ...TERM_OPTIONS
      ];

    }


    /*
      Si maxTermMonths es null,
      significa que todavía no tenemos
      una restricción definida para ese
      vehículo/condición.
    */

    if (
      conditionRules.maxTermMonths === null
    ) {

      return [
        ...TERM_OPTIONS
      ];

    }


    return TERM_OPTIONS.filter(
      term =>
        term <=
        conditionRules.maxTermMonths
    );

  }


  function getMinimumDownPaymentPercent() {

    if (
      simulation.vehicleCondition !== "used"
    ) {

      return 0;

    }

    const year =
      Number(simulation.vehicleYear);

    if (!Number.isInteger(year)) {
      return 0;
    }

    if (year >= 2021) {
      return 0;
    }

    if (year >= 2019) {
      return 10;
    }

    if (year >= 2017) {
      return 20;
    }

    if (year === 2016) {
      return 30;
    }

    // Para 2015 o anteriores no se ha definido
    // una regla de cuota inicial. No inventamos
    // porcentaje ni rechazo.
    return 0;

  }


  function getMinimumDownPayment() {

    const percentage =
      getMinimumDownPaymentPercent();

    return Math.ceil(
      simulation.vehicleValue *
      (percentage / 100)
    );

  }


  /* =======================================================
     UTILIDADES
  ======================================================= */

  function formatCOP(value) {

    const number =
      Number(value) || 0;


    return new Intl.NumberFormat(
      "es-CO",
      {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
      }
    ).format(number);

  }


  function parseCOP(value) {

    if (
      typeof value === "number"
    ) {

      return value;

    }


    return Number(
      String(value)
        .replace(/\D/g, "")
    ) || 0;

  }


  function formatInputCurrency(
    input
  ) {

    const value =
      parseCOP(input.value);


    if (!value) {

      input.value = "";

      return;

    }


    input.value =
      new Intl.NumberFormat(
        "es-CO",
        {
          maximumFractionDigits: 0
        }
      ).format(value);

  }


  function getInputValue(id) {

    const input =
      document.getElementById(id);


    if (!input) {
      return "";
    }


    return input.value;

  }


  function setInfoVisibility(
    show
  ) {

    const infoSection =
      document.querySelector(
        ".info-section"
      );


    if (!infoSection) {
      return;
    }


    infoSection.hidden =
      !show;

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


        if (
          index < stage
        ) {

          step.classList.add(
            "completed"
          );

        }


        if (
          index === stage
        ) {

          step.classList.add(
            "active"
          );

        }


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


    let percentage =
      (stage / 5) * 100;


    if (
      stage === 5
    ) {

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
      labels[stage] ||
      "Inicio";

  }

  const SUPABASE_FUNCTION_URL = "https://abvexwzywrjjywhtzzik.functions.supabase.co/procesar-solicitud";
  async function createZapSignDocument() {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json",  "apikey": SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({
        participant_id: participantId
      })
    });

    const result = await response.json();
    console.log("Resultado ZapSign:", result);

    if (result.zapsign_sign_url) {
      // Redirige al usuario al link de firma
      window.location.href = result.zapsign_sign_url;
    } else {
      alert("No se pudo generar el documento de firma. Estado: " + result.zapsign_status);
    }
  } catch (error) {
    console.error("Error creando documento ZapSign:", error);
    alert("Ocurrió un error al generar el documento de firma.");
  }
}



  /* =======================================================
     COMPARTIR FORMULARIO
  ======================================================= */

  async function shareApplicationForm() {

    const shareUrl =
      window.location.href;

    const shareTitle =
      "Solicitud de crédito | Arrankar";

    const shareText =
      "Te comparto el formulario de solicitud de crédito de Arrankar.";

    /*
      En celular, los navegadores compatibles muestran
      el menú nativo de compartir mediante Web Share API.

      En PC, o cuando Web Share API no está disponible,
      copiamos el enlace del formulario al portapapeles.
    */

    try {

      if (
        navigator.share
      ) {

        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });

        return;

      }

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {
        return;
      }

    }

    try {

      await navigator.clipboard.writeText(
        shareUrl
      );

      alert(
        "El enlace del formulario se copió al portapapeles."
      );

    } catch (error) {

      console.error(
        "No fue posible compartir o copiar el formulario:",
        error
      );

      alert(
        "No fue posible compartir el formulario. Copia el enlace de esta página y compártelo."
      );

    }

  }


  /* =======================================================
     BOTONES
  ======================================================= */

function updateButtons() {

  /*
    Por defecto:
    - volver visible excepto bienvenida
    - botón principal visible
  */

  backBtn.hidden =
    flow === "welcome" ||
    flow === "final-result";

  nextBtn.hidden =
    false;


    /* ---------------------------------------------------
       BIENVENIDA
    --------------------------------------------------- */

    if (
      flow === "welcome"
    ) {

      nextBtn.textContent =
        "Comenzar →";

      return;

    }


    /* ---------------------------------------------------
       SIMULACIÓN
    --------------------------------------------------- */

    if (
      flow === "simulation"
    ) {

      nextBtn.textContent =
        simulationStep === getLastSimulationStep()
          ? "Calcular →"
          : "Continuar →";

      return;

    }


    /* ---------------------------------------------------
       RESULTADO SIMULACIÓN
    --------------------------------------------------- */

    if (
      flow === "simulation-result"
    ) {

      nextBtn.textContent =
        "Continuar con mi solicitud →";

      return;

    }


    /* ---------------------------------------------------
       PRECALIFICACIÓN
    --------------------------------------------------- */

    if (
      flow === "qualification"
    ) {

      nextBtn.textContent =
        qualificationStep ===
        QUESTIONS.length - 1
          ? "Ver resultado →"
          : "Continuar →";

      return;

    }


    /* ---------------------------------------------------
       RESULTADO FINAL
    --------------------------------------------------- */

    if (
      flow === "final-result"
    ) {

      if (
        qualificationResult?.status ===
        "yellow"
      ) {

        nextBtn.textContent =
          "Completar información del codeudor →";

        return;

      }


if (
  qualificationResult?.status === "green"
) {
  nextBtn.textContent = "Continuar con la firma →";
  return;
}


      if (
        qualificationResult?.status ===
        "red"
      ) {

        nextBtn.textContent =
          "Compartir formulario";

        return;

      }

    }


    /* ---------------------------------------------------
       CODEUDOR
    --------------------------------------------------- */

    if (
      flow === "codeudor"
    ) {

      nextBtn.textContent =
        "Continuar con la firma →";

      return;

    }


    /* ---------------------------------------------------
       FIRMA
    --------------------------------------------------- */

    if (
      flow === "signature"
    ) {

      nextBtn.textContent =
        "Nueva solicitud";

      return;

    }

  }


  /* =======================================================
     BIENVENIDA
  ======================================================= */

  function renderWelcome() {

    flow =
      "welcome";


    updateProgress(
      0,
      -1
    );


    setInfoVisibility(
      true
    );


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


<div class="privacy-consent">

  <label class="privacy-checkbox">

    <input
      type="checkbox"
      id="privacyConsent"
    >

    <span class="privacy-checkmark"></span>

    <span class="privacy-text">

      Acepto la
      <button
        type="button"
        class="privacy-link-button"
        id="openPrivacyModal"
      >
        Política de Tratamiento de Datos Personales y Privacidad
      </button>

      y autorizo el tratamiento de mis datos.

    </span>

  </label>

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
     RESUMEN DE PASOS COMPLETADOS
  ======================================================= */

  function escapeSummaryText(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getSummaryItems() {
    const items = [];

    if (participantEmail) {
      items.push({
        label: "Correo electrónico",
        value: participantEmail
      });
    }

    if (simulation.vehicleType) {
      items.push({
        label: "Vehículo",
        value: simulation.vehicleType === "car" ? "Automóvil" : "Moto"
      });
    }

    if (simulation.vehicleCondition) {
      items.push({
        label: "Condición",
        value: simulation.vehicleCondition === "new" ? "Nuevo" : "Usado"
      });
    }

    if (
      simulation.vehicleCondition === "used" &&
      simulation.vehicleYear
    ) {
      items.push({
        label: "Año del vehículo",
        value: simulation.vehicleYear
      });
    }

    if (simulation.vehicleValue > 0) {
      items.push({
        label: "Valor del vehículo",
        value: formatCOP(simulation.vehicleValue)
      });
    }

    const downPaymentStep =
      simulation.vehicleCondition === "used"
        ? 4
        : 3;

    if (simulation.downPayment > 0 || simulationStep >= downPaymentStep || flow !== "simulation") {
      if (simulation.downPayment >= 0 && (simulation.downPayment > 0 || simulationStep >= downPaymentStep || flow !== "simulation")) {
        items.push({
          label: "Cuota inicial",
          value: formatCOP(simulation.downPayment)
        });
      }
    }

    if (simulation.term) {
      items.push({
        label: "Plazo",
        value: `${simulation.term} meses`
      });
    }

    if (answers.credit_history) {
      const historyLabels = {
        current_arrears: "Reporte negativo activo",
        paid_report: "Reporte pagado / paz y salvo",
        none: "Sin reportes / primer crédito"
      };

      items.push({
        label: "Historial crediticio",
        value: historyLabels[answers.credit_history] || answers.credit_history
      });
    }

    if (answers.employment) {
      const employmentLabels = {
        employee: "Empleado",
        independent: "Independiente",
        pensioner: "Pensionado",
        rentier: "Rentista",
        farmer: "Agricultor",
        transporter: "Transportador",
        partner: "Socio"
      };

      items.push({
        label: "Actividad u ocupación",
        value: employmentLabels[answers.employment] || answers.employment
      });
    }

    if (answers.activity_months_range) {
      items.push({
        label: "Antigüedad",
        value: answers.activity_months_label || answers.activity_months_range
      });
    }

    if (answers.monthly_income) {
      items.push({
        label: "Ingresos mensuales",
        value: formatCOP(answers.monthly_income)
      });
    }

    return items;
  }

  function getVisibleSummaryItems() {
    const items = getSummaryItems();

    if (flow === "simulation") {
      // Durante la simulación solo mostramos lo que ya se confirmó.
      const maxItems = Math.min(simulationStep + 1, getLastSimulationStep() + 1);
      return items.slice(0, maxItems);
    }

    // En precalificación, resultado y codeudor mostramos toda la información
    // anterior para que el usuario conserve el contexto del proceso.
    return items;
  }

  function renderFlowSummary() {
    const items = getVisibleSummaryItems();

    if (!items.length) {
      return "";
    }

    return `
      <div class="flow-summary" aria-label="Resumen de información completada">
        <div class="flow-summary-title">Lo que ya has completado</div>
        <div class="flow-summary-list">
          ${items.map(item => `
            <div class="flow-summary-item">
              <span class="flow-summary-check" aria-hidden="true">✓</span>
              <div class="flow-summary-content">
                <span class="flow-summary-label">${escapeSummaryText(item.label)}</span>
                <strong>${escapeSummaryText(item.value)}</strong>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  /* =======================================================
     SIMULACIÓN
  =======================================================
  */

  // El flujo de usados tiene un paso adicional (año).
  // Nuevos: tipo -> condición -> valor -> cuota inicial -> plazo.
  // Usados: tipo -> condición -> año -> valor -> cuota inicial -> plazo.
  function getLastSimulationStep() {
    return simulation.vehicleCondition === "used" ? 5 : 4;
  }

  function renderSimulation() {

    flow =
      "simulation";


    setInfoVisibility(
      false
    );


    let stage = 0;


    if (
      simulationStep === 0
    ) {

      stage = 0;

    }

    else if (
      simulationStep === 1
    ) {

      stage = 1;

    }

    else {

      stage = 2;

    }


    updateProgress(stage);

    updateButtons();


    if (
      simulationStep === 0
    ) {

      renderVehicleType();

      return;

    }


    if (
      simulationStep === 1
    ) {

      renderVehicleCondition();

      return;

    }


    if (simulation.vehicleCondition === "used") {

      if (simulationStep === 2) {
        renderVehicleYear();
        return;
      }

      if (simulationStep === 3) {
        renderVehicleValue();
        return;
      }

      if (simulationStep === 4) {
        renderDownPayment();
        return;
      }

      if (simulationStep === 5) {
        renderTerm();
        return;
      }

    } else {

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

  }


  /* =======================================================
     TIPO VEHÍCULO
  ======================================================= */

  function renderVehicleType() {

    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

        <span class="eyebrow">
          INICIO
        </span>

        <h2>
          ¿Qué vehículo quieres financiar?
        </h2>

        <p>
          Selecciona el tipo de vehículo que deseas adquirir.
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
     NUEVO / USADO
  ======================================================= */

  function renderVehicleCondition() {

    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

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

        if (value === "new") {
          simulation.vehicleYear = "";
        }


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
     AÑO VEHÍCULO USADO
  ======================================================= */

  function getVehicleYearOptions() {

    /*
      Rango dinámico:
      diez años hacia atrás hasta un año adelante.

      En 2026:
      2016 a 2027.

      El rango se actualiza automáticamente
      cuando cambia el año calendario.
    */

    const currentYear =
      new Date().getFullYear();

    const minimumYear =
      currentYear - 10;

    const maximumYear =
      currentYear + 1;

    const years = [];

    for (
      let year = maximumYear;
      year >= minimumYear;
      year--
    ) {
      years.push(year);
    }

    return years;

  }


  function renderVehicleYear() {

    const availableYears =
      getVehicleYearOptions();

    if (
      simulation.vehicleYear &&
      !availableYears.includes(
        Number(simulation.vehicleYear)
      )
    ) {
      simulation.vehicleYear = "";
    }

    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

        <span class="eyebrow">
          VEHÍCULO
        </span>

        <h2>
          ¿De qué año es el vehículo?
        </h2>

        <p>
          Selecciona el año del vehículo que quieres financiar.
        </p>

        <div class="field">

          <label for="vehicleYear">
            Año del vehículo
          </label>

          <select
            id="vehicleYear"
          >

            <option value="">
              Selecciona una opción
            </option>

            ${availableYears.map(year => `
              <option
                value="${year}"
                ${
                  Number(simulation.vehicleYear) === year
                    ? "selected"
                    : ""
                }
              >
                ${year}
              </option>
            `).join("")}

          </select>

        </div>

      </div>

    `;

    const input =
      document.getElementById("vehicleYear");

    if (!input) {
      return;
    }

    input.addEventListener(
      "change",
      function () {

        simulation.vehicleYear =
          this.value;

      }
    );

  }


  /* =======================================================
     VALOR VEHÍCULO
  ======================================================= */

  function renderVehicleValue() {

    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

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

<div class="currency-input">

  <span class="currency-symbol">$</span>

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

      </div>

    `;


    bindCurrencyInput(
      "vehicleValue"
    );

  }


  /* =======================================================
     CUOTA INICIAL
  ======================================================= */

  function renderDownPayment() {

    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

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

<div class="currency-input">

  <span class="currency-symbol">$</span>

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

      </div>

    `;


    bindCurrencyInput(
      "downPayment"
    );

  }


  /* =======================================================
     PLAZO
  ======================================================= */

  function renderTerm() {

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


    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

        <span class="eyebrow">
          FINANCIACIÓN
        </span>

        <h2>
          ¿En cuánto tiempo quieres financiarlo?
        </h2>

        <p>
          Selecciona el plazo.
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
     INPUT MONEDA
  ======================================================= */

function bindCurrencyInput(inputId) {

  const input = document.getElementById(inputId);

  if (!input) return;


  input.addEventListener("input", function () {

    // Dejar únicamente números
    const digits = this.value.replace(/\D/g, "");

    // Si está vacío
    if (!digits) {

      this.value = "";

      if (inputId === "vehicleValue") {
        simulation.vehicleValue = 0;
      }

      if (inputId === "downPayment") {
        simulation.downPayment = 0;
      }

      return;
    }


    // Convertir a número
    const numericValue = Number(digits);


    // Formato colombiano
    this.value =
      new Intl.NumberFormat("es-CO").format(
        numericValue
      );


    // Guardar como número limpio
    if (inputId === "vehicleValue") {

      simulation.vehicleValue =
        numericValue;

    }


    if (inputId === "downPayment") {

      simulation.downPayment =
        numericValue;

    }

  });


  // Evitar pegar caracteres no numéricos
  input.addEventListener("paste", function (event) {

    event.preventDefault();

    const pastedText =
      event.clipboardData
        .getData("text")
        .replace(/\D/g, "");

    if (!pastedText) return;


    const numericValue =
      Number(pastedText);


    this.value =
      new Intl.NumberFormat("es-CO").format(
        numericValue
      );


    if (inputId === "vehicleValue") {

      simulation.vehicleValue =
        numericValue;

    }


    if (inputId === "downPayment") {

      simulation.downPayment =
        numericValue;

    }

  });

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

    if (
      simulationStep === 0
    ) {

      if (
        !simulation.vehicleType
      ) {

        showValidation(
          "Selecciona si quieres financiar un automóvil o una moto."
        );

        return false;

      }

    }


    if (
      simulationStep === 1
    ) {

      if (
        !simulation.vehicleCondition
      ) {

        showValidation(
          "Selecciona si el vehículo es nuevo o usado."
        );

        return false;

      }

    }


    // USADO: paso 2 = año
    if (
      simulation.vehicleCondition === "used" &&
      simulationStep === 2
    ) {

      const input =
        document.getElementById("vehicleYear");

      const year =
        input?.value.trim() || "";

      if (!/^\d{4}$/.test(year)) {

        showValidation(
          "Ingresa el año del vehículo en formato de cuatro dígitos."
        );

        return false;

      }

      simulation.vehicleYear =
        year;

      return true;

    }


    // NUEVO: paso 2 = valor del vehículo.
    // USADO: paso 3 = valor del vehículo.
    const vehicleValueStep =
      simulation.vehicleCondition === "used"
        ? 3
        : 2;

    if (
      simulationStep === vehicleValueStep
    ) {

      const value =
        parseCOP(
          getInputValue("vehicleValue")
        );

      if (
        value <= 0
      ) {

        showValidation(
          "Ingresa el valor del vehículo."
        );

        return false;

      }

      simulation.vehicleValue =
        value;

      return true;

    }


    // NUEVO: paso 3 = cuota inicial.
    // USADO: paso 4 = cuota inicial.
    const downPaymentStep =
      simulation.vehicleCondition === "used"
        ? 4
        : 3;

    if (
      simulationStep === downPaymentStep
    ) {

      const downPayment =
        parseCOP(
          getInputValue("downPayment")
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

      const minimumDownPaymentPercent =
        getMinimumDownPaymentPercent();

      const minimumDownPayment =
        getMinimumDownPayment();

      if (
        minimumDownPaymentPercent > 0 &&
        downPayment < minimumDownPayment
      ) {

        showValidation(
          `Para un vehículo usado modelo ${simulation.vehicleYear}, la cuota inicial mínima es del ${minimumDownPaymentPercent}% (${formatCOP(
            minimumDownPayment
          )}).`
        );

        return false;

      }

      simulation.downPayment =
        downPayment;

      return true;

    }


    // NUEVO: paso 4 = plazo.
    // USADO: paso 5 = plazo.
    const termStep =
      getLastSimulationStep();

    if (
      simulationStep === termStep
    ) {

      if (
        !simulation.term
      ) {

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

      return true;

    }


    return true;

  }

  /* =======================================================
     VALIDACIÓN VISUAL
  ======================================================= */

  function showValidation(
    message
  ) {

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
     CÁLCULO SIMULACIÓN
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

      if (
        monthlyRate === 0
      ) {

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
     RESULTADO SIMULACIÓN
  ======================================================= */

  function renderSimulationResult() {

    flow =
      "simulation-result";


    setInfoVisibility(
      false
    );


    updateProgress(
      2
    );


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


          ${
            simulation.vehicleCondition === "used"
              ? `
                <div class="summary-item">

                  <span class="summary-label">
                    Año vehículo
                  </span>

                  <strong>
                    ${simulation.vehicleYear}
                  </strong>

                </div>
              `
              : ""
          }


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
Información importante
</strong>
 
<p>
El monto aprobado y la tasa dependerán de tu información financiera y nuestro análisis crediticio.
</p>
 
<p>
El valor indicado no incluye seguros.
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
     PRECALIFICACIÓN
  ======================================================= */

  function renderQualification() {

    flow =
      "qualification";


    setInfoVisibility(
      false
    );


    const question =
      QUESTIONS[
        qualificationStep
      ];


    let stage = 3;


    if (
      qualificationStep ===
      QUESTIONS.length - 1
    ) {

      stage = 4;

    }


    updateProgress(
      stage
    );


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
     PREGUNTA OPCIONES
  ======================================================= */

  function renderChoiceQuestion(
    question
  ) {

    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

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
     PREGUNTA INPUT
  ======================================================= */

  function renderInputQuestion(
    question
  ) {

    const existingValue =
      answers[
        question.id
      ] ?? "";


    /* ---------------------------------------------------
       ANTIGÜEDAD
    --------------------------------------------------- */

    if (
      question.id ===
      "activity_months"
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


              ${ACTIVITY_OPTIONS.map(
                option => `

                  <option
                    value="${option.value}"
                    ${
                      answers.activity_months_range ===
                      option.value
                        ? "selected"
                        : ""
                    }
                  >
                    ${option.label}
                  </option>

                `
              ).join("")}

            </select>

          </div>

        </div>

      `;


      return;

    }


    const isCurrency =
      question.type ===
      "currency";


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
        ${renderFlowSummary()}

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


${
  question.type === "currency"
    ? `
      <div class="currency-input">

        <span class="currency-symbol">$</span>

        <input
          id="qualificationInput"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="${question.placeholder || ""}"
          value="${value}"
        >

      </div>
    `
    : `
      <input
        id="qualificationInput"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        placeholder="${question.placeholder || ""}"
        value="${value}"
      >
    `
}

        </div>

      </div>

    `;


const input =
  document.getElementById(
    "qualificationInput"
  );


if (
  question.type === "currency"
) {

  input.addEventListener(
    "input",
    function () {

      const digits =
        this.value.replace(/\D/g, "");


      if (!digits) {

        this.value = "";

        return;

      }


      const numericValue =
        Number(digits);


      this.value =
        new Intl.NumberFormat(
          "es-CO"
        ).format(
          numericValue
        );

    }
  );

}
else if (
  question.type === "number"
) {

  input.addEventListener(
    "input",
    function () {

      this.value =
        this.value.replace(
          /\D/g,
          ""
        );

    }
  );

}

  }


  /* =======================================================
     VALIDACIÓN PRECALIFICACIÓN
  ======================================================= */

  function validateQualificationStep() {

    const question =
      QUESTIONS[
        qualificationStep
      ];


    if (!question) {
      return true;
    }


    /* ---------------------------------------------------
       ANTIGÜEDAD
    --------------------------------------------------- */

    if (
      question.id ===
      "activity_months"
    ) {

      const select =
        document.getElementById(
          "qualificationInput"
        );


      const selectedValue =
        select?.value || "";


      const selectedOption =
        ACTIVITY_OPTIONS.find(
          option =>
            option.value ===
            selectedValue
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


    /* ---------------------------------------------------
       OPCIONES
    --------------------------------------------------- */

    if (
      question.type ===
      "choice"
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


    /* ---------------------------------------------------
       INPUT
    --------------------------------------------------- */

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
      question.type ===
      "number"
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
      question.type ===
      "currency"
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
     REGLAS FRONTEND - REFERENCIA
  ======================================================= */

  /*
    IMPORTANTE:

    Esta función queda únicamente como referencia local.

    La decisión oficial continúa viniendo de:
    procesar-solicitud

    No se utiliza para autorizar la solicitud.
  */

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


    if (
      rules.red.activeNegativeReport &&
      history ===
      "current_arrears"
    ) {

      return {

        status:
          "red",

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


    const hasPaidReport =
      rules.yellow.paidReport &&
      history ===
      "paid_report";


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

        status:
          "yellow",

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


    return {

      status:
        "green",

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
     SANDBOX RESULTADO
  ======================================================= */

  function saveSandboxResult() {

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


    sendSandboxData(
      data
    ).catch(error => {

      console.error(
        "Error guardando resultado sandbox:",
        error
      );

    });

  }


  /* =======================================================
     FINALIZAR PRECALIFICACIÓN
  ======================================================= */

  async function finishQualification() {

    /*
      Primero guardamos el participante
      y esperamos el INSERT de Supabase.
    */

    try {

      await saveSandboxParticipant();

    }

    catch (error) {

      console.error(
        "Error guardando participante:",
        error
      );
        alert(
    "No fue posible guardar tu solicitud. Intenta nuevamente."
  );

  return;

    }


    try {

      const response =
        await fetch(
          `${SUPABASE_URL}/functions/v1/procesar-solicitud`,
          {
            method: "POST",

            headers: {

              "Content-Type":
                "application/json",

              apikey:
                SUPABASE_PUBLISHABLE_KEY,

              Authorization:
                `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

            },

            body:
              JSON.stringify(
                {
                  participant_id:
                    participantId
                }
              )

          }
        );


      const result =
        await response.json();


      if (
        !response.ok
      ) {

        console.error(
          "Error procesando solicitud:",
          result
        );


        alert(
          "No fue posible procesar la solicitud."
        );


        return;

      }


      /*
        La decisión oficial viene
        de la Edge Function.
      */

      qualificationResult =
        result;


      logSandboxEvent(
        "resultado",
        "completó - " +
          qualificationResult.status
      );


      saveSandboxResult();


      /*
        SIEMPRE mostramos primero
        la pantalla de resultado.

        El codeudor ya NO se abre
        automáticamente.
      */

      renderFinalResult();

    }


    catch (error) {

      console.error(
        "Error conectando con procesar-solicitud:",
        error
      );


      alert(
        "No fue posible conectar con el servidor."
      );

    }

  }


  /* =======================================================
     RESULTADO FINAL
  ======================================================= */

  function renderFinalResult() {

    flow =
      "final-result";


    setInfoVisibility(
      false
    );


    updateProgress(
      5,
      5
    );


    const result =
      qualificationResult;


    if (!result) {

      resetFlow();

      return;

    }


    let extraContent = "";


    /* ---------------------------------------------------
       ROJO
    --------------------------------------------------- */

    if (
      result.status ===
      "red"
    ) {

      extraContent = `

        <ul>

          <li>
            En este momento no podemos continuar con tu solicitud.
          </li>

          <li>
            Si lo deseas, puedes considerar realizar la solicitud
            con un familiar que cumpla con las condiciones requeridas.
          </li>

        </ul>

      `;

    }


    /* ---------------------------------------------------
       AMARILLO
    --------------------------------------------------- */

    if (
      result.status ===
      "yellow"
    ) {

      extraContent = `

        <ul>

          <li>
            Para continuar con tu solicitud, necesitas contar
            con un codeudor.
          </li>

          <li>
            El codeudor deberá cumplir con las condiciones
            requeridas para la solicitud.
          </li>

        </ul>

      `;

    }


    /* ---------------------------------------------------
       VERDE
    --------------------------------------------------- */

    if (
      result.status ===
      "green"
    ) {

      extraContent = `

        <ul>

          <li>
            Tu perfil cumple con las condiciones iniciales
            para continuar con la solicitud.
          </li>

          <li>
            Hemos recibido correctamente la información
            proporcionada.
          </li>

        </ul>

      `;

    }


    let followup = "";


    if (
      result.status ===
      "red"
    ) {

      followup = `

        <p>

          Si tienes alguna inquietud, puedes comunicarte
          con nuestro equipo para conocer otras alternativas.

        </p>

      `;

    }


    if (
      result.status ===
      "yellow"
    ) {

      followup = `

        <p>

          El siguiente paso será completar la información
          correspondiente al codeudor para continuar con
          tu solicitud.

        </p>

      `;

    }


    if (
      result.status ===
      "green"
    ) {

      followup = `

        <p>

          Tu solicitud puede continuar al siguiente paso.
          Nuestro equipo se encargará de acompañarte
          durante el proceso.

        </p>

      `;

    }


    screen.innerHTML = `

      <div class="final-result">

        <div class="final-thanks">

          <h2>
            Gracias por participar
          </h2>

          <p>
            Hemos recibido correctamente tu información.
          </p>

        </div>


        <span class="eyebrow">
          RESULTADO
        </span>


        <h2>
          ${result.title}
        </h2>


        <div class="result ${result.status}">

          <p>
            ${result.reason}
          </p>

          ${extraContent}

        </div>


        <div class="result-followup">

          ${followup}

        </div>

      </div>

    `;


    updateButtons();

  }


  /* =======================================================
     CODEUDOR
  ======================================================= */

  function renderCodeudor() {

    flow =
      "codeudor";


    setInfoVisibility(
      false
    );


    /*
      Mantenemos la etapa Resultado
      visualmente porque el codeudor
      pertenece a la continuación
      del resultado amarillo.
    */

    updateProgress(
      5,
      4
    );


    screen.innerHTML = `

      <div class="question">
        ${renderFlowSummary()}

        <span class="eyebrow">
          INFORMACIÓN DEL CODEUDOR
        </span>


        <h2>
          Datos del codeudor
        </h2>


        <p>

          Para continuar con tu solicitud,
          necesitamos la información de la persona
          que te acompañará como codeudor.

        </p>


        <div class="field">

          <label for="codeudorName">
            Nombres y apellidos
          </label>


          <input
            id="codeudorName"
            type="text"
            autocomplete="name"
            placeholder="Nombres y apellidos"
            value="${codeudor.name}"
          >

        </div>


        <div class="field">

          <label for="codeudorRelationship">
            Parentesco con el solicitante
          </label>

          <select
            id="codeudorRelationship"
          >

            <option value="">
              Selecciona una opción
            </option>

            <option value="padre" ${
              codeudor.relationship === "padre"
                ? "selected"
                : ""
            }>
              Padre
            </option>

            <option value="madre" ${
              codeudor.relationship === "madre"
                ? "selected"
                : ""
            }>
              Madre
            </option>

            <option value="hermano" ${
              codeudor.relationship === "hermano"
                ? "selected"
                : ""
            }>
              Hermano(a)
            </option>

            <option value="hijo" ${
              codeudor.relationship === "hijo"
                ? "selected"
                : ""
            }>
              Hijo(a)
            </option>

            <option value="abuelo" ${
              codeudor.relationship === "abuelo"
                ? "selected"
                : ""
            }>
              Abuelo(a)
            </option>

            <option value="tio" ${
              codeudor.relationship === "tio"
                ? "selected"
                : ""
            }>
              Tío(a)
            </option>

            <option value="sobrino" ${
              codeudor.relationship === "sobrino"
                ? "selected"
                : ""
            }>
              Sobrino(a)
            </option>

            <option value="nieto" ${
              codeudor.relationship === "nieto"
                ? "selected"
                : ""
            }>
              Nieto(a)
            </option>

          </select>

        </div>


        <div class="field">

          <label for="codeudorDocumentType">
            Tipo de documento
          </label>


          <select
            id="codeudorDocumentType"
          >

            <option value="">
              Selecciona una opción
            </option>

            <option
              value="CC"
              ${
                codeudor.documentType ===
                "CC"
                  ? "selected"
                  : ""
              }
            >
              Cédula de ciudadanía
            </option>

            <option
              value="CE"
              ${
                codeudor.documentType ===
                "CE"
                  ? "selected"
                  : ""
              }
            >
              Cédula de extranjería
            </option>

            <option
              value="PPT"
              ${
                codeudor.documentType ===
                "PPT"
                  ? "selected"
                  : ""
              }
            >
              Permiso por Protección Temporal
            </option>

            <option
              value="passport"
              ${
                codeudor.documentType ===
                "passport"
                  ? "selected"
                  : ""
              }
            >
              Pasaporte
            </option>

          </select>

        </div>


        <div class="field">

          <label for="codeudorDocumentNumber">
            Número de documento
          </label>


          <input
            id="codeudorDocumentNumber"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Número de documento"
            value="${codeudor.documentNumber}"
          >

        </div>


        <div class="field">

          <label for="codeudorPhone">
            Celular
          </label>


          <input
            id="codeudorPhone"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            placeholder="Número de celular"
            value="${codeudor.phone}"
          >

        </div>


        <div class="field">

          <label for="codeudorEmail">
            Correo electrónico
          </label>


          <input
            id="codeudorEmail"
            type="email"
            autocomplete="email"
            placeholder="Correo electrónico"
            value="${codeudor.email}"
          >

        </div>


        <div class="field">

          <label for="codeudorEmployment">
            Actividad u ocupación
          </label>


          <select
            id="codeudorEmployment"
          >

            <option value="">
              Selecciona una opción
            </option>


            <option
              value="employee"
              ${
                codeudor.employment ===
                "employee"
                  ? "selected"
                  : ""
              }
            >
              Empleado
            </option>


            <option
              value="pensioner"
              ${
                codeudor.employment ===
                "pensioner"
                  ? "selected"
                  : ""
              }
            >
              Pensionado
            </option>


            <option
              value="independent"
              ${
                codeudor.employment ===
                "independent"
                  ? "selected"
                  : ""
              }
            >
              Independiente
            </option>


            <option
              value="rentier"
              ${
                codeudor.employment ===
                "rentier"
                  ? "selected"
                  : ""
              }
            >
              Rentista
            </option>


            <option
              value="farmer"
              ${
                codeudor.employment ===
                "farmer"
                  ? "selected"
                  : ""
              }
            >
              Agricultor
            </option>


            <option
              value="transporter"
              ${
                codeudor.employment ===
                "transporter"
                  ? "selected"
                  : ""
              }
            >
              Transportador
            </option>


            <option
              value="partner"
              ${
                codeudor.employment ===
                "partner"
                  ? "selected"
                  : ""
              }
            >
              Socio
            </option>

          </select>

        </div>

      </div>

    `;


    updateButtons();

  }


  /* =======================================================
     VALIDAR CODEUDOR
  ======================================================= */

  function validateCodeudor() {

    const name =
      document.getElementById(
        "codeudorName"
      )?.value.trim() || "";


    const relationship =
      document.getElementById(
        "codeudorRelationship"
      )?.value || "";


    const documentType =
      document.getElementById(
        "codeudorDocumentType"
      )?.value || "";


    const documentNumber =
      document.getElementById(
        "codeudorDocumentNumber"
      )?.value.trim() || "";


    const phone =
      document.getElementById(
        "codeudorPhone"
      )?.value.trim() || "";


    const email =
      document.getElementById(
        "codeudorEmail"
      )?.value.trim() || "";


    const employment =
      document.getElementById(
        "codeudorEmployment"
      )?.value || "";


    if (!name) {

      showValidation(
        "Ingresa los nombres y apellidos del codeudor."
      );

      return false;

    }


    if (!relationship) {

      showValidation(
        "Selecciona el parentesco del codeudor con el solicitante."
      );

      return false;

    }


    if (!documentType) {

      showValidation(
        "Selecciona el tipo de documento del codeudor."
      );

      return false;

    }


    if (!documentNumber) {

      showValidation(
        "Ingresa el número de documento del codeudor."
      );

      return false;

    }


    if (!phone) {

      showValidation(
        "Ingresa el celular del codeudor."
      );

      return false;

    }


    if (!email) {

      showValidation(
        "Ingresa el correo electrónico del codeudor."
      );

      return false;

    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {

      showValidation(
        "Ingresa un correo electrónico válido para el codeudor."
      );

      return false;

    }


    if (!employment) {

      showValidation(
        "Selecciona la actividad u ocupación del codeudor."
      );

      return false;

    }


    codeudor = {

      name,

      documentType,

      documentNumber,

      phone,

      email,

      employment,

      relationship

    };


    return true;

  }

  async function saveCodeudorData() {
  const codeudorData = {
    participant_id: participantId,
    nombres_apellidos: document.getElementById("codeudorName").value,
    correo: document.getElementById("codeudorEmail").value,
    celular: document.getElementById("codeudorPhone").value,
    empleo: document.getElementById("codeudorEmployment").value
  };

  const { error } = await supabaseClient
    .from("codeudores")
    .insert([codeudorData]);

  if (error) {
    console.error("Error guardando codeudor:", error);
    alert("No fue posible guardar el codeudor.");
    return;
  }

  // Una vez guardado, ahora sí llamamos a la Edge Function
  await createZapSignDocument();
}


function renderCodeudorForm() {
  flow = "codeudor";
  screen.innerHTML = `
    <h2>Información del Codeudor</h2>
    <input id="codeudorName" placeholder="Nombre completo" />
    <input id="codeudorEmail" type="email" placeholder="Correo electrónico" />
    <input id="codeudorPhone" placeholder="Teléfono" />
    <input id="codeudorEmployment" placeholder="Ocupación" />
    <button id="saveCodeudorBtn">Guardar y continuar →</button>
  `;

  document.getElementById("saveCodeudorBtn").onclick = saveCodeudorData;
}



  /* =======================================================
     GUARDAR CODEUDOR - SANDBOX
  ======================================================= */

async function saveCodeudorSandbox() {
  const fecha = new Date().toISOString();

  const codeudorData = {
    participant_id: participantId,
    nombres_apellidos: codeudor.name,
    tipo_documento: codeudor.documentType,
    numero_documento: codeudor.documentNumber,
    celular: codeudor.phone,
    correo: codeudor.email,
    actividad_ocupacion: codeudor.employment,
    parentesco: codeudor.relationship,
    updated_at: fecha
  };

  try {
    const { data: existingCodeudor, error: selectError } =
      await supabaseClient
        .from("codeudores")
        .select("id")
        .eq("participant_id", participantId)
        .maybeSingle();

    if (selectError) {
      console.error("Error buscando codeudor existente:", selectError);
      return false;
    }

    if (existingCodeudor) {
      const { error: updateError } =
        await supabaseClient
          .from("codeudores")
          .update(codeudorData)
          .eq("id", existingCodeudor.id);

      if (updateError) {
        console.error("Error actualizando codeudor:", updateError);
        return false;
      }
    } else {
      const { error: insertError } =
        await supabaseClient
          .from("codeudores")
          .insert([{ ...codeudorData, created_at: fecha }]);

      if (insertError) {
        console.error("Error insertando codeudor:", insertError);
        return false;
      }
    }

    logSandboxEvent("codeudor", "completó información del codeudor");
    return true;

  } catch (error) {
    console.error("Error conectando con Supabase:", error);
    return false;
  }
}



  /* =======================================================
     PREPARAR FIRMA
  ======================================================= */

  async function continueToSignature() {

    clearValidation();


    /*
      Todavía no hacemos una llamada a ZapSign.

      El siguiente paso será crear una Edge Function
      que reciba participant_id y codeudor,
      genere el documento correspondiente
      y devuelva la URL segura de firma.

      Por ahora dejamos la transición preparada.
    */

    logSandboxEvent(
      "firma",
      "solicitó continuar con firma"
    );


    renderSignaturePending();

  }


  /* =======================================================
     PANTALLA PREVIA A FIRMA
  ======================================================= */

  function renderSignaturePending() {

    flow =
      "signature";


    setInfoVisibility(
      false
    );


    updateProgress(
      5,
      5
    );


    const isYellow =
      qualificationResult?.status ===
      "yellow";


    screen.innerHTML = `

      <div class="final-result">

        <span class="eyebrow">
          FIRMA
        </span>


        <h2>
          Tu solicitud está lista para continuar
        </h2>


        <div class="result green">

          <p>

            ${
              isYellow

                ? "Hemos recibido la información del codeudor. El siguiente paso será generar el documento correspondiente para la firma."

                : "Tu solicitud puede continuar al proceso de firma."
            }

          </p>

        </div>


        <div class="result-followup">

          <p>

            En la siguiente etapa se generará
            el documento correspondiente para
            que puedas revisarlo y firmarlo.

          </p>

        </div>

      </div>

    `;


    updateButtons();

  }


  /* =======================================================
     SIGUIENTE
  ======================================================= */

  async function next() {

    clearValidation();


    /*
      En el resultado RED, el botón principal
      cambia de función: comparte el enlace
      del formulario en lugar de iniciar otra solicitud.
    */

    if (
      flow === "final-result" &&
      qualificationResult?.status === "red"
    ) {

      shareApplicationForm();

      return;

    }


    /* =====================================================
       BIENVENIDA
    ===================================================== */

    if (
  flow === "welcome"
) {

  const emailInput =
    document.getElementById(
      "participantEmail"
    );

  const privacyConsent =
    document.getElementById(
      "privacyConsent"
    );

  if (!emailInput || !privacyConsent) {
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
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    showValidation(
      "Ingresa un correo electrónico válido."
    );
    return;
  }

  if (!privacyConsent.checked) {
    showValidation(
      "Debes aceptar la Política de Tratamiento de Datos Personales para continuar."
    );
    return;
  }

  privacyAccepted = true;
privacyAcceptedAt = new Date().toISOString();

  participantEmail =
    email;

  simulationStep =
    0;

  logSandboxEvent(
    "bienvenida",
    "inició"
  );

  flow =
    "simulation";

  renderSimulation();

  return;
}



    /* =====================================================
       SIMULACIÓN
    ===================================================== */

    if (
      flow === "simulation"
    ) {

      if (
        !validateSimulationStep()
      ) {

        return;

      }


      if (
        simulationStep <
        getLastSimulationStep()
      ) {

        logSandboxEvent(
          "formulario",
          "completó paso " +
            (
              simulationStep + 1
            )
        );


        simulationStep++;


        renderSimulation();


        return;

      }


      calculateSimulation();


      logSandboxEvent(
        "formulario",
        "completó formulario"
      );


      renderSimulationResult();


      return;

    }


    /* =====================================================
       RESULTADO SIMULACIÓN
    ===================================================== */

    if (
      flow ===
      "simulation-result"
    ) {

      logSandboxEvent(
        "resultado_formulario",
        "continuó a precalificación"
      );


      qualificationStep =
        0;


      answers =
        {};


      renderQualification();


      return;

    }


    /* =====================================================
       PRECALIFICACIÓN
    ===================================================== */

    if (
      flow ===
      "qualification"
    ) {

      if (
        !validateQualificationStep()
      ) {

        return;

      }


      const currentQuestion =
        QUESTIONS[
          qualificationStep
        ];


      if (
        currentQuestion
      ) {

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


    /* =====================================================
       RESULTADO FINAL
    ===================================================== */

    if (
      flow ===
      "final-result"
    ) {

      /* -----------------------------------------------
         ROJO
      ------------------------------------------------ */

      if (
        qualificationResult?.status ===
        "red"
      ) {

        resetFlow();

        return;

      }


      /* -----------------------------------------------
         AMARILLO
      ------------------------------------------------ */

      if (
        qualificationResult?.status ===
          "yellow" &&
        qualificationResult?.codeudor_required
      ) {

        renderCodeudor();

        return;

      }


      /* -----------------------------------------------
         VERDE
      ------------------------------------------------ */

      if (
        qualificationResult?.status ===
        "green"
      ) {

        continueToSignature();

        return;

      }

    }


    /* =====================================================
       CODEUDOR
    ===================================================== */

if (flow === "codeudor") {
  if (!validateCodeudor()) {
    return;
  }

  const saved = await saveCodeudorSandbox();

  if (!saved) {
    alert("No fue posible guardar la información del codeudor. Intenta nuevamente.");
    return;
  }

  // Espera un pequeño delay para asegurar que el insert se confirme
  await new Promise(resolve => setTimeout(resolve, 500));

  // Ahora sí llama a la Edge Function
  await createZapSignDocument();
  return;
}



    /* =====================================================
       FIRMA
    ===================================================== */

    if (
      flow ===
      "signature"
    ) {

      resetFlow();

      return;

    }

  }


  /* =======================================================
     VOLVER
  ======================================================= */

  function back() {

    clearValidation();


    /* ---------------------------------------------------
       WELCOME
    --------------------------------------------------- */

    if (
      flow ===
      "welcome"
    ) {

      return;

    }


    /* ---------------------------------------------------
       SIMULACIÓN
    --------------------------------------------------- */

    if (
      flow ===
      "simulation"
    ) {

      if (
        simulationStep ===
        0
      ) {

        renderWelcome();

        return;

      }


      simulationStep--;


      renderSimulation();


      return;

    }


    /* ---------------------------------------------------
       RESULTADO SIMULACIÓN
    --------------------------------------------------- */

    if (
      flow ===
      "simulation-result"
    ) {

      simulationStep =
        5;


      renderSimulation();


      return;

    }


    /* ---------------------------------------------------
       PRECALIFICACIÓN
    --------------------------------------------------- */

    if (
      flow ===
      "qualification"
    ) {

      if (
        qualificationStep ===
        0
      ) {

        renderSimulationResult();

        return;

      }


      qualificationStep--;


      renderQualification();


      return;

    }


/* ---------------------------------------------------
   RESULTADO FINAL
--------------------------------------------------- */

if (
  flow ===
  "final-result"
) {

  /*
    La solicitud ya fue guardada en Supabase
    y procesada por la Edge Function.

    No permitimos regresar a modificar las
    respuestas originales de esta solicitud.
  */

  return;

}


    /* ---------------------------------------------------
       CODEUDOR
    --------------------------------------------------- */

    if (
      flow ===
      "codeudor"
    ) {

      renderFinalResult();


      return;

    }


    /* ---------------------------------------------------
       FIRMA
    --------------------------------------------------- */

    if (
      flow ===
      "signature"
    ) {

      /*
        Si venimos de amarillo,
        regresamos al codeudor.

        Si venimos de verde,
        regresamos al resultado.
      */

      if (
        qualificationResult?.status ===
        "yellow"
      ) {

        renderCodeudor();

        return;

      }


      renderFinalResult();

      return;

    }

  }


  /* =======================================================
     REINICIAR TODO
  ======================================================= */

  function resetFlow() {

    flow =
      "welcome";


    simulationStep =
      0;


    qualificationStep =
      0;


    answers =
      {};


    participantEmail =
      "";


    qualificationResult =
      null;


    codeudor = {

      name: "",

      documentType: "",

      documentNumber: "",

      phone: "",

      email: "",

      employment: "",

      relationship: ""

    };


    initializeSandboxSession();


    simulation = {

      vehicleType: "",

      vehicleCondition: "",

      vehicleYear: "",

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
     EVENTOS PRINCIPALES
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
     MODAL PRIVACIDAD
  ======================================================= */

  function openPrivacyPolicy() {

    const privacyModal =
      document.getElementById(
        "privacyModal"
      );


    if (!privacyModal) {
      return;
    }


    privacyModal.classList.add(
      "is-open"
    );


    privacyModal.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.style.overflow =
      "hidden";

  }


function closePrivacyPolicy() {

  const privacyModal =
    document.getElementById(
      "privacyModal"
    );

  const openPrivacyModal =
    document.getElementById(
      "openPrivacyModal"
    );


  if (!privacyModal) {
    return;
  }


  privacyModal.classList.remove(
    "is-open"
  );


  privacyModal.setAttribute(
    "aria-hidden",
    "true"
  );


  if (openPrivacyModal) {
    openPrivacyModal.focus();
  }


  document.body.style.overflow =
    "";

}


  /* =======================================================
     EVENTOS MODAL
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          "#openPrivacyModal"
        )
      ) {

        openPrivacyPolicy();

        return;

      }


      if (
        event.target.closest(
          "#closePrivacyModal"
        ) ||
        event.target.closest(
          "#closePrivacyModalButton"
        ) ||
        event.target.closest(
          "#privacyModalOverlay"
        )
      ) {

        closePrivacyPolicy();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      const privacyModal =
        document.getElementById(
          "privacyModal"
        );


      if (
        privacyModal &&
        privacyModal.classList.contains(
          "is-open"
        )
      ) {

        closePrivacyPolicy();

      }

    }
  );


  /* =======================================================
     INICIO
  ======================================================= */

  renderWelcome();

});