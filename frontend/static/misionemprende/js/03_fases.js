// ════════════════════════════════════════════════════════════════
//  ARCHIVO: 03_fases.js — Lógica Jugable (Fases 1 a 6) y Transiciones
//  MEJORA: generateWordSearch con detección de colisión real.
//          El botón de ayuda ahora muestra animación antes de pasar.
// ════════════════════════════════════════════════════════════════

Object.assign(app, {
    startStage1: function(type) {
        this.state.stage1Path   = type;
        this.state.currentStage = 1;
        this.trackStageEnter(1);
        this.state.cardsDrawn   = 0;

        const titleEl    = document.getElementById('icebreaker-title');
        const subtitleEl = document.getElementById('icebreaker-subtitle');
        if (type === 'known') {
            if (titleEl)    titleEl.innerHTML  = 'Preguntas rápidas <i class="fas fa-bolt text-yellow-400"></i>';
            if (subtitleEl) subtitleEl.innerHTML = 'Ya se conocen, ¿sí? Saquen 3 cartas y discutan en equipo. Tienen <span class="text-yellow-300 font-bold">1 minuto</span>.';
            window._mazoActual = shuffleArray(PREGUNTAS_CONOCIDOS);
        } else {
            if (titleEl)    titleEl.innerHTML  = 'Rompehielos <i class="fas fa-snowflake text-blue-400"></i>';
            if (subtitleEl) subtitleEl.innerHTML = '¡Caras nuevas! Saquen 3 cartas y preséntense ante el equipo. Tienen <span class="text-yellow-300 font-bold">1 minuto</span>.';
            window._mazoActual = shuffleArray(PREGUNTAS_DESCONOCIDOS);
        }

        resetCardUI();
        this.showView('icebreaker');
        this.startTimer(1, () => {
            this.showToast("¡Tiempo en cartas! Pasando a la sopa de letras.", 'error');
            this._animateAndStartWordSearch();
        });
    },

    _animateAndStartWordSearch: function() {
        // Muestra la animación del botón de siguiente antes de pasar
        const nextBtn = document.getElementById('next-stage-btn');
        const msgEl   = document.getElementById('completion-msg');
        const btnDraw = document.getElementById('btn-draw');
        if (btnDraw)  btnDraw.style.display = 'none';
        if (nextBtn)  nextBtn.classList.remove('hidden');
        if (msgEl)    msgEl.classList.remove('hidden');

        // Espera un momento para que el usuario vea la animación, luego avanza
        setTimeout(() => { this.startWordSearch(); }, 1800);
    },

    startWordSearch: function() {
        clearInterval(this.state.timerInterval);
        const display = document.getElementById('global-timer');
        if (display) display.classList.add('hidden');
        this.generateWordSearch();
        this.showView('view-stage1-game');
        const timerMin = PHASE_CONFIG[1] ? PHASE_CONFIG[1].timerMin : 3;
        this.startTimer(timerMin, () => this.finishCurrentPhase(1, { timedOut: true }));
    },

    completeStage1: async function() {
        if (this.state.completedStages?.[1]) return;
        clearInterval(this.state.timerInterval);
        const display = document.getElementById('global-timer');
        if (display) display.classList.add('hidden');
        const coins = PHASE_CONFIG[1] ? PHASE_CONFIG[1].coinsFirst : 5;
        this.addTokens(coins);
        this.state.completedStages = { ...(this.state.completedStages || {}), 1: true };
        await this.finishCurrentPhase(1);
    },

    // ── SOPA DE LETRAS MEJORADA ──────────────────────────────────
    // Cada palabra ocupa celdas exclusivas. Una intersección deja la celda
    // bloqueada al encontrar la primera palabra y hacía imposible seleccionar
    // la segunda, por eso aquí no se permiten solapamientos de ningún tipo.
    generateWordSearch: function() {
        const size = this.state.wordSearch.size || 15;
        this.state.wordSearch.foundWords    = [];
        this.state.wordSearch.wordLocations = {};
        const { grid, locations } = WordSearchGenerator.generate({ size, words: this.state.wordSearch.words });
        this.state.wordSearch.wordLocations = locations;

        // Renderizar lista de palabras a buscar
        const targetWordsDiv = document.getElementById('target-words-display');
        if (targetWordsDiv) {
            targetWordsDiv.innerHTML = '';
            targetWordsDiv.className = 'flex flex-wrap justify-center gap-2 mb-4';
            Object.keys(this.state.wordSearch.wordLocations).forEach(word => {
                const span = document.createElement('span');
                span.id        = `word-target-${word}`;
                span.className = 'bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold transition-all duration-500 cursor-default select-none';
                span.innerText = word;
                targetWordsDiv.appendChild(span);
            });
        }

        // Renderizar grilla
        const gridEl = document.getElementById('word-grid');
        if (!gridEl) return;
        gridEl.innerHTML = '';
        grid.forEach((letter, index) => {
            const div = document.createElement('div');
            div.className     = 'letter-cell';
            div.innerText     = letter;
            div.dataset.index = index;
            div.onclick       = () => this.handleCellClick(div, index);
            gridEl.appendChild(div);
        });

        // Reset visual de palabras encontradas
        Object.keys(this.state.wordSearch.wordLocations).forEach(word => {
            const el = document.getElementById(`word-target-${word}`);
            if (el) { el.classList.remove('bg-green-500', 'line-through'); el.classList.add('bg-pink-600'); }
        });

        // Botón deshabilitado hasta encontrar todo
        const btn = document.getElementById('btn-complete-stage1');
        if (btn) { btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); btn.classList.remove('animate-bounce'); }
    },

    handleCellClick: function(cell, index) {
        if (cell.classList.contains('found') || cell.classList.contains('correct-word')) return;
        cell.classList.toggle('selected');

        const allSelected     = document.querySelectorAll('.letter-cell.selected');
        const selectedIndices = Array.from(allSelected).map(el => parseInt(el.dataset.index)).sort((a, b) => a - b);

        Object.keys(this.state.wordSearch.wordLocations).forEach(word => {
            if (this.state.wordSearch.foundWords.includes(word)) return;
            const targetIndices = (this.state.wordSearch.wordLocations[word] || []).slice().sort((a, b) => a - b);
            if (JSON.stringify(selectedIndices) === JSON.stringify(targetIndices)) {
                this.markWordAsFound(word, this.state.wordSearch.wordLocations[word]);
            }
        });
    },

    markWordAsFound: function(word, indices) {
        this.state.wordSearch.foundWords.push(word);
        this.trackInteraction('word_found', { stage: 1, action: word });
        this.playSound('click');

        // Deselecciona todas las celdas primero
        document.querySelectorAll('.letter-cell.selected').forEach(c => c.classList.remove('selected'));

        // Marca las celdas de la palabra encontrada
        indices.forEach(idx => {
            const cell = document.querySelector(`.letter-cell[data-index='${idx}']`);
            if (cell) { cell.classList.add('found'); }
        });

        const targetEl = document.getElementById(`word-target-${word}`);
        if (targetEl) {
            targetEl.classList.remove('bg-pink-600');
            targetEl.classList.add('bg-green-500', 'line-through', 'scale-95', 'opacity-80');
        }

        const countEl    = document.getElementById('words-found-count');
        const totalWords = Object.keys(this.state.wordSearch.wordLocations).length;
        if (countEl) countEl.innerText = `${this.state.wordSearch.foundWords.length} / ${totalWords} encontradas`;

        if (this.state.wordSearch.foundWords.length === totalWords) {
            clearInterval(this.state.timerInterval);
            const gt = document.getElementById('global-timer');
            if (gt) gt.classList.add('hidden');
            const btn = document.getElementById('btn-complete-stage1');
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.classList.add('animate-bounce');
            }
            this.playSound('fanfare');
            this.showToast("¡Encontraron todas las palabras! ¡Excelente trabajo en equipo! 🎉", "success");
        }
    },

    revealWordSearchSolutions: function() {
        Object.values(this.state.wordSearch.wordLocations).flat().forEach((idx) => {
            const cell = document.querySelector(`.letter-cell[data-index='${idx}']`);
            if (cell) cell.classList.add('correct-word');
        });
    },

    triggerTransition: function(title, message, seconds, onCompleteCallback, phaseNumber) {
        // CANDADO ANTI-FARMEO: Si ya está en transición, ignora el clic
        if (this.state.isTransitioning) return;
        this.state.isTransitioning = true;

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

        const coinsDisplay = document.getElementById('trans-coins-container');
        const coinsText    = document.getElementById('trans-coins-text');
        if (coinsDisplay && coinsText) {
            coinsText.innerText = narrative.coinsText;
            coinsDisplay.classList.remove('hidden');
            coinsDisplay.classList.add('inline-flex');
        }
        // NUEVO: Pinta el total acumulado de HelpiCoins en la nueva tarjeta
        const totalCoinsText = document.getElementById('trans-total-coins-text');
        if (totalCoinsText) {
            totalCoinsText.innerText = `${this.state.tokens} HelpiCoins`;
        }

        const nextTitleEl = document.getElementById('trans-next-title');
        const nextHintEl  = document.getElementById('trans-next-desc');
        if (nextTitleEl) nextTitleEl.innerText = narrative.nextTitle;
        if (nextHintEl)  nextHintEl.innerText  = narrative.nextHint;

        this._renderTransitionRanking();

        // Asegurar que siempre se abre en el Paso 1 (Pantalla de Monedas)
        const step1 = document.getElementById('trans-step-1');
        const step2 = document.getElementById('trans-step-2');
        if (step1) {
            step1.classList.remove('hidden', '-translate-x-10', 'opacity-0', 'pointer-events-none');
            step1.classList.add('translate-x-0', 'opacity-100', 'pointer-events-auto');
        }
        if (step2) {
            step2.classList.remove('relative', 'translate-x-0', 'opacity-100', 'pointer-events-auto');
            step2.classList.add('absolute', 'top-1/2', '-translate-y-1/2', 'translate-x-10', 'opacity-0', 'pointer-events-none');
        }

        const section = document.getElementById('view-transition');
        if (section) { section.classList.remove('hidden'); section.classList.add('flex'); }

        this.playSound('fanfare');

        // Lógica del Cronómetro Visible
        const btnTimer = document.getElementById('btn-entendido-transicion');
        let remaining = seconds;
        
        if (btnTimer) btnTimer.innerText = `Avanzando en ${remaining}s...`;

        const interval = setInterval(() => {
            remaining--;
            if (btnTimer) btnTimer.innerText = `Avanzando en ${remaining}s...`;
            
            if (remaining <= 0) {
                clearInterval(interval);
                if (section) { section.classList.add('hidden'); section.classList.remove('flex'); }
                
                // Liberar el candado y ejecutar la siguiente fase automáticamente
                this.state.isTransitioning = false;
                if (onCompleteCallback) onCompleteCallback();
            }
        }, 1000);
    },

    _renderTransitionRanking: function() {
        const panel     = document.getElementById('trans-ranking-panel');
        const list      = document.getElementById('trans-ranking-list');
        const miniPodio = document.getElementById('trans-mini-podio');
        const myPosEl   = document.getElementById('trans-my-pos');
        const myCoinsEl = document.getElementById('trans-my-coins');

        if (!panel || !list) return;

        const myName  = this.state.teamName || "Tu equipo";
        const myCoins = this.state.tokens;

        let ranking = [...(this.state.ranking || [])];
        const myEntry = ranking.find(r => r.name === myName);
        if (!myEntry) ranking.push({ name: myName, coins: myCoins });
        else myEntry.coins = myCoins;
        ranking.sort((a, b) => b.coins - a.coins);

        panel.classList.remove('hidden');

        if (miniPodio) {
            const heights = [80, 110, 60];
            const colors  = ['from-gray-500 to-gray-400', 'from-yellow-500 to-yellow-300', 'from-amber-700 to-amber-500'];
            const order   = [1, 0, 2];
            miniPodio.innerHTML = order.map(pos => {
                const e = ranking[pos];
                if (!e) return '';
                const isMe = e.name === myName;
                return `<div class="flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br ${colors[pos]} flex items-center justify-center text-white text-xs font-black mb-1 ${isMe ? 'ring-2 ring-yellow-300' : ''}">${e.name.charAt(0)}</div>
                    <div class="text-xs font-bold ${isMe ? 'text-yellow-300' : 'text-gray-400'} mb-0.5 truncate max-w-[60px] text-center">${e.name}${isMe ? ' ★' : ''}</div>
                    <div class="w-16 bg-gradient-to-t ${colors[pos]} rounded-t-lg flex items-center justify-center text-white font-black text-sm" style="height:${heights[pos]}px">${pos + 1}</div>
                </div>`;
            }).join('');
        }

        list.innerHTML = ranking.slice(0, 6).map((entry, idx) => {
            const isMe   = entry.name === myName;
            const medals = ['🥇', '🥈', '🥉'];
            const medal  = medals[idx] || `${idx + 1}.`;
            return `<div class="flex items-center justify-between py-1.5 px-2 rounded-lg ${isMe ? 'bg-yellow-500/15 border border-yellow-500/30' : 'bg-white/3'}">
                <div class="flex items-center gap-2">
                    <span class="text-sm">${medal}</span>
                    <span class="text-xs font-bold ${isMe ? 'text-yellow-300' : 'text-gray-300'} truncate max-w-[100px]">${entry.name}${isMe ? ' (tú)' : ''}</span>
                </div>
                <span class="text-xs font-black ${isMe ? 'text-yellow-400' : 'text-gray-400'}">${entry.coins} HC</span>
            </div>`;
        }).join('');

        const myRank = ranking.findIndex(r => r.name === myName) + 1;
        if (myPosEl)   myPosEl.innerText   = myRank > 0 ? `#${myRank}` : '#?';
        if (myCoinsEl) myCoinsEl.innerText = `${myCoins}`;
    },

    showPodium: function(onComplete) {
        const section = document.getElementById('view-podium');
        if (!section) { if (onComplete) onComplete(); return; }

        const myCoins = this.state.tokens;
        const myName  = this.state.teamName || "Tu equipo";

        let ranking = [...(this.state.ranking || [])];
        const myEntry = ranking.find(r => r.name === myName);
        if (!myEntry) ranking.push({ name: myName, coins: myCoins });
        else myEntry.coins = myCoins;
        ranking.sort((a, b) => b.coins - a.coins);

        const top3 = ranking.slice(0, 3);
        const podioIds   = ['podium-2nd', 'podium-1st', 'podium-3rd'];
        const podioOrder = [1, 0, 2];
        podioOrder.forEach((rankIdx, podioIdx) => {
            const entry = top3[rankIdx];
            const el    = document.getElementById(podioIds[podioIdx]);
            if (!el || !entry) return;
            const nameEl  = el.querySelector('[data-podium-name]');
            const coinsEl = el.querySelector('[data-podium-coins]');
            if (nameEl)  nameEl.innerText  = entry.name;
            if (coinsEl) coinsEl.innerText = entry.coins;
            if (entry.name === myName) el.classList.add('ring-4', 'ring-yellow-400');
        });

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

    selectTopic: function(topic) {
        this.state.selectedTopic = topic;
        this.showPersonaSelection(topic);
    },

    showPersonaSelection: function(topicKey) {
        const personas      = this.state.personas[topicKey];
        const personaListEl = document.getElementById('persona-list');
        if (!personaListEl) return;
        personaListEl.innerHTML = '';

        const topicTitles = {
            adultos_mayores:      'Salud',
            fastfashion_desechos: 'Educación',
            sustentabilidad_agua: 'Sustentabilidad',
        };
        const titleEl = document.getElementById('persona-select-title');
        if (titleEl) titleEl.innerText = `Desafíos de ${topicTitles[topicKey] || topicKey}`;

        personas.forEach((persona, index) => {
            const colorName = persona.color.replace('bg-', '').split('-')[0];
            
            // NUEVO DISEÑO: Sin sticker, sin borde, click para expandir, diseño tipo "macro"
            const html = `
                <div class="relative flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-${colorName}-500/20 hover:-translate-y-2 transition-all duration-300">

                    <div class="h-56 relative overflow-hidden flex-shrink-0">
                        <img src="${persona.img}" alt="${persona.name}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" onerror="this.style.display='none'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        <div class="absolute bottom-0 left-0 right-0 p-5 z-10">
                            <h3 class="font-bold text-2xl gamer-font text-white drop-shadow-lg mb-1">${persona.name}</h3>
                        </div>
                    </div>

                    <div class="pt-5 pb-5 px-5 flex-grow flex flex-col bg-white">
                        
                        <p class="text-base text-gray-700 leading-relaxed font-medium mb-4">${persona.desc}</p>

                        <details class="group mb-6 cursor-pointer">
                            <summary class="text-sm font-bold text-${colorName}-600 outline-none list-none flex items-center gap-2 select-none hover:text-${colorName}-700 transition-colors">
                                <span class="bg-${colorName}-100 w-6 h-6 rounded-full flex items-center justify-center transition-transform group-open:rotate-180">
                                    <i class="fas fa-chevron-down text-xs"></i>
                                </span>
                                Leer más detalles del caso
                            </summary>
                            <div class="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                                <p class="text-sm text-gray-600 leading-relaxed font-medium">${persona.resumen}</p>
                            </div>
                        </details>

                        <div class="mt-auto">
                            <button onclick="app.playSound('click'); app.selectPersona('${topicKey}', ${index})"
                                class="w-full flex items-center justify-between px-5 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-${colorName}-500 hover:text-white transition-all duration-300 group/btn">
                                <span>Elegir este desafío</span>
                                <div class="w-8 h-8 rounded-full bg-white flex items-center justify-center text-${colorName}-500 group-hover/btn:scale-110 shadow-sm transition-transform">
                                    <i class="fas fa-arrow-right text-xs"></i>
                                </div>
                            </button>
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
        this.startTimer(timerMin, () => this.finishCurrentPhase(2, { timedOut: true }));
    },

    completeStage2: function() {
        clearInterval(this.state.timerInterval);
        const gt = document.getElementById('global-timer');
        if (gt) gt.classList.add('hidden');
        const coins = PHASE_CONFIG[2] ? PHASE_CONFIG[2].coinsFirst : 8;
        this.addTokens(coins);

        this.triggerTransition(
            "¡Empatía desbloqueada!",
            "Lograron meterse en la piel de alguien más. Eso no es poca cosa: la mayoría de los negocios fallan por no entender a su usuario. Ahora, ¡a crear una solución con sus propias manos!",
            10,
            () => { this.startStage3(); },
            2
        );
    },

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
        this.startTimer(timerMin, () => this.finishCurrentPhase(3, { timedOut: true }));
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
            "¿Y si tuviera que ser completamente offline?",
            "¿Y si el usuario no pudiera leer?",
            "¿Y si costara lo mismo que un café?",
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
            "¡Prototipo listo!",
            "Construyeron algo tangible. Ahora viene el desafío final: comunicar su idea y negociar su valor. ¡Preparen un pitch de 90 segundos!",
            10,
            () => {
                // Mostrar Fase 4 (empieza en sub-fase "prep")
                this.showView('view-stage4');
                this.state.currentStage = 4;

                // Asegurar que solo se ve la sub-fase de preparación
                const s4Prep  = document.getElementById('s4-prep');
                const s4Coins = document.getElementById('s4-coins-intro');
                const s4Pitch = document.getElementById('s4-pitches');
                if (s4Prep)  s4Prep.classList.remove('hidden');
                if (s4Coins) s4Coins.classList.add('hidden');
                if (s4Pitch) s4Pitch.classList.add('hidden');

                // Lógica existente de imagen de prototipo
                if (this.state.uploadedPrototypeImage) {
                    const previewCard = document.getElementById('prototype-preview-card');
                    const previewImg  = document.getElementById('prototype-img-display');
                    if (previewCard && previewImg) {
                        previewImg.src = this.state.uploadedPrototypeImage;
                        previewCard.classList.remove('hidden');
                    }
                }

                // Arrancar timer de preparación
                const timerMin = PHASE_CONFIG[4] ? PHASE_CONFIG[4].timerMin : 6;
                this.startTimer(timerMin, () => {
                    // Cuando se acaba el timer, auto-transicionar a la intro de coins
                    if (typeof s4_prepTimerDone === 'function') s4_prepTimerDone();
                });

                // Timer visual local (el del display grande en la preparación)
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
                    if (prepTime <= 0) {
                        clearInterval(this.prepInterval);
                    }
                }, 1000);
            },
            3
        );
    },

    startPitchMode: function() {
        document.getElementById('pitch-overlay').classList.remove('hidden');
        const pitchSec = PHASE_CONFIG[4] ? PHASE_CONFIG[4].pitchSec : 90;
        let pitchTime  = pitchSec;
        const pDisplay = document.getElementById('pitch-timer');
        const m0 = Math.floor(pitchSec / 60).toString().padStart(2, '0');
        const s0 = (pitchSec % 60).toString().padStart(2, '0');
        if (pDisplay) { pDisplay.innerText = `${m0}:${s0}`; pDisplay.classList.remove('text-red-500', 'animate-pulse'); }

        if (this.currentPitchInterval) clearInterval(this.currentPitchInterval);
        this.currentPitchInterval = setInterval(() => {
            pitchTime--;
            const m = Math.floor(pitchTime / 60).toString().padStart(2, '0');
            const s = (pitchTime % 60).toString().padStart(2, '0');
            if (pDisplay) pDisplay.innerText = `${m}:${s}`;
            if (pitchTime <= 10) { if (pDisplay) pDisplay.classList.add('text-red-500', 'animate-pulse'); if (pitchTime > 0) this.playSound('countdown'); }
            if (pitchTime <= 0)  { clearInterval(this.currentPitchInterval); this.playSound('success'); this.endPitch(); }
        }, 1000);
    },
    
    endPitch: function() {
        // 1. Detenemos el reloj del pitch
        if (this.currentPitchInterval) clearInterval(this.currentPitchInterval);
        
        // 2. Ocultamos el overlay gigante del Pitch
        document.getElementById('pitch-overlay').classList.add('hidden');
        
        // 3. Entregamos las HelpiCoins por haber presentado
        const coins = PHASE_CONFIG[4] ? PHASE_CONFIG[4].coinsFirst : 3;
        this.addTokens(coins);
        
        // --- EL ARREGLO ESTÁ AQUÍ ---
        // Eliminamos las líneas que enviaban a 'view-stage5' porque ahora todo vive en la misma vista.
        // Simplemente recargamos la lista por si alguien nuevo entró mientras presentaban.
        this._loadEvalTeams();

        // 4. Avisamos que todo salió bien
        this.showToast("¡Gran presentación! Sigan usando la ruleta y evaluando.", "success");
    },

    _loadEvalTeams: function() {
        const listEl    = document.getElementById('eval-teams-list');
        const manualDiv = document.getElementById('eval-manual-input');
        if (!listEl) return;

        const codigo = this.state.sessionCode || '';
        if (codigo) {
            apiFetch(`/api/obtener-equipos/${codigo}`)
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
                listEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-2">Sin conexión. Usa el campo manual.</p>';
            });
        } else {
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
            const draftInfo = hasDraft
                ? `<span class="ml-auto bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-bold border border-green-500/30">✓ Guardado</span>`
                : `<span class="ml-auto bg-orange-500/10 text-orange-400 text-xs px-2 py-0.5 rounded-full font-bold border border-orange-500/20">Pendiente</span>`;
            return `
                <button onclick="app.setEvalTarget('${name}')"
                    class="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${hasDraft ? 'border-green-500/40 bg-green-900/10 hover:bg-green-900/20' : 'border-gray-700 bg-gray-800 hover:border-orange-400 hover:bg-gray-750'}"
                    id="eval-team-btn-${name.replace(/\s+/g, '-')}">
                    <div class="w-9 h-9 rounded-full ${hasDraft ? 'bg-green-600' : 'bg-orange-500'} flex items-center justify-center text-white font-black text-sm flex-shrink-0">${name.charAt(0)}</div>
                    <div class="flex-1">
                        <span class="font-bold text-gray-200 text-sm block">${name}</span>
                        ${hasDraft ? `<span class="text-xs text-green-400">${this.state.evaluationDrafts[name].total} coins asignados</span>` : '<span class="text-xs text-gray-500">Sin evaluar aún</span>'}
                    </div>
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

        const draft = this.state.evaluationDrafts[teamName];
        if (draft) {
            this.state.evaluacion.stats       = { ...draft.stats };
            this.state.evaluacion.currentCoins = maxCoins - (draft.stats.stat1 + draft.stats.stat2 + draft.stats.stat3 + draft.stats.stat4);
        } else {
            this.state.evaluacion.stats        = { stat1: 0, stat2: 0, stat3: 0, stat4: 0 };
            this.state.evaluacion.currentCoins = maxCoins;
        }
        this.state.evaluacion.maxCoins = maxCoins;

        const nameEl    = document.getElementById('eval-target-name');
        const counterEl = document.getElementById('helpi-coin-counter');
        if (nameEl)    nameEl.innerText    = teamName;
        if (counterEl) counterEl.innerText = this.state.evaluacion.currentCoins;

        ['stat1', 'stat2', 'stat3', 'stat4'].forEach(s => {
            const el = document.getElementById(`${s}-val`);
            if (el) el.innerText = this.state.evaluacion.stats[s];
        });

        const panel = document.getElementById('eval-panel');
        if (panel) { panel.classList.remove('hidden'); panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    },
    // Notifica al servidor que este equipo terminó su guion en la sub-fase Prep
    markTeamReady: async function() {
        document.getElementById('btn-ready-prep').classList.add('hidden');
        document.getElementById('waiting-ready-text').classList.remove('hidden');
        this.playSound('click');
        try {
            await apiFetch('/api/equipo-listo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: this.state.sessionCode, equipo: this.state.teamName, sub_stage: 'prep' })
            });
        } catch(e) {}
    },

    // Notifica al servidor que el equipo leyó las reglas y está listo para los pitches
    requestGlobalPitchesStart: async function() {
        document.getElementById('btn-coins-intro-continue').classList.add('hidden');
        document.getElementById('waiting-pitches-text').classList.remove('hidden');
        this.playSound('click');
        try {
            await apiFetch('/api/equipo-listo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: this.state.sessionCode, equipo: this.state.teamName, sub_stage: 'coins_intro' })
            });
        } catch(e) {}
    },

    // Se modifica endPitch para notificar al servidor y que gire la ruleta para el siguiente
    endPitch: async function() {
        if (this.currentPitchInterval) clearInterval(this.currentPitchInterval);
        document.getElementById('pitch-overlay').classList.add('hidden');
        
        const coins = PHASE_CONFIG[4] ? PHASE_CONFIG[4].coinsFirst : 3;
        this.addTokens(coins);
        this.showToast("¡Gran presentación!", "success");

        // Avisar al servidor que libere el turno
        try {
            await apiFetch('/api/terminar-pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: this.state.sessionCode, equipo: this.state.teamName })
            });
        } catch(e) {}
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

        this.playSound('success');
        this.showToast(`✅ Borrador guardado para ${target} (${total} coins)`, "success");
        this._updateDraftsSummary();

        // Refresh team list con estados actualizados
        const allTeams = Array.from(document.querySelectorAll('#eval-teams-list button'))
            .map(b => b.querySelector('.font-bold.text-gray-200')?.innerText)
            .filter(Boolean);
        const uniqueTeams = [...new Set([...Object.keys(this.state.evaluationDrafts), ...allTeams])];
        this._renderEvalTeamList(uniqueTeams);
    },

    _updateDraftsSummary: function() {
        const summaryDiv = document.getElementById('drafts-summary');
        const draftsList = document.getElementById('drafts-list');
        const submitBtn  = document.getElementById('btn-submit-all');
        const countBadge = document.getElementById('drafts-count-badge');

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
                        <span class="text-orange-400 font-bold text-sm">${draft.total} HC</span>
                        <button onclick="app.setEvalTarget('${name}')" class="text-xs text-gray-500 hover:text-orange-400 transition font-bold px-2 py-1 rounded border border-gray-700 hover:border-orange-500">Editar</button>
                    </div>
                </div>
            `).join('');
        }

        if (countBadge) countBadge.innerText = `${count} listo${count !== 1 ? 's' : ''}`;
        if (submitBtn) {
            if (count > 0) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    },

    submitAllEvaluations: async function() {
        const drafts = this.state.evaluationDrafts;
        
        // CASO 1: NO EVALUARON A NADIE
        // Le damos solo 1 HelpiCoin de consuelo para no dejarlos en 0 y avanzamos.
        if (Object.keys(drafts).length === 0) {
            this.showToast("No enviaste inversiones. Recibes 1 HelpiCoin de consuelo.", "warning");
            this.addTokens(1); // <-- PREMIO DE 1 MONEDA
            this._showFinalResults();
            return;
        }

        // Preparar los datos para el envío
        const evaluaciones = Object.entries(drafts).map(([nombre, draft]) => ({
            equipo_evaluado:  nombre,
            equipo_evaluador: this.state.teamName,
            ...draft.stats,
            total: draft.total,
        }));

        // CASO 2: SÍ EVALUARON
        try {
            const response = await apiFetch('/api/enviar-evaluaciones/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluaciones, codigo: this.state.sessionCode })
            });
            const result = await response.json();
            
            // Recompensamos con 5 HelpiCoins por hacer el trabajo
            if (result.status === 'ok') {
                this.playSound('fanfare');
                this.addTokens(5); // <-- PREMIO DE 5 MONEDAS
                this._showFinalResults();
            } else {
                this.playSound('success');
                this.addTokens(5); // <-- PREMIO DE 5 MONEDAS (incluso si el server responde raro, ellos hicieron su parte)
                this._showFinalResults();
            }
        } catch(e) {
            this.playSound('success');
            this.addTokens(5); // <-- PREMIO DE 5 MONEDAS (por si se cae el internet justo al final, no los castigamos)
            this._showFinalResults();
        }
    },

    _showFinalResults: function() {
        const trackedStage = this.state.analytics.trackedStage;
        if (trackedStage > 0 && !this.state.analytics.completedStages[trackedStage] && this.state.analytics.stageStartedAt) {
            this.trackInteraction('stage_complete', { stage: trackedStage, durationMs: Date.now() - this.state.analytics.stageStartedAt, action: 'final_results' });
            this.state.analytics.completedStages[trackedStage] = true;
            this.flushAnalytics();
        }
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

        const myHighlight = document.getElementById('my-team-highlight');
        const myResultTxt = document.getElementById('my-team-result-text');
        if (myHighlight) myHighlight.classList.remove('hidden');
        if (myResultTxt) {
            const posWord = myPos === 1 ? '🥇 ¡PRIMER LUGAR!' : myPos === 2 ? '🥈 Segundo lugar' : myPos === 3 ? '🥉 Tercer lugar' : `#${myPos} en el ranking`;
            myResultTxt.innerHTML = `${myName} — <span class="text-yellow-400">${this.state.tokens} HelpiCoins</span> — ${posWord}`;
        }

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
                return `<div class="flex flex-col items-center ${isMe ? 'scale-110 relative z-10' : ''}">
                    ${crown}
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br ${colors} border-2 flex items-center justify-center mb-1 text-sm font-black text-white gamer-font ${isMe ? 'shadow-xl shadow-yellow-500/60 ring-4 ring-yellow-400' : ''}">${entry.name.charAt(0).toUpperCase()}</div>
                    <div class="text-xs font-bold ${isMe ? 'text-yellow-300' : 'text-gray-400'} mb-1 truncate max-w-[80px] text-center">${entry.name}${isMe ? ' ★' : ''}</div>
                    <div class="text-xs font-bold ${isMe ? 'text-yellow-400' : 'text-gray-500'} mb-1">${entry.coins} HC</div>
                    <div class="w-20 bg-gradient-to-t ${colors} border-t-4 rounded-t-xl flex flex-col items-center justify-end pb-3 ${isMe ? 'shadow-xl shadow-yellow-500/20' : ''}" style="height:${h}px">
                        <span class="text-xl font-black text-white gamer-font">${medal}</span>
                    </div>
                </div>`;
            }).join('')
        }</div>`;

        if (tabla && ranking.length > 0) {
            tabla.innerHTML = `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    <div class="bg-gray-800 px-5 py-3 text-left">
                        <h3 class="text-white font-bold gamer-font text-sm uppercase tracking-wider"><i class="fas fa-list-ol mr-2 text-yellow-400"></i>Clasificación Final</h3>
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

    submitEvaluation: function() {
        if (this.state.currentEvalTarget) {
            this.saveDraft();
        }
        this.submitAllEvaluations();
    },

    _addManualTeam: function() {
        const input = document.getElementById('eval-manual-team-name');
        if (!input) return;
        const name = input.value.trim();
        if (!name) { this.showToast("Ingresa un nombre válido", "error"); return; }
        if (name === this.state.teamName) { this.showToast("No puedes evaluarte a ti mismo", "error"); return; }
        input.value = '';

        const existing = Array.from(document.querySelectorAll('#eval-teams-list button'))
            .map(b => b.querySelector('.font-bold.text-gray-200')?.innerText)
            .filter(Boolean);
        if (existing.includes(name)) { this.showToast("Ese equipo ya está en la lista", "error"); return; }
        this._renderEvalTeamList([...existing, name]);
        this.showToast(`${name} agregado`, "success");
    }
});
