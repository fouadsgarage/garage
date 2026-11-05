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

**Garage** is a lightweight, self-hosted project task board that runs **entirely in your browser** — no backend, no database, no build step. It stores project state in a single `project-status.json` file that lives alongside your project. Share it, version it with Git, and keep full control of your data.

> **Explore GitHub. Understand projects. Stay in your terminal.**

---

## Live Demo

**[https://fouadsgarage.github.io/garage/](https://fouadsgarage.github.io/garage/)**

---

## Features

| Feature | Description |
|---|---|
| **Task Creation** | Create tasks with title, assignee, and weight (percentage of project) |
| **Three-Column Board** | To Do → In Progress → Done |
| **Auto Progress** | Project completion calculated automatically from task weights |
| **JSON Export / Import** | Save and load project state as a single JSON file |
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
| Data on someone else's server | Data in your own repo |
| Requires hosting and a database | Static files only |
| Complex setup | Fork and enable GitHub Pages |
| Vendor lock-in | Plain JSON, fully readable |
| Monthly subscription | Free forever |
| Build step required | No build, no bundler |

---

## How It Works

```
1. Open Garage in your browser
2. Add tasks and assign weights
3. Click "Export JSON" → project-status.json
4. Commit the file to your project repo
5. To view or update, import the latest JSON
```

**GitHub itself becomes your sync layer:** every change is a commit, every review is a pull request.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, flexbox, media queries) |
| Logic | Vanilla JavaScript (ES6+) |
| State | JSON |
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

⭐ If you find this useful, consider giving it a star!
