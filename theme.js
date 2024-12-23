function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
    }
}

function detectTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    } else {
        return 'light';
    }
}

function initTheme() {
    const theme = detectTheme();
    applyTheme(theme);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
        const newTheme = event.matches ? 'dark' : 'light';
        applyTheme(newTheme);
    });
}

initTheme();