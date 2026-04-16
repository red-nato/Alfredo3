        const app = {
            state: {
                teamName: "",
                selectedRole: null, // Nuevo estado para el rol
                members: [],
                tokens: 0,
                currentStage: 0,
                timerInterval: null,
                selectedTopic: null,
                selectedPersona: null, // Nuevo estado para la persona elegida
                preGameType: null, // Para saber si se conocen o no antes del countdown
                wordSearch: {
                    grid: [],
                    size: 8,
                    words: ["INNOVAR", "EQUIPO", "LIDER"],
                    foundWords: [],
                    wordLocations: {} // Guardar coordenadas de palabras
                },
                // NUEVA ESTRUCTURA DE PERSONAS (Casos de ejemplo)
                personas: {
                    adultos_mayores: [
                        {
                            name: "Osvaldo Araya (70)",
                            icon: "fas fa-user-lock", // Icono de seguridad o dificultad
                            color: "bg-red-500",
                            resumen: "El avance tecnológico en los últimos años ha sido incremental. Esto ha beneficiado a multiples sectores, sin embargo el conocimiento y adaptación para los adultos mayores ha sido una gran dificultad. Osvaldo es un adulto mayor de 70 años y debe pedir ayuda a sus hijos o nietos cada vez que debe hacer trámites bancarios, médicos o postular a beneficios sociales en línea. Su mayor dolor es sentirse dependiente y vulnerable ante la tecnología.",
                            desc: "El avance tecnológico en los últimos años ha sido incremental. Esto ha beneficiado a multiples sectores, sin embargo el conocimiento y adaptación para los adultos mayores ha sido una gran dificultad. Osvaldo es un adulto mayor de 70 años y debe pedir ayuda a sus hijos o nietos cada vez que debe hacer trámites bancarios, médicos o postular a beneficios sociales en línea. Su mayor dolor es sentirse dependiente y vulnerable ante la tecnología."
                        },
                        {
                            name: "Clara Soto (65)",
                            icon: "fas fa-graduation-cap", // Icono de aprendizaje
                            color: "bg-blue-500",
                            resumen: "Clara es una jubilada que vive sola en una zona rural. Le gustaría aprender a usar las redes sociales y videollamadas para mantenerse conectada con sus nietos que viven en el extranjero. Su principal frustración es que los tutoriales son muy rápidos y usan un lenguaje técnico que no entiende. Se siente excluida de la vida familiar digital.",
                            desc: "Clara es una jubilada que vive sola en una zona rural. Le gustaría aprender a usar las redes sociales y videollamadas para mantenerse conectada con sus nietos que viven en el extranjero. Su principal frustración es que los tutoriales son muy rápidos y usan un lenguaje técnico que no entiende. Se siente excluida de la vida familiar digital."
                        },
                        {
                            name: "Ricardo Neira (78)",
                            icon: "fas fa-map-marker-alt", // Icono de localización/movilidad
                            color: "bg-green-500",
                            resumen: "Ricardo tiene problemas de movilidad y solo puede salir de casa con dificultad. Necesita acceder a servicios de delivery de medicamentos y comida. El proceso de registro y pago en las aplicaciones móviles le resulta confuso y estresante, teme equivocarse e ingresar mal sus datos bancarios, lo que lo obliga a recurrir al teléfono fijo que es lento y costoso.",
                            desc: "Ricardo tiene problemas de movilidad y solo puede salir de casa con dificultad. Necesita acceder a servicios de delivery de medicamentos y comida. El proceso de registro y pago en las aplicaciones móviles le resulta confuso y estresante, teme equivocarse e ingresar mal sus datos bancarios, lo que lo obliga a recurrir al teléfono fijo que es lento y costoso."
                        }
                    ],
                    fastfashion_desechos: [
                        {
                            name: "Gabriela Rojas (18)",
                            icon: "fas fa-lungs-virus", // Icono de enfermedad/contaminación
                            color: "bg-red-500",
                            resumen: "La moda rápida ha traido graves consecuencias al medio ambiente. Especialmente en sectores del norte de Chile en donde los vertederos y basurales están afectando el diario vivir de las personas. Gabriela es una estudiante de 18 años que vive cerca de esta zona y debe pasar a diario por lugares con desagradables olores y polvo contaminado para ir a su instituto, afectando su salud respiratoria y su estado de ánimo.",
                            desc: "La moda rápida ha traido graves consecuencias al medio ambiente. Especialmente en sectores del norte de Chile en donde los vertederos y basurales están afectando el diario vivir de las personas. Gabriela es una estudiante de 18 años que vive cerca de esta zona y debe pasar a diario por lugares con desagradables olores y polvo contaminado para ir a su instituto, afectando su salud respiratoria y su estado de ánimo."
                        },
                        {
                            name: "Matías Zúñiga (35)",
                            icon: "fas fa-briefcase", // Icono de trabajo/negocio
                            color: "bg-yellow-500",
                            resumen: "Matías es dueño de una pequeña tienda de ropa de segunda mano. Aunque su negocio es sustentable, le cuesta mucho competir con los bajos precios y la constante novedad del fast fashion. Los consumidores jóvenes priorizan el precio, lo que amenaza la supervivencia de su emprendimiento. Busca una manera de revalorizar la ropa vintage y ética.",
                            desc: "Matías es dueño de una pequeña tienda de ropa de segunda mano. Aunque su negocio es sustentable, le cuesta mucho competir con los bajos precios y la constante novedad del fast fashion. Los consumidores jóvenes priorizan el precio, lo que amenaza la supervivencia de su emprendimiento. Busca una manera de revalorizar la ropa vintage y ética."
                        },
                        {
                            name: "Elena Cáceres (52)",
                            icon: "fas fa-house-damage", // Icono de casa dañada
                            color: "bg-blue-500",
                            resumen: "Elena es la líder de su junta vecinal en una población cercana a un basural ilegal de ropa. El viento arrastra prendas y residuos químicos hasta su patio, contaminando su jardín y dificultando la crianza de sus nietos. Su principal dolor es la impotencia ante la inacción de las autoridades para limpiar y prevenir estos desechos tóxicos.",
                            desc: "Elena es la líder de su junta vecinal en una población cercana a un basural ilegal de ropa. El viento arrastra prendas y residuos químicos hasta su patio, contaminando su jardín y dificultando la crianza de sus nietos. Su principal dolor es la impotencia ante la inacción de las autoridades para limpiar y prevenir estos desechos tóxicos."
                        }
                    ],
                    sustentabilidad_agua: [
                        {
                            name: "Camila Díaz (50)",
                            icon: "fas fa-seedling", // Icono de agricultura
                            color: "bg-green-500",
                            resumen: "Camila es una agricultora de 50 años que cultiva paltas de exportación. Ella está complicada de perder su negocio por la cantidad de agua que debe utilizar para mantener la producción, y teme ser señalada socialmente por el alto consumo hídrico de su cultivo.",
                            desc: "El agua dulce es un recurso natural fundamental para la vida. Hay zonas rurales en que el agua se ha hecho escasa. Camila es una agricultora de 50 años que cultiva paltas de exportación. Ella está complicada de perder su negocio por la cantidad de agua que debe utilizar para mantener la producción, y teme ser señalada socialmente por el alto consumo hídrico de su cultivo."
                        },
                        {
                            name: "Pedro Soto (68)",
                            icon: "fas fa-tractor", // Icono de maquinaria
                            color: "bg-yellow-500",
                            resumen: "Don Pedro tiene un pequeño campo donde cultiva hortalizas para el mercado local. Él aún utiliza métodos de riego tradicionales por inundación, perdiendo grandes cantidades de agua por evaporación y escorrentía. No tiene el conocimiento ni el capital para invertir en tecnología de riego por goteo, lo que pone en riesgo su cosecha cada verano debido a la sequía.",
                            desc: "Don Pedro tiene un pequeño campo donde cultiva hortalizas para el mercado local. Él aún utiliza métodos de riego tradicionales por inundación, perdiendo grandes cantidades de agua por evaporación y escorrentía. No tiene el conocimiento ni el capital para invertir en tecnología de riego por goteo, lo que pone en riesgo su cosecha cada verano debido a la sequía."
                        },
                        {
                            name: "Ana María Vidal (30)",
                            icon: "fas fa-flask", // Icono de ciencia/investigación
                            color: "bg-blue-500",
                            resumen: "Ana María es una joven investigadora agrónoma que trabaja en un centro de innovación. Está desarrollando un hidrogel para retener la humedad en la tierra, pero necesita agricultores que le permitan probar su solución en condiciones reales de escasez. Su desafío es ganarse la confianza de la comunidad agrícola tradicional para implementar y escalar su tecnología.",
                            desc: "Ana María es una joven investigadora agrónoma que trabaja en un centro de innovación. Está desarrollando un hidrogel para retener la humedad en la tierra, pero necesita agricultores que le permitan probar su solución en condiciones reales de escasez. Su desafío es ganarse la confianza de la comunidad agrícola tradicional para implementar y escalar su tecnología."
                        }
                    ]
                }
            },

            // --- Sistema de Sonido (sin cambios) ---
            playSound: function(soundId) {
                const audio = document.getElementById('sfx-' + soundId);
                if (audio) {
                    audio.currentTime = 0; // Reiniciar sonido si ya estaba sonando
                    try {
                        audio.play().catch(e => console.log("Audio play prevented:", e));
                    } catch (e) {
                         console.log("Error playing audio:", e);
                    }
                }
            },

            // Inicialización (sin cambios)
            init: function() {
                // No hacemos nada aquí, se hace en startStage1
            },

            // Gestión de Vistas con Scroll Top (sin cambios)
            showView: function(viewId) {
                const current = document.querySelector('section.active');
                if(current) {
                     current.classList.remove('fade-in');
                }

                setTimeout(() => {
                    document.querySelectorAll('section').forEach(el => el.classList.remove('active'));
                    const nextView = document.getElementById(viewId);
                    if(nextView) {
                        nextView.classList.add('active', 'fade-in');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 100);
            },

            // Lógica de Salida (sin cambios)
            attemptGoHome: function() {
                if (this.state.tokens > 0 || this.state.teamName) {
                    const confirmExit = confirm("¿Estás seguro de que quieres salir? Se perderá el progreso de la misión.");
                    if(confirmExit) {
                        this.resetGame();
                        this.showView('view-welcome');
                    }
                } else {
                    this.showView('view-welcome');
                }
            },

            // Resetear Juego (sin cambios)
            resetGame: function() {
                this.state.teamName = "";
                this.state.members = [];
                this.state.tokens = 0;
                this.state.wordSearch.foundWords = [];
                this.state.selectedPersona = null; // Resetear persona
                document.getElementById('token-count').innerText = "0";
                document.getElementById('team-name-display').innerText = "---";
                document.getElementById('team-display').classList.add('hidden');
                document.getElementById('btn-complete-stage1').disabled = true;
                document.getElementById('btn-complete-stage1').classList.add('opacity-50', 'cursor-not-allowed');
                
                // Resetear etiquetas de palabras
                this.state.wordSearch.words.forEach(word => {
                    const el = document.getElementById(`word-target-${word}`);
                    if(el) {
                        el.classList.remove('bg-green-500', 'line-through');
                        el.classList.add('bg-pink-600');
                    }
                });

                clearInterval(this.state.timerInterval);
                document.getElementById('global-timer').classList.add('hidden');
            },

            // Toast Gamer (sin cambios)
            showToast: function(message, type = 'success') {
                const toast = document.getElementById('toast');
                const msgSpan = document.getElementById('toast-message');
                msgSpan.innerText = message;
                
                // Cambiar color según tipo (opcional)
                if(type === 'error') {
                     toast.classList.remove('from-green-400', 'to-blue-500');
                     toast.classList.add('from-red-400', 'to-pink-500');
                     this.playSound('error'); // Sonido de notificación
                } else {
                     toast.classList.remove('from-red-400', 'to-pink-500');
                     toast.classList.add('from-green-400', 'to-blue-500');
                     this.playSound('success'); // Sonido de notificación
                }

                toast.classList.remove('translate-x-full');
                setTimeout(() => toast.classList.add('translate-x-full'), 3000);
            },

            // Abrir y cerrar el modal de ayuda
            toggleHelp: function() {
                    this.playSound('click');
                    const modal = document.getElementById('transmission-modal');
                    const content = document.getElementById('transmission-content');
                    
                    if (modal.classList.contains('hidden')) {
                        // ABRIR AYUDA
                        
                        // Textos dinámicos según la fase en la que estén
                        let titulo = "Hub de ayuda :o";
                        let mensaje = "";
                        
                        switch(this.state.currentStage) {
                            case 1:
                                if (this.state.stage1Path=== "known") {
                                    mensaje = "¿Se conocen? Mish. Interesante. Si se conocen tanto, trabajen en equipo y resuelvan la sopa de letras antes que les ganen...";
                                } else {
                                    mensaje = "Emprender suele ser en equipo pero, si no nos conocemos, ¿Cómo trabajaríamos juntos?"; 
                                }
                                break;
                            case 2: mensaje = "Si queremos emprender, necesitamos encontrar un problema a solucionar. Eligan un categoría y, dentro de ella, alguna persona. El tiempo corre, sin presiones eh..."; break;
                            case 3: mensaje = "¿Ubican algo llamado LEGO? Hablando en serio, ayuda mucho a crear. En este caso, una solución al proeblam de la persona que eligieron. Más les vale que sea bueno. Yo se los advertí."; break;
                            case 4: mensaje = "¿Recuerdan la solución que hicieron? Ahora toca lo más importante, hacer un pitch para venderla :o"; break;
                            default: mensaje = "Este botón es de ayuda, pensaba que estaba claro por el ícono. Veo que no.";
                        }

                        document.getElementById('trans-title').innerText = titulo;
                        document.getElementById('trans-desc').innerText = mensaje;

                        // Mostrar elementos de ayuda, ocultar los de transición
                        document.getElementById('btn-close-transmission').classList.remove('hidden');
                        document.getElementById('trans-media').classList.remove('hidden'); // Tu video
                        document.getElementById('trans-timer-container').classList.add('hidden'); // Sin timer

                        modal.classList.remove('hidden');
                        content.classList.add('expand-from-right');

                    } else {
                        // CERRAR AYUDA
                        modal.classList.add('hidden');
                        content.classList.remove('expand-from-right');
                    }
            },

            // Agregar Tokens (sin cambios)
            addTokens: function(amount) {
                this.state.tokens += amount;
                const tokenEl = document.getElementById('token-count');
                // Animación de conteo rápido
                let current = parseInt(tokenEl.innerText);
                const target = this.state.tokens;
                const step = Math.ceil((target - current) / 10);
                
                const counter = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        current = target;
                        clearInterval(counter);
                    }
                    tokenEl.innerText = current;
                }, 30);

                this.showToast(`+${amount} Tokens obtenidos!`);
            },

            // --- Lógica del Timer Global (Modificada para llamar a handleTimeoutStage1) ---
            startTimer: function(minutes, onComplete) {
                clearInterval(this.state.timerInterval);
                let seconds = minutes * 60;
                const display = document.getElementById('global-timer');
                display.classList.remove('hidden');

                this.state.timerInterval = setInterval(() => {
                    seconds--;
                    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                    const s = (seconds % 60).toString().padStart(2, '0');
                    display.innerText = `${m}:${s}`;

                    // Alerta visual cuando queda poco tiempo
                    if (seconds <= 60) display.classList.add('bg-red-700', 'animate-pulse-fast');

                    if (seconds <= 0) {
                        clearInterval(this.state.timerInterval);
                        display.classList.add('hidden');
                        // Llama a la nueva función de manejo de tiempo de espera
                        if (this.state.currentStage === 1) {
                            this.handleTimeoutStage1();
                        } else {
                            if(onComplete) onComplete();
                        }
                    }
                }, 1000);
            },

            // --- NUEVA FUNCIÓN: Manejo de tiempo agotado para Etapa 1 ---
            handleTimeoutStage1: function() {
                clearInterval(this.state.timerInterval);
                this.playSound('countdown'); // Sonido de alerta
                
                // Muestra el overlay de transición
                const overlay = document.getElementById('phase-transition-overlay');
                const wordsDisplay = document.getElementById('correct-words-display');
                const countdownDisplay = document.getElementById('transition-countdown-number');
                overlay.classList.remove('hidden');

                // Muestra las palabras correctas
                wordsDisplay.innerText = this.state.wordSearch.words.join(', ');

                // Marca las celdas de las palabras correctas en la grilla para referencia
                const allIndices = this.state.wordSearch.words.flatMap(word => this.state.wordSearch.wordLocations[word]);
                document.querySelectorAll('.letter-cell').forEach(cell => {
                    const idx = parseInt(cell.dataset.index);
                    if(allIndices.includes(idx) && !cell.classList.contains('found')) {
                         cell.classList.add('correct-word'); // Clase para resaltar en rojo
                    }
                    cell.onclick = null; // Deshabilita clics
                });
                
                let count = 10;
                countdownDisplay.innerText = count;

                const transitionInterval = setInterval(() => {
                    count--;
                    countdownDisplay.innerText = count;
                    this.playSound('countdown');

                    if (count <= 0) {
                        clearInterval(transitionInterval);
                        overlay.classList.add('hidden');
                        this.showToast("Misión 1 finalizada por tiempo.", 'error');
                        this.addTokens(1); // Bono de consuelo
                        this.showView('view-stage2-topics');
                        this.startTimer(8); // Iniciar Timer para Etapa 2
                    }
                }, 1000);
            },


            // --- Funciones de Etapas ---

            // Seleccionar Rol (sin cambios)
            selectRole: function(roleName) {
                this.state.selectedRole = roleName;
                document.getElementById('selected-role-name').innerText = roleName;
                this.playSound('success');
                this.showView('view-login');
            },

            // Agregar Miembro (sin cambios)
            addMember: function() {
                const nameIn = document.getElementById('input-member-name');
                const careerIn = document.getElementById('input-member-career');
                
                if (this.state.members.length >= 8) return this.showToast("Máximo 8 agentes.", 'error');
                if (!nameIn.value) return;

                this.state.members.push({name: nameIn.value, career: careerIn.value});
                
                // Actualizar UI con estilo gamer
                const list = document.getElementById('members-list');
                const div = document.createElement('div');
                div.className = "member-item flex justify-between bg-white p-3 rounded-lg shadow-sm border-l-4 border-pink-500 text-sm font-semibold items-center";
                div.innerHTML = `<span class="member-name"><i class="fas fa-user-astronaut mr-2 text-gray-400"></i>${nameIn.value}</span> <span class="member-career bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">${careerIn.value}</span>`;
                list.appendChild(div);
                list.scrollTop = list.scrollHeight; // Auto-scroll hacia abajo
                
                document.getElementById('member-count').innerText = `${this.state.members.length}/8`;
                nameIn.value = "";
                careerIn.value = "";
            },

            // Finalizar Login 
            finishLogin: function() {
                const teamName = document.getElementById('input-team-name').value;
                const textoOriginal = '<i class="fas fa-check-circle mr-2"></i> Confirmar y Esperar';
                if(!teamName || this.state.members.length < 3) return this.showToast("Ingresa nombre de escuadrón y al menos 3 integrantes.", 'error');
                
                this.state.teamName = teamName;
                document.getElementById('team-name-display').innerText = teamName;
                document.getElementById('team-display').classList.remove('hidden');
                
                // Simular espera de backend
                const btn = document.getElementById('btn-start-game');
                const inputTeam = document.getElementById('input-team-name'); // Agregado para deshabilitar correctamente
                
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Sincronizando con el servidor...';
                btn.disabled = true;
                inputTeam.disabled = true;

                setTimeout(() => {
                    this.playSound('success')
                    this.showView('view-stage1-intro'); // Aquí entran a la pantalla de decisión
                    btn.innerHTML = textoOriginal;
                    btn.disabled = false;
                    inputTeam.disabled = false;

                    // --- COREOGRAFÍA DEL COMUNICADOR (Movida aquí) ---
                    const commBtn = document.getElementById('base-communicator-btn');
                    const overlay = document.getElementById('comm-overlay');
                    const commText = document.getElementById('communicator-text');

                    if (commBtn && overlay) {
                        overlay.classList.remove('hidden');
                        commBtn.classList.remove('hidden', 'comm-docked');
                        
                        void commBtn.offsetWidth; 
                        
                        overlay.classList.remove('opacity-0');
                        overlay.classList.add('opacity-100');
                        commBtn.classList.add('comm-center');
                        this.playSound('fanfare'); 

                        setTimeout(() => {
                            overlay.classList.remove('opacity-100');
                            overlay.classList.add('opacity-0');
                            
                            commBtn.classList.remove('comm-center');
                            commBtn.classList.add('comm-docked');
                            this.playSound('success'); 

                            setTimeout(() => overlay.classList.add('hidden'), 1000);

                            setTimeout(() => {
                                if (commText) {
                                    commText.style.opacity = '0';
                                    setTimeout(() => commText.classList.add('hidden'), 500);
                                }
                            }, 1000);

                        }, 2500);
                    }
                    // -------------------------------------------

                }, 2000); 
            },

            // CUENTA REGRESIVA DRAMÁTICA (sin cambios)
            triggerDramaticCountdown: function(type) {
                this.state.preGameType = type;
                const overlay = document.getElementById('dramatic-countdown');
                const numberDisplay = document.getElementById('countdown-number');
                let count = 3;
                
                overlay.classList.remove('hidden');
                numberDisplay.innerText = count;
                this.playSound('countdown');

                const countdownInterval = setInterval(() => {
                    count--;
                    if(count > 0) {
                         numberDisplay.innerText = count;
                         this.playSound('countdown');
                    } else if (count === 0) {
                         numberDisplay.innerText = "¡YA!";
                         this.playSound('success');
                    } else {
                        clearInterval(countdownInterval);
                        overlay.classList.add('hidden');
                        this.startStage1(this.state.preGameType); 
                    }
                }, 1000);
            },

            // Iniciar Etapa 1 
            startStage1: function(type) {
                this.state.stage1Path = type;
                this.state.currentStage = 1;
                if(type === 'known') {
                    this.showView('view-stage1-game');
                    const title = document.getElementById('stage1-title');
                    const desc = document.getElementById('stage1-desc');
                    const targetWordsDiv = document.getElementById('target-words-display');
                    title.innerText = "Sopa de Letras";
                    desc.innerHTML = "Encuentren las 3 palabras ocultas: INNOVAR, EQUIPO, LIDER.";
                    targetWordsDiv.classList.remove('hidden');
                    this.generateWordSearch();
                    
                } else {
                    this.showView('icebreaker');
                }
                
                // INICIAR TIMER AQUÍ (5 MIN)
                this.startTimer(5);
            },

            // Lógica Sopa de Letras Inteligente (sin cambios significativos)
            generateWordSearch: function() {
                const size = 8;
                const grid = new Array(size * size).fill('');
                const words = this.state.wordSearch.words;
                this.state.wordSearch.foundWords = [];
                this.state.wordSearch.wordLocations = {}; // Resetear ubicaciones

                // Colocar palabras
                words.forEach(word => {
                    let placed = false;
                    while (!placed) {
                        const direction = Math.floor(Math.random() * 2); // 0: Horiz, 1: Vert
                        const row = Math.floor(Math.random() * size);
                        const col = Math.floor(Math.random() * size);
                        
                        // Verificar si cabe
                        if (direction === 0 && col + word.length <= size) {
                            // Check overlap
                            let canPlace = true;
                            for (let i = 0; i < word.length; i++) {
                                if (grid[row * size + (col + i)] !== '' && grid[row * size + (col + i)] !== word[i]) {
                                    canPlace = false; break;
                                }
                            }
                            if (canPlace) {
                                let indices = [];
                                for (let i = 0; i < word.length; i++) {
                                    grid[row * size + (col + i)] = word[i];
                                    indices.push(row * size + (col + i));
                                }
                                this.state.wordSearch.wordLocations[word] = indices;
                                placed = true;
                            }
                        } else if (direction === 1 && row + word.length <= size) {
                            let canPlace = true;
                            for (let i = 0; i < word.length; i++) {
                                if (grid[(row + i) * size + col] !== '' && grid[(row + i) * size + col] !== word[i]) {
                                    canPlace = false; break;
                                }
                            }
                            if (canPlace) {
                                let indices = [];
                                for (let i = 0; i < word.length; i++) {
                                    grid[(row + i) * size + col] = word[i];
                                    indices.push((row + i) * size + col);
                                }
                                this.state.wordSearch.wordLocations[word] = indices;
                                placed = true;
                            }
                        }
                    }
                });

                // Rellenar vacíos
                for (let i = 0; i < grid.length; i++) {
                    if (grid[i] === '') grid[i] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
                }

                // Renderizar Grid
                const gridEl = document.getElementById('word-grid');
                gridEl.innerHTML = '';
                grid.forEach((letter, index) => {
                    const div = document.createElement('div');
                    div.className = 'letter-cell';
                    div.innerText = letter;
                    div.dataset.index = index;
                    div.onclick = () => this.handleCellClick(div, index);
                    gridEl.appendChild(div);
                });
                
                // Resetear estado visual de palabras objetivo
                this.state.wordSearch.words.forEach(word => {
                    const el = document.getElementById(`word-target-${word}`);
                    el.classList.remove('bg-green-500', 'line-through');
                    el.classList.add('bg-pink-600');
                });
                
                // Deshabilitar botón
                const btn = document.getElementById('btn-complete-stage1');
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
            },

            // Manejo de Click en celda (sin cambios)
            handleCellClick: function(cell, index) {
                if (cell.classList.contains('found') || cell.classList.contains('correct-word')) return; 
                
                cell.classList.toggle('selected');
                
                const allSelected = document.querySelectorAll('.letter-cell.selected');
                const selectedIndices = Array.from(allSelected).map(el => parseInt(el.dataset.index)).sort((a,b)=>a-b);
                
                const words = this.state.wordSearch.words;
                words.forEach(word => {
                    if (this.state.wordSearch.foundWords.includes(word)) return;

                    const targetIndices = this.state.wordSearch.wordLocations[word].sort((a,b)=>a-b);
                    
                    if (JSON.stringify(selectedIndices) === JSON.stringify(targetIndices)) {
                        this.markWordAsFound(word, targetIndices);
                    }
                });
            },

            // Marcar Palabra Encontrada (sin cambios)
            markWordAsFound: function(word, indices) {
                this.state.wordSearch.foundWords.push(word);
                this.playSound('click');
                
                indices.forEach(idx => {
                    const cell = document.querySelector(`.letter-cell[data-index='${idx}']`);
                    cell.classList.remove('selected');
                    cell.classList.add('found');
                });

                const targetEl = document.getElementById(`word-target-${word}`);
                targetEl.classList.remove('bg-pink-600');
                targetEl.classList.add('bg-green-500', 'line-through');

                if (this.state.wordSearch.foundWords.length === this.state.wordSearch.words.length) {
                    clearInterval(this.state.timerInterval); // Detener el timer al completar
                    document.getElementById('global-timer').classList.add('hidden');

                    const btn = document.getElementById('btn-complete-stage1');
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                    btn.classList.add('animate-bounce');
                    this.playSound('fanfare');
                }
            },

            // Completar Etapa 1
            completeStage1: function() {
                clearInterval(this.state.timerInterval); // Asegurar que el timer se detenga
                document.getElementById('global-timer').classList.add('hidden');
                this.addTokens(5);

            // AQUÍ USAMOS LA NUEVA FUNCIÓN
                // "Título", "Mensaje", Tiempo, Función que arranca la etapa 2
                this.triggerTransition(
                    "El compañerismo puede ser ... entretenido", 
                    "¡Excelente trabajo en equipo! Ahora deberán seleccionar en conjunto una problemática para resolver.", 
                    10, 
                    () => {
                        // Todo lo que antes hacías para iniciar la etapa 2 va AQUÍ ADENTRO
                        this.showView('view-stage2-topics');
                        this.state.currentStage = 2;
                        this.startTimer(8); 
                    }
                );
            },
            triggerTransition: function(title, message, seconds, onCompleteCallback) {
                const modal = document.getElementById('transmission-modal');
                const content = document.getElementById('transmission-content');
                
                // Configurar textos
                document.getElementById('trans-title').innerText = title;
                document.getElementById('trans-desc').innerText = message;
                const countEl = document.getElementById('trans-countdown');
                countEl.innerText = seconds;

                // Ocultar elementos de ayuda, mostrar timer
                document.getElementById('btn-close-transmission').classList.add('hidden');
                document.getElementById('trans-media').classList.add('hidden');
                document.getElementById('trans-timer-container').classList.remove('hidden');

                // Abrir el comunicador
                modal.classList.remove('hidden');
                content.classList.remove('expand-from-right'); // Reset
                void content.offsetWidth; // Reflow
                content.classList.add('expand-from-right');
                
                this.playSound('fanfare');

                // Timer de la transición
                let remaining = seconds;
                const interval = setInterval(() => {
                    remaining--;
                    if (remaining > 0) {
                        countEl.innerText = remaining;
                    } else {
                        clearInterval(interval);
                        
                        // Cerrar modal
                        modal.classList.add('hidden');
                        
                        // Iniciar la siguiente fase por debajo
                        if (onCompleteCallback) onCompleteCallback();
                    }
                }, 1000);
            },
            
            // --- NUEVAS FUNCIONES PARA ETAPA 2 ---

            // Seleccionar Tema (Muestra la lista de personas)
            selectTopic: function(topic) {
                this.state.selectedTopic = topic;
                this.showPersonaSelection(topic);
            },

            showPersonaSelection: function(topicKey) {
                const personas = this.state.personas[topicKey];
                const personaListEl = document.getElementById('persona-list');
                personaListEl.innerHTML = '';
                
                // Generar cards de personas
                personas.forEach((persona, index) => {
                    const html = `
                        <div onclick="app.playSound('click'); app.selectPersona('${topicKey}', ${index})" 
                            class="game-card p-6 cursor-pointer group hover:bg-gray-100 persona-card border-t-8 border-${persona.color.split('-')[1]} relative">
                            
                            <div class="flex items-center gap-4 mb-3">
                                <div class="w-12 h-12 ${persona.color} rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-lg">
                                    <i class="${persona.icon} text-xl"></i>
                                </div>
                                <h3 class="font-bold text-xl gamer-font text-gray-800">${persona.name}</h3>
                            </div>
                            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
                            
                                <p class="text-sm text-gray-600 font-medium summary-text">
                                    ${persona.resumen} 
                                    <span class="block mt-2 text-pink-600 text-xs font-bold uppercase tracking-wide">
                                        <i class="fas fa-eye mr-1"></i> Leer caso completo
                                    </span>
                                </p>

                                <div class="full-description">
                                    <p class="text-sm text-gray-700 font-medium leading-relaxed">${persona.desc}</p>
                                </div>
                            </div>
                        </div>
                    `;
                    personaListEl.innerHTML += html;
                });
                
                // Deshabilitar botón de volver (no hay vuelta atrás desde aquí por regla de negocio)
                document.getElementById('btn-persona-back').classList.add('hidden');

                this.showView('view-stage2-persona-select');
            },

            showPersonaSelection: function(topicKey) {
                const personas = this.state.personas[topicKey];
                const personaListEl = document.getElementById('persona-list');
                personaListEl.innerHTML = '';
                
                // Aseguramos que la grilla use items-start para evitar deformaciones
                personaListEl.className = "grid grid-cols-1 md:grid-cols-3 gap-8 items-start";
            
                personas.forEach((persona, index) => {
                    
                    // Extraemos el nombre del color base (ej: 'red' de 'bg-red-500') para usarlo en bordes y sombras
                    const colorName = persona.color.split('-')[1]; 
            
                    const html = `
                        <div onclick="app.playSound('click'); app.selectPersona('${topicKey}', ${index})" 
                            class="group relative bg-white rounded-3xl p-1 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-${colorName}-500/30">
                            
                            <div class="absolute inset-0 bg-gradient-to-br from-${colorName}-400 to-${colorName}-600 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
            
                            <div class="bg-white rounded-[1.3rem] overflow-hidden h-full flex flex-col relative z-0">
                                
                                <div class="h-24 ${persona.color} relative overflow-hidden">
                                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                                    <div class="absolute left-10 top-10 w-12 h-12 bg-black opacity-10 rounded-full"></div>
                                </div>
            
                                <div class="absolute top-12 left-1/2 transform -translate-x-1/2">
                                    <div class="w-20 h-20 bg-white p-1 rounded-full shadow-lg">
                                        <div class="w-full h-full ${persona.color} rounded-full flex items-center justify-center text-white text-3xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                                            <i class="${persona.icon}"></i>
                                        </div>
                                    </div>
                                </div>
            
                                <div class="pt-14 pb-6 px-6 text-center flex-grow">
                                    <h3 class="text-2xl font-bold text-gray-800 gamer-font mb-1 group-hover:text-${colorName}-600 transition-colors">${persona.name}</h3>
                                    
                                    <div class="mt-4 text-left">
                                        <div class="summary-text bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p class="text-sm text-gray-600 font-medium leading-relaxed text-center">
                                                "${persona.resumen}"
                                            </p>
                                            <div class="mt-3 flex justify-center">
                                                <span class="text-xs font-bold text-${colorName}-500 uppercase tracking-wide flex items-center bg-${colorName}-50 px-3 py-1 rounded-full">
                                                    <i class="fas fa-plus-circle mr-2"></i> Ver Historia
                                                </span>
                                            </div>
                                        </div>
            
                                        <div class="full-description">
                                            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-gray-700 leading-relaxed shadow-inner">
                                                ${persona.desc}
                                            </div>
                                        </div>
                                    </div>
                                </div>
            
                                <div class="px-6 pb-6">
                                    <div class="w-full py-3 rounded-xl border-2 border-gray-100 font-bold text-gray-400 text-center uppercase text-sm group-hover:bg-${colorName}-500 group-hover:text-white group-hover:border-${colorName}-500 transition-all duration-300">
                                        Seleccionar Agente
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    personaListEl.innerHTML += html;
                });
            
                this.showView('view-stage2-persona-select');
            },

            // Seleccionar Persona y avanzar al Mapa de Empatía
            selectPersona: function(topicKey, index) {
                clearInterval(this.state.timerInterval); // Detener timer de la fase de selección
                this.state.selectedPersona = this.state.personas[topicKey][index];
                
                // Cargar datos en el mapa de empatía
                document.getElementById('persona-name-map').innerText = this.state.selectedPersona.name;
                document.getElementById('persona-problem-map').innerText = this.state.selectedPersona.resumen; // Primera frase
                document.getElementById('bubble-center-user').innerText = this.state.selectedPersona.name.split(' ')[0].toUpperCase();

                // Actualizar icono grande del mapa
                const iconContainer = document.getElementById('persona-icon-large');
                iconContainer.innerHTML = `<i class="${this.state.selectedPersona.icon} text-5xl text-white"></i>`;
                iconContainer.className = `bg-gradient-to-br from-purple-400 to-pink-500 w-24 h-24 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-lg rotate-3`; // Resetear y dejar color por defecto o ajustarlo.

                this.showView('view-stage2-challenge-detail');
                this.startTimer(8); // Reiniciar/iniciar timer de 8 min para completar el mapa
            },

            // Completar Etapa 2
            completeStage2: function() {
                clearInterval(this.state.timerInterval); // Detener el timer
                document.getElementById('global-timer').classList.add('hidden');
                this.addTokens(8);
                this.triggerTransition(
                    "La empatía se puede trabajar, ¡Ya lo hicieron!", 
                    "Excelente caracterización. Ahora deberán crear una solución creativa con LEGO. ¿Podrán?", 
                    10,
                    () => {
                        this.startStage3();
                    }
                );
            },

            // --- INICIAR ETAPA 3 (CON DATOS DE LA PERSONA) ---
            startStage3: function() {
                this.showView('view-stage3');
                this.state.currentStage = 3;

                // 1. Recuperamos la persona de la memoria
                const persona = this.state.selectedPersona;

                if (persona) {
                    // 2. Buscamos los elementos del HTML de la Etapa 3
                    // (Asegúrate de agregar estos IDs en tu HTML, ver Paso 3)
                    const tituloNombre = document.getElementById('stage3-persona-name');
                    const textoResumen = document.getElementById('stage3-problem-summary');
                    
                    // 3. Inyectamos los datos
                    if (tituloNombre) {
                        tituloNombre.innerText = persona.name;
                    }
                    
                    if (textoResumen) {
                        // Aquí usamos el .resumen que guardamos en el paso anterior
                        textoResumen.innerText = persona.resumen || persona.desc; 
                    }
                }

                            // 4. Iniciamos el juego (10 minutos para LEGO)
                this.startTimer(10); 
            },

            // New Prompt (sin cambios)
            newPrompt: function() {
                // Animación del icono de recarga
                const icon = document.querySelector('.spin-on-hover');
                icon.classList.add('fa-spin');
                setTimeout(() => icon.classList.remove('fa-spin'), 1000);

                const prompts = [
                    "¿Y si la solución costara $0?",
                    "¿Y si fuera 100% digital (sin hardware)?",
                    "¿Y si tuviera que ser usada en total oscuridad?",
                    "¿Y si tuviera que pesar menos de 100 gramos?",
                    "¿Y si la solución fuera para niños de 5 años?"
                ];
                document.getElementById('creative-prompt').innerText = `"${prompts[Math.floor(Math.random() * prompts.length)]}"`;
            },

            // Completar Etapa 3 (sin cambios)
            completeStage3: function() {
                clearInterval(this.state.timerInterval); // Detener el timer
                document.getElementById('global-timer').classList.add('hidden');
                this.addTokens(5);
                this.triggerTransition(
                    "¡La creatividad se potencia en grupo!", 
                    "Excelente solución. ¿Se imaginan creando un pitch para vender su solución innovadora?", 
                    10, 
                    () => {
                        // Todo lo que antes hacías para iniciar la etapa 2 va AQUÍ ADENTRO
                        this.showView('view-stage4');
                        this.state.currentStage = 4;
                        // INICIAR TIMER PROPIO DE FASE 4 (6 MIN)
                        this.startTimer(6);
                        
                        // Timer visual local adicional
                        let prepTime = 6 * 60;
                        const prepDisplay = document.getElementById('prep-timer-display');
                        if(this.prepInterval) clearInterval(this.prepInterval); 

                        this.prepInterval = setInterval(() => {
                            prepTime--;
                            const m = Math.floor(prepTime / 60).toString().padStart(2, '0');
                            const s = (prepTime % 60).toString().padStart(2, '0');
                            prepDisplay.innerText = `${m}:${s}`;
                            if(prepTime <= 0) clearInterval(this.prepInterval);
                        }, 1000);
                        },
                );
            },

            // Iniciar Pitch (sin cambios)
            startPitchMode: function() {
                document.getElementById('pitch-overlay').classList.remove('hidden');
                let pitchTime = 90; // 90 segundos
                const pDisplay = document.getElementById('pitch-timer');
                pDisplay.innerText = "01:30"; // Reset visual
                pDisplay.classList.remove('text-red-500', 'animate-pulse'); // Reset estilos

                if(this.currentPitchInterval) clearInterval(this.currentPitchInterval);
                
                this.currentPitchInterval = setInterval(() => {
                    pitchTime--;
                    const m = Math.floor(pitchTime / 60).toString().padStart(2, '0');
                    const s = (pitchTime % 60).toString().padStart(2, '0');
                    pDisplay.innerText = `${m}:${s}`;

                    // Tensión final
                    if(pitchTime <= 10) {
                        pDisplay.classList.add('text-red-500', 'animate-pulse');
                        if(pitchTime > 0) this.playSound('countdown'); // Tic-tac final
                    }
                    
                    if(pitchTime <= 0) {
                        clearInterval(this.currentPitchInterval);
                        this.playSound('success'); // Sonido de fin de tiempo (o alarma)
                        this.endPitch();
                    }
                }, 1000);
            },

            // Terminar Pitch (sin cambios)
            endPitch: function() {
                if(this.currentPitchInterval) clearInterval(this.currentPitchInterval);
                document.getElementById('pitch-overlay').classList.add('hidden');
                this.showView('view-stage5');
            },

            // Enviar Evaluación (sin cambios)
            submitEvaluation: function() {
                this.addTokens(5); // Tokens por evaluar
                
                // Calcular total final (añadiendo un bono por terminar)
                const total = this.state.tokens + 2; // Bono de 2 tokens por completar todo
                document.getElementById('result-tokens').innerText = total;
                document.getElementById('result-team-name').innerText = this.state.teamName || "Tu Equipo";
                
                this.showView('view-stage6');
                this.playSound('fanfare'); // Música de victoria al final
            },
            /* --- FUNCIONES DE ADMINISTRACIÓN Y PROFESOR --- */

            // 1. LOGIN DE ADMIN
            adminLogin: function() {
                const user = document.getElementById('admin-user').value;
                const pass = document.getElementById('admin-pass').value;

                // Validación Hardcodeada (Como pediste)
                if (user === 'shlam' && pass === '1234') {
                    this.playSound('success');
                    this.loadAdminData(); // Cargar datos antes de mostrar
                    this.showView('view-admin-dashboard');
                } else {
                    this.playSound('error');
                    this.showToast('Acceso denegado. Credenciales inválidas.', 'error');
                    // Efecto visual de error
                    document.getElementById('admin-pass').value = '';
                    document.getElementById('admin-pass').classList.add('border-red-500', 'animate-shake');
                    setTimeout(() => document.getElementById('admin-pass').classList.remove('border-red-500', 'animate-shake'), 500);
                }
            },

            // 2. CARGAR DATOS 

            // EN main2.js - Reemplaza la función loadAdminData por esta:

            loadAdminData: function() {
                const grid = document.getElementById('admin-teams-grid');
                grid.innerHTML = '<p class="text-gray-500 ml-4">Cargando datos...</p>'; 

                // LLAMADA AL BACKEND REAL
                fetch('/api/admin-stats/')
                .then(res => res.json())
                .then(data => {
                    if(data.status === 'ok') {
                        // 1. Actualizar Contadores
                        document.getElementById('admin-total-teams').innerText = data.total_equipos;
                        document.getElementById('admin-total-agents').innerText = data.total_agentes;

                        // 2. Limpiar y Renderizar Equipos
                        grid.innerHTML = '';
                        
                        if (data.equipos.length === 0) {
                            grid.innerHTML = '<p class="text-gray-500 col-span-full ml-4">No hay equipos registrados aún.</p>';
                            return;
                        }

                        data.equipos.forEach(team => {
                            // Generar HTML de miembros
                            let membersHtml = team.miembros.map(m => 
                                `<div class="flex items-center text-sm text-gray-300 mb-1">
                                    <i class="fas fa-user-astronaut text-gray-500 mr-2 text-xs"></i> ${m}
                                </div>`
                            ).join('');

                            // Generar Tarjeta
                            const card = `
                                <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-pink-500 transition shadow-lg relative overflow-hidden group">
                                    <div class="absolute top-0 right-0 bg-gray-700 text-xs text-white px-2 py-1 rounded-bl-lg font-mono">
                                        ${team.codigo_sesion}
                                    </div>
                                    
                                    <h3 class="text-xl font-bold text-white mb-1 gamer-font group-hover:text-pink-500 transition truncate">
                                        ${team.nombre}
                                    </h3>
                                    <p class="text-xs text-gray-500 uppercase font-bold mb-4">
                                        ${team.miembros.length} Agentes
                                    </p>
                                    
                                    <div class="bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 min-h-[80px]">
                                        ${membersHtml || '<span class="text-gray-600 text-xs">Sin miembros</span>'}
                                    </div>

                                    <div class="mt-4 flex gap-2">
                                        <button class="flex-1 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white text-xs py-2 rounded transition border border-red-900/50">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            `;
                            grid.innerHTML += card;
                        });
                    } else {
                        console.error("Error cargando admin:", data.error);
                        app.showToast("Error al cargar datos del servidor", "error");
                    }
                })
                .catch(err => {
                    console.error("Error fetch admin:", err);
                    grid.innerHTML = '<p class="text-red-500 ml-4">Error de conexión.</p>';
                });
            },

            // 3. VISTA DEL PROFESOR (VERSIÓN FINAL REAL)
            initProfessorView: function() {
                const codeDisplay = document.getElementById('prof-session-code');
                codeDisplay.innerText = "CONECTANDO...";

                // 1. Pedir al backend que cree una sesión nueva
                fetch('/api/crear-sesion/', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if(data.status === 'ok') {
                        this.currentSessionCode = data.codigo;
                        codeDisplay.innerText = data.codigo;
                        
                        // 2. Iniciar el Polling Real (Preguntar a la BD)
                        this.startPollingTeams(data.codigo);
                    } else {
                        console.error("Error backend:", data);
                        codeDisplay.innerText = "ERROR";
                        app.showToast("No se pudo crear la sesión", "error");
                    }
                })
                .catch(err => {
                    console.error("Error conexión:", err);
                    codeDisplay.innerText = "OFFLINE";
                });
            },

            // Esta función pregunta a Django cada 3 segundos
            startPollingTeams: function(codigoSesion) {
                const grid = document.getElementById('prof-teams-grid');
                const countEl = document.getElementById('prof-team-count');
                
                if(this.pollingInterval) clearInterval(this.pollingInterval);

                this.pollingInterval = setInterval(() => {
                    
                    // Llamada real al backend
                    fetch(`/api/obtener-equipos/${codigoSesion}/`)
                    .then(res => res.json())
                    .then(data => {
                        if(data.status === 'ok') {
                            const equiposDB = data.equipos; // Esto viene de tu base de datos
                            
                            countEl.innerText = equiposDB.length;
                            grid.innerHTML = ''; 
                            
                            if (equiposDB.length === 0) {
                                grid.innerHTML = '<p class="text-gray-500 col-span-full text-center">Esperando alumnos...</p>';
                            }

                            equiposDB.forEach(equipo => {
                                const card = `
                                    <div class="bg-white p-3 rounded-xl shadow-lg transform animate-bounce-in flex items-center justify-between border-l-4 border-green-500">
                                        <span class="font-bold text-gray-800 truncate uppercase">${equipo.nombre}</span>
                                        <i class="fas fa-check-circle text-green-500 text-xl"></i>
                                    </div>
                                `;
                                grid.innerHTML += card;
                            });
                        }
                    })
                    .catch(err => console.error("Error polling:", err));

                }, 3000); 
            },
        };

        // Iniciar app
        window.onload = function() {
            // Pequeño hack para que el navegador permita reproducir audio después de la primera interacción del usuario
            document.body.addEventListener('click', function() {
                // Solo la primera vez
                if(!this.audioEnabled) {
                     const silentAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
                     silentAudio.play().catch(()=>{});
                     this.audioEnabled = true;
                }
            }, { once: true });

            app.init();
        };

                // --- LÓGICA DEL JUEGO ---

        // 1. Array original de preguntas
        const preguntasBase = [
           "¿Qué habilidad nueva quieres aprender este año?",
           "¿Qué aplicación de tu celular no podrías borrar nunca?",
           "¿Cuál fue tu primer trabajo y qué aprendiste?",
           "Si pudieras teletransportarte ahora mismo, ¿a dónde irías?",
           "¿Qué canción has escuchado en bucle este mes?"
        ];

        // 2. Copia del array para ir descartando (evita repetir)
        let mazoActual = [...preguntasBase];

        // Referencias al DOM
        const preguntaTexto = document.getElementById("pregunta-texto");
        const cardContainer = document.getElementById("question-card");
        const btnDraw = document.getElementById("btn-draw");
        const nextStageBtn = document.getElementById("next-stage-btn");
        const counterSpan = document.getElementById("counter");
        const completionMsg = document.getElementById("completion-msg");

        // Inicializar contador
        counterSpan.textContent = `${mazoActual.length} cartas restantes`;

        function drawCard() {
            // Reproducir sonido (si tu app lo tiene)
            // app.playSound('card-flip'); 

            if (mazoActual.length > 0) {
                // Seleccionar índice aleatorio
                const randomIndex = Math.floor(Math.random() * mazoActual.length);
                
                // Obtener pregunta y eliminarla del mazo (splice devuelve un array, tomamos el elemento [0])
                const preguntaSeleccionada = mazoActual.splice(randomIndex, 1)[0];

                // Animación: Quitamos y ponemos la clase para reiniciar la animación
                cardContainer.classList.remove("pop-in");
                void cardContainer.offsetWidth; // Truco para reiniciar el reflujo del DOM
                cardContainer.classList.add("pop-in");

                // Actualizar texto
                preguntaTexto.textContent = preguntaSeleccionada;
                
                // Actualizar contador
                counterSpan.textContent = mazoActual.length === 0 
                    ? "¡Última carta!" 
                    : `${mazoActual.length} cartas restantes`;

                // Cambiar color del borde levemente para indicar acción
                cardContainer.classList.add("border-pink-200");
                setTimeout(() => cardContainer.classList.remove("border-pink-200"), 300);

            } 
            
            // Verificación: Si el mazo quedó vacío DESPUÉS de sacar esta carta
            if (mazoActual.length === 0) {
                // Cambiar el botón de "Sacar Carta" para indicar que es la última o terminar
                btnDraw.innerHTML = '<i class="fas fa-check"></i> Terminar';
                btnDraw.onclick = finalizarJuego; // Cambiamos la función del botón
                btnDraw.classList.remove("bg-gray-900", "hover:bg-pink-600");
                btnDraw.classList.add("bg-green-500", "hover:bg-green-600");
            }
        }

        function finalizarJuego() {
            // 1. Ocultar el botón de juego
            btnDraw.style.display = 'none';
            
            // 2. Mostrar el botón de "Siguiente Fase" (El código que tenías)
            nextStageBtn.classList.remove("hidden");
            completionMsg.classList.remove("hidden");
            
            // 3. Feedback visual en la carta final
            counterSpan.textContent = "Completado";
            counterSpan.classList.add("bg-green-100", "text-green-600");
        }

        async function enviarEquipoAlBackend() {
            try {
                const nombreEquipo = document.getElementById("input-team-name").value;
                const codigo = document.getElementById("input-code").value;

            // recolectar integrantes desde tu lista dinámica
            const miembrosHTML = document.querySelectorAll("#members-list .member-item");

            let integrantes = [];
            miembrosHTML.forEach(m => {
                const nombreEl = m.querySelector(".member-name");
                const carreraEl = m.querySelector(".member-career");
                
                if (nombreEl && carreraEl) {
                    // Limpiar el texto (remover iconos y espacios extra)
                    const nombre = nombreEl.innerText.trim().replace(/^\S+\s+/, ''); // Remover icono si existe
                    const carrera = carreraEl.innerText.trim();
                    
                    if (nombre) {
                        integrantes.push({
                            nombre: nombre,
                            carrera: carrera || "Sin definir"
                        });
                    }
                }
            });
            
            // Si no hay integrantes en el HTML, usar el estado interno
            if (integrantes.length === 0 && app.state.members.length > 0) {
                integrantes = app.state.members.map(m => ({
                    nombre: m.name,
                    carrera: m.career || "Sin definir"
                }));
            }

            const payload = {
                nombre_equipo: nombreEquipo,
                codigo: codigo,
                carrera_principal: integrantes.length > 0 ? integrantes[0].carrera : "Sin definir",
                integrantes: integrantes
            };

            console.log("Enviando payload:", payload);
            
            const response = await fetch("/api/registrar-equipo/", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            });

            const resultado = await response.json();
            console.log("Resultado del servidor:", resultado);

            if (resultado.status === "ok") {
                app.finishLogin(); // tu función original
            } else {
                // Mostrar error al usuario
                const errorMsg = resultado.error || "Error al registrar el equipo";
                app.showToast(errorMsg, 'error');
                console.error("Error:", errorMsg);
            }
            } catch (error) {
                console.error("Error al enviar equipo:", error);
                app.showToast("Error de conexión. Por favor intenta nuevamente.", 'error');
            }
        };