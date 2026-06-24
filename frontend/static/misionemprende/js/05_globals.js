// ════════════════════════════════════════════════════════════════
//  ARCHIVO: 05_globals.js — Cartas, Eventos y Arranque Global
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

        if (!response.ok || resultado.status !== "ok") { 
            app.showToast(resultado.error || `Error HTTP ${response.status}`, 'error'); 
            return; 
        }

        app.state.teamName   = nombreEquipo;
        app.state.sessionCode = codigo;
        app.state.teamId     = resultado.equipo_id || resultado.id;
        
        // Solo mostramos el lobby de espera
        const step2 = document.getElementById('login-step-2');
        const waiting = document.getElementById('lobby-waiting-screen');
        if (step2) step2.classList.add('hidden');
        if (waiting) waiting.classList.remove('hidden');

        // IMPORTANTE: Quitamos el app.playLobbyIntro() de aquí.
        app.startGlobalSync();
        // -------------------
    } catch(error) {
        app.showToast(error?.message || "Error al registrar equipo.", 'error');
    } finally {
        if (btnStart) { btnStart.disabled = false; btnStart.innerHTML = originalHtml; }
    }
}

// Vinculación explícita al scope global
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