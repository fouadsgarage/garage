# Garage

**Small tools that run entirely in your browser.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-fouadsgarage.github.io%2Fgarage-2563eb?style=for-the-badge&logo=githubpages&logoColor=white)](https://fouadsgarage.github.io/garage/)
[![License](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![HTML](https://img.shields.io/badge/HTML-5-e34f26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-3-1572b6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![JSON](https://img.shields.io/badge/State-JSON-000000?style=for-the-badge&logo=json&logoColor=white)](https://www.json.org/)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://fouadsgarage.github.io/garage/)

---

## What is Garage?

**Garage** is a growing collection of small, fast apps that run **entirely in your browser**: no backend, no database, no account and no build step. Every app saves its data in your browser, and can export it to a single JSON file that you keep, share and version with Git.

One repository, one GitHub Pages site, several independent tools.

| Project | What it does | Open |
|---|---|---|
| **Garage Flow** | A weighted task board with a built-in terminal, reports, backups and JSON export | [Tasks](https://fouadsgarage.github.io/garage/flow/tasks) · [Terminal](https://fouadsgarage.github.io/garage/flow/terminal) · [Docs](https://fouadsgarage.github.io/garage/flow/) |
| **Garage GYM** | A home training log with day-by-day workouts, reps and three-set checkboxes | [Open app](https://fouadsgarage.github.io/garage/gym/) |

---

> [!TIP]
> **Try it now:** open the live demo at **[fouadsgarage.github.io/garage](https://fouadsgarage.github.io/garage/)** and pick an app. No install, no sign-up.

---

## Live Demo

**[https://fouadsgarage.github.io/garage/](https://fouadsgarage.github.io/garage/)**

| Page | URL |
|---|---|
| Garage (home) | `https://fouadsgarage.github.io/garage/` |
| Garage Flow docs | `https://fouadsgarage.github.io/garage/flow/` |
| Garage Flow tasks | `https://fouadsgarage.github.io/garage/flow/tasks` |
| Garage Flow terminal | `https://fouadsgarage.github.io/garage/flow/terminal` |
| Garage GYM | `https://fouadsgarage.github.io/garage/gym/` |

---

## Why Garage?

Most tools are heavy, cloud-locked, and require a server. **Garage is the opposite.**

| Typical tools | Garage |
|---|---|
| Data on someone else's server | Data in your browser and your own repo |
| Requires hosting and a database | Static files only |
| Complex setup | Fork and enable GitHub Pages |
| Vendor lock-in | Plain JSON, fully readable |
| Monthly subscription | Free forever |
| Build step required | No build, no bundler |

---

## Data and Privacy

| Topic | Details |
|---|---|
| Storage | Each app keeps its data in your browser's local storage, on your device only |
| Isolation | Every app uses its own storage keys, so apps never overwrite each other |
| Backup | Auto-save is a convenience, not a backup. Export JSON regularly |
| Sync | None. Move data between devices with the exported JSON file |
| Network | No analytics, no cookies, no external calls |

| App | Storage keys |
|---|---|
| Garage (home) | `garage-theme` |
| Garage Flow | `garage-flow-tasks`, `garage-flow-backups`, `garage-flow-theme` |
| Garage GYM | `garage-gym-data`, `garage-gym-day`, `garage-gym-theme` |

All apps support a light and a dark theme. The first visit follows your system setting, and the header button switches it.

> [!IMPORTANT]
> Auto-save keeps your data in this browser only. **Export the JSON file regularly** and commit it to your repo — that is your real backup.

---

# Garage Flow

**A lightweight task board with weighted progress, a built-in terminal and JSON state.**

Garage Flow helps you plan a project, assign work and see how far along you are. Your tasks are saved automatically in your browser, and you can export the whole project state to a single JSON file that lives alongside your project. Share it, version it with Git, and keep full control of your data.

Prefer the keyboard? The built-in **terminal** works on the same board: add and move tasks, read reports, take backups and import or export, all from a command line.

## Features

| Feature | Description |
|---|---|
| **Task Creation** | Create tasks with title, assignee, and weight (percentage of project) |
| **Rich Task Fields** | Optional description, due date, priority (Low / Medium / High / Urgent), and comma-separated tags |
| **Due Date Awareness** | Tasks past their due date are highlighted in red until they are marked Done |
| **Priority Badges** | Color-coded priority badges on every card (gray, blue, amber, red) |
| **Edit & Delete** | Edit any task in place, or delete it after a confirmation |
| **Move Back & Reopen** | Send an In Progress task back to To Do, or reopen a Done task |
| **Drag & Drop** | Drag any card between To Do, In Progress, and Done; the status and history update exactly as with the buttons |
| **Three-Column Board** | To Do → In Progress → Done |
| **Search** | Live search across title, assignee, description, due date, priority, and tags |
| **Assignee Filter** | Filter the board to a single assignee |
| **Per-Assignee Summary** | See how much weight each person carries, how many of their tasks are done, and their completion percentage |
| **Weight Validation** | Weights stay between 1 and 100, with a live "remaining weight" hint and no way to go over 100% |
| **Auto Progress** | Project completion calculated automatically from task weights |
| **Auto-Save** | Tasks are saved in your browser after every change, so a reload loses nothing |
| **Task History** | Every task records `created_at`, `started_at`, `completed_at`, and `reopened_at` timestamps, used by the terminal `burndown` chart |
| **JSON Export / Import** | Save and load project state as a single, versioned JSON file |
| **Safe Import** | Merge, replace, or cancel when the board already has tasks; invalid tasks are skipped and counted |
| **Reset Data** | One click clears all local data after a confirmation, useful for starting a fresh project |
| **Full Terminal** | Create, edit, move and delete tasks, read reports (`status`, `weights`, `overdue`, `who`, `find`, `burndown`), and run `export`, `import`, `reset`, `backup` and `restore` |
| **Smart Command Parser** | Quoted values, `--options`, `@assignee` mentions, and tasks addressed by `#number` or id prefix |
| **Confirmed Deletes** | `rm`, `reset` and `restore` ask `[y/N]` inside the terminal; `-y` skips the question |
| **Local Backups** | Save named snapshots of the board in your browser (last 10 kept) and restore any of them |
| **Burndown Chart** | A text chart of the weight still remaining per day, built from task history |
| **Light & Dark Theme** | Follows your system and can be switched from the header |
| **Built-in Documentation** | The Flow home page is a full user guide with a sticky table of contents |
| **Share Button** | Copy the page URL to your clipboard instantly |
| **Fully Responsive** | Works on desktop, tablet, and mobile |
| **Ubuntu Font** | Clean, modern typography |

## How It Works

```
1. Open Garage Flow in your browser
2. Add tasks and assign weights (plus optional description, due date, priority, and tags)
3. Move tasks across the board by drag & drop, with the action buttons, or from the terminal (saved automatically)
4. Click "Export JSON" (or run `export`) → project-status-YYYY-MM-DD.json
5. Commit the file to your project repo
6. To view or update, import the latest JSON (merge or replace)
```

**GitHub itself becomes your sync layer:** every change is a commit, every review is a pull request.

## Tasks

| Action | Where | What it does |
|---|---|---|
| **Start** | To Do | Moves the task to In Progress |
| **Success** | In Progress | Marks the task as Done |
| **Back** | In Progress | Returns the task to To Do |
| **Reopen** | Done | Returns the task to In Progress |
| **Edit** | Any column | Loads the task into the form; save or cancel your changes |
| **Delete** | Any column | Removes the task after you confirm |
| **Drag & Drop** | Any column | Move the card onto another column to change its status |

Each task card also shows its priority, optional due date, description, and tags, so the whole context lives on the board. Every one of these actions is also available from the [terminal](#terminal-commands).

## Filtering and Search

| Control | Where | What it does |
|---|---|---|
| **Search box** | Above the board | Live filter across title, assignee, description, due date, priority, and tags |
| **Assignee filter** | Above the board | Show only tasks assigned to one person |
| **Work per assignee** | Below the filters | A bar per person showing their share of total weight, how many tasks they have done, and their completion percentage |

In the terminal, `find <text>`, `list @name` and `who` do the same jobs.

## Weights and Progress

Every task carries a weight: its share of the whole project.

```
progress = done weight ÷ total weight × 100
```

| Rule | Behavior |
|---|---|
| Range | Each weight is a whole number from 1 to 100 |
| Limit | A task cannot use more weight than what is still available |
| Hint | The line under the form shows the remaining weight, and turns red if an import pushes the total over 100% |

In the terminal, `status` shows the progress bar and `weights` shows the weight used and remaining.

## Task History

Every task records the four key moments of its lifecycle, saved in the JSON export:

| Field | Meaning |
|---|---|
| `created_at` | When the task was created |
| `started_at` | When it was last moved to In Progress |
| `completed_at` | When it was last marked Done |
| `reopened_at` | When a Done task was reopened |

`show <task>` prints a task's history, and `burndown` turns these timestamps into a chart of the weight still remaining for each day.

## Flow Data and Backups

| Topic | Details |
|---|---|
| Auto-save | Tasks are kept in your browser's local storage after every change |
| Local backups | `backup` saves snapshots in the same browser storage, so clearing site data removes them too |
| Reset | The **Reset data** button and the `reset` command wipe every task from this browser after a confirmation. Local backups are kept |

## Flow JSON Format

The export is a file named `project-status-YYYY-MM-DD.json`.

```json
{
  "version": 1,
  "project": {
    "name": "Garage Flow",
    "updated_at": "2026-11-17T09:30:00.000Z"
  },
  "tasks": [
    {
      "id": "m3k9x2ab",
      "title": "Design the landing page",
      "assignee": "Sam",
      "weight": 40,
      "status": "done",
      "description": "Hero, pricing and footer",
      "due_date": "2026-11-20",
      "priority": "high",
      "tags": ["design", "frontend"],
      "history": {
        "created_at": "2026-11-10T08:00:00.000Z",
        "started_at": "2026-11-12T09:15:00.000Z",
        "completed_at": "2026-11-16T17:45:00.000Z",
        "reopened_at": null
      }
    }
  ]
}
```

| Import check | Behavior |
|---|---|
| Missing `tasks` list | File is rejected |
| Newer `version` than the app supports | File is rejected |
| No `version` field (older exports) | File is accepted |
| Missing title or assignee, weight outside 1 to 100, duplicate id | Task is skipped and counted in the result message |
| Missing `description`, `due_date`, `priority`, `tags`, or `history` | Filled with safe defaults |

When the board already has tasks, importing offers **Merge** (add tasks, update matching ids), **Replace all**, or **Cancel**. In the terminal, answer `m`, `r`, or anything else to cancel.

## Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Enter` | Add or save the task from the form, run a terminal command, or answer a terminal `[y/N]` question |
| `Esc` | Cancel editing a task, or close a confirmation dialog |
| `Tab` | Move between fields and buttons |

## Desktop App

**Garage Flow Desktop** runs the hosted version in a native Windows window, with Export JSON saving through the system save dialog. See [garage-desktop](https://github.com/fouadsgarage/garage-desktop) for downloads.

<details>
<summary><strong>Terminal Commands</strong> — click to expand</summary>

The terminal works on the same saved tasks as the board. Type `help` for the list, or `help <command>` for usage and examples.

### Referring to a task

| Form | Example | Meaning |
|---|---|---|
| Number | `#3` or `3` | The position shown in the first column of `list` |
| Id | `m3k9x2ab` or `m3k` | The full id or its start; ambiguous prefixes ask for more characters |

### Writing commands

| Syntax | Example |
|---|---|
| Quotes for values with spaces | `add "Fix the login page" @sam 20` |
| Assignee | `@sam`, or `@"Sam Lee"` when it has a space |
| Options | `--due 2026-11-25`, `--priority high`, `--tags a,b` |
| Weight in `add` | The last number outside quotes, so `add Fix login @sam 20` works |

### Tasks

| Command | Description |
|---|---|
| `add "Title" @name 20` | Create a task. Options: `--due`, `--priority`, `--tags`, `--desc` |
| `list [status] [@name]` | List tasks. Filters: `todo`, `in_progress`, `done`, `@name`, `--priority`, `--tag` |
| `start <task>` | Move a To Do task to In Progress |
| `done <task>` | Mark an In Progress task as Done |
| `back <task>` | Return an In Progress task to To Do |
| `reopen <task>` | Return a Done task to In Progress |
| `edit <task> --weight 30` | Change fields: `--title`, `--assignee`, `--weight`, `--due`, `--priority`, `--tags`, `--desc` |
| `rm <task>` | Delete after a `[y/N]` question (`-y` skips it) |
| `show <task>` | Show every field and the task history |

`start`, `done`, `back`, `reopen` and `rm` accept several tasks at once, for example `done 1 2 3`.

### Reports

| Command | Description |
|---|---|
| `status` | Progress bar and the tasks and weight in each column |
| `weights` | Weight used and weight still available |
| `overdue` | Tasks past their due date and not Done |
| `who` | Work per assignee: share of weight and tasks done |
| `find <text>` | Search title, assignee, description, due date, priority and tags |
| `burndown` | Text chart of the weight remaining per day, from task history |

### Data

| Command | Description |
|---|---|
| `export` | Download the project as JSON |
| `import` | Pick a JSON file; asks merge or replace if the board is not empty |
| `reset` | Remove every task from this browser after `[y/N]`. Backups are kept |
| `backup [label]` | Save a snapshot of the board (last 10 kept) |
| `restore [n]` | List backups, or replace the board with backup `n` after `[y/N]` |
| `backup --delete <n>` | Delete backup `n` |

### Terminal

| Command | Description |
|---|---|
| `help [command]` | Show available commands, or usage for one command |
| `clear` | Clear the terminal |
| `version` | Show Garage Flow version |

Aliases: `ls` (list), `progress` (status), `delete` and `del` (rm), `success` (done), `info` (show), `cls` (clear).

### Example session

```
> add "Design landing page" @sam 40 --priority high --due 2026-11-25
> add Build API @lee 35 --tags backend
> start 1
> done 1
> status
> backup before-launch
> burndown
```

</details>

> [!WARNING]
> `rm`, `reset`, and `restore` ask for confirmation before deleting anything. Use `-y` only when you are sure.

---

# Garage GYM

**A home training log that follows your workouts day by day.**

Garage GYM is a local home workout tracker. Add exercises to a day, set the reps and tick off three sets as you go. Everything is saved in your browser, and you can export your whole history to a JSON file.

## Features

| Feature | Description |
|---|---|
| **Exercise Log** | Add an exercise with a name, a date and optional reps (1 to 999) |
| **Day-by-Day View** | A day selector lists every day with workouts, labels Today and Yesterday, and remembers the last day you opened |
| **Three-Set Checkboxes** | Tick Set 1, Set 2 and Set 3 for every exercise |
| **Daily Summary** | See how many exercises the day has, how many sets are done, and how many exercises are fully completed (3/3) |
| **Search** | Live search across exercise names |
| **Set Filter** | Show only exercises with no sets, one, two or three sets done |
| **Edit & Delete** | Edit any exercise in place, or delete it after a confirmation |
| **Auto-Save** | Your log is saved in your browser after every change |
| **JSON Export / Import** | Save and load your history as a single JSON file |
| **Safe Import** | Invalid exercises are skipped and counted; with existing data you confirm before merging |
| **Reset Data** | Clears every exercise from this browser after a confirmation |
| **Light & Dark Theme** | Follows your system and can be switched from the header |
| **Fully Responsive** | Works on desktop, tablet, and mobile |

## How It Works

```
1. Open Garage GYM in your browser
2. Add an exercise with a name, a date and the reps
3. Pick a day and tick off each set as you finish it
4. Click "Export JSON" → garage-gym-YYYY-MM-DD.json
5. Keep the file with your notes or commit it to a repo
6. To restore or merge your history, import the file
```

## GYM JSON Format

```json
{
  "version": 1,
  "project": {
    "name": "Garage GYM",
    "updated_at": "2026-11-24T08:00:00.000Z"
  },
  "exercises": [
    {
      "id": "k2j8d9x1m3ab",
      "name": "Push-ups",
      "date": "2026-11-24",
      "reps": 15,
      "set1": true,
      "set2": true,
      "set3": false,
      "createdAt": "2026-11-24T07:45:00.000Z"
    }
  ]
}
```

| Import check | Behavior |
|---|---|
| File is a list, or an object with an `exercises` list | File is accepted |
| No list found | File is rejected |
| Missing name, or a date that is not `YYYY-MM-DD`, or a duplicate id | Exercise is skipped and counted in the result message |
| Invalid `reps` | Stored as empty |
| Missing `id` or `createdAt` | Filled automatically |

When the log is empty the imported exercises load right away. When it already has exercises, you confirm to merge them with the current data (matching ids are updated), or cancel to abort.

## GYM Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Enter` | Add or save the exercise while a form field is focused |
| `Esc` | Cancel editing an exercise, or close a confirmation dialog |
| `Tab` | Move between fields and buttons |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, flexbox, grid, media queries) |
| Logic | Vanilla JavaScript (ES6+) |
| State | JSON |
| Persistence | Browser local storage |
| Hosting | GitHub Pages |
| Typography | Ubuntu Font (Garage Flow), system fonts (Garage and Garage GYM) |
| Build Tools | None |

---

<details>
<summary><strong>Project Structure</strong> — click to expand</summary>

```
garage/
├── .nojekyll
├── index.html
├── LICENSE
├── README.md
├── assets/
│   ├── engines/
│   │   └── engine.js
│   └── stylesheets/
│       ├── defaults.css
│       └── style.css
├── flow/
│   ├── index.html
│   ├── tasks.html
│   ├── terminal.html
│   └── dashboard/
│       └── assets/
│           ├── engines/
│           │   └── engine.js
│           ├── fonts/
│           │   └── ubuntu-font-family-0.83/
│           │       └── ubuntu-font-family-0.83/
│           │           ├── Ubuntu-*.ttf
│           │           ├── LICENCE.txt
│           │           ├── LICENCE-FAQ.txt
│           │           ├── FONTLOG.txt
│           │           ├── copyright.txt
│           │           └── ...
│           └── stylesheets/
│               ├── defaults.css
│               └── style.css
└── gym/
    ├── index.html
    └── dashboard/
        └── assets/
            ├── engines/
            │   └── engine.js
            └── stylesheets/
                ├── defaults.css
                └── style.css
```

Each app is a self-contained folder, so a new tool is just a new folder with its own `index.html` and a card on the home page.

</details>

---

## Getting Started

### Use the hosted version

Open **[https://fouadsgarage.github.io/garage/](https://fouadsgarage.github.io/garage/)** and pick an app.

### Self-host on GitHub Pages

```bash
# 1. Fork this repository
# 2. Go to Settings → Pages
# 3. Set source to: main branch / root folder
# 4. Your instance is live at:
#    https://<your-username>.github.io/garage/
```

Garage Flow's Back button and breadcrumbs use absolute paths that start with `/garage/flow/`. Keep the repository named `garage`, or update those links if you rename it.

### Run locally

```bash
git clone https://github.com/fouadsgarage/garage.git
cd garage
# Open index.html in your browser, that's it.
```

> [!NOTE]
> The absolute Garage Flow links only resolve on the hosted site, where the app lives under `/garage/`.

---

## Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License**, see the [LICENSE](LICENSE) file for details.

The **Ubuntu Font** is used under its own license (Ubuntu Font Licence 1.0), included alongside the font files at `flow/dashboard/assets/fonts/ubuntu-font-family-0.83/ubuntu-font-family-0.83/LICENCE.txt`.

---

## Author

**Fouad Salehi**

[![GitHub](https://img.shields.io/badge/GitHub-fouad--salehi-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fouad-salehi)
[![Organization](https://img.shields.io/badge/Org-fouadsgarage-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fouadsgarage)

---

**Garage** — *Small tools. Your data. Your browser.*