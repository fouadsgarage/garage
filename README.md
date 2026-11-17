# Garage

**A lightweight, self-hosted task board that runs entirely in your browser.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-fouadsgarage.github.io%2Fgarage-2563eb?style=for-the-badge&logo=githubpages&logoColor=white)](https://fouadsgarage.github.io/garage/)
[![License](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)](LICENSE)
[![HTML](https://img.shields.io/badge/HTML-5-e34f26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-3-1572b6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![JSON](https://img.shields.io/badge/State-JSON-000000?style=for-the-badge&logo=json&logoColor=white)](https://www.json.org/)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-181717?style=for-the-badge&logo=github&logoColor=white)](https://fouadsgarage.github.io/garage/)

---

## What is Garage?

**Garage** is a lightweight, self-hosted project task board that runs **entirely in your browser** — no backend, no database, no build step. Your tasks are saved automatically in your browser, and you can export the whole project state to a single JSON file that lives alongside your project. Share it, version it with Git, and keep full control of your data.

> **Explore GitHub. Understand projects. Stay in your terminal.**

---

## Live Demo

**[https://fouadsgarage.github.io/garage/](https://fouadsgarage.github.io/garage/)**

The home page doubles as the **documentation**, with a table of contents covering every feature.

---

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
| **Task History** | Every task records `created_at`, `started_at`, `completed_at`, and `reopened_at` timestamps — the foundation for a future burndown chart |
| **JSON Export / Import** | Save and load project state as a single, versioned JSON file |
| **Safe Import** | Merge, replace, or cancel when the board already has tasks; invalid tasks are skipped and counted |
| **Reset Data** | One click clears all local data after a confirmation — useful for starting a fresh project |
| **Built-in Documentation** | The home page is a full user guide with a sticky table of contents |
| **Terminal Commands** | `help`, `clear`, `version` — built-in terminal for power users |
| **Share Button** | Copy the page URL to your clipboard instantly |
| **GitHub Pages Ready** | Deploy in one click — no server required |
| **Fully Responsive** | Works on desktop, tablet, and mobile |
| **Ubuntu Font** | Clean, modern typography |
| **No Tracking** | Zero analytics, zero cookies, zero external calls |

---

## Why Garage?

Most project management tools are heavy, cloud-locked, and require a server. **Garage is the opposite.**

| Typical tools | Garage |
|---|---|
| Data on someone else's server | Data in your browser and your own repo |
| Requires hosting and a database | Static files only |
| Complex setup | Fork and enable GitHub Pages |
| Vendor lock-in | Plain JSON, fully readable |
| Monthly subscription | Free forever |
| Build step required | No build, no bundler |

---

## How It Works

```
1. Open Garage in your browser
2. Add tasks and assign weights (plus optional description, due date, priority, and tags)
3. Move tasks across the board by drag & drop or with the action buttons (saved automatically)
4. Click "Export JSON" → project-status-YYYY-MM-DD.json
5. Commit the file to your project repo
6. To view or update, import the latest JSON (merge or replace)
```

**GitHub itself becomes your sync layer:** every change is a commit, every review is a pull request.

---

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

Each task card also shows its priority, optional due date, description, and tags, so the whole context lives on the board.

---

## Filtering and Search

| Control | Where | What it does |
|---|---|---|
| **Search box** | Above the board | Live filter across title, assignee, description, due date, priority, and tags |
| **Assignee filter** | Above the board | Show only tasks assigned to one person |
| **Work per assignee** | Below the filters | A bar per person showing their share of total weight, how many tasks they have done, and their completion percentage |

---

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

---

## Task History

Every task records the four key moments of its lifecycle, saved in the JSON export:

| Field | Meaning |
|---|---|
| `created_at` | When the task was created |
| `started_at` | When it was first moved to In Progress |
| `completed_at` | When it was last marked Done |
| `reopened_at` | When a Done task was reopened |

These timestamps are the foundation for a future **burndown chart** built from the exported JSON.

---

## Data and Privacy

| Topic | Details |
|---|---|
| Storage | Tasks are kept in your browser's local storage, on your device only |
| Backup | Auto-save is a convenience, not a backup. Export JSON regularly |
| Sync | None. Move a project between devices with the exported JSON file |
| Reset | The **Reset data** button wipes every task from this browser after a confirmation |
| Network | No analytics, no cookies, no external calls |

---

## JSON Format

```json
{
  "version": 1,
  "project": {
    "name": "Garage",
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

When the board already has tasks, importing offers **Merge** (add tasks, update matching ids), **Replace all**, or **Cancel**.

---

## Keyboard Shortcuts

| Keys | Action |
|---|---|
| `Enter` | Add or save the task from the form, or run a terminal command |
| `Esc` | Cancel editing a task, or close a confirmation dialog |
| `Tab` | Move between fields and buttons |

---

## Desktop App

**Garage Desktop** runs the hosted version in a native Windows window, with Export JSON saving through the system save dialog. See [garage-desktop](https://github.com/fouadsgarage/garage-desktop) for downloads.

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
| Typography | Ubuntu Font |
| Build Tools | None |

---

## Project Structure

```
garage/
├── .nojekyll
├── index.html
├── LICENSE
├── README.md
├── tasks.html
├── terminal.html
└── dashboard/
    └── assets/
        ├── engines/
        │   └── engine.js
        ├── fonts/
        │   └── ubuntu-font-family-0.83/
        │       └── ubuntu-font-family-0.83/
        │           ├── Ubuntu-*.ttf
        │           ├── LICENCE.txt
        │           ├── LICENCE-FAQ.txt
        │           ├── FONTLOG.txt
        │           ├── copyright.txt
        │           └── ...
        └── stylesheets/
            ├── defaults.css
            └── style.css
```

---

## Getting Started

### Use the hosted version

Open **[https://fouadsgarage.github.io/garage/](https://fouadsgarage.github.io/garage/)** and start adding tasks.

### Self-host on GitHub Pages

```bash
# 1. Fork this repository
# 2. Go to Settings → Pages
# 3. Set source to: main branch / root folder
# 4. Your instance is live at:
#    https://<your-username>.github.io/garage/
```

### Run locally

```bash
git clone https://github.com/fouadsgarage/garage.git
cd garage
# Open index.html in your browser — that's it.
```

---

## Terminal Commands

| Command | Description |
|---|---|
| `help` | Show available commands |
| `clear` | Clear the terminal |
| `version` | Show Garage version |

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

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

The **Ubuntu Font** is used under its own license (Ubuntu Font Licence 1.0), included alongside the font files at `dashboard/assets/fonts/ubuntu-font-family-0.83/ubuntu-font-family-0.83/LICENCE.txt`.

---

## Author

**Fouad Salehi**

[![GitHub](https://img.shields.io/badge/GitHub-fouad--salehi-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fouad-salehi)
[![Organization](https://img.shields.io/badge/Org-fouadsgarage-2563eb?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fouadsgarage)

---

**Garage** — *Create the structure once. Focus on building.*
