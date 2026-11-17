const shareBtn = document.getElementById('share-btn');

if (shareBtn) {
    shareBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const url = window.location.href;

        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard');
        } catch (err) {
            const input = document.createElement('input');
            input.value = url;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('Link copied to clipboard');
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2400);
}

const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('commandline');
const terminalBody = document.getElementById('terminal-body');

function appendLine(text, type = '') {
    const p = document.createElement('p');
    p.className = 'line' + (type ? ` ${type}` : '');
    p.textContent = text;
    terminalBody.appendChild(p);
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

const commands = {
    help: {
        description: 'Show available commands',
        run: () => {
            appendLine('Available commands:');
            Object.entries(commands).forEach(([name, cmd]) => {
                appendLine(`  ${name.padEnd(10)} ${cmd.description}`);
            });
        }
    },
    clear: {
        description: 'Clear the terminal',
        run: () => {
            terminalBody.innerHTML = '';
        }
    },
    version: {
        description: 'Show Garage version',
        run: () => {
            appendLine('Garage v1.0.0');
        }
    }
};

function handleCommand(cmd) {
    const [name, ...args] = cmd.split(/\s+/);
    const key = name.toLowerCase();
    const command = Object.hasOwn(commands, key) ? commands[key] : null;

    if (command) {
        command.run(args);
    } else {
        appendLine(`Unknown command: ${name}. Type "help".`);
    }
}

if (terminalForm && terminalInput && terminalBody) {
    terminalForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const cmd = terminalInput.value.trim();
        if (!cmd) return;

        appendLine(`> ${cmd}`, 'cmd');
        terminalInput.value = '';

        handleCommand(cmd);
    });
}

const STORAGE_KEY = 'garage-tasks';
const DATA_VERSION = 1;
const STATUSES = ['todo', 'in_progress', 'done'];

const NEXT_STATUS = {
    start: 'in_progress',
    complete: 'done',
    back: 'todo',
    reopen: 'in_progress'
};

const STATUS_BUTTONS = {
    todo: '<button type="button" class="btn-start" data-action="start">Start</button>',
    in_progress: '<button type="button" class="btn-success" data-action="complete">Success</button>'
        + '<button type="button" class="btn-back" data-action="back">Back</button>',
    done: '<button type="button" class="btn-back" data-action="reopen">Reopen</button>'
};

const tasks = [];
let editingId = null;

const form = document.getElementById('task-create');
const titleInput = document.getElementById('task-title');
const assigneeInput = document.getElementById('task-assignee');
const weightInput = document.getElementById('task-weight');
const submitButton = form ? form.querySelector('button[type="submit"]') : null;
const cancelButton = document.getElementById('task-cancel');
const weightHint = document.getElementById('weight-hint');
const boardColumns = document.getElementById('board-columns');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const dialog = document.getElementById('dialog');
const dialogMessage = document.getElementById('dialog-message');
const dialogActions = document.getElementById('dialog-actions');

function sanitizeTask(t) {
    if (!t || typeof t !== 'object') return null;

    const title = String(t.title || '').trim();
    const assignee = String(t.assignee || '').trim();
    const weight = parseInt(t.weight, 10);

    if (!t.id || !title || !assignee) return null;
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) return null;

    return {
        id: String(t.id),
        title,
        assignee,
        weight,
        status: STATUSES.includes(t.status) ? t.status : 'todo'
    };
}

function loadTasks() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return;

        list.forEach(item => {
            const task = sanitizeTask(item);
            if (task) tasks.push(task);
        });
    } catch (err) {
        tasks.length = 0;
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
        showToast('Could not save tasks in this browser');
    }
}

function commit() {
    saveTasks();
    render();
}

function getTotalWeight(excludeId) {
    return tasks
        .filter(t => t.id !== excludeId)
        .reduce((sum, t) => sum + t.weight, 0);
}

function getWeightLimit() {
    if (!editingId) return 100 - getTotalWeight();

    const current = tasks.find(t => t.id === editingId);
    return Math.max(100 - getTotalWeight(editingId), current ? current.weight : 0);
}

function updateWeightHint() {
    if (!weightHint) return;

    const total = getTotalWeight();
    const remaining = 100 - total;

    weightHint.classList.toggle('over', remaining < 0);

    if (editingId) {
        weightHint.textContent = `Available for this task: ${getWeightLimit()}%`;
    } else if (remaining < 0) {
        weightHint.textContent = `Total weight is ${total}%, over by ${-remaining}%. Edit or delete tasks to fix it.`;
    } else if (remaining === 0) {
        weightHint.textContent = 'All 100% of the weight is assigned.';
    } else {
        weightHint.textContent = `Remaining weight: ${remaining}%`;
    }
}

function askChoice(message, choices) {
    return new Promise((resolve) => {
        dialogMessage.textContent = message;
        dialogActions.innerHTML = '';

        choices.forEach(choice => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = choice.label;
            if (choice.kind) button.className = choice.kind;
            button.addEventListener('click', () => dialog.close(choice.value));
            dialogActions.appendChild(button);
        });

        dialog.returnValue = '';
        dialog.addEventListener('close', () => {
            resolve(dialog.returnValue || 'cancel');
        }, { once: true });
        dialog.showModal();
    });
}

function startEditing(task) {
    editingId = task.id;
    titleInput.value = task.title;
    assigneeInput.value = task.assignee;
    weightInput.value = task.weight;
    submitButton.textContent = 'Save task';
    cancelButton.hidden = false;
    form.classList.add('editing');
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleInput.focus();
    updateWeightHint();
}

function stopEditing() {
    editingId = null;
    form.reset();
    submitButton.textContent = 'Add task';
    cancelButton.hidden = true;
    form.classList.remove('editing');
    updateWeightHint();
}

async function removeTask(task) {
    const choice = await askChoice(`Delete "${task.title}"? This cannot be undone.`, [
        { label: 'Cancel', value: 'cancel' },
        { label: 'Delete', value: 'delete', kind: 'danger' }
    ]);

    if (choice !== 'delete') return;

    if (editingId === task.id) stopEditing();

    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) tasks.splice(index, 1);

    commit();
}

function mergeTasks(list) {
    list.forEach(task => {
        const index = tasks.findIndex(t => t.id === task.id);

        if (index === -1) {
            tasks.push(task);
        } else {
            tasks[index] = task;
        }
    });
}

if (form && titleInput && assigneeInput && weightInput && submitButton && cancelButton
    && weightHint && boardColumns && progressFill && progressText
    && dialog && dialogMessage && dialogActions) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const assignee = assigneeInput.value.trim();
        const weight = parseInt(weightInput.value, 10);

        if (!title || !assignee || !weight) return;

        const limit = getWeightLimit();

        if (weight > limit) {
            showToast(limit > 0
                ? `Only ${limit}% of the weight is left`
                : 'No weight left. Edit or delete a task first.');
            weightInput.focus();
            return;
        }

        if (editingId) {
            const task = tasks.find(t => t.id === editingId);

            if (task) {
                task.title = title;
                task.assignee = assignee;
                task.weight = weight;
            }

            stopEditing();
        } else {
            tasks.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                title,
                assignee,
                weight,
                status: 'todo'
            });

            form.reset();
        }

        titleInput.focus();
        commit();
    });

    cancelButton.addEventListener('click', stopEditing);

    form.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editingId) stopEditing();
    });

    boardColumns.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-action]');
        if (!button) return;

        const card = button.closest('.task-card');
        const task = card ? tasks.find(t => t.id === card.dataset.id) : null;
        if (!task) return;

        const action = button.dataset.action;

        if (action === 'edit') {
            startEditing(task);
            return;
        }

        if (action === 'delete') {
            removeTask(task);
            return;
        }

        const nextStatus = NEXT_STATUS[action];
        if (!nextStatus) return;

        task.status = nextStatus;
        commit();
    });

    loadTasks();
    render();
}

function render() {
    document.querySelectorAll('.column .task-card').forEach(card => card.remove());

    tasks.forEach(task => {
        const column = boardColumns.querySelector(`.column[data-status="${task.status}"]`);
        if (!column) return;

        const card = document.createElement('div');
        card.className = 'task-card' + (task.status === 'done' ? ' done' : '');
        card.dataset.id = task.id;
        card.innerHTML = `
            <p class="task-title">${escapeHtml(task.title)}</p>
            <p class="task-meta">${escapeHtml(task.assignee)} · ${task.weight}%</p>
            <div class="task-buttons">
                ${STATUS_BUTTONS[task.status]}
                <button type="button" class="btn-edit" data-action="edit">Edit</button>
                <button type="button" class="btn-delete" data-action="delete">Delete</button>
            </div>
        `;

        column.appendChild(card);
    });

    updateProgress();
    updateWeightHint();
}

function updateProgress() {
    const total = tasks.reduce((sum, t) => sum + t.weight, 0);
    const done = tasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + t.weight, 0);
    const percent = total ? Math.round((done / total) * 100) : 0;

    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '% complete';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

const exportBtn = document.getElementById('export-json');
const importInput = document.getElementById('import-json');

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const data = {
            version: DATA_VERSION,
            project: {
                name: 'Garage',
                updated_at: new Date().toISOString()
            },
            tasks: tasks
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-status-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

if (importInput) {
    importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!data || !Array.isArray(data.tasks)) {
                showToast('Invalid JSON: missing tasks array.');
                return;
            }

            const version = Number.isInteger(data.version) ? data.version : 0;

            if (version > DATA_VERSION) {
                showToast('This file was exported by a newer version of Garage.');
                return;
            }

            const imported = [];
            const seen = new Set();
            let skipped = 0;

            data.tasks.forEach(item => {
                const task = sanitizeTask(item);

                if (!task || seen.has(task.id)) {
                    skipped++;
                    return;
                }

                seen.add(task.id);
                imported.push(task);
            });

            if (!imported.length && skipped) {
                showToast('No valid tasks found in this file.');
                return;
            }

            let mode = 'replace';

            if (tasks.length) {
                mode = await askChoice(
                    `You have ${tasks.length} task${tasks.length === 1 ? '' : 's'} on the board. `
                    + `What should happen with the ${imported.length} imported?`,
                    [
                        { label: 'Cancel', value: 'cancel' },
                        { label: 'Merge', value: 'merge', kind: 'primary' },
                        { label: 'Replace all', value: 'replace', kind: 'danger' }
                    ]
                );
            }

            if (mode === 'cancel') return;

            if (editingId) stopEditing();

            if (mode === 'merge') {
                mergeTasks(imported);
            } else {
                tasks.length = 0;
                imported.forEach(task => tasks.push(task));
            }

            commit();

            showToast(`Imported ${imported.length} task${imported.length === 1 ? '' : 's'}`
                + (skipped ? `, skipped ${skipped} invalid` : ''));
        } catch (err) {
            showToast('Failed to parse JSON: ' + err.message);
        } finally {
            importInput.value = '';
        }
    });
}

const docsLinks = document.querySelectorAll('.docs-nav a[href^="#"]');

if (docsLinks.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            docsLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
            });
        });
    }, { rootMargin: '-10% 0px -75% 0px' });

    docsLinks.forEach(link => {
        const section = document.getElementById(link.getAttribute('href').slice(1));
        if (section) observer.observe(section);
    });
}
