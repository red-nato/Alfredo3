// ════════════════════════════════════════════════════════════════
//  ARCHIVO: 01_config.js — Constantes y Configuración
// ════════════════════════════════════════════════════════════════

const PREGUNTAS_CONOCIDOS = [
    "¿Cuál fue la situación más difícil que vivieron juntos como equipo?",
    "¿Qué fortaleza de cada integrante destacarías para este desafío?",
    "Si su equipo fuera una empresa, ¿cómo se llamaría y qué haría?",
    "¿Cuál es el mayor riesgo que tomarían juntos hoy?",
    "¿Quién del equipo convencería mejor a un inversionista? ¿Por qué?",
    "¿En qué área del emprendimiento creen que son más fuertes como equipo?",
    "¿Qué habilidad de otro integrante quisieran tener?",
];

const PREGUNTAS_DESCONOCIDOS = [
    "Preséntate: nombre, carrera y un superpoder que tengas.",
    "¿Qué te motivó a estudiar lo que estudias?",
    "¿Cuál es el problema del mundo que más te molesta y querrías resolver?",
    "¿Alguna vez emprendiste algo? ¿Qué pasó?",
    "¿Qué app o producto usas todos los días y nunca podrías dejar de usar?",
    "¿Qué te hace diferente del resto de tu equipo?",
    "¿Qué necesitarías para lanzar un negocio mañana mismo?",
];

const PHASE_CONFIG_DEFAULTS = {
    1: { timerMin: 3, coinsFirst: 7, coinsSecond: 5, coinsThird: 3 },
    2: { timerMin: 8, coinsFirst: 10, coinsSecond: 8, coinsThird: 5 },
    3: { timerMin: 10, coinsFirst: 8, coinsSecond: 5, coinsThird: 3 },
    4: { timerMin: 6, pitchSec: 90, coinsFirst: 5, coinsSecond: 3, coinsThird: 2 },
    5: { evalCoinsPerTeam: 11 },
};

let PHASE_CONFIG = JSON.parse(JSON.stringify(PHASE_CONFIG_DEFAULTS));

// Vacío mantiene Django durante la transición. Para SAM local, en la consola:
// localStorage.setItem('misionEmprendeApiBaseUrl', 'http://localhost:3000')
// Para AWS, se puede inyectar window.MISION_EMPRENDE_API_BASE_URL al servir el frontend.
function apiFetch(path, options) {
    const configuredBase = window.MISION_EMPRENDE_API_BASE_URL
        || localStorage.getItem('misionEmprendeApiBaseUrl')
        || '';
    const requestOptions = { ...(options || {}) };
    const token = window.getMisionEmprendeAdminToken?.();
    if (token) {
        const headers = new Headers(requestOptions.headers || {});
        if (!headers.has('Authorization')) headers.set('Authorization', token);
        requestOptions.headers = headers;
    }
    return window.fetch(`${configuredBase}${path}`, requestOptions);
}

const PHASE_NARRATIVES = {
    1: {
        phaseLabel:  "Fase 1 completada — Trabajo en equipo",
        icon:        "fas fa-users",
        iconColor:   "text-yellow-400",
        glowClass:   "bg-yellow-500",
        topBar:      "bg-gradient-to-r from-transparent via-yellow-400 to-transparent",
        bottomBar:   "bg-gradient-to-r from-transparent via-purple-500 to-transparent",
        coinsText:   "+5 HelpiCoins ganados",
        nextTitle:   "Fase 2 — Empatía",
        nextHint:    "Ahora deben ponerse en los zapatos de alguien más. ¿Quién necesita su ayuda?",
    },
    2: {
        phaseLabel:  "Fase 2 completada — Empatía",
        icon:        "fas fa-heart",
        iconColor:   "text-purple-400",
        glowClass:   "bg-purple-500",
        topBar:      "bg-gradient-to-r from-transparent via-purple-500 to-transparent",
        bottomBar:   "bg-gradient-to-r from-transparent via-orange-400 to-transparent",
        coinsText:   "+8 HelpiCoins ganados",
        nextTitle:   "Fase 3 — Creatividad",
        nextHint:    "Tienen un problema real. Ahora creen una solución con LEGO.",
    },
    3: {
        phaseLabel:  "Fase 3 completada — Creatividad",
        icon:        "fas fa-cube",
        iconColor:   "text-orange-400",
        glowClass:   "bg-orange-500",
        topBar:      "bg-gradient-to-r from-transparent via-orange-400 to-transparent",
        bottomBar:   "bg-gradient-to-r from-transparent via-emerald-400 to-transparent",
        coinsText:   "+5 HelpiCoins ganados",
        nextTitle:   "Fase 4 — Comunicación",
        nextHint:    "Construyeron algo. Ahora convénzannos de que vale. ¡Preparen su pitch!",
    },
    4: {
        phaseLabel:  "Fase 4 completada — Comunicación",
        icon:        "fas fa-microphone",
        iconColor:   "text-emerald-400",
        glowClass:   "bg-emerald-500",
        topBar:      "bg-gradient-to-r from-transparent via-emerald-400 to-transparent",
        bottomBar:   "bg-gradient-to-r from-transparent via-yellow-400 to-transparent",
        coinsText:   "+3 HelpiCoins por el pitch",
        nextTitle:   "Fase 5 — Negociación",
        nextHint:    "Es hora de evaluar a los otros equipos. ¡Sean justos!",
    },
};
// Añade esta línea debajo de tu PHASE_NARRATIVES en 01_config.js
const PHASE_NARRATIVES_DEFAULTS = JSON.parse(JSON.stringify(PHASE_NARRATIVES));

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Inicialización del objeto principal
const app = {};
