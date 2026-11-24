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

const THEME_KEY = 'garage-flow-theme';
const themeToggle = document.getElementById('theme-toggle');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    if (themeToggle) {
        const dark = theme === 'dark';
        themeToggle.setAttribute('aria-pressed', String(dark));
        themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
}

function storedTheme() {
    try {
        const value = localStorage.getItem(THEME_KEY);
        return value === 'light' || value === 'dark' ? value : null;
    } catch (err) {
        return null;
    }
}

applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);

        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (err) {
            showToast('Could not save the theme in this browser');
        }
    });
}

systemTheme.addEventListener('change', (e) => {
    if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

const STORAGE_KEY = 'garage-flow-tasks';
const BACKUP_KEY = 'garage-flow-backups';
const MAX_BACKUPS = 10;
const DATA_VERSION = 1;
const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

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

function plural(n, word) {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function clip(str, max) {
    return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function bar(percent, width = 20) {
    const filled = Math.max(0, Math.min(width, Math.round((percent / 100) * width)));
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function pad2(n) {
    return String(n).padStart(2, '0');
}

function localDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayStr() {
    return localDate(new Date());
}

function addDays(dateStr, n) {
    return new Date(Date.parse(dateStr + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
}

function fmtTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function isValidDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

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

function newTask({ title, assignee, weight, description = '', due_date = '', priority = 'medium', tags = [] }) {
    return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        title,
        assignee,
        weight,
        status: 'todo',
        description,
        due_date,
        priority: PRIORITIES.includes(priority) ? priority : 'medium',
        tags,
        history: {
            created_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            reopened_at: null
        }
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

loadTasks();

function moveTask(task, nextStatus) {
    if (!STATUSES.includes(nextStatus) || task.status === nextStatus) return false;

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

    return true;
}

function getTotalWeight(excludeId) {
    return tasks
        .filter(t => t.id !== excludeId)
        .reduce((sum, t) => sum + t.weight, 0);
}

function getWeightLimit(id = editingId) {
    if (!id) return 100 - getTotalWeight();

    const current = tasks.find(t => t.id === id);
    return Math.max(100 - getTotalWeight(id), current ? current.weight : 0);
}

function getProgress() {
    const total = tasks.reduce((sum, t) => sum + t.weight, 0);
    const done = tasks
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + t.weight, 0);
    const percent = total ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
}

function isOverdue(task) {
    if (!task.due_date || task.status === 'done') return false;
    return task.due_date < todayStr();
}

function daysLate(task) {
    const diff = Date.parse(todayStr() + 'T00:00:00Z') - Date.parse(task.due_date + 'T00:00:00Z');
    return Math.round(diff / 86400000);
}

function matchesQuery(task, query) {
    const q = query.toLowerCase();
    const haystack = [
        task.title,
        task.assignee,
        task.description,
        task.due_date,
        task.priority,
        ...(task.tags || [])
    ].join(' ').toLowerCase();
    return haystack.includes(q);
}

function getFilteredTasks() {
    return tasks.filter(task => {
        if (filterAssignee && task.assignee !== filterAssignee) return false;
        if (searchQuery && !matchesQuery(task, searchQuery)) return false;
        return true;
    });
}

function getAssigneeStats() {
    const total = tasks.reduce((sum, t) => sum + t.weight, 0);
    const groups = new Map();

    tasks.forEach(task => {
        if (!groups.has(task.assignee)) {
            groups.set(task.assignee, { name: task.assignee, weight: 0, done: 0, count: 0, doneCount: 0 });
        }
        const g = groups.get(task.assignee);
        g.weight += task.weight;
        g.count += 1;
        if (task.status === 'done') {
            g.done += task.weight;
            g.doneCount += 1;
        }
    });

    return [...groups.values()]
        .sort((a, b) => b.weight - a.weight)
        .map(g => ({
            ...g,
            percent: total ? Math.round((g.weight / total) * 100) : 0,
            donePercent: g.weight ? Math.round((g.done / g.weight) * 100) : 0
        }));
}

function loadBackups() {
    try {
        const list = JSON.parse(localStorage.getItem(BACKUP_KEY));
        return Array.isArray(list) ? list : [];
    } catch (err) {
        return [];
    }
}

function saveBackups(list) {
    try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(list));
        return true;
    } catch (err) {
        return false;
    }
}

function downloadExport() {
    const data = {
        version: DATA_VERSION,
        project: {
            name: 'Garage Flow',
            updated_at: new Date().toISOString()
        },
        tasks: tasks
    };

    const filename = `project-status-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    return filename;
}

async function parseImportFile(file) {
    const text = await file.text();
    let data;

    try {
        data = JSON.parse(text);
    } catch (err) {
        throw new Error('Failed to parse JSON: ' + err.message);
    }

    if (!data || !Array.isArray(data.tasks)) {
        throw new Error('Invalid JSON: missing tasks array.');
    }

    const version = Number.isInteger(data.version) ? data.version : 0;

    if (version > DATA_VERSION) {
        throw new Error('This file was exported by a newer version of Garage Flow.');
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
        throw new Error('No valid tasks found in this file.');
    }

    return { imported, skipped };
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

function applyImport(imported, mode) {
    if (mode === 'merge') {
        mergeTasks(imported);
    } else {
        tasks.length = 0;
        imported.forEach(task => tasks.push(task));
    }
    commit();
}

function importSummary(count, skipped) {
    return `Imported ${plural(count, 'task')}` + (skipped ? `, skipped ${skipped} invalid` : '');
}

const terminalForm = document.getElementById('terminal-form');
const terminalInput = document.getElementById('commandline');
const terminalBody = document.getElementById('terminal-body');

let pendingAnswer = null;

function appendLine(text, type = '') {
    const p = document.createElement('p');
    p.className = 'line' + (type ? ` ${type}` : '');
    p.textContent = text;
    terminalBody.appendChild(p);
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function ask(question) {
    return new Promise((resolve) => {
        appendLine(question);
        pendingAnswer = resolve;
    });
}

async function confirmYes(question) {
    const answer = await ask(`${question} [y/N]`);
    const yes = answer === 'y' || answer === 'yes';
    if (!yes) appendLine('Cancelled.', 'dim');
    return yes;
}

function tokenize(input) {
    const tokens = [];
    let buf = '';
    let quote = null;
    let quoted = false;
    let has = false;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        const prev = input[i - 1];

        if (quote) {
            if (ch === '\\' && (input[i + 1] === quote || input[i + 1] === '\\')) {
                buf += input[++i];
            } else if (ch === quote) {
                quote = null;
            } else {
                buf += ch;
            }
        } else if ((ch === '"' || ch === "'") && (!has || prev === '=' || prev === '@')) {
            if (!has) quoted = true;
            quote = ch;
            has = true;
        } else if (/\s/.test(ch)) {
            if (has) {
                tokens.push({ text: buf, quoted });
                buf = '';
                quoted = false;
                has = false;
            }
        } else {
            buf += ch;
            has = true;
        }
    }

    if (quote) throw new Error('Unclosed quote.');
    if (has) tokens.push({ text: buf, quoted });

    return tokens;
}

function parseArgs(tokens, spec = {}) {
    const values = spec.values || [];
    const bools = spec.bools || [];
    const short = spec.short || {};
    const out = { pos: [], mentions: [], flags: {} };

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        const text = tok.text;

        if (!tok.quoted && /^--?[a-zA-Z]/.test(text)) {
            let name;
            let inline = null;

            if (text.startsWith('--')) {
                const eq = text.indexOf('=');
                name = eq === -1 ? text.slice(2) : text.slice(2, eq);
                if (eq !== -1) inline = text.slice(eq + 1);
            } else {
                name = short[text.slice(1)];
                if (!name) throw new Error(`Unknown option: ${text}`);
            }

            if (bools.includes(name)) {
                out.flags[name] = true;
                continue;
            }

            if (!values.includes(name)) throw new Error(`Unknown option: --${name}`);

            if (inline === null) {
                if (i + 1 >= tokens.length) throw new Error(`Option --${name} needs a value.`);
                inline = tokens[++i].text;
            }

            out.flags[name] = inline;
            continue;
        }

        if (!tok.quoted && text.length > 1 && text[0] === '@') {
            out.mentions.push(text.slice(1));
            continue;
        }

        out.pos.push(tok);
    }

    return out;
}

function parseWeight(raw) {
    const s = String(raw).trim().replace(/%$/, '');
    const n = /^\d+$/.test(s) ? parseInt(s, 10) : NaN;
    if (!Number.isInteger(n) || n < 1 || n > 100) {
        throw new Error('Weight must be a whole number from 1 to 100.');
    }
    return n;
}

function parseDue(raw) {
    const s = String(raw).trim();
    if (!s || s === 'none' || s === '-') return '';
    if (!isValidDate(s)) throw new Error('Due date must look like YYYY-MM-DD, for example 2026-11-25.');
    return s;
}

function parsePriority(raw) {
    const p = String(raw).trim().toLowerCase();
    if (!PRIORITIES.includes(p)) throw new Error(`Priority must be one of: ${PRIORITIES.join(', ')}.`);
    return p;
}

function parseTags(raw) {
    return String(raw).split(',').map(t => t.trim()).filter(Boolean);
}

function parseStatus(raw) {
    const s = String(raw).toLowerCase().replace(/-/g, '_');
    if (s === 'todo' || s === 'done' || s === 'in_progress') return s;
    if (s === 'progress') return 'in_progress';
    return null;
}

function cleanAssignee(raw) {
    return String(raw).replace(/^@/, '').trim();
}

function taskNumber(task) {
    return tasks.indexOf(task) + 1;
}

function resolveTask(ref) {
    const r = String(ref).trim();

    if (!tasks.length) throw new Error('There are no tasks yet.');

    if (/^#?\d+$/.test(r)) {
        const n = parseInt(r.replace('#', ''), 10);
        if (n >= 1 && n <= tasks.length) return tasks[n - 1];
        if (r.startsWith('#')) throw new Error(`No task #${n}. The board has ${plural(tasks.length, 'task')}.`);
    }

    const id = r.replace(/^#/, '').toLowerCase();
    const exact = tasks.find(t => t.id.toLowerCase() === id);
    if (exact) return exact;

    const matches = tasks.filter(t => t.id.toLowerCase().startsWith(id));
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
        throw new Error(`"${r}" matches ${matches.length} tasks. Type more characters or use the #number.`);
    }

    throw new Error(`No task matches "${r}".`);
}

function resolveMany(tokens) {
    return [...new Set(tokens.map(tok => resolveTask(tok.text)))];
}

function usageError(name) {
    return new Error(`Usage: ${commands[name].usage}`);
}

function taskSuffix(t) {
    const parts = [];
    if (t.priority !== 'medium') parts.push(t.priority);
    if (t.due_date) {
        if (isOverdue(t)) {
            const n = daysLate(t);
            parts.push(Number.isFinite(n) ? `${n}d overdue, due ${t.due_date}` : `overdue, due ${t.due_date}`);
        } else {
            parts.push(`due ${t.due_date}`);
        }
    }
    return parts.length ? `  (${parts.join(', ')})` : '';
}

function printTasks(list) {
    if (!list.length) {
        appendLine('No matching tasks.', 'dim');
        return;
    }

    const rows = list.map(t => ({
        num: '#' + taskNumber(t),
        id: t.id.slice(0, 8),
        status: t.status,
        weight: t.weight + '%',
        who: clip('@' + t.assignee, 14),
        title: t.title + taskSuffix(t)
    }));

    const wNum = Math.max(...rows.map(r => r.num.length), 1);
    const wWho = Math.max(8, ...rows.map(r => r.who.length));
    const line = r => `${r.num.padEnd(wNum)}  ${r.id.padEnd(8)}  ${r.status.padEnd(11)}  ${r.weight.padStart(4)}  ${r.who.padEnd(wWho)}  ${r.title}`;

    appendLine(line({ num: '#', id: 'ID', status: 'STATUS', weight: 'W', who: 'ASSIGNEE', title: 'TITLE' }), 'row dim');
    rows.forEach(r => appendLine(line(r), 'row'));

    const sum = list.reduce((s, t) => s + t.weight, 0);
    appendLine(`${plural(list.length, 'task')}, ${sum}% of the weight`, 'dim');
}

const TRANSITIONS = {
    start: { from: ['todo'], to: 'in_progress', text: 'Move a To Do task to In Progress' },
    done: { from: ['in_progress'], to: 'done', text: 'Mark an In Progress task as Done' },
    back: { from: ['in_progress'], to: 'todo', text: 'Return an In Progress task to To Do' },
    reopen: { from: ['done'], to: 'in_progress', text: 'Return a Done task to In Progress' }
};

function transitionCommand(name) {
    const rule = TRANSITIONS[name];

    return {
        group: 'Tasks',
        usage: `${name} <id|#n> [more...]`,
        description: rule.text,
        run(a) {
            if (!a.pos.length) throw usageError(name);

            const targets = resolveMany(a.pos);
            let changed = 0;

            targets.forEach(task => {
                const n = taskNumber(task);

                if (!rule.from.includes(task.status)) {
                    appendLine(`#${n} "${task.title}" is ${task.status}; "${name}" only works on ${rule.from.join('/')} tasks.`, 'error');
                    return;
                }

                moveTask(task, rule.to);
                changed++;
                appendLine(`#${n} "${task.title}" → ${rule.to}`, 'ok');
            });

            if (changed) commit();
        }
    };
}

const aliases = {
    ls: 'list',
    cls: 'clear',
    progress: 'status',
    delete: 'rm',
    del: 'rm',
    success: 'done',
    info: 'show'
};

const GROUP_ORDER = ['Tasks', 'Reports', 'Data', 'Terminal'];

const commands = {

    add: {
        group: 'Tasks',
        usage: 'add "Title" @assignee <weight> [--due YYYY-MM-DD] [--priority low|medium|high|urgent] [--tags a,b] [--desc "text"]',
        description: 'Create a task',
        examples: [
            'add "Design landing page" @sam 20',
            'add Fix login bug @lee 10 --priority urgent --due 2026-11-25 --tags auth,bug'
        ],
        options: { values: ['weight', 'due', 'priority', 'tags', 'desc', 'assignee'] },
        run(a) {
            const f = a.flags;
            let weightRaw = f.weight !== undefined ? f.weight : null;
            const pos = a.pos.slice();

            if (weightRaw === null) {
                for (let i = pos.length - 1; i >= 0; i--) {
                    if (!pos[i].quoted && /^\d+%?$/.test(pos[i].text)) {
                        weightRaw = pos[i].text;
                        pos.splice(i, 1);
                        break;
                    }
                }
            }

            const title = pos.map(t => t.text).join(' ').trim();
            const assignee = cleanAssignee(a.mentions[0] || f.assignee || '');

            if (!title) throw usageError('add');
            if (!assignee) throw new Error('Assignee is required. Add it as @name.');
            if (weightRaw === null) throw new Error('Weight is required. Add a number from 1 to 100.');

            const weight = parseWeight(weightRaw);
            const limit = getWeightLimit(null);

            if (weight > limit) {
                throw new Error(limit > 0
                    ? `Only ${limit}% of the weight is left.`
                    : 'No weight left. Edit or delete a task first.');
            }

            const task = newTask({
                title,
                assignee,
                weight,
                description: f.desc !== undefined ? f.desc.trim() : '',
                due_date: f.due !== undefined ? parseDue(f.due) : '',
                priority: f.priority !== undefined ? parsePriority(f.priority) : 'medium',
                tags: f.tags !== undefined ? parseTags(f.tags) : []
            });

            tasks.push(task);
            commit();
            appendLine(`Added #${taskNumber(task)} (${task.id}): "${task.title}" · @${task.assignee} · ${task.weight}%`, 'ok');
        }
    },

    list: {
        group: 'Tasks',
        usage: 'list [todo|in_progress|done] [@assignee] [--priority p] [--tag t]',
        description: 'List tasks, optionally filtered',
        options: { values: ['priority', 'tag'] },
        run(a) {
            if (!tasks.length) {
                appendLine('No tasks yet. Try: add "My first task" @me 20', 'dim');
                return;
            }

            let status = null;
            a.pos.forEach(tok => {
                const s = parseStatus(tok.text);
                if (!s) throw new Error(`Unknown status "${tok.text}". Use todo, in_progress or done.`);
                status = s;
            });

            const who = a.mentions[0] ? a.mentions[0].toLowerCase() : null;
            const priority = a.flags.priority !== undefined ? parsePriority(a.flags.priority) : null;
            const tag = a.flags.tag ? a.flags.tag.toLowerCase() : null;

            printTasks(tasks.filter(t =>
                (!status || t.status === status)
                && (!who || t.assignee.toLowerCase() === who)
                && (!priority || t.priority === priority)
                && (!tag || t.tags.some(x => x.toLowerCase() === tag))
            ));
        }
    },

    ...Object.fromEntries(Object.keys(TRANSITIONS).map(name => [name, transitionCommand(name)])),

    edit: {
        group: 'Tasks',
        usage: 'edit <id|#n> [--title "..."] [--assignee name] [--weight n] [--due date|none] [--priority p] [--tags a,b] [--desc "..."]',
        description: 'Change fields of a task',
        examples: ['edit 3 --weight 30 --title "New title"', 'edit 3 --due none --tags ""'],
        options: { values: ['title', 'assignee', 'weight', 'due', 'priority', 'tags', 'desc'] },
        run(a) {
            if (!a.pos.length) throw usageError('edit');
            if (a.pos.length > 1) {
                throw new Error('Too many arguments. Put new values in options, for example --title "New title".');
            }

            const task = resolveTask(a.pos[0].text);
            const f = a.flags;
            const changes = {};

            if (f.title !== undefined) {
                const title = f.title.trim();
                if (!title) throw new Error('Title cannot be empty.');
                changes.title = title;
            }

            const assignee = a.mentions[0] || f.assignee;
            if (assignee !== undefined) {
                const name = cleanAssignee(assignee);
                if (!name) throw new Error('Assignee cannot be empty.');
                changes.assignee = name;
            }

            if (f.weight !== undefined) {
                const weight = parseWeight(f.weight);
                const limit = getWeightLimit(task.id);
                if (weight > limit) throw new Error(`Only ${limit}% of the weight is available for this task.`);
                changes.weight = weight;
            }

            if (f.due !== undefined) changes.due_date = parseDue(f.due);
            if (f.priority !== undefined) changes.priority = parsePriority(f.priority);
            if (f.tags !== undefined) changes.tags = parseTags(f.tags);
            if (f.desc !== undefined) changes.description = f.desc.trim();

            const fields = Object.keys(changes);
            if (!fields.length) throw new Error('Nothing to change. ' + commands.edit.usage);

            Object.assign(task, changes);
            commit();
            appendLine(`Updated #${taskNumber(task)} "${task.title}": ${fields.join(', ')}`, 'ok');
        }
    },

    rm: {
        group: 'Tasks',
        usage: 'rm <id|#n> [more...] [-y]',
        description: 'Delete tasks (asks for confirmation, -y skips it)',
        options: { bools: ['yes'], short: { y: 'yes' } },
        async run(a) {
            if (!a.pos.length) throw usageError('rm');

            const targets = resolveMany(a.pos);

            if (!a.flags.yes) {
                const what = targets.length === 1
                    ? `#${taskNumber(targets[0])} "${targets[0].title}"`
                    : `${targets.length} tasks (${targets.map(t => '#' + taskNumber(t)).join(', ')})`;

                if (!await confirmYes(`Delete ${what}? This cannot be undone.`)) return;
            }

            targets.forEach(task => {
                const index = tasks.indexOf(task);
                if (index !== -1) tasks.splice(index, 1);
            });

            commit();
            appendLine(`Deleted ${plural(targets.length, 'task')}. Task numbers may have shifted; run list to see them.`, 'ok');
        }
    },

    show: {
        group: 'Tasks',
        usage: 'show <id|#n>',
        description: 'Show every detail of a task, including its history',
        run(a) {
            if (!a.pos.length) throw usageError('show');

            const t = resolveTask(a.pos[0].text);
            const h = t.history;
            const due = t.due_date
                ? t.due_date + (isOverdue(t) ? `  (overdue)` : '')
                : '-';

            const rows = [
                ['Task', `#${taskNumber(t)}  (${t.id})`],
                ['Title', t.title],
                ['Assignee', t.assignee],
                ['Weight', t.weight + '%'],
                ['Status', `${t.status} (${STATUS_LABELS[t.status]})`],
                ['Priority', t.priority],
                ['Due', due],
                ['Tags', t.tags.length ? t.tags.join(', ') : '-'],
                ['Description', t.description || '-']
            ];

            rows.forEach(([k, v]) => appendLine(`${(k + ':').padEnd(13)}${v}`, 'row'));
            appendLine('History:', 'row');

            [
                ['created', h.created_at],
                ['started', h.started_at],
                ['completed', h.completed_at],
                ['reopened', h.reopened_at]
            ].forEach(([k, v]) => appendLine(`  ${k.padEnd(11)}${fmtTime(v)}`, 'row'));
        }
    },

    status: {
        group: 'Reports',
        usage: 'status',
        description: 'Progress and number of tasks in each column',
        run() {
            if (!tasks.length) {
                appendLine('No tasks yet.', 'dim');
                return;
            }

            const { total, done, percent } = getProgress();
            appendLine(`Progress  ${bar(percent)} ${percent}%  (${done}/${total} weight done)`, 'row');

            STATUSES.forEach(s => {
                const list = tasks.filter(t => t.status === s);
                const weight = list.reduce((sum, t) => sum + t.weight, 0);
                appendLine(`${STATUS_LABELS[s].padEnd(12)}${plural(list.length, 'task').padEnd(10)}${weight}%`, 'row');
            });
        }
    },

    weights: {
        group: 'Reports',
        usage: 'weights',
        description: 'Weight used and weight still available',
        run() {
            const total = getTotalWeight();
            const remaining = 100 - total;

            appendLine(`Assigned   ${bar(Math.min(100, total))} ${total}%`, 'row');

            if (remaining < 0) {
                appendLine(`Over by ${-remaining}%. Edit or delete tasks to fix it.`, 'error');
            } else {
                appendLine(`Remaining  ${remaining}%`, 'row');
            }
        }
    },

    overdue: {
        group: 'Reports',
        usage: 'overdue',
        description: 'Tasks that are past their due date',
        run() {
            const late = tasks
                .filter(isOverdue)
                .sort((a, b) => a.due_date.localeCompare(b.due_date));

            if (!late.length) {
                appendLine('No overdue tasks.', 'ok');
                return;
            }

            printTasks(late);
        }
    },

    who: {
        group: 'Reports',
        usage: 'who',
        description: 'Work per assignee',
        run() {
            if (!tasks.length) {
                appendLine('No tasks yet.', 'dim');
                return;
            }

            const stats = getAssigneeStats();
            const wName = Math.max(8, ...stats.map(s => clip(s.name, 16).length));
            const line = (name, share, done, note) =>
                `${name.padEnd(wName)}  ${share.padStart(5)}  ${done.padStart(6)}  ${note}`;

            appendLine(line('ASSIGNEE', 'SHARE', 'DONE', ''), 'row dim');
            stats.forEach(s => {
                appendLine(line(
                    clip(s.name, 16),
                    s.percent + '%',
                    `${s.doneCount}/${s.count}`,
                    `${s.donePercent}% of their weight done`
                ), 'row');
            });
        }
    },

    find: {
        group: 'Reports',
        usage: 'find <text>',
        description: 'Search title, assignee, description, due date, priority and tags',
        run(a) {
            const q = a.pos.map(t => t.text).join(' ').trim();
            if (!q) throw usageError('find');
            printTasks(tasks.filter(t => matchesQuery(t, q)));
        }
    },

    burndown: {
        group: 'Reports',
        usage: 'burndown',
        description: 'ASCII chart of the weight still remaining per day (uses task history)',
        run() {
            const today = todayStr();
            const created = t => localDate(t.history.created_at);
            const finished = t => {
                if (t.status !== 'done') return null;
                return localDate(t.history.completed_at) || today;
            };

            const known = [];
            tasks.forEach(t => {
                const c = created(t);
                if (c) known.push(c);
                if (t.status === 'done') {
                    const f = localDate(t.history.completed_at);
                    if (f) known.push(f);
                }
            });

            if (!known.length) {
                appendLine('Not enough history yet. Burndown needs tasks with creation or completion dates.', 'dim');
                return;
            }

            known.sort();
            const start = known[0];
            const end = today > start ? today : start;

            const days = [];
            for (let d = start; d <= end && days.length < 4000; d = addDays(d, 1)) days.push(d);

            const step = Math.ceil(days.length / 30);
            const shown = days.filter((d, i) => i % step === 0 || i === days.length - 1);

            const remainingOn = d => tasks.reduce((sum, t) => {
                if ((created(t) || start) > d) return sum;
                const f = finished(t);
                return f && f <= d ? sum : sum + t.weight;
            }, 0);

            const values = shown.map(d => [d, remainingOn(d)]);
            const scale = Math.max(100, ...values.map(v => v[1]));
            const sameYear = start.slice(0, 4) === end.slice(0, 4);

            appendLine(`Burndown: weight remaining per day${step > 1 ? ` (every ${step} days)` : ''}`);
            values.forEach(([d, rem]) => {
                const filled = Math.round((rem / scale) * 30);
                const label = sameYear ? d.slice(5) : d;
                appendLine(`${label}  ${'█'.repeat(filled)}${'░'.repeat(30 - filled)}  ${rem}%`, 'row');
            });

            const undated = tasks.filter(t => t.status === 'done' && !localDate(t.history.completed_at)).length;
            if (undated) {
                appendLine(`${plural(undated, 'done task')} without a completion date counted as completed today.`, 'dim');
            }
        }
    },

    export: {
        group: 'Data',
        usage: 'export',
        description: 'Download the project as a JSON file',
        run() {
            const name = downloadExport();
            appendLine(`Downloaded ${name} (${plural(tasks.length, 'task')}).`, 'ok');
        }
    },

    import: {
        group: 'Data',
        usage: 'import',
        description: 'Load tasks from a JSON file (asks merge or replace if the board is not empty)',
        async run() {
            appendLine('Choose a JSON file...', 'dim');

            const file = await pickJsonFile();
            if (!file) {
                appendLine('Import cancelled.', 'dim');
                return;
            }

            const { imported, skipped } = await parseImportFile(file);
            let mode = 'replace';

            if (tasks.length) {
                const answer = await ask(
                    `You have ${plural(tasks.length, 'task')}. What should happen with the ${imported.length} imported? `
                    + '[m]erge / [r]eplace all / [c]ancel'
                );

                if (answer.startsWith('m')) {
                    mode = 'merge';
                } else if (answer.startsWith('r')) {
                    mode = 'replace';
                } else {
                    appendLine('Import cancelled.', 'dim');
                    return;
                }
            }

            applyImport(imported, mode);
            appendLine(importSummary(imported.length, skipped), 'ok');
        }
    },

    reset: {
        group: 'Data',
        usage: 'reset [-y]',
        description: 'Remove every task from this browser (backups are kept)',
        options: { bools: ['yes'], short: { y: 'yes' } },
        async run(a) {
            if (!tasks.length) {
                appendLine('The board is already empty.', 'dim');
                return;
            }

            if (!a.flags.yes) {
                const sure = await confirmYes(
                    `Remove all ${plural(tasks.length, 'task')} from this browser? This cannot be undone. `
                    + 'Run backup first if you need them.'
                );
                if (!sure) return;
            }

            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (err) {
                throw new Error('Could not clear local data.');
            }

            tasks.length = 0;
            commit();
            appendLine('All tasks have been removed.', 'ok');
        }
    },

    backup: {
        group: 'Data',
        usage: 'backup [label] | backup --delete <n>',
        description: `Save a snapshot of the board in this browser (keeps the last ${MAX_BACKUPS})`,
        options: { values: ['delete'] },
        run(a) {
            const list = loadBackups();

            if (a.flags.delete !== undefined) {
                const n = parseInt(a.flags.delete, 10);
                if (!Number.isInteger(n) || n < 1 || n > list.length) {
                    throw new Error(`No backup #${a.flags.delete}. Run restore to see the list.`);
                }
                list.splice(n - 1, 1);
                if (!saveBackups(list)) throw new Error('Could not update backups in this browser.');
                appendLine(`Deleted backup #${n}.`, 'ok');
                return;
            }

            if (!tasks.length) throw new Error('Nothing to back up: the board is empty.');

            const label = a.pos.map(t => t.text).join(' ').trim();
            list.push({
                label,
                created_at: new Date().toISOString(),
                tasks: JSON.parse(JSON.stringify(tasks))
            });

            let dropped = false;
            while (list.length > MAX_BACKUPS) {
                list.shift();
                dropped = true;
            }

            if (!saveBackups(list)) throw new Error('Could not save the backup in this browser.');

            appendLine(`Backup #${list.length} saved: ${plural(tasks.length, 'task')}${label ? ` ("${label}")` : ''}.`, 'ok');
            if (dropped) appendLine(`The oldest backup was removed (limit is ${MAX_BACKUPS}).`, 'dim');
        }
    },

    restore: {
        group: 'Data',
        usage: 'restore [n] [-y]',
        description: 'Without a number: list backups. With a number: replace the board with that backup',
        options: { bools: ['yes'], short: { y: 'yes' } },
        async run(a) {
            const list = loadBackups();

            if (!list.length) {
                appendLine('No backups yet. Run backup to create one.', 'dim');
                return;
            }

            if (!a.pos.length) {
                appendLine('Backups (oldest first):', 'row dim');
                list.forEach((b, i) => {
                    const count = Array.isArray(b.tasks) ? b.tasks.length : 0;
                    appendLine(`#${i + 1}  ${fmtTime(b.created_at)}  ${plural(count, 'task').padEnd(9)}${b.label ? `  "${b.label}"` : ''}`, 'row');
                });
                appendLine('Use restore <n> to load one.', 'dim');
                return;
            }

            const n = parseInt(a.pos[0].text.replace('#', ''), 10);
            if (!Number.isInteger(n) || n < 1 || n > list.length) {
                throw new Error(`No backup "${a.pos[0].text}". Run restore to see the list.`);
            }

            const snap = list[n - 1];
            if (!snap || !Array.isArray(snap.tasks)) throw new Error(`Backup #${n} is damaged.`);

            const seen = new Set();
            const restored = [];
            snap.tasks.forEach(item => {
                const task = sanitizeTask(item);
                if (task && !seen.has(task.id)) {
                    seen.add(task.id);
                    restored.push(task);
                }
            });

            if (!a.flags.yes) {
                const sure = await confirmYes(
                    `Replace the current ${plural(tasks.length, 'task')} with backup #${n} `
                    + `(${plural(restored.length, 'task')}, ${fmtTime(snap.created_at)})? This cannot be undone.`
                );
                if (!sure) return;
            }

            tasks.length = 0;
            restored.forEach(task => tasks.push(task));
            commit();
            appendLine(`Restored backup #${n}: ${plural(restored.length, 'task')}.`, 'ok');
        }
    },

    help: {
        group: 'Terminal',
        usage: 'help [command]',
        description: 'Show available commands',
        run(a) {
            if (a.pos.length) {
                const typed = a.pos[0].text.toLowerCase();
                const name = Object.hasOwn(aliases, typed) ? aliases[typed] : typed;

                if (!Object.hasOwn(commands, name)) {
                    throw new Error(`Unknown command: ${a.pos[0].text}.`);
                }

                const cmd = commands[name];
                appendLine(`${name}: ${cmd.description}`);
                appendLine(`Usage: ${cmd.usage}`, 'row');
                (cmd.examples || []).forEach(ex => appendLine(`  e.g. ${ex}`, 'row dim'));
                return;
            }

            GROUP_ORDER.forEach(group => {
                appendLine(`${group}:`);
                Object.entries(commands)
                    .filter(([, cmd]) => cmd.group === group)
                    .forEach(([name, cmd]) => appendLine(`  ${name.padEnd(10)} ${cmd.description}`, 'row'));
            });

            appendLine('Type help <command> for usage. Tasks are referenced by #number (see list) or by id prefix.', 'dim');
            appendLine('Use quotes for values with spaces: add "Fix the login page" @sam 20', 'dim');
        }
    },

    clear: {
        group: 'Terminal',
        usage: 'clear',
        description: 'Clear the terminal',
        run() {
            terminalBody.innerHTML = '';
        }
    },

    version: {
        group: 'Terminal',
        usage: 'version',
        description: 'Show Garage Flow version',
        run() {
            appendLine('Garage Flow v1.0.0');
        }
    }
};

function pickJsonFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.hidden = true;
        document.body.appendChild(input);

        const finish = (file) => {
            input.remove();
            if (terminalInput) terminalInput.focus();
            resolve(file);
        };

        input.addEventListener('change', () => finish(input.files[0] || null), { once: true });
        input.addEventListener('cancel', () => finish(null), { once: true });
        input.click();
    });
}

async function handleCommand(line) {
    try {
        const tokens = tokenize(line);
        if (!tokens.length) return;

        const typed = tokens[0].text;
        const key = typed.toLowerCase();
        const name = Object.hasOwn(aliases, key) ? aliases[key] : key;
        const command = Object.hasOwn(commands, name) ? commands[name] : null;

        if (!command) {
            appendLine(`Unknown command: ${typed}. Type "help".`, 'error');
            return;
        }

        const args = parseArgs(tokens.slice(1), command.options);
        await command.run(args, name);
    } catch (err) {
        appendLine(err.message, 'error');
    }
}

if (terminalForm && terminalInput && terminalBody) {
    terminalForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cmd = terminalInput.value.trim();
        terminalInput.value = '';

        if (pendingAnswer) {
            const resolve = pendingAnswer;
            pendingAnswer = null;
            appendLine(`> ${cmd}`, 'cmd');
            resolve(cmd.toLowerCase());
            return;
        }

        if (!cmd) return;

        appendLine(`> ${cmd}`, 'cmd');
        await handleCommand(cmd);
    });
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

    const rows = getAssigneeStats()
        .map(s => `<div class="assignee-row">
                <span class="assignee-name">${escapeHtml(s.name)}</span>
                <span class="assignee-bar"><span style="width:${s.percent}%"></span></span>
                <span class="assignee-value">${s.percent}% · ${s.doneCount}/${s.count} done (${s.donePercent}%)</span>
            </div>`)
        .join('');

    assigneeSummary.innerHTML = `<h3>Work per assignee</h3>${rows}`;
}

function updateProgress() {
    const { percent } = getProgress();

    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '% complete';
}

function render() {
    if (!boardColumns) return;

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
            tasks.push(newTask({ title, assignee, weight, description, due_date: dueDate, priority, tags }));
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

        moveTask(task, nextStatus);
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
        if (!task) return;

        if (moveTask(task, column.dataset.status)) commit();
    });
}

const exportBtn = document.getElementById('export-json');
const importInput = document.getElementById('import-json');
const resetBtn = document.getElementById('reset-data');

if (exportBtn) {
    exportBtn.addEventListener('click', downloadExport);
}

if (importInput) {
    importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const { imported, skipped } = await parseImportFile(file);
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

            applyImport(imported, mode);
            showToast(importSummary(imported.length, skipped));
        } catch (err) {
            showToast(err.message);
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