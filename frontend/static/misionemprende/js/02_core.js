// ════════════════════════════════════════════════════════════════
//  ARCHIVO: 02_core.js — Estado, Navegación y Utilidades UI
// ════════════════════════════════════════════════════════════════

Object.assign(app, {
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
            // words: ["INNOVAR"],
            words: ["INNOVAR", "EQUIPO", "LIDER", "EMPATIA", "CLIENTE", "PROBLEMA", "SOLUCION", "PITCH", "VALOR", "MERCADO"],
            foundWords: [],
            wordLocations: {}
        },
        completedStages: {},
        phaseCompletionInFlight: null,
        analytics: { queue: [], trackedStage: 0, stageStartedAt: null, completedStages: {}, flushing: false },
        personas: {
            adultos_mayores: [
                {
                    name: "Don Humberto (50)", img: "/static/misionemprende/img/Fase2/Salud/autogestion.jpeg",
                    icon: "fas fa-user-lock", color: "bg-red-500",
                    desc:"Don Humberto necesita ayuda para autogestionar su tratamiento",
                    resumen: "Muchos errores médicos y complicaciones surgen al cambiar de un centro de salud a otro, por falta de continuidad y seguimiento personalizado. Don Humberto de 50 años, fue dado de alta con indicaciones médicas complejas, pero no entendió qué debía seguir tomando ni a quién acudir si se sentía mal."
                },
                {
                    name: "Simona (27)", img: "/static/misionemprende/img/Fase2/Salud/obesidad.jpeg",
                    icon: "fas fa-graduation-cap", color: "bg-orange-500",
                    resumen: "Más de un 70% de la población en Chile presenta sobrepeso u obesidad (MINSAL). Esta situación se debe múltiples factores, entre ellos la falta de ejercicio y educación nutricional, disponibilidad de productos ultraprocesados y la desinformación. Simona tiene 27 años, una hija pequeña y trabaja tiempo completo. Sabe que la alimentación es clave, pero no ha podido organizar ni aprender a darle una nutrición buena a su hija.",
                    desc: "Una madre no puede darle una buena alimentación a su hija por falta de tiempo e información."
                },
                {
                    name: "Juana (72)", img: "/static/misionemprende/img/Fase2/Salud/soledad.jpeg",
                    icon: "fas fa-map-marker-alt", color: "bg-yellow-500",
                    resumen: "La población chilena está envejeciendo rápidamente y muchos adultos mayores enfrentan soledad, pérdida de movilidad y falta de programas de prevención. Juana, de 72 años, vive sola desde que sus hijos se independizaron. Le gustaría mantenerse activa, pero no conoce programas accesibles que la motiven a hacer ejercicio, socializar y prevenir enfermedades.",
                    desc: "Juana vive sola. Le gustaría ser más activa y social, pero no conoce programas accesibles para ello."
                }
            ],
            fastfashion_desechos: [
                {
                    name: "Martina (22)", img: "/static/misionemprende/img/Fase2/Educacion/educacionFinanciera.jpeg",
                    icon: "fas fa-lungs-virus", color: "bg-blue-500",
                    resumen: "La ausencia de educación financiera en realidades económicas inestables dificulta la planificación y el uso responsable del dinero. Martina, joven emprendedora de 22 años, vende productos por redes sociales. Aunque gana dinero, no sabe cómo organizarlo ni cuánto debe ahorrar o invertir, lo que lo mantiene en constante inestabilidad.",
                    desc: "Martina no sabe cómo gestionar su dinero, causandole constante malestar."
                },
                {
                    name: "Andrés (23)", img: "/static/misionemprende/img/Fase2/Educacion/inicio.jpeg",
                    icon: "fas fa-briefcase", color: "bg-emerald-500",
                    resumen: "Muchos estudiantes recién titulados enfrentan barreras para conseguir su primer empleo, ya que se les exige experiencia previa que aún no han podido adquirir. Andrés, de 23 años, acaba de egresar de odontología. Le preocupa no poder trabajar pronto, pero ninguna clínica lo ha llamado porque no tiene experiencia previa.",
                    desc: "Andrés acaba de egresar de odontología pero ninguna clínica lo ha llamado por falta de experiencia laboral."
                },
                {
                    name: "Osvaldo (70)", img: "/static/misionemprende/img/Fase2/Educacion/osvaldo.png",
                    icon: "fas fa-house-damage", color: "bg-purple-500",
                    resumen: "El avance tecnológico en los últimos años ha sido incremental. Esto ha beneficiado a múltiples sectores, sin embargo el conocimiento y adaptación para los adultos mayores ha sido una gran dificultad. Osvaldo es un adulto mayor de 70 años y debe pedir ayuda a sus hijos o nietos cada vez que debe hacer tramites.",
                    desc: "Osvaldo no es capáz de realizar sus trámites online por si solo."
                }
            ],
            sustentabilidad_agua: [
                {
                    name: "Gabriela (18)", img: "/static/misionemprende/img/Fase2/Sustentabilidad/fastfashion.png",
                    icon: "fas fa-seedling", color: "bg-yellow-500",
                    resumen: "La moda rápida ha traído graves consecuencias al medio ambiente. Especialmente en sectores del norte de Chile en donde los vertederos y basurales están afectando el diario vivir de las personas. Gabriela es una estudiante de 18 años que vive cerca de esta zona y debe pasar a diario por lugares con desagradables olores.",
                    desc: "Gabriela sufre diaramente con los olores de la contaminación por ropa cerca de donde vive."
                },
                {
                    name: "Camila (50)", img: "/static/misionemprende/img/Fase2/Sustentabilidad/agua.png",
                    icon: "fas fa-tractor", color: "bg-emerald-500",
                    resumen: "El agua dulce es un recurso natural fundamental para la vida. Hay zonas rurales en que el agua se ha hecho escasa. Camila es una agricultora de 50 años que cultiva paltas de exportación, ella está complicada de perder su negocio por la cantidad de agua que debe utilizar.",
                    desc: "Camila necesita ocupar mucha agua para sus cultivos de palta, pero se ve complicada por tantos litros requeridos."
                },
                {
                    name: "Francisco (29)", img: "/static/misionemprende/img/Fase2/Sustentabilidad/tech.jpeg",
                    icon: "fas fa-flask", color: "bg-green-500",
                    resumen: "El aumento del consumo tecnológico ha generado toneladas de desechos electrónicos difíciles de reciclar. Francisco, de 29 años, cambió su celular y computador el año pasado, pero no sabe dónde llevar los antiguos dispositivos. Terminó guardándolos en un cajón, como millones de personas que desconocen alternativas de reciclaje.",
                    desc: "Francisco renovó sus dispositivos electrónicos pero no sabe en donde reciclar los antiguos, por lo que decide guardarlos."
                }
            ]
        }
    },

    playSound: function(soundId) {
        const audio = document.getElementById('sfx-' + soundId);
        const volumes = { 'fanfare': 0.4, 'success': 0.1, 'error': 0.4, 'click': 0.8, 'countdown': 0.6, 'nose': 1.0 };
        if (audio) {
            audio.currentTime = 0;
            audio.volume = volumes[soundId] || 1.0;
            try { audio.play().catch(() => {}); } catch(e) {}
        }
    },

    trackStageEnter: function(stage) {
        const value = Number(stage);
        if (!Number.isInteger(value) || value < 1 || this.state.analytics.trackedStage === value) return;
        const previous = this.state.analytics.trackedStage;
        if (previous > 0 && !this.state.analytics.completedStages[previous] && this.state.analytics.stageStartedAt) {
            this.trackInteraction('stage_complete', { stage: previous, durationMs: Date.now() - this.state.analytics.stageStartedAt, action: 'server_transition' });
            this.state.analytics.completedStages[previous] = true;
        }
        this.state.analytics.trackedStage = value;
        this.state.analytics.stageStartedAt = Date.now();
        this.trackInteraction('stage_enter', { stage: value });
    },

    trackInteraction: function(type, details = {}) {
        if (!this.state.sessionCode || !this.state.teamName) return;
        const event = {
            eventId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            type,
            stage: Number(details.stage ?? this.state.currentStage ?? 0),
            action: String(details.action ?? '').slice(0, 160),
            durationMs: details.durationMs ?? null,
            timedOut: Boolean(details.timedOut),
            timestamp: new Date().toISOString(),
        };
        this.state.analytics.queue.push(event);
        if (this.state.analytics.queue.length >= 10) this.flushAnalytics();
    },

    flushAnalytics: async function({ keepalive = false } = {}) {
        const analytics = this.state.analytics;
        if (analytics.flushing || !analytics.queue.length || !this.state.sessionCode || !this.state.teamName) return;
        analytics.flushing = true;
        const events = analytics.queue.splice(0, 25);
        try {
            const response = await apiFetch('/api/analytics/events', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive,
                body: JSON.stringify({ codigo: this.state.sessionCode, nombre_equipo: this.state.teamName, events }),
            });
            if (!response.ok) throw new Error(`Analytics HTTP ${response.status}`);
        } catch (_) {
            analytics.queue.unshift(...events);
        } finally {
            analytics.flushing = false;
        }
    },

    init: function() {
        const page = document.body.dataset.page || 'game';
        if (page === 'professor') { this.showView('view-professor-login'); this.initProfessorLogin(); return; }
        if (page === 'admin') { this.initAdminAuth(); return; }
        this.showView('view-welcome');
    },

    frontendUrl: function(path = '') {
        const configured = String(window.MISION_EMPRENDE_FRONTEND_BASE_URL || '').replace(/\/+$/, '');
        // Cuando la app se abrió desde el endpoint REST de S3, todas las
        // páginas deben permanecer en ese mismo bucket. Esto también protege
        // contra una copia antigua de 00_env.js que todavía apunte a la API.
        const isS3Frontend = /(^|\.)s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(window.location.hostname);
        const base = isS3Frontend ? window.location.origin : (configured || window.location.origin);
        return `${base}/${String(path).replace(/^\/+/, '')}`;
    },
    // Usamos archivos explícitos porque el endpoint REST de S3 no aplica el
    // documento índice de website hosting a rutas como /profesor/.
    goHome:        function() { window.location.href = this.frontendUrl('index.html'); },
    goToProfessor: function() { window.location.href = this.frontendUrl('profesor/index.html'); },
    goToAdmin:     function() { window.location.href = this.frontendUrl('panel-admin/index.html'); },

    showView: function(viewId) {
        const current = document.querySelector('section.active');
        if (current) current.classList.remove('fade-in');

        setTimeout(() => {
            // CORRECCIÓN: Ocultar TODOS los sections y quitarles el active
            document.querySelectorAll('section').forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('active');
            });

            const nextView = document.getElementById(viewId);
            if (nextView) {
                // Mostrar solo la vista solicitada
                nextView.classList.remove('hidden');
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
        this.state.completedStages = {};
        this.state.phaseCompletionInFlight = null;
        this.state.analytics = { queue: [], trackedStage: 0, stageStartedAt: null, completedStages: {}, flushing: false };

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

    showToast: function(message, type = 'success') {
        const toast   = document.getElementById('toast');
        const msgSpan = document.getElementById('toast-message');
        if (!toast || !msgSpan) return;
        msgSpan.innerText = message;
        if (type === 'error') {
            toast.classList.remove('from-blue-100','to-blue-500');
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

    startTimer: function(minutes, onExpire) {
        clearInterval(this.state.timerInterval);
        const display = document.getElementById('global-timer');
        if (!display) return;
        display.classList.remove('hidden');

        let remaining = Math.floor(minutes * 60);
        const update = () => {
            // El backend (Django legado y las Lambdas) nunca envía "tiempo_restante" en
            // /api/estado-juego; se guarda aquí para que una pausa pueda reanudar el
            // conteo real en vez de reiniciarlo con un valor inexistente (NaN).
            this.state.timerRemainingSeconds = remaining;
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

    finishCurrentPhase: async function(stage, { timedOut = false } = {}) {
        if (!this.state.sessionCode || !this.state.teamName) return;
        if (this.state.phaseCompletionInFlight === stage || this.state.currentStage !== stage) return;

        this.state.phaseCompletionInFlight = stage;
        if (!this.state.analytics.completedStages[stage]) {
            this.trackInteraction('stage_complete', {
                stage,
                timedOut,
                durationMs: this.state.analytics.stageStartedAt ? Date.now() - this.state.analytics.stageStartedAt : null,
            });
            this.state.analytics.completedStages[stage] = true;
        }
        this.flushAnalytics();
        clearInterval(this.state.timerInterval);
        const timer = document.getElementById('global-timer');
        if (timer) timer.classList.add('hidden');
        if (timedOut && stage === 1) this.revealWordSearchSolutions();

        const overlay = document.getElementById('phase-transition-overlay');
        const message = document.getElementById('correct-words-display');
        if (overlay) overlay.classList.remove('hidden');
        if (message) message.textContent = timedOut
            ? 'Tiempo terminado. Registrando el fin de fase…'
            : 'Equipo listo. Esperando a los demás equipos…';

        try {
            const response = await apiFetch('/api/equipo/terminar-fase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: this.state.sessionCode, nombre_equipo: this.state.teamName, fase: stage })
            });
            const result = await response.json();
            if (!response.ok || result.status !== 'ok') throw new Error(result.error || 'No se pudo terminar la fase');
            if (result.advanced && result.current_stage > this.state.currentStage) {
                if (overlay) overlay.classList.add('hidden');
                this.handleServerState({ status: 'ok', current_stage: result.current_stage, paused: false });
            } else if (message) {
                message.textContent = 'Esperando a que los demás equipos terminen…';
            }
        } catch (error) {
            this.state.phaseCompletionInFlight = null;
            if (overlay) overlay.classList.add('hidden');
            this.showToast(error.message || 'No se pudo registrar el fin de fase. Reintentaremos.', 'error');
            setTimeout(() => this.finishCurrentPhase(stage, { timedOut }), 3000);
        }
    },

    addTokens: function(amount) {
        this.state.tokens += amount;
        const el = document.getElementById('token-count');
        if (el) el.innerText = this.state.tokens;
    },

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
            const response = await apiFetch(`/api/validar-sesion?codigo=${code}`);
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

    // Intro 1: Al presionar "Quiero Jugar"
    playGameIntro: function(nextViewId) {
        const introSection = document.getElementById('view-game-intro');
        const step1 = document.getElementById('intro-step-1');
        const step2 = document.getElementById('intro-step-2');

        this.state.nextViewAfterIntro = nextViewId || 'view-login';

        // Quitamos el hidden y ponemos flex ANTES de la opacidad
        introSection.classList.remove('hidden');
        introSection.classList.add('flex');
        
        // Mini pausa (50ms) para que el navegador sí haga la animación suave
        setTimeout(() => {
            introSection.classList.remove('opacity-0');
            introSection.classList.add('opacity-100');
            
            step1.classList.remove('hidden');
            step1.classList.add('opacity-100', 'scale-100');
            step2.classList.add('hidden', 'opacity-0');
            
            this.playSound('fanfare');
        }, 50);

        // Transición al saludo de Helpi
        setTimeout(() => {
            step1.classList.remove('opacity-100', 'scale-100');
            step1.classList.add('opacity-0', 'scale-95');
            
            setTimeout(() => {
                step1.classList.add('hidden');
                step2.classList.remove('hidden');
                step2.classList.add('flex');
                
                setTimeout(() => {
                    step2.classList.remove('opacity-0', 'translate-y-12');
                    step2.classList.add('opacity-100', 'translate-y-0');
                    this.playSound('success');
                }, 50);
                
            }, 1000);
        }, 4000);
    },

    finishGameIntro: function() {
        this.playSound('click');
        const introSection = document.getElementById('view-game-intro');
        
        // SOLUCIÓN AL FLASH: Cargamos el Login en el fondo AHORA MISMO
        this.showView(this.state.nextViewAfterIntro || 'view-login');

        if (introSection) {
            introSection.classList.remove('opacity-100');
            introSection.classList.add('opacity-0');
            
            // Esperar a que se desvanezca para ocultarlo
            setTimeout(() => {
                introSection.classList.add('hidden');
                introSection.classList.remove('flex');
            }, 800);
        }
    },

    // Intro 2: Explicación de Fases (Iniciada por el Profe)
    playLobbyIntro: function(nextViewId) {
        const lobbyIntro = document.getElementById('view-lobby-intro');
        if (!lobbyIntro) return;

        this.state.nextViewAfterLobby = nextViewId || 'view-stage1-intro';

        lobbyIntro.classList.remove('hidden');
        lobbyIntro.classList.add('flex');
        
        setTimeout(() => {
            lobbyIntro.classList.remove('opacity-0');
            lobbyIntro.classList.add('opacity-100');
            this.playSound('fanfare');
        }, 50);
    },

    closeLobbyIntro: function() {
        this.playSound('click');
        const lobbyIntro = document.getElementById('view-lobby-intro');

        if (lobbyIntro) {
            lobbyIntro.classList.remove('opacity-100');
            lobbyIntro.classList.add('opacity-0');
            
            setTimeout(() => {
                lobbyIntro.classList.add('hidden');
                lobbyIntro.classList.remove('flex');

                // AQUÍ ESTÁ LA MAGIA: En lugar de cargar la Fase 1 directo,
                // lanzamos la transición de inicio con Helpi.
                this.triggerStartTransition(1);
            }, 800); // Esperamos que termine el fade-out
        }
    },

    shakeElement: function(elementId) {
        const el = document.getElementById(elementId);
        if (el) { el.classList.add('animate-shake','text-red-500'); setTimeout(() => el.classList.remove('animate-shake','text-red-500'), 500); }
    },
    // ══════════════════════════════════════════════════════════════
    // TRANSICIONES DE FASE (Pulido)
    // ══════════════════════════════════════════════════════════════

    /**
     * MODO INICIO: Muestra SOLO la explicación de la fase actual al empezar el juego.
     * Uso: app.triggerStartTransition(1) al presionar "Iniciar Juego" en admin.
     */

    triggerStartTransition: function(phaseNumber) {
        const phaseData = typeof PHASE_NARRATIVES !== 'undefined' ? PHASE_NARRATIVES[phaseNumber] : null;

        const step1 = document.getElementById('trans-step-1');
        const step2 = document.getElementById('trans-step-2');
        const nextPreTitle = document.getElementById('trans-next-pre-title');

        if(step1) step1.classList.add('hidden', 'pointer-events-none');
        if(step2) {
            step2.classList.remove('absolute', 'top-1/2', '-translate-y-1/2', 'translate-x-10', 'opacity-0', 'pointer-events-none');
            step2.classList.add('relative', 'translate-x-0', 'opacity-100', 'pointer-events-auto');
        }

        if(nextPreTitle) {
            nextPreTitle.innerText = "Misión Actual";
            nextPreTitle.className = "text-green-400 font-bold tracking-widest uppercase mb-2";
        }
        
        const titleEl = document.getElementById('trans-next-title');
        const descEl = document.getElementById('trans-next-desc');
        
        if (phaseNumber === 1) {
            if(titleEl) titleEl.innerText = "Fase 1 — Trabajo en Equipo";
            if(descEl) descEl.innerText = "¡Bienvenidos! Su primer objetivo es conocerse como equipo y organizarse para los desafíos que vienen.";
        } else {
            if(titleEl) titleEl.innerText = `Fase ${phaseNumber}`;
            if(descEl) descEl.innerText = phaseData ? phaseData.nextHint : "";
        }

        // Definimos hacia dónde ir cuando la transición termine
        this.state.onTransitionClose = () => {
            this.state.isTransitioning = false;
            if (phaseNumber === 1) {
                // Ahora sí, cargamos la Fase 1 real
                this.showView(this.state.nextViewAfterLobby || 'view-stage1-intro');
            }
        };

        this.playSound('start_game'); 
        this.showView('view-transition');

        // LÓGICA DEL CRONÓMETRO: Automáticamente avanza después de 8 segundos
        const btnTimer = document.getElementById('btn-entendido-transicion');
        let remaining = 8; 
        
        if (btnTimer) btnTimer.innerText = `Avanzando en ${remaining}s...`;

        const interval = setInterval(() => {
            remaining--;
            if (btnTimer) btnTimer.innerText = `Avanzando en ${remaining}s...`;
            
            if (remaining <= 0) {
                clearInterval(interval);
                this.closeTransition(); // Cierra Helpi y dispara el onTransitionClose
            }
        }, 1000);
    },

    closeTransition: function() {
        this.playSound('click');
        const section = document.getElementById('view-transition');
        if (section) { 
            section.classList.add('hidden'); 
            section.classList.remove('flex'); 
        }
        
        // Ejecutamos la lógica de la siguiente fase AL INSTANTE que presionan el botón
        if (typeof this.state.onTransitionClose === 'function') {
            this.state.onTransitionClose();
            this.state.onTransitionClose = null; 
        }
    },

    nextTransitionStep: function() {
        this.playSound('click');
        const step1 = document.getElementById('trans-step-1');
        const step2 = document.getElementById('trans-step-2');

        // Animación de salida Paso 1
        step1.classList.remove('translate-x-0', 'opacity-100');
        step1.classList.add('-translate-x-10', 'opacity-0', 'pointer-events-none');

        // Animación de entrada Paso 2
        step2.classList.remove('translate-x-10', 'opacity-0', 'pointer-events-none');
        step2.classList.add('translate-x-0', 'opacity-100', 'pointer-events-auto');
    },
});
