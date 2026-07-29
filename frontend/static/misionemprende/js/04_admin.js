// ════════════════════════════════════════════════════════════════
//  ARCHIVO: 04_admin.js — Funciones de Profesor, Admin y Sincronización
// ════════════════════════════════════════════════════════════════

Object.assign(app, {
    // -------------------------------------------------------------
    // 1. LOGIN Y NAVEGACIÓN ADMIN
    // -------------------------------------------------------------
    adminLogin: async function() {
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value;

    try {
        const response = await apiFetch('/api/admin/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass }),
        });
        const data = await response.json();
        if (!response.ok || data.status !== 'ok') throw new Error(data.error || 'Acceso denegado.');

        sessionStorage.setItem('misionEmprendeAdminToken', data.token);
        this.playSound('success');
        this.showView('view-admin-dashboard');

        setTimeout(() => {
            this.loadAdminData();
            this._renderAdminConfigPanel();
            this._switchAdminTab('teams');
        }, 100);
    } catch (error) {
        this.playSound('error');
        this.showToast(error.message || 'Acceso denegado.', 'error');
        const passEl = document.getElementById('admin-pass');
        if (passEl) {
            passEl.classList.add('border-red-500','animate-shake');
            setTimeout(() => passEl.classList.remove('border-red-500','animate-shake'), 500);
        }
    }
},

    adminLogout: function() {
    apiFetch('/api/admin/logout/', { method: 'POST' }).catch(() => {});
    sessionStorage.removeItem('misionEmprendeAdminToken');
    this.goHome();
},

    _switchAdminTab: function(tab) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('border-pink-500', 'text-white');
            btn.classList.add('border-transparent', 'text-gray-400');
        });
        const content = document.getElementById(`tab-${tab}`);
        const btn     = document.getElementById(`tab-btn-${tab}`);
        if (content) content.classList.remove('hidden');
        if (btn) {
            btn.classList.add('border-pink-500', 'text-white');
            btn.classList.remove('border-transparent', 'text-gray-400');
        }
        if (tab === 'config') this._renderAdminConfigPanel();
        if (tab === 'teams') this.loadAdminData();
        if (tab === 'history') { if (!this.adminData) this.loadAdminData(); else this.renderAdminHistory(); }
    },

    // -------------------------------------------------------------
    // 2. GESTIÓN DE EQUIPOS (ADMIN)
    // -------------------------------------------------------------
    loadAdminData: function() {
        const grid = document.getElementById('admin-teams-grid');
        if (grid) grid.innerHTML = '<p class="text-gray-400 ml-4 animate-pulse">Consultando registros...</p>';

        apiFetch('/api/admin-stats/')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                this.adminData = data;
                const tt = document.getElementById('admin-total-teams');
                const ta = document.getElementById('admin-total-agents');
                if (tt) tt.innerText = data.total_equipos;
                if (ta) ta.innerText = data.total_agentes;
                this.renderAdminMetrics(data.metricas || {});
                this.populateAdminFilters(data.sesiones || []);
                this.renderAdminTeams(data.equipos || []);
                this.renderAdminHistory();
            } else {
                this.showToast("Error de servidor", "error");
            }
        }).catch(() => { if (grid) grid.innerHTML = '<p class="text-red-500 ml-4">Error de conexión.</p>'; });
    },

    renderAdminMetrics: function(metrics) {
        const grid = document.getElementById('admin-metrics-grid');
        if (!grid) return;
        const cards = [
            ['Sesiones registradas', metrics.total_sesiones ?? 0, 'Total de ejecuciones guardadas en el sistema'],
            ['Participantes registrados', metrics.total_estudiantes ?? 0, 'Total de estudiantes asociados a sesiones'],
            ['Grupos registrados', metrics.total_grupos ?? 0, 'Total de grupos creados en todas las sesiones'],
            ['Promedio por grupo', metrics.promedio_estudiantes_por_grupo ?? 'Sin datos', 'Media de participantes por grupo'],
            ['Facultad más frecuente', metrics.facultad_mas_frecuente || 'Sin datos suficientes', 'Segmentación con más sesiones'],
            ['Profesor con más sesiones', metrics.profesor_con_mas_sesiones || 'Sin datos suficientes', 'Docente con mayor número de registros'],
            ['Modalidad más usada', metrics.modalidad_mas_usada || 'Sin datos suficientes', 'Manual, Excel o no especificada'],
            ['Duración promedio', metrics.duracion_promedio || 'Sin datos suficientes', 'Solo se calcula si existe inicio y término'],
        ];
        grid.innerHTML = cards.map(([title, value, desc]) => `
            <div class="bg-black border border-gray-800 p-5 rounded-2xl shadow-lg">
                <p class="text-gray-400 text-xs uppercase tracking-wider mb-2">${title}</p>
                <p class="text-2xl text-white font-bold break-words">${value}</p>
                <p class="text-gray-500 text-xs mt-2">${desc}</p>
            </div>
        `).join('');
    },

    renderAdminTeams: function(teams) {
        const grid = document.getElementById('admin-teams-grid');
        if (!grid) return;
        grid.innerHTML = '';
        if (!teams.length) {
            grid.innerHTML = '<p class="text-gray-500 col-span-full ml-4">No hay grupos registrados.</p>';
            return;
        }
        teams.forEach(team => {
            grid.innerHTML += `
                <div class="bg-gray-950 border border-gray-800 rounded-xl p-5 hover:border-pink-500 transition shadow-lg relative group">
                    <button onclick="app.adminDeleteTeam('${team.id || team.nombre}')" class="absolute top-3 right-3 text-gray-600 hover:text-red-500 transition" title="Eliminar grupo">
                        <i class="fas fa-trash"></i>
                    </button>
                    <div class="text-xs text-pink-500 font-mono mb-2">SESIÓN: ${team.codigo_sesion}</div>
                    <h3 class="text-xl font-bold text-white mb-2 truncate uppercase">${team.nombre}</h3>
                    <div class="text-xs text-gray-500 mb-2">Puntaje acumulado: ${team.puntaje_total || 0}</div>
                    <div class="bg-gray-900 p-3 rounded text-xs text-gray-400 leading-relaxed h-20 overflow-y-auto">
                        ${(team.miembros || []).map(m => `• ${m}`).join('<br>') || 'Sin participantes registrados'}
                    </div>
                </div>
            `;
        });
    },

    normalizeSession: function(session) {
        return {
            ...session,
            nombreProfesor: session.nombreProfesor || 'Sin profesor registrado',
            facultad: session.facultad || 'Sin facultad registrada',
            modalidadGrupos: session.modalidadGrupos || 'No especificada',
            cantidad_grupos: session.cantidad_grupos || 0,
            cantidad_participantes: session.cantidad_participantes || 0,
        };
    },

    formatSessionDate: function(dateValue) {
        if (!dateValue) return 'Sin fecha registrada';
        try {
            return new Date(dateValue).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
        } catch(e) { return 'Fecha no válida'; }
    },

    populateAdminFilters: function(sessions) {
        const normalized = sessions.map(s => this.normalizeSession(s));
        const config = [
            ['filter-faculty', 'facultad', 'Todas las facultades'],
            ['filter-professor', 'nombreProfesor', 'Todos los profesores'],
            ['filter-modality', 'modalidadGrupos', 'Todas las modalidades'],
            ['filter-status', 'estado', 'Todos los estados'],
        ];
        config.forEach(([id, field, label]) => {
            const select = document.getElementById(id);
            if (!select) return;
            const current = select.value;
            const values = [...new Set(normalized.map(s => s[field]).filter(Boolean))].sort();
            select.innerHTML = `<option value="">${label}</option>` + values.map(v => `<option value="${v}">${v}</option>`).join('');
            select.value = values.includes(current) ? current : '';
        });
    },

    groupSessions: function(sessions) {
        const grouped = {};
        sessions.forEach(raw => {
            const session = this.normalizeSession(raw);
            if (!grouped[session.facultad]) grouped[session.facultad] = {};
            if (!grouped[session.facultad][session.nombreProfesor]) grouped[session.facultad][session.nombreProfesor] = [];
            grouped[session.facultad][session.nombreProfesor].push(session);
        });
        Object.values(grouped).forEach(byProfessor => {
            Object.values(byProfessor).forEach(list => list.sort((a,b) => new Date(b.creado_en || 0) - new Date(a.creado_en || 0)));
        });
        return grouped;
    },

    renderAdminHistory: function() {
        const container = document.getElementById('admin-history-container');
        if (!container || !this.adminData) return;
        const faculty = document.getElementById('filter-faculty')?.value || '';
        const professor = document.getElementById('filter-professor')?.value || '';
        const modality = document.getElementById('filter-modality')?.value || '';
        const status = document.getElementById('filter-status')?.value || '';
        const date = document.getElementById('filter-date')?.value || '';

        let sessions = (this.adminData.sesiones || []).map(s => this.normalizeSession(s));
        sessions = sessions.filter(s => {
            const sessionDate = (s.creado_en || s.fecha_inicio || '').slice(0, 10);
            return (!faculty || s.facultad === faculty)
                && (!professor || s.nombreProfesor === professor)
                && (!modality || s.modalidadGrupos === modality)
                && (!status || s.estado === status)
                && (!date || sessionDate === date);
        });

        if (!sessions.length) {
            container.innerHTML = '<div class="bg-black border border-gray-800 rounded-2xl p-6 text-gray-500">No hay sesiones que coincidan con los filtros.</div>';
            return;
        }

        const grouped = this.groupSessions(sessions);
        container.innerHTML = Object.entries(grouped).map(([facultad, professors]) => `
            <details class="bg-black border border-gray-800 rounded-2xl overflow-hidden" open>
                <summary class="cursor-pointer px-6 py-4 bg-gray-950 text-white font-bold text-lg">${facultad}</summary>
                <div class="p-5 space-y-5">
                    ${Object.entries(professors).map(([prof, list]) => `
                        <details class="bg-gray-950 border border-gray-800 rounded-xl" open>
                            <summary class="cursor-pointer px-5 py-3 text-blue-300 font-bold">Profesor: ${prof}</summary>
                            <div class="p-4 space-y-3">
                                ${list.map(session => `
                                    <details class="bg-gray-900 border border-gray-800 rounded-xl p-4">
                                        <summary class="cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-white font-semibold">
                                            <span>Sesión ${session.codigo} · ${this.formatSessionDate(session.creado_en || session.fecha_inicio)}</span>
                                            <span class="text-xs text-gray-400">${session.estado} · ${session.modalidadGrupos}</span>
                                        </summary>
                                        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-sm">
                                            <div class="bg-gray-950 rounded-lg p-3"><span class="text-gray-500 block text-xs">Grupos</span><span class="text-white font-bold">${session.cantidad_grupos}</span></div>
                                            <div class="bg-gray-950 rounded-lg p-3"><span class="text-gray-500 block text-xs">Participantes</span><span class="text-white font-bold">${session.cantidad_participantes}</span></div>
                                            <div class="bg-gray-950 rounded-lg p-3"><span class="text-gray-500 block text-xs">Duración</span><span class="text-white font-bold">${session.duracion || 'Sin datos suficientes'}</span></div>
                                            <div class="bg-gray-950 rounded-lg p-3"><span class="text-gray-500 block text-xs">Puntaje total</span><span class="text-white font-bold">${session.puntaje_total || 0}</span></div>
                                        </div>
                                        <div class="mt-4 bg-gray-950 rounded-xl p-4 max-h-72 overflow-y-auto">
                                            <h4 class="text-gray-300 font-bold mb-3">Detalle de grupos</h4>
                                            ${(session.grupos || []).length ? session.grupos.map(g => `
                                                <div class="border-t border-gray-800 py-3">
                                                    <div class="flex justify-between text-sm"><span class="text-white font-bold">${g.nombre}</span><span class="text-gray-400">${(g.integrantes || []).length} participantes · ${g.puntaje_total || 0} pts</span></div>
                                                    <div class="text-xs text-gray-500 mt-1">${(g.integrantes || []).map(i => i.nombre).join(', ') || 'Sin participantes registrados'}</div>
                                                </div>
                                            `).join('') : '<p class="text-gray-500 text-sm">Sin grupos registrados.</p>'}
                                        </div>
                                    </details>
                                `).join('')}
                            </div>
                        </details>
                    `).join('')}
                </div>
            </details>
        `).join('');
    },

    adminDeleteTeam: async function(teamId) {
        if (confirm("⚠️ ¿Eliminar este equipo de la base de datos permanentemente?")) {
            await apiFetch(`/api/admin/kick/?team_id=${teamId}`, { method: 'POST' }).catch(() => {});
            this.showToast("Grupo eliminado", "success");
            this.loadAdminData(); 
        }
    },

    adminNukeAllTeams: async function() {
        if (confirm("¿Estás seguro de que quieres eliminar todos los grupos registrados?")) {
            await apiFetch(`/api/admin/clear-all/`, { method: 'POST' }).catch(() => {});
            this.showToast("Registros eliminados", "success");
            this.loadAdminData();
        }
    },

    // -------------------------------------------------------------
    // 3. CONFIGURACIÓN Y TEXTOS (01_config.js)
    // -------------------------------------------------------------
    _renderAdminConfigPanel: function() {
        const panel = document.getElementById('admin-config-panel');
        if (!panel) return;

        let html = '';
        html += `<h3 class="text-xl text-pink-500 font-bold gamer-font mb-4"><i class="fas fa-clock mr-2"></i>Tiempos y Monedas</h3>`;
        [1, 2, 3, 4, 5].forEach(phase => {
            const cfg = PHASE_CONFIG[phase] || {};
            html += `
                <div class="bg-black rounded-xl p-5 mb-4 border border-gray-700">
                    <h4 class="text-white font-bold gamer-font mb-3 uppercase">Fase ${phase}</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${cfg.timerMin !== undefined ? `<div><label class="text-gray-500 text-xs font-mono mb-1 block">Minutos</label><input type="number" value="${cfg.timerMin}" onchange="app.updateConfigValue('num', ${phase}, 'timerMin', this.value)" class="w-full bg-gray-900 border border-gray-600 text-pink-400 p-2 rounded outline-none font-mono text-center"></div>` : ''}
                        ${cfg.pitchSec !== undefined ? `<div><label class="text-gray-500 text-xs font-mono mb-1 block">Seg. Pitch</label><input type="number" value="${cfg.pitchSec}" onchange="app.updateConfigValue('num', ${phase}, 'pitchSec', this.value)" class="w-full bg-gray-900 border border-gray-600 text-pink-400 p-2 rounded outline-none font-mono text-center"></div>` : ''}
                        ${cfg.coinsFirst !== undefined ? `<div><label class="text-gray-500 text-xs font-mono mb-1 block">🥇 Coins</label><input type="number" value="${cfg.coinsFirst}" onchange="app.updateConfigValue('num', ${phase}, 'coinsFirst', this.value)" class="w-full bg-gray-900 border border-gray-600 text-yellow-400 p-2 rounded outline-none font-mono text-center"></div>` : ''}
                        ${cfg.evalCoinsPerTeam !== undefined ? `<div><label class="text-gray-500 text-xs font-mono mb-1 block">Coins x Equipo</label><input type="number" value="${cfg.evalCoinsPerTeam}" onchange="app.updateConfigValue('num', ${phase}, 'evalCoinsPerTeam', this.value)" class="w-full bg-gray-900 border border-gray-600 text-yellow-400 p-2 rounded outline-none font-mono text-center"></div>` : ''}
                    </div>
                </div>
            `;
        });

        html += `<h3 class="text-xl text-blue-400 font-bold gamer-font mb-4 mt-8"><i class="fas fa-comment-dots mr-2"></i>Textos de Transición</h3>`;
        [1, 2, 3, 4].forEach(phase => {
            const nar = PHASE_NARRATIVES[phase] || {};
            html += `
                <div class="bg-black rounded-xl p-5 mb-4 border border-gray-700">
                    <h4 class="text-white font-bold gamer-font mb-3 uppercase">Transición Fase ${phase} -> ${phase+1}</h4>
                    <div class="space-y-3">
                        <div>
                            <label class="text-gray-500 text-xs font-mono mb-1 block">Habilidad Lograda (Ej: Trabajo en equipo)</label>
                            <input type="text" value="${nar.phaseLabel}" onchange="app.updateConfigValue('text', ${phase}, 'phaseLabel', this.value)" class="w-full bg-gray-900 border border-gray-600 text-blue-300 p-2 rounded outline-none font-mono text-sm">
                        </div>
                        <div>
                            <label class="text-gray-500 text-xs font-mono mb-1 block">Título Siguiente (Ej: Fase 2 — Empatía)</label>
                            <input type="text" value="${nar.nextTitle}" onchange="app.updateConfigValue('text', ${phase}, 'nextTitle', this.value)" class="w-full bg-gray-900 border border-gray-600 text-blue-300 p-2 rounded outline-none font-mono text-sm">
                        </div>
                        <div>
                            <label class="text-gray-500 text-xs font-mono mb-1 block">Explicación Siguiente Fase</label>
                            <textarea onchange="app.updateConfigValue('text', ${phase}, 'nextHint', this.value)" class="w-full bg-gray-900 border border-gray-600 text-gray-300 p-2 rounded outline-none font-mono text-sm h-16 resize-none">${nar.nextHint}</textarea>
                        </div>
                    </div>
                </div>
            `;
        });

        panel.innerHTML = html;
    },

    updateConfigValue: function(type, phase, field, value) {
        if (type === 'num') {
            const num = parseFloat(value);
            if (!isNaN(num)) PHASE_CONFIG[phase][field] = num;
        } else if (type === 'text') {
            PHASE_NARRATIVES[phase][field] = value;
        }
        
        apiFetch('/api/admin/update-config/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase, field, value, codigo: this.currentSessionCode })
        }).catch(() => {});
        
        this.showToast("Parámetro actualizado", "success");
    },

    resetPhaseConfigToDefaults: function() {
        if(typeof PHASE_NARRATIVES_DEFAULTS !== 'undefined'){
            PHASE_NARRATIVES = JSON.parse(JSON.stringify(PHASE_NARRATIVES_DEFAULTS));
        }
        PHASE_CONFIG = JSON.parse(JSON.stringify(PHASE_CONFIG_DEFAULTS));
        this.showToast("Parámetros restaurados a valores por defecto", "success");
        this._renderAdminConfigPanel();
    },

    // -------------------------------------------------------------
    // 4. PANEL DEL PROFESOR
    // -------------------------------------------------------------
    initProfessorLogin: function() {
        this.teacherSetup = {
            nombreProfesor: '',
            facultad: '',
            modalidadGrupos: 'manual',
            estudiantesExcel: [],
            gruposExcel: []
        };
        this.setTeacherGroupMode('manual');
    },

    setTeacherGroupMode: function(mode) {
        const selectedMode = mode === 'excel' ? 'excel' : 'manual';
        if (!this.teacherSetup) this.initProfessorLogin();
        this.teacherSetup.modalidadGrupos = selectedMode;

        const manualBtn = document.getElementById('teacher-mode-manual');
        const excelBtn = document.getElementById('teacher-mode-excel');
        const panel = document.getElementById('teacher-excel-panel');
        const desc = document.getElementById('teacher-mode-description');
        const active = ['bg-pink-600','text-white'];
        const inactive = ['text-gray-300'];

        if (manualBtn && excelBtn) {
            manualBtn.classList.toggle('bg-pink-600', selectedMode === 'manual');
            manualBtn.classList.toggle('text-white', selectedMode === 'manual');
            manualBtn.classList.toggle('text-gray-300', selectedMode !== 'manual');
            excelBtn.classList.toggle('bg-pink-600', selectedMode === 'excel');
            excelBtn.classList.toggle('text-white', selectedMode === 'excel');
            excelBtn.classList.toggle('text-gray-300', selectedMode !== 'excel');
        }
        if (panel) panel.classList.toggle('hidden', selectedMode !== 'excel');
        if (desc) desc.textContent = selectedMode === 'excel'
            ? 'Lista Excel: se carga una lista de estudiantes y se crean grupos equilibrados automáticamente.'
            : 'Conteo manual de grupos: los equipos se registran como en el flujo actual.';
    },

    validateTeacherLogin: function(data) {
        if (!data.nombreProfesor) return 'No se pudo continuar: ingresa el nombre del profesor.';
        if (!data.facultad) return 'No se pudo continuar: ingresa la facultad.';
        if (!['manual','excel'].includes(data.modalidadGrupos)) return 'No se pudo continuar: selecciona una modalidad de grupos.';
        if (data.modalidadGrupos === 'excel') {
            if (!data.grupos || data.grupos.length === 0) return 'No se pudo continuar: carga una lista Excel válida antes de crear la sesión.';
            const total = data.grupos.reduce((sum, g) => sum + ((g.integrantes || []).length), 0);
            if (total === 0) return 'La lista está vacía o no contiene estudiantes válidos.';
        }
        return null;
    },

    detectStudentNameColumn: function(rows) {
        if (!rows || rows.length === 0) return -1;
        const normalizedHeader = rows[0].map(c => String(c || '').trim().toLowerCase());
        const candidates = ['nombre completo','nombre','estudiante','alumno','participante','name','student'];
        for (const candidate of candidates) {
            const idx = normalizedHeader.findIndex(col => col.includes(candidate));
            if (idx >= 0) return idx;
        }
        // Si no hay encabezado claro, usa la columna con más celdas no vacías.
        const maxCols = Math.max(...rows.slice(0, 20).map(r => r.length), 0);
        let bestIdx = -1, bestCount = 0;
        for (let c = 0; c < maxCols; c++) {
            let count = 0;
            for (let r = 0; r < Math.min(rows.length, 30); r++) {
                const value = String((rows[r] || [])[c] || '').trim();
                if (value && !/^\d+$/.test(value)) count++;
            }
            if (count > bestCount) { bestCount = count; bestIdx = c; }
        }
        return bestCount > 0 ? bestIdx : -1;
    },

    parseExcelStudents: async function(file) {
        if (!file) throw new Error('No se pudo leer la lista: selecciona un archivo válido.');
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!['xlsx','xls','csv'].includes(ext)) throw new Error('No se pudo leer la lista: usa un archivo .xlsx, .xls o .csv.');
        if (typeof XLSX === 'undefined') throw new Error('No se pudo leer la lista: la librería XLSX no está disponible.');

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (!rows || rows.length === 0) throw new Error('La lista está vacía o no contiene estudiantes válidos.');

        const nameCol = this.detectStudentNameColumn(rows);
        if (nameCol < 0) throw new Error('No se pudo leer la lista: revisa que el Excel tenga una columna de nombres.');
        const headerLooksReal = rows[0].map(c => String(c || '').toLowerCase()).some(c => ['nombre','estudiante','alumno','participante','name'].some(k => c.includes(k)));
        const startRow = headerLooksReal ? 1 : 0;

        const seen = new Set();
        const students = [];
        for (let i = startRow; i < rows.length; i++) {
            const rawName = String((rows[i] || [])[nameCol] || '').trim();
            const name = rawName.replace(/\s+/g, ' ');
            if (!name || name.length < 2) continue;
            const key = name.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            students.push({ nombre: name, carrera: 'Sin definir' });
        }
        if (students.length === 0) throw new Error('La lista está vacía o no contiene estudiantes válidos.');
        return students;
    },

    splitStudentsIntoGroups: function(students, numberOfGroups) {
        const total = students.length;
        const groupCount = Math.max(1, Math.min(parseInt(numberOfGroups, 10) || 1, total));
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const groups = Array.from({ length: groupCount }, (_, idx) => ({
            grupoId: idx + 1,
            nombreGrupo: `Grupo ${idx + 1}`,
            integrantes: []
        }));
        shuffled.forEach((student, idx) => groups[idx % groupCount].integrantes.push(student));
        return groups.filter(g => g.integrantes.length > 0);
    },

    handleTeacherExcelUpload: async function(event) {
        const file = event.target.files[0];
        const status = document.getElementById('teacher-excel-status');
        try {
            if (status) { status.textContent = 'Procesando archivo...'; status.className = 'text-xs text-yellow-400 mt-2'; }
            const students = await this.parseExcelStudents(file);
            const groupCount = document.getElementById('teacher-group-count-input')?.value || 4;
            const groups = this.splitStudentsIntoGroups(students, groupCount);
            this.teacherSetup.estudiantesExcel = students;
            this.teacherSetup.gruposExcel = groups;
            this.renderTeacherGeneratedGroups(groups);
            if (status) { status.textContent = `${students.length} estudiantes detectados y ${groups.length} grupos generados.`; status.className = 'text-xs text-green-400 mt-2'; }
        } catch (err) {
            this.teacherSetup.estudiantesExcel = [];
            this.teacherSetup.gruposExcel = [];
            this.renderTeacherGeneratedGroups([]);
            if (status) { status.textContent = err.message; status.className = 'text-xs text-red-400 mt-2'; }
            this.showToast(err.message, 'error');
        }
    },

    renderTeacherGeneratedGroups: function(groups) {
        const preview = document.getElementById('teacher-generated-groups-preview');
        if (!preview) return;
        if (!groups || groups.length === 0) {
            preview.classList.add('hidden');
            preview.innerHTML = '';
            return;
        }
        preview.classList.remove('hidden');
        preview.innerHTML = groups.map(group => `
            <div class="bg-gray-900 border border-gray-700 rounded-xl p-4">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="text-white font-bold">${group.nombreGrupo}</h4>
                    <span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">${group.integrantes.length} participantes</span>
                </div>
                <div class="text-xs text-gray-400 max-h-28 overflow-y-auto">
                    ${group.integrantes.map(p => `<div>• ${p.nombre}</div>`).join('')}
                </div>
            </div>
        `).join('');
    },

    submitTeacherLogin: async function() {
        const nombreProfesor = (document.getElementById('teacher-name-input')?.value || '').trim();
        const facultad = (document.getElementById('teacher-faculty-input')?.value || '').trim();
        const modalidadGrupos = this.teacherSetup?.modalidadGrupos || 'manual';
        const grupos = modalidadGrupos === 'excel' ? (this.teacherSetup?.gruposExcel || []) : [];
        const payload = { nombreProfesor, facultad, modalidadGrupos, origenGrupos: modalidadGrupos, grupos };
        
        const error = this.validateTeacherLogin(payload);
        if (error) { this.showToast(error, 'error'); return; }

        // --- EFECTO VISUAL DEL BOTÓN ---
        // Buscamos el botón de crear sesión
        const btn = document.querySelector('button[onclick="app.submitTeacherLogin()"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> CREANDO...';
            // Estilo de "botón presionado/seleccionado"
            btn.classList.add('bg-gray-700', 'border-gray-800', 'translate-y-1', 'opacity-80');
            btn.classList.remove('bg-green-500', 'hover:bg-green-600', 'hover:-translate-y-1');
        }

        // Poblamos los datos del profesor en el panel superior antes de entrar
        const displayNombre = document.getElementById('display-prof-name');
        const displayFacultad = document.getElementById('display-prof-faculty');
        if (displayNombre) displayNombre.innerText = nombreProfesor;
        if (displayFacultad) displayFacultad.innerText = facultad;

        // Llamamos a la creación de sesión
        await this.initProfessorView(payload);
    },

    initProfessorView: function(sessionPayload = null) {
        const codeDisplay = document.getElementById('prof-session-code');
        if (codeDisplay) codeDisplay.innerText = "CONECTANDO...";

        apiFetch('/api/crear-sesion/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionPayload || { modalidadGrupos: 'manual' })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                this.currentSessionCode = data.codigo;
                if (codeDisplay) codeDisplay.innerText = data.codigo;
                this.startPollingTeams(data.codigo);
                this.showToast('Sesión creada correctamente.', 'success');
                
                // CAMBIO CLAVE: Ahora showView ocultará el login gracias al fix anterior
                this.showView('view-professor');
            } else {
                if (codeDisplay) codeDisplay.innerText = "ERROR";
                this.showToast(data.error || 'No se pudo crear la sesión.', 'error');
                // Si falla, restauramos el botón para reintentar
                this._restoreLoginButton();
            }
        }).catch(() => { 
            if (codeDisplay) codeDisplay.innerText = "OFFLINE";
            this._restoreLoginButton();
        });
    },

    // Función auxiliar para restaurar el botón si algo falla
    _restoreLoginButton: function() {
        const btn = document.querySelector('button[onclick="app.submitTeacherLogin()"]');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check mr-2"></i> Crear sesión';
            btn.classList.remove('bg-gray-700', 'border-gray-800', 'translate-y-1', 'opacity-80');
            btn.classList.add('bg-green-500', 'hover:bg-green-600');
        }
    },

    startPollingTeams: function(codigoSesion) {
        const grid    = document.getElementById('prof-teams-grid');
        const countEl = document.getElementById('prof-team-count');
        if (this.pollingInterval) clearInterval(this.pollingInterval);

        this.pollingInterval = setInterval(() => {
            apiFetch(`/api/obtener-equipos/${codigoSesion}/`)
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
                            const photoHtml = equipo.prototipo_url 
                                ? `<img src="${equipo.prototipo_url}" class="mt-3 w-full h-24 object-cover rounded-lg border-2 border-gray-600 cursor-pointer hover:border-pink-500 transition" onclick="app.showLivePresentation('${equipo.nombre}', '${equipo.prototipo_url}')">` 
                                : `<div class="mt-3 w-full h-24 bg-gray-900 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-gray-600 text-xs cursor-pointer hover:bg-gray-800 transition" onclick="app.showLivePresentation('${equipo.nombre}', null)"><i class="fas fa-camera mb-1 text-lg"></i>Proyectar</div>`;
                            
                            grid.innerHTML += `
                                <div class="bg-gray-800 p-4 rounded-xl shadow-lg border-t-4 border-blue-500 relative group transition hover:-translate-y-1">
                                    <button onclick="app.profesorKickTeam('${equipo.id || equipo.nombre}')" class="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" title="Expulsar"><i class="fas fa-times-circle"></i></button>
                                    <span class="font-bold text-white block uppercase tracking-wide truncate pr-6">${equipo.nombre}</span>
                                    <div class="text-xs text-blue-400 font-bold mb-1">${equipo.miembros?.length || 0} integrantes</div>
                                    ${photoHtml}
                                </div>
                            `;
                        });
                    }
                }
            }).catch(() => {});
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
        await apiFetch(`/api/admin/start/?codigo=${this.currentSessionCode}`, { method: 'POST' }).catch(() => {});
        this.showToast("Juego Iniciado. Equipos sincronizados.", "success");
        
        const btnStart = document.getElementById('btn-prof-start');
        const btnPause = document.getElementById('btn-prof-pause');
        const btnNext = document.getElementById('btn-prof-next');
        
        if (btnStart) btnStart.classList.add('hidden');
        if (btnPause) { btnPause.classList.remove('hidden'); btnPause.classList.add('flex'); }
        if (btnNext) { btnNext.classList.remove('hidden'); btnNext.classList.add('flex'); }

        // Reproducimos el sonido, pero NO cambiamos de vista (el profesor se queda en el panel)
        this.playSound('success'); 
    },

    profesorNextStage: async function() {
        if (confirm("¿Estás seguro de forzar a todos los equipos a la siguiente fase?")) {
            await apiFetch(`/api/admin/next/?codigo=${this.currentSessionCode}`, { method: 'POST' }).catch(() => {});
            this.showToast("Avanzando a la siguiente fase...", "success");
        }
    },

    profesorTogglePause: async function() {
        const btn = document.getElementById('btn-prof-pause');
        const isPausing = btn && btn.innerText.includes("PAUSAR");
        await apiFetch(`/api/admin/pause/?codigo=${this.currentSessionCode}&state=${isPausing}`, { method: 'POST' }).catch(() => {});
        if (btn) {
            if (isPausing) { btn.innerHTML = '<i class="fas fa-play mr-3"></i> REANUDAR JUEGO'; btn.classList.replace('bg-yellow-500','bg-green-500'); }
            else           { btn.innerHTML = '<i class="fas fa-pause mr-3"></i> PAUSAR TODOS';  btn.classList.replace('bg-green-500','bg-yellow-500'); }
        }
    },

    profesorKickTeam: async function(teamId) {
        if (confirm("❌ ¿Expulsar a este equipo de la sesión actual?")) {
            await apiFetch(`/api/admin/kick/?team_id=${teamId}`, { method: 'POST' }).catch(() => {});
            this.showToast("Equipo expulsado", "success");
        }
    },

    showLivePresentation: function(teamName, imgUrl) {
        const area = document.getElementById('prof-presentation-area');
        const nameEl = document.getElementById('prof-live-team-name');
        const imgEl = document.getElementById('prof-live-prototype');
        const noImgEl = document.getElementById('prof-live-no-img');

        if(area) { area.classList.remove('hidden'); area.classList.add('flex'); }
        if(nameEl) nameEl.innerText = teamName;

        if (imgUrl) {
            if(imgEl) { imgEl.src = imgUrl; imgEl.classList.remove('hidden'); }
            if(noImgEl) noImgEl.classList.add('hidden');
        } else {
            if(imgEl) imgEl.classList.add('hidden');
            if(noImgEl) { noImgEl.classList.remove('hidden'); noImgEl.classList.add('flex'); }
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // -------------------------------------------------------------
    // 5. EXCEL Y AGRUPACIÓN IA
    // -------------------------------------------------------------
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

            const response = await apiFetch('/api/agrupar-alumnos/', {
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

    // -------------------------------------------------------------
    // 6. SINCRONIZACIÓN Y TRANSICIONES
    // -------------------------------------------------------------

    showLobbyWaitingScreen: function() {
        this.showView('view-login');
        setTimeout(() => {
            const step1   = document.getElementById('login-step-1'); 
            const step2   = document.getElementById('login-step-2');
            const waiting = document.getElementById('lobby-waiting-screen');
            
            if (step1) {
                step1.classList.add('hidden');
                step1.classList.remove('opacity-100', 'scale-100');
            }
            if (step2)   step2.classList.add('hidden');
            if (waiting) waiting.classList.remove('hidden');
        }, 160);
    },

    startGlobalSync: function() {
        if (this.globalSyncInterval) clearInterval(this.globalSyncInterval);
        this.globalSyncInterval = setInterval(async () => {
            if (!this.state.sessionCode || !this.state.teamName) return;
            try {
                const response = await apiFetch(`/api/estado-juego/?codigo=${this.state.sessionCode}&equipo=${this.state.teamName}`);
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
            // /api/estado-juego nunca ha enviado "tiempo_restante" (ni en Django ni en
            // las Lambdas): reanudamos con los segundos que el propio cliente venía
            // contando antes de la pausa, en vez de NaN.
            const remainingSeconds = this.state.timerRemainingSeconds ?? 0;
            if (remainingSeconds > 0) this.startTimer(remainingSeconds / 60);
        }

        if (serverData.ranking_temporal) {
            this.state.ranking = serverData.ranking_temporal;
        }

        if (serverData.current_stage > this.state.currentStage) {
            this.state.currentStage = serverData.current_stage;
            const section = document.getElementById('view-transition');
            if (section) section.classList.add('hidden');
            
            if (this.state.currentStage === 1) this.playLobbyIntro('view-stage1-intro'); 
            else if (this.state.currentStage === 2) this.showView('view-stage2-topics');
            else if (this.state.currentStage === 3) this.startStage3();
            // Ya NO forzamos cargar la fase 4 aquí, lo manejamos abajo con sub_stage
            
            // EL ARREGLO: Si el profe fuerza avanzar y pasa de la fase 4 (llega a 5 o más)
            else if (this.state.currentStage >= 5) {
                this.showToast("El profesor ha finalizado la sesión. Procesando resultados...", "warning");
                // Obligamos a que el sistema envíe los borradores actuales y salte al podio final
                if (typeof this.submitAllEvaluations === 'function') {
                    this.submitAllEvaluations();
                } else {
                    this._showFinalResults();
                }
            }
        }

        // ── MANEJO DETALLADO DE FASE 4 (Sub-fases y Sincronización Global) ──
        if (this.state.currentStage === 4) {
            if (this.state.currentView !== 'view-stage4') {
                this.showView('view-stage4');
                this.state.currentView = 'view-stage4';
            }

            // 1. Transición de Prep -> Coins Intro (Ocurre cuando el backend ve que todos mandaron 'equipo-listo')
            if (serverData.sub_stage === 'coins_intro' && this.state.currentSubStage !== 'coins_intro') {
                this.state.currentSubStage = 'coins_intro';
                if (typeof window.s4_showCoinsIntro === 'function') window.s4_showCoinsIntro();
            }
            
            // 2. Transición de Coins Intro -> Pitches
            else if (serverData.sub_stage === 'pitches') {
                if (this.state.currentSubStage !== 'pitches') {
                    this.state.currentSubStage = 'pitches';
                    if (typeof window.s4_enterPitchPhase === 'function') window.s4_enterPitchPhase();
                }

                // 3. RULETA GLOBAL: El servidor envió un nuevo ganador de ruleta
                if (serverData.roulette_winner && serverData.roulette_winner !== this.state.lastRouletteWinner) {
                    this.state.lastRouletteWinner = serverData.roulette_winner;
                    
                    // Cerramos cualquier evaluación abierta por seguridad
                    if (typeof window.toggleEvalView === 'function') window.toggleEvalView(false);
                    
                    // Disparamos la animación global
                    if (typeof window.showGlobalRouletteAnimation === 'function') {
                        window.showGlobalRouletteAnimation(serverData.roulette_winner, serverData.roulette_winner === this.state.teamName);
                    }
                }

                // 4. ACTUALIZACIÓN FORZADA (Por si un equipo se reconecta a mitad de pitch)
                if (serverData.current_presenter && serverData.current_presenter !== this.state.currentPresenter) {
                    this.state.currentPresenter = serverData.current_presenter;
                    const presText = document.getElementById('global-current-presenter');
                    if (presText) presText.textContent = serverData.current_presenter;
                }

                // 5. FIN DE FASE: Todos expusieron
                if (serverData.all_presented && !this.state.allPresentedHandled) {
                    this.state.allPresentedHandled = true;
                    this.showToast("¡Todos los equipos han presentado! Procesando inversiones...", "success");
                    
                    // Enviar todos los borradores automáticamente tras 3 segundos
                    setTimeout(() => {
                        this.submitAllEvaluations();
                    }, 3000);
                }
            }
        }
    },

    handleKicked: function() {
        clearInterval(this.globalSyncInterval);
        alert("Has sido expulsado de la sesión por el administrador.");
        window.location.reload();
    },

    runCommunicatorIntro: function() {
        const btn = document.getElementById('base-communicator-btn');
        if (!btn) return;
        btn.classList.remove('hidden');
        btn.classList.add('comm-center');
        setTimeout(() => {
            btn.classList.remove('comm-center');
            btn.classList.add('comm-docked');
        }, 3000);
    }
});