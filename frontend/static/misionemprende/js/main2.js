// ════════════════════════════════════════════════════════════════
//  MisiónEmprende — main2.js (versión mejorada v2)
//  Mejoras: sopa sin colisiones · borradores evaluación · podio dinámico
//           ranking en transición · admin configurable
// ════════════════════════════════════════════════════════════════

// ── MAZOS DE PREGUNTAS ───────────────────────────────────────────
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

// ── CONFIGURACIÓN DE FASES (editable desde admin) ───────────────
// Estos valores son defaults; el admin puede sobreescribirlos en tiempo real.
const PHASE_CONFIG_DEFAULTS = {
    1: { timerMin: 3, coinsFirst: 7, coinsSecond: 5, coinsThird: 3 },
    2: { timerMin: 8, coinsFirst: 10, coinsSecond: 8, coinsThird: 5 },
    3: { timerMin: 10, coinsFirst: 8, coinsSecond: 5, coinsThird: 3 },
    4: { timerMin: 6, pitchSec: 90, coinsFirst: 5, coinsSecond: 3, coinsThird: 2 },
    5: { evalCoinsPerTeam: 11 },
};

// Configuración activa (se puede sobreescribir desde admin)
let PHASE_CONFIG = JSON.parse(JSON.stringify(PHASE_CONFIG_DEFAULTS));

// ── NARRATIVA POR FASE ───────────────────────────────────────────
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

// ── HELPERS ──────────────────────────────────────────────────────
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ════════════════════════════════════════════════════════════════
//  OBJETO PRINCIPAL DE LA APP
// ════════════════════════════════════════════════════════════════
const app = {

    // ── ESTADO ──────────────────────────────────────────────────
    state: {
        teamName: "",
        selectedRole: null,
        members: [],
        tokens: 0,
        currentStage: 0,
        uploadedPrototypeImage: null,
        timerInterval: null,
        selectedTopic: null,
        selectedPersona: null,
        preGameType: null,
        stage1Path: null,
        cardsDrawn: 0,
        isPaused: false,
        ranking: [],
        // Borradores de evaluación: { [teamName]: { stat1, stat2, stat3, stat4, total } }
        evaluationDrafts: {},
        currentEvalTarget: null,
        evaluacion: {
            maxCoins: 11,
            currentCoins: 11,
            stats: { stat1: 0, stat2: 0, stat3: 0, stat4: 0 }
        },
        wordSearch: {
            grid: [],
            size: 15,
            words: ["INNOVAR", "EQUIPO", "LIDER", "EMPATIA", "CLIENTE", "PROBLEMA", "SOLUCION", "PITCH", "VALOR", "MERCADO"],
            foundWords: [],
            wordLocations: {}
        },
        personas: {
            adultos_mayores: [
                {
                    name: "Osvaldo Araya (70)", img: "/static/misionemprende/img/personas/osvaldo.png",
                    icon: "fas fa-user-lock", color: "bg-red-500",
                    resumen: "El avance tecnológico en los últimos años ha sido incremental. Esto ha beneficiado a múltiples sectores, sin embargo el conocimiento y adaptación para los adultos mayores ha sido una gran dificultad. Osvaldo es un adulto mayor de 70 años y debe pedir ayuda a sus hijos o nietos cada vez que debe hacer trámites bancarios, médicos o postular a beneficios sociales en línea. Su mayor dolor es sentirse dependiente y vulnerable ante la tecnología.",
                    desc: "Osvaldo necesita hacer trámites bancarios y médicos en línea pero depende de sus hijos para lograrlo. Se siente excluido y vulnerable."
                },
                {
                    name: "Clara Soto (65)", img: "/static/misionemprende/img/personas/clara.png",
                    icon: "fas fa-graduation-cap", color: "bg-blue-500",
                    resumen: "Clara es una jubilada que vive sola en una zona rural. Le gustaría aprender a usar las redes sociales y videollamadas para mantenerse conectada con sus nietos que viven en el extranjero. Su principal frustración es que los tutoriales son muy rápidos y usan un lenguaje técnico que no entiende. Se siente excluida de la vida familiar digital.",
                    desc: "Clara quiere conectar con sus nietos por videollamada pero los tutoriales son demasiado técnicos. Se siente excluida de la vida familiar digital."
                },
                {
                    name: "Ricardo Neira (78)", img: "/static/misionemprende/img/personas/ricardo.png",
                    icon: "fas fa-map-marker-alt", color: "bg-green-500",
                    resumen: "Ricardo tiene problemas de movilidad y solo puede salir de casa con dificultad. Necesita acceder a servicios de delivery de medicamentos y comida. El proceso de registro y pago en las aplicaciones móviles le resulta confuso y estresante, teme equivocarse e ingresar mal sus datos bancarios, lo que lo obliga a recurrir al teléfono fijo que es lento y costoso.",
                    desc: "Ricardo no puede salir de casa y necesita hacer delivery pero las apps le resultan confusas y peligrosas para sus datos bancarios."
                }
            ],
            fastfashion_desechos: [
                {
                    name: "Gabriela Rojas (18)", img: "/static/misionemprende/img/personas/gabriela.png",
                    icon: "fas fa-lungs-virus", color: "bg-red-500",
                    resumen: "La moda rápida ha traído graves consecuencias al medio ambiente. Especialmente en sectores del norte de Chile donde los vertederos y basurales están afectando el diario vivir. Gabriela es una estudiante de 18 años que vive cerca de esta zona y debe pasar a diario por lugares con desagradables olores y polvo contaminado para ir a su instituto, afectando su salud respiratoria y su estado de ánimo.",
                    desc: "Gabriela pasa a diario por basurales de ropa cerca de su instituto. Sufre problemas respiratorios y su calidad de vida se ve afectada cada día."
                },
                {
                    name: "Matías Zúñiga (35)", img: "/static/misionemprende/img/personas/matias.png",
                    icon: "fas fa-briefcase", color: "bg-yellow-500",
                    resumen: "Matías es dueño de una pequeña tienda de ropa de segunda mano. Aunque su negocio es sustentable, le cuesta mucho competir con los bajos precios y la constante novedad del fast fashion. Los consumidores jóvenes priorizan el precio, lo que amenaza la supervivencia de su emprendimiento. Busca una manera de revalorizar la ropa vintage y ética.",
                    desc: "Matías tiene una tienda de ropa vintage pero no puede competir con los precios del fast fashion. Su negocio sustentable está en riesgo."
                },
                {
                    name: "Elena Cáceres (52)", img: "/static/misionemprende/img/personas/elena.png",
                    icon: "fas fa-house-damage", color: "bg-blue-500",
                    resumen: "Elena es la líder de su junta vecinal en una población cercana a un basural ilegal de ropa. El viento arrastra prendas y residuos químicos hasta su patio, contaminando su jardín y dificultando la crianza de sus nietos. Su principal dolor es la impotencia ante la inacción de las autoridades para limpiar y prevenir estos desechos tóxicos.",
                    desc: "Elena lidera su junta vecinal pero no puede proteger a sus vecinos de los residuos tóxicos de un basural de ropa ilegal."
                }
            ],
            sustentabilidad_agua: [
                {
                    name: "Camila Díaz (50)", img: "/static/misionemprende/img/personas/camila.png",
                    icon: "fas fa-seedling", color: "bg-green-500",
                    resumen: "Camila es una agricultora de 50 años que cultiva paltas de exportación. Está complicada de perder su negocio por la cantidad de agua que debe utilizar para mantener la producción, y teme ser señalada socialmente por el alto consumo hídrico de su cultivo. Necesita una solución que le permita producir de manera más eficiente sin arruinar su reputación.",
                    desc: "Camila cultiva paltas pero el alto consumo de agua amenaza su negocio y su reputación. Necesita producir más eficientemente."
                },
                {
                    name: "Pedro Soto (68)", img: "/static/misionemprende/img/personas/pedro.png",
                    icon: "fas fa-tractor", color: "bg-yellow-500",
                    resumen: "Don Pedro tiene un pequeño campo donde cultiva hortalizas para el mercado local. Aún utiliza métodos de riego tradicionales por inundación, perdiendo grandes cantidades de agua. No tiene el conocimiento ni el capital para invertir en tecnología de riego por goteo, lo que pone en riesgo su cosecha cada verano debido a la sequía.",
                    desc: "Don Pedro pierde cosechas por sequía pero no tiene capital para modernizar su sistema de riego. Depende del agua para sobrevivir."
                },
                {
                    name: "Ana María Vidal (30)", img: "/static/misionemprende/img/personas/ana_maria.png",
                    icon: "fas fa-flask", color: "bg-blue-500",
                    resumen: "Ana María es una joven investigadora agrónoma que está desarrollando un hidrogel para retener la humedad en la tierra en condiciones de escasez. Su desafío es ganarse la confianza de la comunidad agrícola tradicional para implementar y escalar su tecnología.",
                    desc: "Ana María tiene una tecnología para ahorrar agua pero los agricultores tradicionales no confían en ella. Necesita comunicar su innovación."
                }
            ]
        }
    },

    // ── SONIDO ──────────────────────────────────────────────────
    playSound: function(soundId) {
        const audio = document.getElementById('sfx-' + soundId);
        const volumes = { 'fanfare': 0.4, 'success': 0.1, 'error': 0.4, 'click': 0.8, 'countdown': 0.6, 'nose': 1.0 };
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volumes[soundId] || 1.0;
            try { audio.play().catch(() => {}); } catch(e) {}
        }
    },

    // ── INICIALIZACIÓN ───────────────────────────────────────────
    init: function() {
        const page = document.body.dataset.page || 'game';
        if (page === 'professor') { this.showView('view-professor'); this.initProfessorView(); return; }
        if (page === 'admin') { this.showView('view-admin-login'); return; }
        this.showView('view-welcome');
    },

    goHome:        function() { window.location.href = '/'; },
    goToProfessor: function() { window.location.href = '/profesor/'; },
    goToAdmin:     function() { window.location.href = '/panel-admin/'; },

    // ── NAVEGACIÓN ───────────────────────────────────────────────
    showView: function(viewId) {
        const current = document.querySelector('section.active');
        if (current) current.classList.remove('fade-in');

        setTimeout(() => {
            document.querySelectorAll('section').forEach(el => el.classList.remove('active'));
            const nextView = document.getElementById(viewId);
            if (nextView) {
                nextView.classList.add('active', 'fade-in');
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (viewId === 'view-login') {
                    const step1   = document.getElementById('login-step-1');
                    const step2   = document.getElementById('login-step-2');
                    const waiting = document.getElementById('lobby-waiting-screen');
                    if (step1)   { step1.classList.remove('hidden','scale-95','opacity-0'); step1.classList.add('scale-100','opacity-100'); }
                    if (step2)   { step2.classList.add('hidden','opacity-0','translate-y-10'); step2.classList.remove('opacity-100','translate-y-0'); }
                    if (waiting) waiting.classList.add('hidden');
                }
            } else if (viewId === 'view-welcome') {
                this.goHome();
            }
        }, 100);
    },

    attemptGoHome: function() {
        if (this.state.tokens > 0 || this.state.teamName) {
            if (confirm("¿Estás seguro de que quieres salir? Se perderá el progreso de la misión.")) {
                this.resetGame();
                this.showView('view-welcome');
            }
        } else {
            this.showView('view-welcome');
        }
    },

    resetGame: function() {
        this.state.teamName = "";
        this.state.members  = [];
        this.state.tokens   = 0;
        this.state.cardsDrawn = 0;
        this.state.wordSearch.foundWords = [];
        this.state.selectedPersona = null;
        this.state.evaluationDrafts = {};
        this.state.currentEvalTarget = null;

        const tc = document.getElementById('token-count');
        const nd = document.getElementById('team-name-display');
        const td = document.getElementById('team-display');
        const bb = document.getElementById('btn-complete-stage1');
        if (tc) tc.innerText = "0";
        if (nd) nd.innerText = "---";
        if (td) td.classList.add('hidden');
        if (bb) { bb.disabled = true; bb.classList.add('opacity-50','cursor-not-allowed'); }

        this.state.wordSearch.words.forEach(word => {
            const el = document.getElementById(`word-target-${word}`);
            if (el) { el.classList.remove('bg-green-500','line-through'); el.classList.add('bg-pink-600'); }
        });

        clearInterval(this.state.timerInterval);
        const gt = document.getElementById('global-timer');
        if (gt) gt.classList.add('hidden');
    },

    // ── TOAST ────────────────────────────────────────────────────
    showToast: function(message, type = 'success') {
        const toast   = document.getElementById('toast');
        const msgSpan = document.getElementById('toast-message');
        if (!toast || !msgSpan) return;
        msgSpan.innerText = message;
        if (type === 'error') {
            toast.classList.remove('from-green-400','to-blue-500');
            toast.classList.add('from-red-400','to-pink-500');
            this.playSound('error');
        } else {
            toast.classList.remove('from-red-400','to-pink-500');
            toast.classList.add('from-green-400','to-blue-500');
            this.playSound('success');
        }
        toast.classList.remove('translate-x-full');
        setTimeout(() => toast.classList.add('translate-x-full'), 3500);
    },

    // ── AYUDA ────────────────────────────────────────────────────
    toggleHelp: function() {
        this.playSound('click');
        const modal = document.getElementById('transmission-modal');
        if (!modal) return;
        if (modal.classList.contains('hidden')) {
            const msgs = {
                1: this.state.stage1Path === "known"
                    ? "¿Se conocen? Interesante. Si se conocen tanto, trabajen en equipo y resuelvan la sopa de letras antes que los demás..."
                    : "Emprender suele ser en equipo pero, si no nos conocemos, ¿cómo trabajaríamos juntos?",
                2: "Empatía significa ponerse en el lugar del otro. Piensen: ¿qué siente realmente esa persona? ¿Qué le impide resolver su problema solo?",
                3: "No busquen la solución perfecta, busquen la solución posible. El LEGO no miente: si no puedes construirlo, quizás no lo has pensado bien.",
                4: "Un buen pitch tiene gancho, problema, solución y un cierre memorable. Tienen 90 segundos. ¡Aprovechen cada uno!",
                5: "Evalúen con honestidad y justicia. Las HelpiCoins que distribuyan hoy afectan el ranking final de todos.",
            };
            const title = document.getElementById('trans-title');
            const desc  = document.getElementById('trans-desc');
            if (title) title.innerText = this.state.currentStage > 0 ? `Ayuda Fase ${this.state.currentStage}` : "¡Hola, soy Helpi!";
            if (desc)  desc.innerText  = msgs[this.state.currentStage] || "Estoy aquí para ayudarte. ¿En qué parte de la misión tienes dudas?";
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    },

    // ── TIMER ────────────────────────────────────────────────────
    startTimer: function(minutes, onExpire) {
        clearInterval(this.state.timerInterval);
        const display = document.getElementById('global-timer');
        if (!display) return;
        display.classList.remove('hidden');

        let remaining = Math.floor(minutes * 60);
        const update = () => {
            const m = Math.floor(remaining / 60).toString().padStart(2, '0');
            const s = (remaining % 60).toString().padStart(2, '0');
            display.innerText = `${m}:${s}`;
            if (remaining <= 30) {
                display.classList.remove('bg-red-600');
                display.classList.add('bg-red-700', 'animate-pulse');
            }
            if (remaining <= 0) {
                clearInterval(this.state.timerInterval);
                display.classList.add('hidden');
                if (onExpire) onExpire();
            }
            remaining--;
        };
        update();
        this.state.timerInterval = setInterval(update, 1000);
    },

    addTokens: function(amount) {
        this.state.tokens += amount;
        const el = document.getElementById('token-count');
        if (el) el.innerText = this.state.tokens;
    },

    // ── VERIFICAR CÓDIGO DE SESIÓN ───────────────────────────────
    verifySessionCode: async function() {
        const codeInput  = document.getElementById('input-code');
        if (!codeInput) return;
        const code       = codeInput.value.trim();
        const btnConnect = document.querySelector('#login-step-1 button');
        if (!btnConnect) return;
        const originalBtn = btnConnect.innerHTML;

        if (code.length < 4) {
            this.playSound('error');
            this.showToast("Ingresa un código válido", "error");
            codeInput.classList.add('border-red-500','text-red-500','animate-shake');
            setTimeout(() => codeInput.classList.remove('border-red-500','text-red-500','animate-shake'), 500);
            return;
        }

        btnConnect.innerHTML = '<i class="fas fa-spinner fa-spin text-lg"></i> VERIFICANDO...';
        btnConnect.disabled  = true;

        try {
            const response = await fetch(`/api/validar-sesion/?codigo=${code}`);
            const data     = await response.json();
            if (data.status === 'ok') {
                this.playSound('success');
                const step1 = document.getElementById('login-step-1');
                const step2 = document.getElementById('login-step-2');
                step1.classList.remove('scale-100','opacity-100');
                step1.classList.add('scale-95','opacity-0');
                setTimeout(() => {
                    step1.classList.add('hidden');
                    step2.classList.remove('hidden');
                    setTimeout(() => { step2.classList.remove('opacity-0','translate-y-10'); step2.classList.add('opacity-100','translate-y-0'); }, 50);
                }, 500);
            } else {
                this.playSound('error');
                this.showToast("Código de sesión incorrecto o inactivo", "error");
                codeInput.classList.add('border-red-500','text-red-500','animate-shake');
                setTimeout(() => codeInput.classList.remove('border-red-500','text-red-500','animate-shake'), 500);
            }
        } catch(e) {
            this.showToast("Error de conexión con la base", "error");
        } finally {
            btnConnect.innerHTML = originalBtn;
            btnConnect.disabled  = false;
        }
    },

    // ── MIEMBROS ─────────────────────────────────────────────────
    addMember: function() {
        const nameInput   = document.getElementById('input-member-name');
        const careerInput = document.getElementById('input-member-career');
        const membersList = document.getElementById('members-list');
        const countSpan   = document.getElementById('member-count');
        if (!nameInput || !careerInput || !membersList) return;

        const name   = nameInput.value.trim();
        const career = careerInput.value;
        if (!name) { this.showToast("Ingresa el nombre del agente", "error"); return; }
        if (this.state.members.length >= 8) { this.showToast("Máximo 8 integrantes por equipo", "error"); return; }

        const member = { name, career };
        this.state.members.push(member);

        const div = document.createElement('div');
        div.className = 'member-item flex items-center justify-between bg-blue-50 rounded-xl p-3 border border-blue-100';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-black">${name.charAt(0).toUpperCase()}</div>
                <span class="member-name font-bold text-gray-800 text-sm">${name}</span>
                <span class="member-career text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${career || 'Sin definir'}</span>
            </div>
            <button onclick="this.parentElement.remove(); app.state.members = app.state.members.filter(m=>m.name!=='${name}'); document.getElementById('member-count').innerText = app.state.members.length+'/8';" class="text-red-400 hover:text-red-600 transition text-sm">
                <i class="fas fa-times"></i>
            </button>
        `;
        membersList.appendChild(div);

        nameInput.value   = '';
        careerInput.value = '';
        nameInput.focus();
        if (countSpan) countSpan.innerText = `${this.state.members.length}/8`;
    },

    // ── COUNTDOWN DRAMÁTICO ──────────────────────────────────────
    triggerDramaticCountdown: function(type) {
        this.state.preGameType = type;
        const overlay       = document.getElementById('dramatic-countdown');
        const numberDisplay = document.getElementById('countdown-number');
        let count = 3;
        overlay.classList.remove('hidden');
        numberDisplay.innerText = count;
        this.playSound('countdown');

        const interval = setInterval(() => {
            count--;
            if (count > 0) { numberDisplay.innerText = count; this.playSound('countdown'); }
            else if (count === 0) { numberDisplay.innerText = "¡YA!"; this.playSound('success'); }
            else { clearInterval(interval); overlay.classList.add('hidden'); this.startStage1(this.state.preGameType); }
        }, 1000);
    },

    // ════════════════════════════════════════════════════════════
    //  FASE 1 — TRABAJO EN EQUIPO
    // ════════════════════════════════════════════════════════════

    startStage1: function(type) {
        this.state.stage1Path   = type;
        this.state.currentStage = 1;
        this.state.cardsDrawn   = 0;

        const titleEl    = document.getElementById('icebreaker-title');
        const subtitleEl = document.getElementById('icebreaker-subtitle');
        if (type === 'known') {
            if (titleEl)    titleEl.innerHTML  = 'Preguntas rápidas <i class="fas fa-bolt text-yellow-400"></i>';
            if (subtitleEl) subtitleEl.innerHTML = 'Ya se conocen, ¿sí? Respondan estas 3 preguntas en <span class="text-yellow-300 font-bold">1 minuto</span>. Luego viene la sopa de letras.';
            window._mazoActual = shuffleArray(PREGUNTAS_CONOCIDOS);
        } else {
            if (titleEl)    titleEl.innerHTML  = 'Rompehielos <i class="fas fa-snowflake text-blue-400 animate-pulse"></i>';
            if (subtitleEl) subtitleEl.innerHTML = '¡Son caras nuevas! Saquen 3 cartas y preséntense en <span class="text-yellow-300 font-bold">1 minuto</span>. Luego viene la sopa de letras.';
            window._mazoActual = shuffleArray(PREGUNTAS_DESCONOCIDOS);
        }

        resetCardUI();
        this.showView('icebreaker');
        this.startTimer(1, () => {
            this.showToast("¡Tiempo en cartas! Pasando a la sopa de letras.", 'error');
            this.startWordSearch();
        });
    },

    startWordSearch: function() {
        clearInterval(this.state.timerInterval);
        const display = document.getElementById('global-timer');
        if (display) display.classList.add('hidden');
        this.generateWordSearch();
        this.showView('view-stage1-game');
        const timerMin = PHASE_CONFIG[1] ? PHASE_CONFIG[1].timerMin : 3;
        this.startTimer(timerMin);
    },

    completeStage1: function() {
        clearInterval(this.state.timerInterval);
        const display = document.getElementById('global-timer');
        if (display) display.classList.add('hidden');
        const coins = PHASE_CONFIG[1] ? PHASE_CONFIG[1].coinsFirst : 5;
        this.addTokens(coins);

        this.triggerTransition(
            "El trabajo en equipo ya dejó huella",
            "¡Excelentes comunicadores! Conocerse es el primer paso para emprender juntos. Ahora viene algo más profundo: entender a alguien que necesita tu ayuda.",
            10,
            () => { this.showView('view-stage2-topics'); this.state.currentStage = 2; this.startTimer(8); },
            1
        );
    },

    // ── SOPA DE LETRAS (SIN COLISIONES) ──────────────────────────
    // FIX: El bug era que se permitía solapar si las letras coincidían (posición correcta).
    // Ahora: una celda solo puede ser compartida si ambas palabras tienen LA MISMA LETRA
    // en esa posición Y el cruce es intencional. La nueva versión es más estricta:
    // cada celda solo puede ser ocupada por UNA palabra, excepto cruces explícitos.
    generateWordSearch: function() {
        const size  = this.state.wordSearch.size || 15;
        let grid    = new Array(size * size).fill('');
        // cellOwner: rastrea qué palabra ocupa cada celda (evita colisiones de palabras distintas)
        let cellOwner = new Array(size * size).fill(null);
        const words = [...this.state.wordSearch.words].sort((a, b) => b.length - a.length); // Largas primero
        this.state.wordSearch.foundWords    = [];
        this.state.wordSearch.wordLocations = {};

        const DIRECTIONS = [
            { dr: 0, dc: 1 },   // horizontal →
            { dr: 1, dc: 0 },   // vertical ↓
        ];

        const tryPlace = (word) => {
            const attempts = 800;
            for (let attempt = 0; attempt < attempts; attempt++) {
                const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
                const maxRow = dir.dr === 0 ? size : size - word.length;
                const maxCol = dir.dc === 0 ? size : size - word.length;
                if (maxRow <= 0 || maxCol <= 0) continue;

                const row = Math.floor(Math.random() * maxRow);
                const col = Math.floor(Math.random() * maxCol);

                let canPlace = true;
                const indices = [];
                for (let i = 0; i < word.length; i++) {
                    const r   = row + dir.dr * i;
                    const c   = col + dir.dc * i;
                    const idx = r * size + c;
                    const existing = grid[idx];
                    const owner    = cellOwner[idx];
                    // Celda vacía: OK
                    if (existing === '') { indices.push(idx); continue; }
                    // Celda ocupada por la MISMA palabra (no debería pasar, pero safety):
                    if (owner === word)  { canPlace = false; break; }
                    // Celda ocupada por otra palabra: SOLO se permite si es exactamente la misma letra (cruce)
                    if (existing === word[i] && owner !== null && owner !== word) {
                        // Permitir cruce solo si es horizontal cruzando vertical o viceversa
                        // Para simplificar: NO permitir cruces en esta versión
                        canPlace = false; break;
                    }
                    canPlace = false; break;
                }

                if (canPlace) {
                    indices.forEach((idx, i) => {
                        grid[idx]      = word[i];
                        cellOwner[idx] = word;
                    });
                    this.state.wordSearch.wordLocations[word] = indices;
                    return true;
                }
            }
            return false;
        };

        // Colocar palabras
        const notPlaced = [];
        words.forEach(word => {
            if (!tryPlace(word)) notPlaced.push(word);
        });

        // Intentar palabras no colocadas con más intentos
        notPlaced.forEach(word => {
            if (!tryPlace(word)) {
                console.warn(`No se pudo colocar: ${word}. Omitida.`);
                delete this.state.wordSearch.wordLocations[word];
            }
        });

        // Rellenar vacíos con letras aleatorias (evitando formar palabras accidentalmente)
        const SAFE_FILL = "BCDFGHJKNPQRSTVWXYZ"; // Sin vocales frecuentes para reducir falsos positivos
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] === '') {
                grid[i] = SAFE_FILL[Math.floor(Math.random() * SAFE_FILL.length)];
            }
        }

        // Crear etiquetas
        const targetWordsDiv = document.getElementById('target-words-display');
        if (targetWordsDiv) {
            targetWordsDiv.innerHTML = '';
            targetWordsDiv.className = 'flex flex-wrap justify-center gap-2 mb-4';
            Object.keys(this.state.wordSearch.wordLocations).forEach(word => {
                const span = document.createElement('span');
                span.id        = `word-target-${word}`;
                span.className = 'bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold transition';
                span.innerText = word;
                targetWordsDiv.appendChild(span);
            });
        }

        // Renderizar grid
        const gridEl = document.getElementById('word-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';
        grid.forEach((letter, index) => {
            const div = document.createElement('div');
            div.className   = 'letter-cell';
            div.innerText   = letter;
            div.dataset.index = index;
            div.onclick     = () => this.handleCellClick(div, index);
            gridEl.appendChild(div);
        });

        // Reset visual
        Object.keys(this.state.wordSearch.wordLocations).forEach(word => {
            const el = document.getElementById(`word-target-${word}`);
            if (el) { el.classList.remove('bg-green-500','line-through'); el.classList.add('bg-pink-600'); }
        });

        const btn = document.getElementById('btn-complete-stage1');
        if (btn) { btn.disabled = true; btn.classList.add('opacity-50','cursor-not-allowed'); }
    },

    handleCellClick: function(cell, index) {
        if (cell.classList.contains('found') || cell.classList.contains('correct-word')) return;
        cell.classList.toggle('selected');

        const allSelected     = document.querySelectorAll('.letter-cell.selected');
        const selectedIndices = Array.from(allSelected).map(el => parseInt(el.dataset.index)).sort((a,b) => a - b);

        Object.keys(this.state.wordSearch.wordLocations).forEach(word => {
            if (this.state.wordSearch.foundWords.includes(word)) return;
            const targetIndices = (this.state.wordSearch.wordLocations[word] || []).sort((a,b) => a - b);
            if (JSON.stringify(selectedIndices) === JSON.stringify(targetIndices)) {
                this.markWordAsFound(word, targetIndices);
            }
        });
    },

    markWordAsFound: function(word, indices) {
        this.state.wordSearch.foundWords.push(word);
        this.playSound('click');
        indices.forEach(idx => {
            const cell = document.querySelector(`.letter-cell[data-index='${idx}']`);
            if (cell) { cell.classList.remove('selected'); cell.classList.add('found'); }
        });
        const targetEl = document.getElementById(`word-target-${word}`);
        if (targetEl) { targetEl.classList.remove('bg-pink-600'); targetEl.classList.add('bg-green-500','line-through'); }

        const countEl = document.getElementById('words-found-count');
        const totalWords = Object.keys(this.state.wordSearch.wordLocations).length;
        if (countEl) countEl.innerText = `${this.state.wordSearch.foundWords.length} / ${totalWords} encontradas`;

        if (this.state.wordSearch.foundWords.length === totalWords) {
            clearInterval(this.state.timerInterval);
            const gt = document.getElementById('global-timer');
            if (gt) gt.classList.add('hidden');
            const btn = document.getElementById('btn-complete-stage1');
            if (btn) { btn.disabled = false; btn.classList.remove('opacity-50','cursor-not-allowed'); btn.classList.add('animate-bounce'); }
            this.playSound('fanfare');
            this.showToast("¡Encontraron todas las palabras! ¡Excelente trabajo en equipo! 🎉", "success");
        }
    },

    // ════════════════════════════════════════════════════════════
    //  TRANSICIÓN NARRATIVA CON RANKING PARCIAL
    // ════════════════════════════════════════════════════════════

    triggerTransition: function(title, message, seconds, onCompleteCallback, phaseNumber) {
        const phase     = phaseNumber || this.state.currentStage;
        const narrative = PHASE_NARRATIVES[phase] || PHASE_NARRATIVES[1];

        const titleEl = document.getElementById('trans-title');
        const descEl  = document.getElementById('trans-desc');
        const badgeEl = document.getElementById('trans-phase-label');
        if (titleEl) titleEl.innerText = title;
        if (descEl)  descEl.innerText  = message;
        if (badgeEl) badgeEl.innerText = narrative.phaseLabel;

        const iconEl = document.getElementById('trans-icon');
        const glowEl = document.getElementById('trans-icon-glow');
        const topBar = document.getElementById('trans-top-bar');
        const botBar = document.getElementById('trans-bottom-bar');
        if (iconEl) iconEl.className = `${narrative.icon} text-4xl ${narrative.iconColor}`;
        if (glowEl) glowEl.className = `absolute inset-0 ${narrative.glowClass} blur-2xl opacity-30 animate-pulse rounded-full`;
        if (topBar) topBar.className = `absolute top-0 left-0 w-full h-1.5 ${narrative.topBar} transition-all duration-1000`;
        if (botBar) botBar.className = `absolute bottom-0 left-0 w-full h-1 ${narrative.bottomBar} transition-all duration-1000`;

        const coinsDisplay = document.getElementById('trans-coins-display');
        const coinsText    = document.getElementById('trans-coins-text');
        if (coinsDisplay && coinsText) {
            coinsText.innerText = narrative.coinsText;
            coinsDisplay.classList.remove('hidden');
            coinsDisplay.classList.add('flex');
        }

        const nextTitleEl = document.getElementById('trans-next-title');
        const nextHintEl  = document.getElementById('trans-next-hint');
        if (nextTitleEl) nextTitleEl.innerText = narrative.nextTitle;
        if (nextHintEl)  nextHintEl.innerText  = narrative.nextHint;

        // Renderizar ranking parcial en la transición
        this._renderTransitionRanking();

        const countEl = document.getElementById('trans-countdown');
        if (countEl) countEl.innerText = seconds;

        const section = document.getElementById('view-transition');
        if (section) { section.classList.remove('hidden'); section.classList.add('flex'); }

        this.playSound('fanfare');

        let remaining = seconds;
        const interval = setInterval(() => {
            remaining--;
            if (countEl && remaining > 0) countEl.innerText = remaining;
            if (remaining <= 0) {
                clearInterval(interval);
                if (section) { section.classList.add('hidden'); section.classList.remove('flex'); }
                if (onCompleteCallback) onCompleteCallback();
            }
        }, 1000);
    },

    _renderTransitionRanking: function() {
        const panel = document.getElementById('trans-ranking-panel');
        const list  = document.getElementById('trans-ranking-list');
        const miniPodio = document.getElementById('trans-mini-podio');
        const myPosEl   = document.getElementById('trans-my-pos');
        const myCoinsEl = document.getElementById('trans-my-coins');

        if (!panel || !list) return;

        const myName  = this.state.teamName || "Tu equipo";
        const myCoins = this.state.tokens;

        // Construir ranking incluyendo el equipo propio si no está
        let ranking = [...(this.state.ranking || [])];
        const myEntry = ranking.find(r => r.name === myName);
        if (!myEntry) ranking.push({ name: myName, coins: myCoins });
        else myEntry.coins = myCoins;
        ranking.sort((a, b) => b.coins - a.coins);

        panel.classList.remove('hidden');

        // Mini podio (top 3)
        if (miniPodio) {
            const heights = [80, 110, 60];
            const colors  = ['from-gray-500 to-gray-400', 'from-yellow-500 to-yellow-300', 'from-amber-700 to-amber-500'];
            const order   = [1, 0, 2]; // 2do, 1ro, 3ro en posición visual
            miniPodio.innerHTML = order.map(pos => {
                const e = ranking[pos];
                if (!e) return '';
                return `<div class="flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br ${colors[pos]} flex items-center justify-center text-white text-xs font-black mb-1">${e.name.charAt(0)}</div>
                    <div class="w-16 bg-gradient-to-t ${colors[pos]} rounded-t-lg flex items-center justify-center text-white font-black text-sm" style="height:${heights[pos]}px">${pos + 1}</div>
                </div>`;
            }).join('');
        }

        // Lista de equipos
        list.innerHTML = ranking.slice(0, 6).map((entry, idx) => {
            const isMe    = entry.name === myName;
            const medals  = ['🥇', '🥈', '🥉'];
            const medal   = medals[idx] || `${idx + 1}.`;
            return `<div class="flex items-center justify-between py-1.5 px-2 rounded-lg ${isMe ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-white/3'}">
                <div class="flex items-center gap-2">
                    <span class="text-sm">${medal}</span>
                    <span class="text-xs font-bold ${isMe ? 'text-yellow-300' : 'text-gray-300'} truncate max-w-[100px]">${entry.name}${isMe ? ' (tú)' : ''}</span>
                </div>
                <span class="text-xs font-black ${isMe ? 'text-yellow-400' : 'text-gray-400'}">${entry.coins} ₿</span>
            </div>`;
        }).join('');

        // Mi posición
        const myRank = ranking.findIndex(r => r.name === myName) + 1;
        if (myPosEl)   myPosEl.innerText   = myRank > 0 ? `#${myRank}` : '#?';
        if (myCoinsEl) myCoinsEl.innerText = `${myCoins}`;
    },

    // ── PODIO ENTRE FASES ─────────────────────────────────────────
    showPodium: function(onComplete) {
        const section = document.getElementById('view-podium');
        if (!section) { if (onComplete) onComplete(); return; }

        const myCoins = this.state.tokens;
        const myName  = this.state.teamName || "Tu equipo";
        let ranking   = [...(this.state.ranking || [])];
        const myEntry = ranking.find(r => r.name === myName);
        if (!myEntry) ranking.push({ name: myName, coins: myCoins });
        else myEntry.coins = myCoins;
        ranking.sort((a, b) => b.coins - a.coins);

        [1, 2, 3].forEach(pos => {
            const entry    = ranking[pos - 1];
            const nameEl   = document.getElementById(`podium-name-${pos}`);
            const coinsEl  = document.getElementById(`podium-coins-${pos}`);
            const avatarEl = document.getElementById(`podium-avatar-${pos}`);
            if (nameEl)   nameEl.innerText   = entry ? entry.name : '—';
            if (coinsEl)  coinsEl.innerText  = entry ? `${entry.coins} ₿` : '—';
            if (avatarEl) avatarEl.innerText = entry ? entry.name.charAt(0).toUpperCase() : '?';
        });

        // Lista extendida si hay más de 3
        const extList = document.getElementById('podium-extended-list');
        if (extList && ranking.length > 3) {
            extList.classList.remove('hidden');
            extList.innerHTML = ranking.slice(3).map((e, i) => `
                <div class="flex items-center justify-between py-1 text-xs">
                    <span class="text-gray-400 font-bold">${i + 4}°</span>
                    <span class="text-gray-300 truncate max-w-[120px] mx-2">${e.name}</span>
                    <span class="text-yellow-500 font-bold">${e.coins} ₿</span>
                </div>
            `).join('');
        }

        const myRank    = ranking.findIndex(r => r.name === myName) + 1;
        const myPosEl   = document.getElementById('podium-my-pos');
        const myCoinsEl = document.getElementById('podium-my-coins');
        if (myPosEl)   myPosEl.innerText   = myRank > 0 ? `#${myRank}` : '#?';
        if (myCoinsEl) myCoinsEl.innerText = `${myCoins} HelpiCoins`;

        section.classList.remove('hidden');
        section.classList.add('flex');

        let count   = 8;
        const cntEl = document.getElementById('podium-countdown');
        if (cntEl) cntEl.innerText = count;
        this._podiumInterval = setInterval(() => {
            count--;
            if (cntEl) cntEl.innerText = count;
            if (count <= 0) this.skipPodium(onComplete);
        }, 1000);
    },

    skipPodium: function(onComplete) {
        clearInterval(this._podiumInterval);
        const section = document.getElementById('view-podium');
        if (section) { section.classList.add('hidden'); section.classList.remove('flex'); }
        if (onComplete) onComplete();
    },

    // ════════════════════════════════════════════════════════════
    //  FASE 2 — EMPATÍA
    // ════════════════════════════════════════════════════════════

    selectTopic: function(topic) {
        this.state.selectedTopic = topic;
        this.showPersonaSelection(topic);
    },

    showPersonaSelection: function(topicKey) {
        const personas     = this.state.personas[topicKey];
        const personaListEl = document.getElementById('persona-list');
        if (!personaListEl) return;
        personaListEl.innerHTML = '';

        const topicTitles = {
            adultos_mayores:    'Salud & Tecnología',
            fastfashion_desechos: 'Educación & Medioambiente',
            sustentabilidad_agua: 'Sustentabilidad del Agua',
        };
        const titleEl = document.getElementById('persona-select-title');
        if (titleEl) titleEl.innerText = `Desafíos de ${topicTitles[topicKey] || topicKey}`;

        personas.forEach((persona, index) => {
            const colorName = persona.color.replace('bg-','').split('-')[0];
            const html = `
                <div onclick="app.playSound('click'); app.selectPersona('${topicKey}', ${index})"
                    class="persona-card group relative bg-white rounded-3xl p-1 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col h-full">
                    <div class="bg-white rounded-[1.3rem] overflow-hidden flex flex-col h-full">
                        <div class="h-52 relative overflow-hidden flex-shrink-0">
                            <img src="${persona.img}" alt="${persona.name}" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.style.display='none'">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div class="absolute bottom-4 left-5 right-5">
                                <h3 class="text-xl font-bold text-white gamer-font mb-0 drop-shadow-md">${persona.name}</h3>
                            </div>
                        </div>
                        <div class="pt-4 pb-4 px-5 flex-grow flex flex-col">
                            <div class="summary-text">
                                <p class="text-sm text-gray-600 leading-relaxed text-justify font-medium">${persona.desc}</p>
                            </div>
                            <div class="full-description">
                                <p class="text-xs text-gray-600 leading-relaxed text-justify font-medium">${persona.resumen}</p>
                            </div>
                        </div>
                        <div class="px-5 pb-5 mt-auto">
                            <div class="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-500 text-center uppercase text-sm group-hover:bg-${colorName}-500 group-hover:text-white group-hover:border-${colorName}-500 transition-all duration-300">
                                Elegir este desafío
                            </div>
                        </div>
                    </div>
                </div>
            `;
            personaListEl.innerHTML += html;
        });

        this.showView('view-stage2-persona-select');
    },

    selectPersona: function(topicKey, index) {
        clearInterval(this.state.timerInterval);
        this.state.selectedPersona = this.state.personas[topicKey][index];

        document.getElementById('persona-name-map').innerText    = this.state.selectedPersona.name;
        document.getElementById('persona-problem-map').innerText = this.state.selectedPersona.resumen;
        document.getElementById('bubble-center-user').innerText  = this.state.selectedPersona.name.split(' ')[0].toUpperCase();

        const iconContainer = document.getElementById('persona-icon-large');
        if (this.state.selectedPersona.img) {
            iconContainer.innerHTML = `<img src="${this.state.selectedPersona.img}" alt="${this.state.selectedPersona.name}" class="w-full h-full object-cover rounded-xl" onerror="this.style.display='none'">`;
            iconContainer.className = `bg-white p-1 w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg overflow-hidden`;
        } else {
            iconContainer.innerHTML = `<i class="${this.state.selectedPersona.icon} text-5xl text-white"></i>`;
            iconContainer.className = `bg-gradient-to-br from-purple-400 to-pink-500 w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg`;
        }

        this.showView('view-stage2-challenge-detail');
        const timerMin = PHASE_CONFIG[2] ? PHASE_CONFIG[2].timerMin : 8;
        this.startTimer(timerMin);
    },

    completeStage2: function() {
        clearInterval(this.state.timerInterval);
        const gt = document.getElementById('global-timer');
        if (gt) gt.classList.add('hidden');
        const coins = PHASE_CONFIG[2] ? PHASE_CONFIG[2].coinsFirst : 8;
        this.addTokens(coins);

        this.triggerTransition(
            "La empatía se entrena, ¡y ustedes lo hicieron!",
            "Comprendieron el problema de alguien real. Eso es lo que separa a un emprendedor del resto. Ahora toca crear: ¿qué solución le darían con lo que tienen?",
            10,
            () => { this.startStage3(); },
            2
        );
    },

    // ════════════════════════════════════════════════════════════
    //  FASE 3 — CREATIVIDAD
    // ════════════════════════════════════════════════════════════

    startStage3: function() {
        this.showView('view-stage3');
        this.state.currentStage = 3;
        const persona = this.state.selectedPersona;
        if (persona) {
            const tituloNombre  = document.getElementById('stage3-persona-name');
            const textoResumen  = document.getElementById('stage3-problem-summary');
            const iconContainer = document.getElementById('stage3-persona-icon');
            if (tituloNombre)  tituloNombre.innerText = persona.name;
            if (textoResumen)  textoResumen.innerText = persona.desc || persona.resumen;
            if (iconContainer) {
                if (persona.img) {
                    iconContainer.innerHTML = `<img src="${persona.img}" alt="${persona.name}" class="w-full h-full object-cover rounded-xl" onerror="this.style.display='none'">`;
                    iconContainer.className = `bg-white p-1 w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg overflow-hidden`;
                } else {
                    iconContainer.innerHTML = `<i class="${persona.icon} text-4xl text-white"></i>`;
                    iconContainer.className = `bg-gradient-to-br from-orange-400 to-red-500 w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg`;
                }
            }
        }
        const timerMin = PHASE_CONFIG[3] ? PHASE_CONFIG[3].timerMin : 10;
        this.startTimer(timerMin);
    },

    newPrompt: function() {
        const icon = document.querySelector('.spin-on-hover');
        if (icon) { icon.classList.add('fa-spin'); setTimeout(() => icon.classList.remove('fa-spin'), 1000); }
        const prompts = [
            "¿Y si la solución costara $0?",
            "¿Y si fuera 100% digital (sin hardware)?",
            "¿Y si tuviera que ser usada en total oscuridad?",
            "¿Y si tuviera que pesar menos de 100 gramos?",
            "¿Y si la solución fuera para niños de 5 años?",
            "¿Y si tuvieras que explicarla en 10 palabras?",
            "¿Y si no hubiera internet disponible?",
            "¿Y si tuviera que funcionar para personas mayores de 80?",
            "¿Y si el material principal fuera cartón reciclado?",
        ];
        const el = document.getElementById('creative-prompt');
        if (el) el.innerText = `"${prompts[Math.floor(Math.random() * prompts.length)]}"`;
    },

    handlePrototypeUpload: function(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.uploadedPrototypeImage = e.target.result;
            this.playSound('success');
            this.showToast("¡Prototipo capturado con éxito!", "success");
            // Actualizar área de upload en Fase 3
            const contentContainer = document.getElementById('prototype-upload-content');
            if (contentContainer) {
                contentContainer.innerHTML = `
                    <div class="w-full h-32 rounded-lg overflow-hidden border-2 border-[#ffcf00] mb-2 shadow-lg">
                        <img src="${e.target.result}" class="w-full h-full object-cover">
                    </div>
                    <p class="text-white font-bold drop-shadow-md text-sm"><i class="fas fa-check-circle text-green-400 mr-1"></i> Imagen Capturada</p>
                    <p class="text-white/60 text-xs mt-1">Haz clic para cambiar</p>
                `;
            }
            // Precargar en Fase 4 preview card
            const previewCard = document.getElementById('prototype-preview-card');
            const previewImg  = document.getElementById('prototype-img-display');
            if (previewCard && previewImg) {
                previewImg.src = e.target.result;
                previewCard.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    },

    completeStage3: function() {
        clearInterval(this.state.timerInterval);
        const gt = document.getElementById('global-timer');
        if (gt) gt.classList.add('hidden');
        const coins = PHASE_CONFIG[3] ? PHASE_CONFIG[3].coinsFirst : 5;
        this.addTokens(coins);

        this.triggerTransition(
            "¡La creatividad en grupo no tiene límites!",
            "Construyeron algo con sus propias manos. Ahora toca el momento de la verdad: convencer a otros de que su idea vale. Preparen su pitch.",
            10,
            () => {
                this.showView('view-stage4');
                this.state.currentStage = 4;
                // Mostrar foto del prototipo en Fase 4 si existe
                if (this.state.uploadedPrototypeImage) {
                    const previewCard = document.getElementById('prototype-preview-card');
                    const previewImg  = document.getElementById('prototype-img-display');
                    if (previewCard && previewImg) {
                        previewImg.src = this.state.uploadedPrototypeImage;
                        previewCard.classList.remove('hidden');
                    }
                }
                const timerMin = PHASE_CONFIG[4] ? PHASE_CONFIG[4].timerMin : 6;
                this.startTimer(timerMin);
                let prepTime   = timerMin * 60;
                const prepDisp = document.getElementById('prep-timer-display');
                if (this.prepInterval) clearInterval(this.prepInterval);
                this.prepInterval = setInterval(() => {
                    prepTime--;
                    if (prepDisp) {
                        const m = Math.floor(prepTime / 60).toString().padStart(2, '0');
                        const s = (prepTime % 60).toString().padStart(2, '0');
                        prepDisp.innerText = `${m}:${s}`;
                    }
                    if (prepTime <= 0) clearInterval(this.prepInterval);
                }, 1000);
            },
            3
        );
    },

    // ════════════════════════════════════════════════════════════
    //  FASE 4 — COMUNICACIÓN (PITCH)
    // ════════════════════════════════════════════════════════════

    startPitchMode: function() {
        document.getElementById('pitch-overlay').classList.remove('hidden');
        const pitchSec  = PHASE_CONFIG[4] ? PHASE_CONFIG[4].pitchSec : 90;
        let pitchTime   = pitchSec;
        const pDisplay  = document.getElementById('pitch-timer');
        const m0 = Math.floor(pitchSec / 60).toString().padStart(2, '0');
        const s0 = (pitchSec % 60).toString().padStart(2, '0');
        if (pDisplay) { pDisplay.innerText = `${m0}:${s0}`; pDisplay.classList.remove('text-red-500','animate-pulse'); }

        if (this.currentPitchInterval) clearInterval(this.currentPitchInterval);
        this.currentPitchInterval = setInterval(() => {
            pitchTime--;
            const m = Math.floor(pitchTime / 60).toString().padStart(2, '0');
            const s = (pitchTime % 60).toString().padStart(2, '0');
            if (pDisplay) pDisplay.innerText = `${m}:${s}`;
            if (pitchTime <= 10) { if (pDisplay) pDisplay.classList.add('text-red-500','animate-pulse'); if (pitchTime > 0) this.playSound('countdown'); }
            if (pitchTime <= 0)  { clearInterval(this.currentPitchInterval); this.playSound('success'); this.endPitch(); }
        }, 1000);
    },

    endPitch: function() {
        if (this.currentPitchInterval) clearInterval(this.currentPitchInterval);
        document.getElementById('pitch-overlay').classList.add('hidden');
        const coins = PHASE_CONFIG[4] ? PHASE_CONFIG[4].coinsFirst : 3;
        this.addTokens(coins);
        this.showView('view-stage5');
        this.state.currentStage = 5;
        // Cargar lista de equipos para evaluar
        this._loadEvalTeams();
    },

    // ════════════════════════════════════════════════════════════
    //  FASE 5 — NEGOCIACIÓN / EVALUACIÓN CON BORRADORES
    // ════════════════════════════════════════════════════════════

    _loadEvalTeams: function() {
        const listEl    = document.getElementById('eval-teams-list');
        const manualDiv = document.getElementById('eval-manual-input');
        if (!listEl) return;

        // Intentar obtener equipos del servidor
        const codigo = this.state.sessionCode || '';
        if (codigo) {
            fetch(`/api/obtener-equipos/${codigo}/`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok' && data.equipos && data.equipos.length > 0) {
                    this._renderEvalTeamList(data.equipos.map(e => e.nombre).filter(n => n !== this.state.teamName));
                } else {
                    if (manualDiv) manualDiv.classList.remove('hidden');
                    listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No se encontraron otros equipos. Ingrésalos manualmente.</p>';
                }
            })
            .catch(() => {
                if (manualDiv) manualDiv.classList.remove('hidden');
                listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">Sin conexión al servidor. Usa el campo manual.</p>';
            });
        } else {
            // Modo offline / demo: mostrar un par de equipos de ejemplo
            this._renderEvalTeamList(['Equipo Alpha', 'Equipo Beta', 'Equipo Gamma', 'Equipo Delta']);
        }
    },

    _renderEvalTeamList: function(teams) {
        const listEl = document.getElementById('eval-teams-list');
        if (!listEl) return;

        if (teams.length === 0) {
            listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">No hay otros equipos registrados.</p>';
            return;
        }

        listEl.innerHTML = teams.map(name => {
            const hasDraft  = !!this.state.evaluationDrafts[name];
            const draftInfo = hasDraft ? `<span class="ml-auto bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold">Borrador guardado</span>` : '';
            return `
                <button onclick="app.setEvalTarget('${name}')"
                    class="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${hasDraft ? 'border-green-500/40 bg-green-900/10 hover:bg-green-900/20' : 'border-gray-700 bg-gray-800 hover:border-orange-400 hover:bg-gray-750'}"
                    id="eval-team-btn-${name.replace(/\s+/g, '-')}">
                    <div class="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">${name.charAt(0)}</div>
                    <span class="font-bold text-gray-200 text-sm">${name}</span>
                    ${draftInfo}
                </button>
            `;
        }).join('');
    },

    setEvalTarget: function(teamName) {
        if (!teamName || teamName === this.state.teamName) {
            this.showToast("No puedes evaluarte a ti mismo", "error");
            return;
        }
        this.state.currentEvalTarget = teamName;
        const maxCoins = PHASE_CONFIG[5] ? PHASE_CONFIG[5].evalCoinsPerTeam : 11;

        // Cargar borrador si existe
        const draft = this.state.evaluationDrafts[teamName];
        if (draft) {
            this.state.evaluacion.stats    = { ...draft.stats };
            this.state.evaluacion.currentCoins = maxCoins - (draft.stats.stat1 + draft.stats.stat2 + draft.stats.stat3 + draft.stats.stat4);
        } else {
            this.state.evaluacion.stats    = { stat1: 0, stat2: 0, stat3: 0, stat4: 0 };
            this.state.evaluacion.currentCoins = maxCoins;
        }
        this.state.evaluacion.maxCoins = maxCoins;

        // Actualizar UI
        const nameEl    = document.getElementById('eval-target-name');
        const counterEl = document.getElementById('helpi-coin-counter');
        if (nameEl)    nameEl.innerText    = teamName;
        if (counterEl) counterEl.innerText = this.state.evaluacion.currentCoins;

        ['stat1','stat2','stat3','stat4'].forEach(s => {
            const el = document.getElementById(`${s}-val`);
            if (el) el.innerText = this.state.evaluacion.stats[s];
        });

        const panel = document.getElementById('eval-panel');
        if (panel) panel.classList.remove('hidden');
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    allocateCoins: function(statId, amount) {
        const currentStatVal = this.state.evaluacion.stats[statId];
        const availableCoins = this.state.evaluacion.currentCoins;

        if (amount < 0) {
            if (currentStatVal > 0) {
                this.state.evaluacion.stats[statId]--;
                this.state.evaluacion.currentCoins++;
                this.playSound('click');
            } else {
                this.playSound('error');
                this.shakeElement(`${statId}-val`);
                return;
            }
        } else {
            if (availableCoins > 0) {
                if (currentStatVal < 5) {
                    this.state.evaluacion.stats[statId]++;
                    this.state.evaluacion.currentCoins--;
                    this.playSound('click');
                } else {
                    this.showToast("Máximo 5 monedas por categoría.", "error");
                    this.playSound('error');
                    this.shakeElement(`${statId}-val`);
                    return;
                }
            } else {
                this.showToast("¡No te quedan HelpiCoins para este equipo!", "error");
                this.playSound('error');
                this.shakeElement('helpi-coin-counter');
                return;
            }
        }

        const el = document.getElementById(`${statId}-val`);
        const cc = document.getElementById('helpi-coin-counter');
        if (el) el.innerText = this.state.evaluacion.stats[statId];
        if (cc) cc.innerText = this.state.evaluacion.currentCoins;
    },

    saveDraft: function() {
        const target = this.state.currentEvalTarget;
        if (!target) { this.showToast("Selecciona un equipo primero", "error"); return; }

        const stats = { ...this.state.evaluacion.stats };
        const total = stats.stat1 + stats.stat2 + stats.stat3 + stats.stat4;
        this.state.evaluationDrafts[target] = { stats, total };

        this.showToast(`Borrador guardado para ${target} (${total} coins)`, "success");
        this._updateDraftsSummary();

        // Actualizar el botón del equipo en la lista
        this._renderEvalTeamList(Object.keys(this.state.evaluationDrafts).concat(
            Array.from(document.querySelectorAll('#eval-teams-list button')).map(b => b.querySelector('span.font-bold')?.innerText).filter(n => n && !this.state.evaluationDrafts[n])
        ));
    },

    _updateDraftsSummary: function() {
        const summaryDiv  = document.getElementById('drafts-summary');
        const draftsList  = document.getElementById('drafts-list');
        const submitBtn   = document.getElementById('btn-submit-all');
        const countBadge  = document.getElementById('drafts-count-badge');

        const drafts = this.state.evaluationDrafts;
        const count  = Object.keys(drafts).length;

        if (!summaryDiv) return;
        summaryDiv.classList.remove('hidden');

        if (draftsList) {
            draftsList.innerHTML = Object.entries(drafts).map(([name, draft]) => `
                <div class="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl p-3">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-400 text-sm"></i>
                        <span class="font-bold text-gray-200 text-sm">${name}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-orange-400 font-bold text-sm">${draft.total} ₿</span>
                        <button onclick="app.setEvalTarget('${name}')" class="text-xs text-gray-500 hover:text-orange-400 transition font-bold">Editar</button>
                    </div>
                </div>
            `).join('');
        }

        if (countBadge) countBadge.innerText = `${count} listo${count !== 1 ? 's' : ''}`;
        if (submitBtn) {
            if (count > 0) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50','cursor-not-allowed');
            } else {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50','cursor-not-allowed');
            }
        }
    },

    submitAllEvaluations: async function() {
        const drafts = this.state.evaluationDrafts;
        if (Object.keys(drafts).length === 0) {
            this.showToast("No hay borradores guardados aún", "error");
            return;
        }

        // Transformar borradores a formato de payload
        const evaluaciones = Object.entries(drafts).map(([nombre, draft]) => ({
            equipo_evaluado: nombre,
            equipo_evaluador: this.state.teamName,
            ...draft.stats,
            total: draft.total,
        }));

        try {
            const response = await fetch('/api/enviar-evaluaciones/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluaciones, codigo: this.state.sessionCode })
            });
            const result = await response.json();
            if (result.status === 'ok') {
                this.playSound('fanfare');
                this.addTokens(5);
                this._showFinalResults();
            } else {
                // Modo offline: avanzar igual
                this.playSound('success');
                this.addTokens(5);
                this._showFinalResults();
            }
        } catch(e) {
            // Modo offline
            this.playSound('success');
            this.addTokens(5);
            this._showFinalResults();
        }
    },

    _showFinalResults: function() {
        const myName  = this.state.teamName || "Tu Equipo";
        const myCoins = this.state.tokens;
        let ranking   = [...(this.state.ranking || [])];
        const myEntry = ranking.find(r => r.name === myName);
        if (!myEntry) ranking.push({ name: myName, coins: myCoins });
        else myEntry.coins = myCoins;
        ranking.sort((a, b) => b.coins - a.coins);

        this._renderFinalPodio(ranking);
        this.showView('view-stage6');
        this.playSound('fanfare');
    },

    _renderFinalPodio: function(ranking) {
        const container = document.getElementById('podio-final-container');
        const tabla     = document.getElementById('tabla-clasificacion');
        const myName    = this.state.teamName || "Tu Equipo";
        const myPos     = ranking.findIndex(r => r.name === myName) + 1;

        // Mi equipo destacado
        const myHighlight = document.getElementById('my-team-highlight');
        const myResultTxt = document.getElementById('my-team-result-text');
        if (myHighlight) myHighlight.classList.remove('hidden');
        if (myResultTxt) {
            const posWord = myPos === 1 ? '🥇 ¡PRIMER LUGAR!' : myPos === 2 ? '🥈 Segundo lugar' : myPos === 3 ? '🥉 Tercer lugar' : `#${myPos} en el ranking`;
            myResultTxt.innerHTML = `${myName} — <span class="text-yellow-400">${this.state.tokens} HelpiCoins</span> — ${posWord}`;
        }

        // Podio visual
        if (!container) return;
        const heightMap  = [192, 256, 160, 128, 96];
        const colorMap   = [
            'from-gray-500 to-gray-300 border-gray-400',
            'from-yellow-500 to-yellow-300 border-yellow-400',
            'from-amber-700 to-amber-500 border-amber-600',
            'from-blue-700 to-blue-500 border-blue-600',
            'from-purple-700 to-purple-500 border-purple-600',
        ];
        const visualOrder = [1, 0, 2, 3, 4];

        container.innerHTML = `<div class="flex justify-center items-end gap-3 px-4 mb-4" style="min-height:18rem">${
            visualOrder.map(pos => {
                if (!ranking[pos]) return '';
                const entry  = ranking[pos];
                const isMe   = entry.name === myName;
                const h      = heightMap[pos] || 80;
                const colors = colorMap[pos] || colorMap[4];
                const crown  = pos === 0 ? `<i class="fas fa-crown text-yellow-400 text-2xl mb-1 animate-bounce"></i>` : '';
                const medal  = ['🥇','🥈','🥉','4°','5°'][pos] || `${pos+1}°`;
                return `<div class="flex flex-col items-center ${isMe ? 'scale-110 relative' : ''}">
                    ${crown}
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br ${colors} border-2 flex items-center justify-center mb-1 text-sm font-black text-white gamer-font ${isMe ? 'shadow-lg shadow-yellow-500/60 ring-2 ring-yellow-400' : ''}">${entry.name.charAt(0).toUpperCase()}</div>
                    <div class="text-xs font-bold ${isMe ? 'text-yellow-300' : 'text-gray-400'} mb-1 truncate max-w-[80px] text-center">${entry.name}${isMe ? ' ★' : ''}</div>
                    <div class="text-xs font-bold ${isMe ? 'text-yellow-400' : 'text-gray-500'} mb-1">${entry.coins} ₿</div>
                    <div class="w-20 bg-gradient-to-t ${colors} border-t-4 rounded-t-xl flex flex-col items-center justify-end pb-3 ${isMe ? 'shadow-lg shadow-yellow-500/20' : ''}" style="height:${h}px">
                        <span class="text-xl font-black text-white gamer-font">${medal}</span>
                    </div>
                </div>`;
            }).join('')
        }</div>`;

        // Tabla completa
        if (tabla && ranking.length > 0) {
            tabla.innerHTML = `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div class="bg-gray-800 px-5 py-3 text-left">
                        <h3 class="text-white font-bold gamer-font text-sm uppercase tracking-wider">Clasificación Completa</h3>
                    </div>
                    ${ranking.map((entry, idx) => {
                        const isMe   = entry.name === myName;
                        const medals = ['🥇','🥈','🥉'];
                        const medal  = medals[idx] || `${idx + 1}°`;
                        return `<div class="flex items-center justify-between py-3 px-5 ${isMe ? 'bg-yellow-50 border-l-4 border-yellow-400' : idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                            <div class="flex items-center gap-3">
                                <span class="text-base w-8 text-center">${medal}</span>
                                <span class="font-bold text-gray-800 ${isMe ? 'text-yellow-700' : ''}">${entry.name}${isMe ? ' ← Tu equipo' : ''}</span>
                            </div>
                            <span class="font-black text-lg ${isMe ? 'text-yellow-600' : 'text-gray-600'}">${entry.coins} <span class="text-xs text-gray-400 font-normal">HC</span></span>
                        </div>`;
                    }).join('')}
                </div>`;
        }
    },

    // Mantener submitEvaluation por compatibilidad (modo legacy sin borradores)
    submitEvaluation: function() {
        if (this.state.currentEvalTarget) {
            this.saveDraft();
        }
        this.submitAllEvaluations();
    },

    // Agregar equipo manualmente en evaluación (fallback sin servidor)
    _addManualTeam: function() {
        const input = document.getElementById('eval-manual-team-name');
        if (!input) return;
        const name = input.value.trim();
        if (!name) { this.showToast("Ingresa un nombre válido", "error"); return; }
        if (name === this.state.teamName) { this.showToast("No puedes evaluarte a ti mismo", "error"); return; }
        input.value = '';

        // Agregar al estado y re-renderizar
        const existing = Array.from(document.querySelectorAll('#eval-teams-list button'))
            .map(b => b.querySelector('span.font-bold')?.innerText).filter(Boolean);
        if (existing.includes(name)) { this.showToast("Ese equipo ya está en la lista", "error"); return; }
        this._renderEvalTeamList([...existing, name]);
        this.showToast(`${name} agregado`, "success");
    },

    shakeElement: function(elementId) {
        const el = document.getElementById(elementId);
        if (el) { el.classList.add('animate-shake','text-red-500'); setTimeout(() => el.classList.remove('animate-shake','text-red-500'), 500); }
    },

    // ════════════════════════════════════════════════════════════
    //  ADMINISTRACIÓN (Dashboard con configuración de fases)
    // ════════════════════════════════════════════════════════════

    adminLogin: function() {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;
        if (user === 'shlam' && pass === '1234') {
            this.playSound('success');
            this.showView('view-admin-dashboard');
            setTimeout(() => {
                this.loadAdminData();
                this._renderAdminConfigPanel();
                this._switchAdminTab('teams');
            }, 100);
        } else {
            this.playSound('error');
            this.showToast('Acceso denegado. Credenciales inválidas.', 'error');
            document.getElementById('admin-pass').value = '';
            const passEl = document.getElementById('admin-pass');
            if (passEl) { passEl.classList.add('border-red-500','animate-shake'); setTimeout(() => passEl.classList.remove('border-red-500','animate-shake'), 500); }
        }
    },

    loadAdminData: function() {
        const grid = document.getElementById('admin-teams-grid');
        if (grid) grid.innerHTML = '<p class="text-gray-500 ml-4">Cargando datos...</p>';

        fetch('/api/admin-stats/')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                const tt = document.getElementById('admin-total-teams');
                const ta = document.getElementById('admin-total-agents');
                if (tt) tt.innerText = data.total_equipos;
                if (ta) ta.innerText = data.total_agentes;
                if (grid) {
                    grid.innerHTML = '';
                    if (data.equipos.length === 0) {
                        grid.innerHTML = '<p class="text-gray-500 col-span-full ml-4">No hay equipos registrados aún.</p>';
                        return;
                    }
                    data.equipos.forEach(team => {
                        let membersHtml = team.miembros.map(m =>
                            `<div class="flex items-center text-sm text-gray-300 mb-1"><i class="fas fa-user-astronaut text-gray-500 mr-2 text-xs"></i>${m}</div>`
                        ).join('');
                        grid.innerHTML += `
                            <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-pink-500 transition shadow-lg relative overflow-hidden group">
                                <div class="absolute top-0 right-0 bg-gray-700 text-xs text-white px-2 py-1 rounded-bl-lg font-mono">${team.codigo_sesion}</div>
                                <h3 class="text-xl font-bold text-white mb-1 gamer-font group-hover:text-pink-500 transition truncate">${team.nombre}</h3>
                                <p class="text-xs text-gray-500 uppercase font-bold mb-4">${team.miembros.length} Agentes</p>
                                <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 min-h-[80px]">${membersHtml || '<span class="text-gray-600 text-xs">Sin miembros</span>'}</div>
                            </div>
                        `;
                    });
                }
            } else {
                this.showToast("Error al cargar datos del servidor", "error");
            }
        })
        .catch(() => {
            if (grid) grid.innerHTML = '<p class="text-red-500 ml-4">Error de conexión.</p>';
        });
    },

    // ── PESTAÑAS ADMIN ───────────────────────────────────────────
    _switchAdminTab: function(tab) {
        // Ocultar todas las tabs y desactivar botones
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('border-pink-500', 'text-white');
            btn.classList.add('border-transparent', 'text-gray-400');
            const icon = btn.querySelector('i');
            if (icon) { icon.className = icon.className.replace(/text-\w+-\d+/, 'text-gray-400'); }
        });
        // Mostrar la tab activa
        const content = document.getElementById(`tab-${tab}`);
        const btn     = document.getElementById(`tab-btn-${tab}`);
        if (content) content.classList.remove('hidden');
        if (btn) {
            btn.classList.add('border-pink-500', 'text-white');
            btn.classList.remove('border-transparent', 'text-gray-400');
        }
        // Acciones por tab
        if (tab === 'config') this._renderAdminConfigPanel();
        if (tab === 'ranking') this._loadLiveRanking();
    },

    _loadLiveRanking: function() {
        const listEl = document.getElementById('admin-ranking-list');
        if (!listEl) return;
        listEl.innerHTML = '<p class="text-gray-500 text-center py-4 animate-pulse">Cargando ranking...</p>';

        fetch('/api/admin-ranking/')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok' && data.ranking && data.ranking.length > 0) {
                listEl.innerHTML = data.ranking.map((entry, idx) => {
                    const medals = ['🥇','🥈','🥉'];
                    const medal  = medals[idx] || `${idx + 1}°`;
                    return `<div class="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 hover:border-yellow-500/50 transition">
                        <div class="flex items-center gap-3">
                            <span class="text-lg">${medal}</span>
                            <span class="font-bold text-white">${entry.name || entry.nombre}</span>
                        </div>
                        <span class="font-black text-yellow-400 text-lg">${entry.coins || entry.tokens || 0} <span class="text-xs text-gray-500 font-normal">HC</span></span>
                    </div>`;
                }).join('');
            } else {
                // Modo offline: mostrar ranking local si existe
                listEl.innerHTML = '<p class="text-gray-500 text-center py-4">No hay datos de ranking disponibles aún.</p>';
            }
        })
        .catch(() => {
            listEl.innerHTML = '<p class="text-red-500 text-center py-4"><i class="fas fa-exclamation-triangle mr-2"></i>Sin conexión al servidor.</p>';
        });
    },

    // ── CONFIG DE FASES DESDE ADMIN ──────────────────────────────
    // Estos métodos permiten al admin cambiar tiempos y coins en tiempo real
    updatePhaseConfig: function(phase, field, value) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) return;
        if (!PHASE_CONFIG[phase]) PHASE_CONFIG[phase] = {};
        PHASE_CONFIG[phase][field] = num;

        // Sincronizar con el servidor si está conectado
        fetch('/api/admin/update-config/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase, field, value: num, codigo: this.currentSessionCode })
        }).catch(() => {}); // Silenciar errores si no hay servidor
    },

    resetPhaseConfigToDefaults: function() {
        PHASE_CONFIG = JSON.parse(JSON.stringify(PHASE_CONFIG_DEFAULTS));
        this.showToast("Configuración reiniciada a valores por defecto", "success");
        // Re-render el panel si está abierto
        const panel = document.getElementById('admin-config-panel');
        if (panel) this._renderAdminConfigPanel();
    },

    _renderAdminConfigPanel: function() {
        const panel = document.getElementById('admin-config-panel');
        if (!panel) return;

        const phaseNames = {
            1: { name: 'Trabajo en Equipo', icon: 'fa-users', color: 'yellow' },
            2: { name: 'Empatía', icon: 'fa-heart', color: 'purple' },
            3: { name: 'Creatividad (LEGO)', icon: 'fa-cube', color: 'red' },
            4: { name: 'Comunicación (Pitch)', icon: 'fa-microphone', color: 'emerald' },
            5: { name: 'Negociación', icon: 'fa-handshake', color: 'orange' },
        };

        panel.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl text-white font-bold gamer-font"><i class="fas fa-sliders-h text-pink-500 mr-2"></i>Configuración de Fases</h3>
                <button onclick="app.resetPhaseConfigToDefaults()" class="text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-lg transition font-bold">
                    <i class="fas fa-undo mr-1"></i>Restaurar
                </button>
            </div>
            ${[1, 2, 3, 4, 5].map(phase => {
                const cfg = PHASE_CONFIG[phase] || {};
                const def = PHASE_CONFIG_DEFAULTS[phase] || {};
                const info = phaseNames[phase];
                return `
                    <div class="bg-gray-800 rounded-xl p-5 mb-4 border border-gray-700">
                        <h4 class="text-${info.color}-400 font-bold gamer-font mb-4 flex items-center gap-2">
                            <i class="fas ${info.icon}"></i> Fase ${phase} — ${info.name}
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                            ${cfg.timerMin !== undefined ? `
                            <div>
                                <label class="text-gray-500 text-xs font-bold uppercase block mb-1">Duración (min)</label>
                                <input type="number" min="1" max="60" value="${cfg.timerMin}"
                                    onchange="app.updatePhaseConfig(${phase}, 'timerMin', this.value)"
                                    class="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:border-pink-500 outline-none font-mono">
                            </div>` : ''}
                            ${cfg.pitchSec !== undefined ? `
                            <div>
                                <label class="text-gray-500 text-xs font-bold uppercase block mb-1">Duración Pitch (seg)</label>
                                <input type="number" min="30" max="300" value="${cfg.pitchSec}"
                                    onchange="app.updatePhaseConfig(${phase}, 'pitchSec', this.value)"
                                    class="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:border-pink-500 outline-none font-mono">
                            </div>` : ''}
                            ${cfg.coinsFirst !== undefined ? `
                            <div>
                                <label class="text-gray-500 text-xs font-bold uppercase block mb-1">🥇 Coins 1er lugar</label>
                                <input type="number" min="0" max="30" value="${cfg.coinsFirst}"
                                    onchange="app.updatePhaseConfig(${phase}, 'coinsFirst', this.value)"
                                    class="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:border-pink-500 outline-none font-mono">
                            </div>` : ''}
                            ${cfg.coinsSecond !== undefined ? `
                            <div>
                                <label class="text-gray-500 text-xs font-bold uppercase block mb-1">🥈 Coins 2do lugar</label>
                                <input type="number" min="0" max="30" value="${cfg.coinsSecond}"
                                    onchange="app.updatePhaseConfig(${phase}, 'coinsSecond', this.value)"
                                    class="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:border-pink-500 outline-none font-mono">
                            </div>` : ''}
                            ${cfg.coinsThird !== undefined ? `
                            <div>
                                <label class="text-gray-500 text-xs font-bold uppercase block mb-1">🥉 Coins 3er lugar</label>
                                <input type="number" min="0" max="30" value="${cfg.coinsThird}"
                                    onchange="app.updatePhaseConfig(${phase}, 'coinsThird', this.value)"
                                    class="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:border-pink-500 outline-none font-mono">
                            </div>` : ''}
                            ${cfg.evalCoinsPerTeam !== undefined ? `
                            <div>
                                <label class="text-gray-500 text-xs font-bold uppercase block mb-1">Coins por evaluación</label>
                                <input type="number" min="5" max="30" value="${cfg.evalCoinsPerTeam}"
                                    onchange="app.updatePhaseConfig(${phase}, 'evalCoinsPerTeam', this.value)"
                                    class="w-full bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:border-pink-500 outline-none font-mono">
                            </div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    },

    // ════════════════════════════════════════════════════════════
    //  PROFESOR
    // ════════════════════════════════════════════════════════════

    initProfessorView: function() {
        const codeDisplay = document.getElementById('prof-session-code');
        if (codeDisplay) codeDisplay.innerText = "CONECTANDO...";

        fetch('/api/crear-sesion/', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                this.currentSessionCode = data.codigo;
                if (codeDisplay) codeDisplay.innerText = data.codigo;
                this.startPollingTeams(data.codigo);
            } else {
                if (codeDisplay) codeDisplay.innerText = "ERROR";
            }
        })
        .catch(() => { if (codeDisplay) codeDisplay.innerText = "OFFLINE"; });
    },

    startPollingTeams: function(codigoSesion) {
        const grid    = document.getElementById('prof-teams-grid');
        const countEl = document.getElementById('prof-team-count');
        if (this.pollingInterval) clearInterval(this.pollingInterval);

        this.pollingInterval = setInterval(() => {
            fetch(`/api/obtener-equipos/${codigoSesion}/`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') {
                    if (countEl) countEl.innerText = data.equipos.length;
                    if (grid) {
                        grid.innerHTML = '';
                        if (data.equipos.length === 0) {
                            grid.innerHTML = '<p class="text-gray-500 col-span-full text-center">Esperando alumnos...</p>';
                            return;
                        }
                        data.equipos.forEach(equipo => {
                            grid.innerHTML += `
                                <div class="bg-white p-3 rounded-xl shadow-lg flex items-center justify-between border-l-4 border-green-500">
                                    <span class="font-bold text-gray-800 truncate uppercase">${equipo.nombre}</span>
                                    <i class="fas fa-check-circle text-green-500 text-xl"></i>
                                </div>
                            `;
                        });
                    }
                }
            })
            .catch(() => {});
        }, 3000);
    },

    copyCode: function() {
        const el = document.getElementById('prof-session-code');
        if (!el) return;
        const code = el.innerText;
        if (['CONECTANDO...','OFFLINE','ERROR'].includes(code)) return;
        navigator.clipboard.writeText(code).then(() => this.showToast(`Código copiado: ${code}`, 'success')).catch(() => {});
    },

    profesorStartGame: async function() {
        await fetch(`/api/admin/start/?codigo=${this.currentSessionCode}`, { method: 'POST' }).catch(() => {});
        this.showToast("Juego Iniciado. Equipos sincronizados.", "success");
    },

    profesorTogglePause: async function() {
        const btn = document.getElementById('btn-prof-pause');
        const isPausing = btn && btn.innerText.includes("PAUSAR");
        await fetch(`/api/admin/pause/?codigo=${this.currentSessionCode}&state=${isPausing}`, { method: 'POST' }).catch(() => {});
        if (btn) {
            if (isPausing) { btn.innerHTML = '<i class="fas fa-play mr-3"></i> REANUDAR JUEGO'; btn.classList.replace('bg-yellow-500','bg-green-500'); }
            else           { btn.innerHTML = '<i class="fas fa-pause mr-3"></i> PAUSAR TODOS';  btn.classList.replace('bg-green-500','bg-yellow-500'); }
        }
    },

    profesorKickTeam: async function(teamId) {
        if (confirm("¿Seguro que quieres expulsar a este escuadrón?")) {
            await fetch(`/api/admin/kick/?team_id=${teamId}`, { method: 'POST' }).catch(() => {});
            this.showToast("Equipo expulsado", "success");
        }
    },

    // ── LOBBY / SYNC ──────────────────────────────────────────────
    showLobbyWaitingScreen: function() {
        this.showView('view-login');
        setTimeout(() => {
            const step2   = document.getElementById('login-step-2');
            const waiting = document.getElementById('lobby-waiting-screen');
            if (step2)   step2.classList.add('hidden');
            if (waiting) waiting.classList.remove('hidden');
        }, 160);
    },

    startGlobalSync: function() {
        if (this.globalSyncInterval) clearInterval(this.globalSyncInterval);
        this.globalSyncInterval = setInterval(async () => {
            if (!this.state.sessionCode || !this.state.teamName) return;
            try {
                const response = await fetch(`/api/estado-juego/?codigo=${this.state.sessionCode}&equipo=${this.state.teamName}`);
                const data     = await response.json();
                if (data.status === 'ok') this.handleServerState(data);
                else if (data.status === 'kicked') this.handleKicked();
            } catch(e) {}
        }, 3000);
    },

    handleServerState: function(serverData) {
        if (serverData.paused) {
            if (!this.state.isPaused) {
                this.state.isPaused = true;
                clearInterval(this.state.timerInterval);
                const overlay = document.getElementById('phase-transition-overlay');
                const display = document.getElementById('correct-words-display');
                if (overlay) overlay.classList.remove('hidden');
                if (display) display.innerHTML = "<i class='fas fa-pause-circle text-5xl text-yellow-500 mb-4'></i><br>JUEGO EN PAUSA";
            }
            return;
        } else if (this.state.isPaused) {
            this.state.isPaused = false;
            const overlay = document.getElementById('phase-transition-overlay');
            if (overlay) overlay.classList.add('hidden');
            this.startTimer(serverData.tiempo_restante / 60);
        }

        // Actualizar ranking si el servidor lo envía
        if (serverData.ranking) {
            this.state.ranking = serverData.ranking;
        }

        if (serverData.current_stage > this.state.currentStage) {
            this.state.currentStage = serverData.current_stage;
            const section = document.getElementById('view-transition');
            if (section) section.classList.add('hidden');
            if      (this.state.currentStage === 1) this.showView('view-stage1-intro');
            else if (this.state.currentStage === 2) this.showView('view-stage2-topics');
            else if (this.state.currentStage === 3) this.startStage3();
            else if (this.state.currentStage === 4) this.showView('view-stage4');
        }
    },

    handleKicked: function() {
        clearInterval(this.globalSyncInterval);
        alert("Has sido expulsado de la sesión por el administrador.");
        window.location.reload();
    },

    // ── EXCEL UPLOAD ─────────────────────────────────────────────
    triggerExcelUpload: function() {
        const input = document.getElementById('excel-upload-input');
        if (input) input.click();
    },

    handleExcelUpload: async function(event) {
        const file       = event.target.files[0];
        if (!file) return;
        const statusIcon = document.getElementById('excel-status-icon');
        const statusText = document.getElementById('excel-status');
        if (statusIcon) statusIcon.className = 'fas fa-spinner fa-spin text-xl text-yellow-400 mb-1';
        if (statusText) { statusText.textContent = 'Procesando...'; statusText.className = 'text-yellow-400 font-semibold text-xs tracking-wider uppercase'; }

        try {
            const buffer = await file.arrayBuffer();
            let alumnos  = [];
            if (typeof XLSX !== 'undefined') {
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheet    = workbook.Sheets[workbook.SheetNames[0]];
                const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
                let startRow   = 0;
                if (rows.length > 0 && rows[0].map(c => String(c).toLowerCase()).some(c => c.includes('nombre') || c.includes('name'))) startRow = 1;
                for (let i = startRow; i < rows.length; i++) {
                    const nombre  = String(rows[i][0] || '').trim();
                    const carrera = String(rows[i][1] || 'Sin definir').trim();
                    if (nombre) alumnos.push({ nombre, carrera });
                }
            }

            if (alumnos.length < 2) throw new Error('El archivo necesita al menos 2 alumnos.');
            if (statusText) statusText.textContent = `${alumnos.length} alumnos. Agrupando...`;

            const response = await fetch('/api/agrupar-alumnos/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alumnos, tamano_grupo: 4 })
            });
            const result = await response.json();
            if (result.status !== 'ok') throw new Error(result.error || 'Error desconocido');

            this._renderAIGroups(result.grupos);
            if (statusIcon) statusIcon.className = 'fas fa-check-circle text-xl text-green-400 mb-1';
            if (statusText) { statusText.textContent = `${result.total_grupos} grupos listos`; statusText.className = 'text-green-400 font-semibold text-xs tracking-wider uppercase'; }
            this.playSound('success');
        } catch(err) {
            if (statusIcon) statusIcon.className = 'fas fa-exclamation-triangle text-xl text-red-400 mb-1';
            if (statusText) { statusText.textContent = 'Error'; statusText.className = 'text-red-400 font-semibold text-xs tracking-wider uppercase'; }
            this.showToast(err.message || 'Error al procesar', 'error');
        }
        event.target.value = '';
    },

    _renderAIGroups: function(grupos) {
        const grid = document.getElementById('prof-teams-grid');
        if (!grid) return;
        grid.innerHTML = '';
        const colors = ['border-pink-500','border-blue-500','border-green-500','border-yellow-500','border-purple-500','border-red-500'];
        grupos.forEach((grupo, idx) => {
            const integrantesHtml = (grupo.integrantes || []).map(m =>
                `<div class="flex items-center gap-2 text-xs text-gray-300 mb-1">
                    <i class="fas fa-user-astronaut text-gray-500"></i>
                    <span class="font-semibold">${m.nombre}</span>
                    <span class="bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">${m.carrera || ''}</span>
                </div>`
            ).join('');
            grid.innerHTML += `
                <div class="bg-gray-800 rounded-xl p-4 border-l-4 ${colors[idx % colors.length]} shadow-lg hover:shadow-pink-500/10 transition">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-white font-bold gamer-font truncate">${grupo.nombre}</h3>
                        <span class="bg-gray-700 text-gray-300 text-xs font-bold px-2 py-1 rounded-full">${(grupo.integrantes || []).length} ag.</span>
                    </div>
                    <div class="space-y-0.5">${integrantesHtml}</div>
                </div>
            `;
        });
        const countEl = document.getElementById('prof-team-count');
        if (countEl) countEl.innerText = grupos.length;
    },

    // ── COMMUNICATOR / HELP INTRO ────────────────────────────────
    runCommunicatorIntro: function() {
        const btn = document.getElementById('base-communicator-btn');
        if (!btn) return;
        btn.classList.remove('hidden');
        btn.classList.add('comm-center');
        setTimeout(() => {
            btn.classList.remove('comm-center');
            btn.classList.add('comm-docked');
        }, 3000);
    },
};

// ════════════════════════════════════════════════════════════════
//  LÓGICA DE CARTAS (fuera del objeto app)
// ════════════════════════════════════════════════════════════════
window._mazoActual = [];

function resetCardUI() {
    window._cardsDrawnCount = 0;
    const pregEl    = document.getElementById("pregunta-texto");
    const counterEl = document.getElementById("counter");
    const btn       = document.getElementById("btn-draw");
    const nextBtn   = document.getElementById("next-stage-btn");
    const msgEl     = document.getElementById("completion-msg");

    if (pregEl)    pregEl.textContent    = "Cuando estén listos, saquen la primera carta. ¡Respondan todos!";
    if (counterEl) counterEl.textContent = "0 / 3 cartas";
    if (btn) { btn.innerHTML = '<i class="fas fa-random"></i> Sacar Carta'; btn.onclick = drawCard; btn.style.display = ''; }
    if (nextBtn) nextBtn.classList.add("hidden");
    if (msgEl)   msgEl.classList.add("hidden");

    [1, 2, 3].forEach(n => {
        const dot = document.getElementById(`card-dot-${n}`);
        if (dot) dot.className = "w-8 h-8 rounded-full border-2 border-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 transition-all";
    });
}

function drawCard() {
    const preguntaTexto = document.getElementById("pregunta-texto");
    const cardContainer = document.getElementById("question-card");
    const btnDraw       = document.getElementById("btn-draw");
    const counterSpan   = document.getElementById("counter");
    if (!preguntaTexto || !cardContainer || !btnDraw || !counterSpan) return;
    if (window._cardsDrawnCount >= 3) return;

    if (window._mazoActual.length === 0) {
        window._mazoActual = shuffleArray(app.state.stage1Path === 'known' ? PREGUNTAS_CONOCIDOS : PREGUNTAS_DESCONOCIDOS);
    }
    app.playSound('click');

    const randomIndex = Math.floor(Math.random() * window._mazoActual.length);
    const pregunta    = window._mazoActual.splice(randomIndex, 1)[0];

    cardContainer.classList.remove("pop-in");
    void cardContainer.offsetWidth;
    cardContainer.classList.add("pop-in");

    preguntaTexto.textContent = pregunta;
    window._cardsDrawnCount++;

    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`card-dot-${i}`);
        if (!dot) continue;
        if (i < window._cardsDrawnCount) dot.className = "w-8 h-8 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center text-xs font-bold text-white transition-all";
        else if (i === window._cardsDrawnCount) dot.className = "w-8 h-8 rounded-full bg-yellow-500 border-2 border-yellow-400 flex items-center justify-center text-xs font-bold text-white transition-all scale-110";
    }

    counterSpan.textContent = `${window._cardsDrawnCount} / 3 cartas`;

    if (window._cardsDrawnCount >= 3) {
        btnDraw.style.display = 'none';
        const nextBtn = document.getElementById("next-stage-btn");
        const msgEl   = document.getElementById("completion-msg");
        if (nextBtn) nextBtn.classList.remove("hidden");
        if (msgEl)   msgEl.classList.remove("hidden");
        const dot3 = document.getElementById("card-dot-3");
        if (dot3) dot3.className = "w-8 h-8 rounded-full bg-green-500 border-2 border-green-400 flex items-center justify-center text-xs font-bold text-white transition-all";
    }
}

function finalizarJuego() { app.startWordSearch(); }

// ════════════════════════════════════════════════════════════════
//  BACKEND: REGISTRO DE EQUIPO
// ════════════════════════════════════════════════════════════════
async function enviarEquipoAlBackend() {
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart && btnStart.disabled) return;
    const originalHtml = btnStart ? btnStart.innerHTML : '';
    if (btnStart) { btnStart.disabled = true; btnStart.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Conectando...'; }

    try {
        const nombreEquipo = document.getElementById("input-team-name").value;
        const codigo       = document.getElementById("input-code").value;
        const miembrosHTML = document.querySelectorAll("#members-list .member-item");
        let integrantes    = [];

        miembrosHTML.forEach(m => {
            const nombreEl  = m.querySelector(".member-name");
            const carreraEl = m.querySelector(".member-career");
            if (nombreEl && carreraEl) {
                const nombre  = nombreEl.innerText.trim().replace(/^\S+\s+/, '');
                const carrera = carreraEl.innerText.trim();
                if (nombre) integrantes.push({ nombre, carrera: carrera || "Sin definir" });
            }
        });

        if (integrantes.length === 0 && app.state.members.length > 0) {
            integrantes = app.state.members.map(m => ({ nombre: m.name, carrera: m.career || "Sin definir" }));
        }

        const payload = { nombre_equipo: nombreEquipo, codigo, carrera_principal: integrantes[0]?.carrera || "Sin definir", integrantes };

        let response;
        try { response = await fetch("/api/registrar-equipo/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
        catch(e) { app.showToast("No se pudo conectar con el servidor.", 'error'); return; }

        let resultado = {};
        try { resultado = await response.json(); } catch(e) { resultado = { error: `Respuesta inválida (HTTP ${response.status})` }; }

        if (!response.ok || resultado.status !== "ok") { app.showToast(resultado.error || `Error HTTP ${response.status}`, 'error'); return; }

        app.state.teamName   = nombreEquipo;
        app.state.sessionCode = codigo;
        app.state.teamId     = resultado.equipo_id || resultado.id;

        app.showLobbyWaitingScreen();
        app.startGlobalSync();
    } catch(error) {
        app.showToast(error?.message || "Error al registrar equipo.", 'error');
    } finally {
        if (btnStart) { btnStart.disabled = false; btnStart.innerHTML = originalHtml; }
    }
}

// ════════════════════════════════════════════════════════════════
//  ARRANQUE
// ════════════════════════════════════════════════════════════════
window.drawCard              = drawCard;
window.finalizarJuego        = finalizarJuego;
window.enviarEquipoAlBackend = enviarEquipoAlBackend;

window.onload = function() {
    document.body.addEventListener('click', function() {
        if (!this.audioEnabled) {
            const silent = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
            silent.play().catch(() => {});
            this.audioEnabled = true;
        }
    }, { once: true });
    app.init();
};