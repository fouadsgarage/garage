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
    }, 2000);
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
    const command = commands[name.toLowerCase()];

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

const tasks = [];

const form = document.getElementById('task-create');
const titleInput = document.getElementById('task-title');
const assigneeInput = document.getElementById('task-assignee');
const weightInput = document.getElementById('task-weight');
const boardColumns = document.getElementById('board-columns');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

if (form && titleInput && assigneeInput && weightInput && boardColumns && progressFill && progressText) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const assignee = assigneeInput.value.trim();
        const weight = parseInt(weightInput.value, 10);

        if (!title || !assignee || !weight) return;

        tasks.push({
            id: Date.now().toString(),
            title,
            assignee,
            weight,
            status: 'todo'
        });

        form.reset();
        titleInput.focus();
        render();
    });
}

function render() {
    document.querySelectorAll('.column .task-card').forEach(card => card.remove());

    tasks.forEach(task => {
        const column = boardColumns.querySelector(`.column[data-status="${task.status}"]`);
        if (!column) return;

        const card = document.createElement('div');
        card.className = 'task-card' + (task.status === 'done' ? ' done' : '');
        card.innerHTML = `
            <p class="task-title">${escapeHtml(task.title)}</p>
            <p class="task-meta">${escapeHtml(task.assignee)} · ${task.weight}%</p>
            ${task.status === 'todo' ? '<button class="btn-start">Start</button>' : ''}
            ${task.status === 'in_progress' ? '<button class="btn-success">Success</button>' : ''}
        `;

        if (task.status === 'todo') {
            card.querySelector('.btn-start').addEventListener('click', () => {
                task.status = 'in_progress';
                render();
            });
        }

        if (task.status === 'in_progress') {
            card.querySelector('.btn-success').addEventListener('click', () => {
                task.status = 'done';
                render();
            });
        }

        column.appendChild(card);
    });

    updateProgress();
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

            if (!Array.isArray(data.tasks)) {
                alert('Invalid JSON: missing tasks array.');
                return;
            }

            tasks.length = 0;
            data.tasks.forEach(t => {
                if (t.id && t.title && t.assignee && t.weight && t.status) {
                    tasks.push({
                        id: String(t.id),
                        title: String(t.title),
                        assignee: String(t.assignee),
                        weight: parseInt(t.weight, 10),
                        status: ['todo', 'in_progress', 'done'].includes(t.status) ? t.status : 'todo'
                    });
                }
            });

            render();
        } catch (err) {
            alert('Failed to parse JSON: ' + err.message);
        }

        importInput.value = '';
    });
}