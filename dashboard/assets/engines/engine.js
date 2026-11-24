const THEME_KEY = 'garage-theme';
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
        } catch (err) {}
    });
}

systemTheme.addEventListener('change', (e) => {
    if (!storedTheme()) applyTheme(e.matches ? 'dark' : 'light');
});