(function () {
    'use strict';

    const STORAGE_KEY = 'garage-gym-data';
    const THEME_KEY = 'garage-gym-theme';
    const DAY_KEY = 'garage-gym-day';
    const FILE_VERSION = 1;

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    const els = {
        form: $('#create-form'),
        name: $('#name'),
        date: $('#date'),
        reps: $('#reps'),
        filterText: $('#filter-text'),
        filterStatus: $('#filter-status'),
        daySelect: $('#day-select'),
        dayMeta: $('#day-meta'),
        table: $('#workout-table'),
        tbody: $('#workout-table tbody'),
        summary: $('#summary'),
        emptyMsg: $('#empty-msg'),
        exportBtn: $('#export-btn'),
        importInput: $('#import-input'),
        resetBtn: $('#reset-btn'),
        themeToggle: $('#theme-toggle'),
        toast: $('#toast'),
        dialog: $('#confirm-dialog'),
    };

    let state = { version: FILE_VERSION, exercises: [] };
    let editingId = null;
    let confirmResolve = null;
    let activeDay = null;

    function uid() {
        return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    }

    function todayISO() {
        return new Date().toISOString().slice(0, 10);
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.exercises)) {
                state.exercises = parsed.exercises;
            }
        } catch (e) {}
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {}
    }

    function loadSavedDay() {
        try {
            return localStorage.getItem(DAY_KEY) || null;
        } catch (e) {
            return null;
        }
    }

    function saveSavedDay(day) {
        try {
            if (day) localStorage.setItem(DAY_KEY, day);
            else localStorage.removeItem(DAY_KEY);
        } catch (e) {}
    }

    function showToast(msg) {
        els.toast.textContent = msg;
        els.toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => {
            els.toast.classList.remove('show');
        }, 2200);
    }

    function askConfirm(message) {
        if (!els.dialog || typeof els.dialog.showModal !== 'function') {
            return Promise.resolve(window.confirm(message));
        }
        return new Promise((resolve) => {
            confirmResolve = resolve;
            $('.dialog-message', els.dialog).textContent = message;
            els.dialog.showModal();
        });
    }

    function closeDialog(result) {
        if (!els.dialog) return;
        els.dialog.close();
        if (confirmResolve) {
            confirmResolve(result);
            confirmResolve = null;
        }
    }

    function formatDateLong(iso) {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function formatDateShort(iso) {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function relativeDayLabel(iso) {
        if (!iso) return '';
        const today = todayISO();
        if (iso === today) return 'Today';
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yesterday = y.toISOString().slice(0, 10);
        if (iso === yesterday) return 'Yesterday';
        return '';
    }

    function totalSets(ex) {
        return (ex.set1 ? 1 : 0) + (ex.set2 ? 1 : 0) + (ex.set3 ? 1 : 0);
    }

    function getAllDays() {
        const set = new Set(state.exercises.map((ex) => ex.date).filter(Boolean));
        set.add(todayISO());
        return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
    }

    function rebuildDaySelect() {
        const days = getAllDays();
        els.daySelect.innerHTML = '';

        days.forEach((day) => {
            const opt = document.createElement('option');
            opt.value = day;
            const rel = relativeDayLabel(day);
            opt.textContent = rel ? `${rel} — ${formatDateShort(day)}` : formatDateLong(day);
            els.daySelect.appendChild(opt);
        });

        if (!activeDay || !days.includes(activeDay)) {
            const saved = loadSavedDay();
            if (saved && days.includes(saved)) activeDay = saved;
            else activeDay = todayISO();
        }

        els.daySelect.value = activeDay;
    }

    function getFilteredExercises() {
        const text = els.filterText.value.trim().toLowerCase();
        const status = els.filterStatus.value;

        return state.exercises
            .filter((ex) => {
                if (ex.date !== activeDay) return false;
                if (text && !ex.name.toLowerCase().includes(text)) return false;
                if (status !== '' && totalSets(ex) !== Number(status)) return false;
                return true;
            })
            .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    }

    function updateDayMeta() {
        const dayExercises = state.exercises.filter((ex) => ex.date === activeDay);
        if (dayExercises.length === 0) {
            els.dayMeta.innerHTML = '';
            return;
        }
        const setsDone = dayExercises.reduce((sum, ex) => sum + totalSets(ex), 0);
        const totalPossible = dayExercises.length * 3;
        els.dayMeta.innerHTML =
            `<strong>${dayExercises.length}</strong> exercise${dayExercises.length === 1 ? '' : 's'} · ` +
            `<strong>${setsDone}</strong> / ${totalPossible} sets done`;
    }

    function render() {
        rebuildDaySelect();
        updateDayMeta();

        const rows = getFilteredExercises();
        els.tbody.innerHTML = '';

        if (rows.length === 0) {
            els.emptyMsg.style.display = 'block';
            els.summary.innerHTML = '';
            els.table.style.display = 'none';
            return;
        }

        els.emptyMsg.style.display = 'none';
        els.table.style.display = '';

        rows.forEach((ex, index) => {
            const tr = document.createElement('tr');
            tr.dataset.id = ex.id;
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td class="cell-name" title="${escapeAttr(ex.name)}">${escapeHtml(ex.name)}</td>
                <td class="cell-reps">${ex.reps != null ? escapeHtml(String(ex.reps)) : '—'}</td>
                <td class="cell-set"><input type="checkbox" data-set="set1" ${ex.set1 ? 'checked' : ''} aria-label="Set 1 done"></td>
                <td class="cell-set"><input type="checkbox" data-set="set2" ${ex.set2 ? 'checked' : ''} aria-label="Set 2 done"></td>
                <td class="cell-set"><input type="checkbox" data-set="set3" ${ex.set3 ? 'checked' : ''} aria-label="Set 3 done"></td>
                <td class="cell-actions">
                    <div class="row-buttons">
                        <button type="button" class="btn-row btn-edit" data-action="edit">Edit</button>
                        <button type="button" class="btn-row btn-delete" data-action="delete">Delete</button>
                    </div>
                </td>
            `;
            els.tbody.appendChild(tr);
        });

        updateSummary(rows);
    }

    function updateSummary(rows) {
        const total = rows.length;
        const totalS = rows.reduce((sum, ex) => sum + totalSets(ex), 0);
        const doneAll = rows.filter((ex) => totalSets(ex) === 3).length;

        els.summary.innerHTML =
            `<strong>${total}</strong> exercise${total === 1 ? '' : 's'} on this day · ` +
            `<strong>${totalS}</strong> of ${total * 3} sets done · ` +
            `<strong>${doneAll}</strong> completed (3/3)`;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        }[c]));
    }

    function escapeAttr(str) {
        return escapeHtml(str);
    }

    function handleCreate(e) {
        e.preventDefault();

        const name = els.name.value.trim();
        const date = els.date.value;
        const repsRaw = els.reps.value.trim();

        if (!name) {
            showToast('Please enter an exercise name');
            els.name.focus();
            return;
        }
        if (!date) {
            showToast('Please choose a date');
            els.date.focus();
            return;
        }

        let reps = null;
        if (repsRaw !== '') {
            const n = Number(repsRaw);
            if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
                showToast('Reps must be a positive whole number');
                els.reps.focus();
                return;
            }
            reps = n;
        }

        if (editingId) {
            const ex = state.exercises.find((x) => x.id === editingId);
            if (ex) {
                ex.name = name;
                ex.date = date;
                ex.reps = reps;
                activeDay = date;
                saveSavedDay(activeDay);
            }
            editingId = null;
            els.form.classList.remove('editing');
            els.form.querySelector('button[type="submit"]').textContent = 'Add exercise';
            showToast('Exercise updated');
        } else {
            state.exercises.push({
                id: uid(),
                name,
                date,
                reps,
                set1: false,
                set2: false,
                set3: false,
                createdAt: new Date().toISOString(),
            });
            activeDay = date;
            saveSavedDay(activeDay);
            showToast('Exercise added');
        }

        saveState();
        render();
        resetForm();
        els.name.focus();
    }

    function resetForm() {
        els.form.reset();
        editingId = null;
        els.form.classList.remove('editing');
        els.form.querySelector('button[type="submit"]').textContent = 'Add exercise';
        els.date.value = activeDay || todayISO();
    }

    function handleTbodyChange(e) {
        const target = e.target;
        const tr = target.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;
        const ex = state.exercises.find((x) => x.id === id);
        if (!ex) return;

        if (target.matches('input[type="checkbox"][data-set]')) {
            const key = target.dataset.set;
            ex[key] = target.checked;
            saveState();
            render();
        }
    }

    function handleTbodyClick(e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const tr = btn.closest('tr');
        if (!tr) return;
        const id = tr.dataset.id;
        const action = btn.dataset.action;
        const ex = state.exercises.find((x) => x.id === id);
        if (!ex) return;

        if (action === 'edit') {
            editingId = id;
            els.name.value = ex.name;
            els.date.value = ex.date;
            els.reps.value = ex.reps != null ? String(ex.reps) : '';
            els.form.classList.add('editing');
            els.form.querySelector('button[type="submit"]').textContent = 'Save exercise';
            els.name.focus();
            els.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (action === 'delete') {
            askConfirm(`Delete "${ex.name}"? This cannot be undone.`).then((ok) => {
                if (!ok) return;
                state.exercises = state.exercises.filter((x) => x.id !== id);
                if (editingId === id) resetForm();
                saveState();
                render();
                showToast('Exercise deleted');
            });
        }
    }

    function handleDayChange() {
        activeDay = els.daySelect.value;
        saveSavedDay(activeDay);
        render();
    }

    function handleExport() {
        const payload = {
            version: FILE_VERSION,
            project: {
                name: 'Garage GYM',
                updated_at: new Date().toISOString(),
            },
            exercises: state.exercises.map((ex) => ({
                id: ex.id,
                name: ex.name,
                date: ex.date,
                reps: ex.reps,
                set1: !!ex.set1,
                set2: !!ex.set2,
                set3: !!ex.set3,
                createdAt: ex.createdAt,
            })),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `garage-gym-${todayISO()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Exported Garage GYM JSON');
    }

    function validateExercise(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const name = typeof raw.name === 'string' ? raw.name.trim() : '';
        const date = typeof raw.date === 'string' ? raw.date.trim() : '';
        if (!name || !date) return null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

        let reps = null;
        if (raw.reps !== null && raw.reps !== undefined) {
            const n = Number(raw.reps);
            if (Number.isFinite(n) && n > 0 && Number.isInteger(n)) reps = n;
        }

        return {
            id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
            name,
            date,
            reps,
            set1: !!raw.set1,
            set2: !!raw.set2,
            set3: !!raw.set3,
            createdAt: typeof raw.createdAt === 'string' && raw.createdAt
                ? raw.createdAt
                : new Date().toISOString(),
        };
    }

    function handleImportFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            let parsed;
            try {
                parsed = JSON.parse(String(reader.result));
            } catch (e) {
                showToast('Invalid JSON file');
                return;
            }

            const list = Array.isArray(parsed)
                ? parsed
                : (parsed && Array.isArray(parsed.exercises) ? parsed.exercises : null);

            if (!list) {
                showToast('No exercises list in file');
                return;
            }

            const incoming = [];
            let skipped = 0;
            const seen = new Set();

            list.forEach((raw) => {
                const ex = validateExercise(raw);
                if (!ex || seen.has(ex.id)) {
                    skipped++;
                    return;
                }
                seen.add(ex.id);
                incoming.push(ex);
            });

            if (incoming.length === 0) {
                showToast(`Nothing to import${skipped ? ` (skipped ${skipped})` : ''}`);
                return;
            }

            const merge = () => {
                const byId = new Map(state.exercises.map((e) => [e.id, e]));
                incoming.forEach((ex) => byId.set(ex.id, ex));
                state.exercises = Array.from(byId.values());
                saveState();
                render();
                showToast(`Merged ${incoming.length}${skipped ? `, skipped ${skipped}` : ''}`);
            };

            const replace = () => {
                state.exercises = incoming.slice();
                saveState();
                render();
                showToast(`Replaced with ${incoming.length}${skipped ? `, skipped ${skipped}` : ''}`);
            };

            if (state.exercises.length === 0) {
                replace();
                return;
            }

            askConfirm(
                `Import ${incoming.length} exercise${incoming.length === 1 ? '' : 's'}? ` +
                `Confirm = merge with current data. Cancel = abort.`
            ).then((ok) => {
                if (ok) merge();
            });
        };
        reader.onerror = () => showToast('Could not read file');
        reader.readAsText(file);
    }

    function handleImportInput(e) {
        const file = e.target.files && e.target.files[0];
        if (file) handleImportFile(file);
        e.target.value = '';
    }

    function handleReset() {
        if (state.exercises.length === 0) {
            showToast('Nothing to reset');
            return;
        }
        askConfirm('Remove all exercises from this browser? This cannot be undone.').then((ok) => {
            if (!ok) return;
            state.exercises = [];
            activeDay = todayISO();
            saveSavedDay(activeDay);
            saveState();
            resetForm();
            render();
            showToast('All exercises removed');
        });
    }

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const isDark = theme === 'dark';
        els.themeToggle.setAttribute('aria-pressed', String(isDark));
        els.themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    }

    function handleThemeToggle() {
        const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    function handleDialogClick(e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        closeDialog(btn.dataset.action === 'confirm');
    }

    function handleDialogCancel(e) {
        e.preventDefault();
        closeDialog(false);
    }

    function bindEvents() {
        els.form.addEventListener('submit', handleCreate);
        els.tbody.addEventListener('change', handleTbodyChange);
        els.tbody.addEventListener('click', handleTbodyClick);
        els.filterText.addEventListener('input', render);
        els.filterStatus.addEventListener('change', render);
        els.daySelect.addEventListener('change', handleDayChange);
        els.exportBtn.addEventListener('click', handleExport);
        els.importInput.addEventListener('change', handleImportInput);
        els.resetBtn.addEventListener('click', handleReset);
        els.themeToggle.addEventListener('click', handleThemeToggle);

        if (els.dialog) {
            els.dialog.addEventListener('click', handleDialogClick);
            els.dialog.addEventListener('cancel', handleDialogCancel);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && editingId) {
                resetForm();
                els.name.blur();
            }
        });
    }

    function init() {
        loadState();
        const saved = loadSavedDay();
        activeDay = saved || todayISO();
        bindEvents();
        els.date.value = activeDay;
        render();
    }

    init();
})();