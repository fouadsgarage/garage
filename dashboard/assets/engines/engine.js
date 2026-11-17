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
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

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
let searchQuery = '';
let filterAssignee = '';

const form = document.getElementById('task-create');
const titleInput = document.getElementById('task-title');
const assigneeInput = document.getElementById('task-assignee');
const weightInput = document.getElementById('task-weight');
const descriptionInput = document.getElementById('task-description');
const dueDateInput = document.getElementById('task-due-date');
const priorityInput = document.getElementById('task-priority');
const tagsInput = document.getElementById('task-tags');
const submitButton = form ? form.querySelector('button[type="submit"]') : null;
const cancelButton = document.getElementById('task-cancel');
const weightHint = document.getElementById('weight-hint');
const boardColumns = document.getElementById('board-columns');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const dialog = document.getElementById('dialog');
const dialogMessage = document.getElementById('dialog-message');
const dialogActions = document.getElementById('dialog-actions');
const searchInput = document.getElementById('task-search');
const assigneeFilter = document.getElementById('assignee-filter');
const assigneeSummary = document.getElementById('assignee-summary');

function sanitizeTask(t) {
    if (!t || typeof t !== 'object') return null;

    const title = String(t.title || '').trim();
    const assignee = String(t.assignee || '').trim();
    const weight = parseInt(t.weight, 10);

    if (!t.id || !title || !assignee) return null;
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) return null;

    const tags = Array.isArray(t.tags)
        ? t.tags.map(tag => String(tag).trim()).filter(Boolean)
        : [];

    const history = t.history && typeof t.history === 'object' ? {
        created_at: t.history.created_at || null,
        started_at: t.history.started_at || null,
        completed_at: t.history.completed_at || null,
        reopened_at: t.history.reopened_at || null
    } : {
        created_at: null,
        started_at: null,
        completed_at: null,
        reopened_at: null
    };

    return {
        id: String(t.id),
        title,
        assignee,
        weight,
        status: STATUSES.includes(t.status) ? t.status : 'todo',
        description: String(t.description || '').trim(),
        due_date: t.due_date || '',
        priority: PRIORITIES.includes(t.priority) ? t.priority : 'medium',
        tags,
        history
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
    if (descriptionInput) descriptionInput.value = task.description || '';
    if (dueDateInput) dueDateInput.value = task.due_date || '';
    if (priorityInput) priorityInput.value = task.priority || 'medium';
    if (tagsInput) tagsInput.value = (task.tags || []).join(', ');
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

function getFilteredTasks() {
    return tasks.filter(task => {
        if (filterAssignee && task.assignee !== filterAssignee) return false;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const haystack = [
                task.title,
                task.assignee,
                task.description,
                task.due_date,
                task.priority,
                ...(task.tags || [])
            ].join(' ').toLowerCase();
            if (!haystack.includes(q)) return false;
        }

        return true;
    });
}

function updateAssigneeFilter() {
    if (!assigneeFilter) return;

    const names = [...new Set(tasks.map(t => t.assignee))].sort((a, b) => a.localeCompare(b));
    const current = assigneeFilter.value;

    assigneeFilter.innerHTML = '<option value="">All assignees</option>';
    names.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        assigneeFilter.appendChild(opt);
    });

    if (names.includes(current)) {
        assigneeFilter.value = current;
    } else {
        filterAssignee = '';
    }
}

function updateAssigneeSummary() {
    if (!assigneeSummary) return;

    if (!tasks.length) {
        assigneeSummary.innerHTML = '';
        return;
    }

    const total = tasks.reduce((sum, t) => sum + t.weight, 0);
    const groups = {};

    tasks.forEach(task => {
        if (!groups[task.assignee]) {
            groups[task.assignee] = { weight: 0, done: 0, count: 0, doneCount: 0 };
        }
        const g = groups[task.assignee];
        g.weight += task.weight;
        g.count += 1;
        if (task.status === 'done') {
            g.done += task.weight;
            g.doneCount += 1;
        }
    });

    const rows = Object.entries(groups)
        .sort((a, b) => b[1].weight - a[1].weight)
        .map(([name, g]) => {
            const percent = total ? Math.round((g.weight / total) * 100) : 0;
            const donePercent = g.weight ? Math.round((g.done / g.weight) * 100) : 0;
            return `<div class="assignee-row">
                <span class="assignee-name">${escapeHtml(name)}</span>
                <span class="assignee-bar"><span style="width:${percent}%"></span></span>
                <span class="assignee-value">${percent}% · ${g.doneCount}/${g.count} done (${donePercent}%)</span>
            </div>`;
        })
        .join('');

    assigneeSummary.innerHTML = `<h3>Work per assignee</h3>${rows}`;
}

function render() {
    document.querySelectorAll('.column .task-card').forEach(card => card.remove());

    const visible = getFilteredTasks();

    visible.forEach(task => {
        const column = boardColumns.querySelector(`.column[data-status="${task.status}"]`);
        if (!column) return;

        const card = document.createElement('div');
        card.className = 'task-card' + (task.status === 'done' ? ' done' : '');
        card.dataset.id = task.id;
        card.setAttribute('draggable', 'true');

        const tagHtml = (task.tags && task.tags.length)
            ? `<div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${escapeHtml(tag)}</span>`).join('')}</div>`
            : '';

        const descHtml = task.description
            ? `<p class="task-description">${escapeHtml(task.description)}</p>`
            : '';

        const dueHtml = task.due_date
            ? `<span class="task-due ${isOverdue(task) ? 'overdue' : ''}">Due ${escapeHtml(task.due_date)}</span>`
            : '';

        const priorityHtml = `<span class="task-priority priority-${task.priority}">${task.priority}</span>`;

        card.innerHTML = `
            <p class="task-title">${escapeHtml(task.title)}</p>
            <p class="task-meta">${escapeHtml(task.assignee)} · ${task.weight}%</p>
            ${descHtml}
            <div class="task-badges">${priorityHtml}${dueHtml}</div>
            ${tagHtml}
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
    updateAssigneeFilter();
    updateAssigneeSummary();
}

function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    const today = new Date().toISOString().slice(0, 10);
    return task.due_date < today;
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

        const description = descriptionInput ? descriptionInput.value.trim() : '';
        const dueDate = dueDateInput ? dueDateInput.value : '';
        const priority = priorityInput ? priorityInput.value : 'medium';
        const tags = tagsInput
            ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        if (editingId) {
            const task = tasks.find(t => t.id === editingId);

            if (task) {
                task.title = title;
                task.assignee = assignee;
                task.weight = weight;
                task.description = description;
                task.due_date = dueDate;
                task.priority = PRIORITIES.includes(priority) ? priority : 'medium';
                task.tags = tags;
            }

            stopEditing();
        } else {
            tasks.push({
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                title,
                assignee,
                weight,
                status: 'todo',
                description,
                due_date: dueDate,
                priority: PRIORITIES.includes(priority) ? priority : 'medium',
                tags,
                history: {
                    created_at: new Date().toISOString(),
                    started_at: null,
                    completed_at: null,
                    reopened_at: null
                }
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
        const now = new Date().toISOString();
        if (nextStatus === 'in_progress') {
            task.history.started_at = now;
            task.history.reopened_at = task.history.completed_at ? now : task.history.reopened_at;
        } else if (nextStatus === 'done') {
            task.history.completed_at = now;
        }
        commit();
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim();
            render();
        });
    }

    if (assigneeFilter) {
        assigneeFilter.addEventListener('change', () => {
            filterAssignee = assigneeFilter.value;
            render();
        });
    }

    loadTasks();
    render();
}

let dragTaskId = null;

if (boardColumns) {
    boardColumns.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        dragTaskId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragTaskId); } catch (err) {}
    });

    boardColumns.addEventListener('dragend', (e) => {
        const card = e.target.closest('.task-card');
        if (card) card.classList.remove('dragging');
        boardColumns.querySelectorAll('.column.drag-over').forEach(c => c.classList.remove('drag-over'));
        dragTaskId = null;
    });

    boardColumns.addEventListener('dragover', (e) => {
        const column = e.target.closest('.column');
        if (!column || !dragTaskId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        boardColumns.querySelectorAll('.column.drag-over').forEach(c => {
            if (c !== column) c.classList.remove('drag-over');
        });
        column.classList.add('drag-over');
    });

    boardColumns.addEventListener('dragleave', (e) => {
        const column = e.target.closest('.column');
        if (!column) return;
        if (e.relatedTarget && column.contains(e.relatedTarget)) return;
        column.classList.remove('drag-over');
    });

    boardColumns.addEventListener('drop', (e) => {
        e.preventDefault();
        const column = e.target.closest('.column');
        if (!column || !dragTaskId) return;

        column.classList.remove('drag-over');

        const task = tasks.find(t => t.id === dragTaskId);
        const nextStatus = column.dataset.status;

        if (!task || !STATUSES.includes(nextStatus)) return;
        if (task.status === nextStatus) return;

        task.status = nextStatus;
        const now = new Date().toISOString();
        if (nextStatus === 'in_progress') {
            task.history.started_at = now;
            task.history.reopened_at = task.history.completed_at ? now : task.history.reopened_at;
        } else if (nextStatus === 'done') {
            task.history.completed_at = now;
        } else if (nextStatus === 'todo') {
            task.history.started_at = null;
        }
        commit();
    });
}

const exportBtn = document.getElementById('export-json');
const importInput = document.getElementById('import-json');
const resetBtn = document.getElementById('reset-data');

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

if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
        const choice = await askChoice(
            'Reset all data? This removes every task from this browser and cannot be undone. Export a JSON backup first if you need it.',
            [
                { label: 'Cancel', value: 'cancel' },
                { label: 'Reset everything', value: 'reset', kind: 'danger' }
            ]
        );

        if (choice !== 'reset') return;

        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            showToast('Could not clear local data');
            return;
        }

        tasks.length = 0;

        if (editingId) stopEditing();

        if (searchInput) {
            searchInput.value = '';
            searchQuery = '';
        }

        if (assigneeFilter) {
            assigneeFilter.value = '';
            filterAssignee = '';
        }

        commit();
        showToast('All local data has been removed');
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
