(() => {
    'use strict';
    const config = window.CraftDarkModeConfig;
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const valid = value => ['auto', 'light', 'dark'].includes(value);
    let mode = valid(config.mode) ? config.mode : 'auto';
    // Login uses a separate anonymous preference. Users never inherit another user's cache.
    if (!config.authenticated) {
        try {
            const cached = localStorage.getItem(config.storageKey);
            if (valid(cached)) mode = cached;
        } catch (_) { /* Storage can be disabled without disabling appearance. */ }
    }
    function apply(next = mode, source = 'local') {
        if (!valid(next)) return;
        mode = next;
        const theme = mode === 'auto' ? (media.matches ? 'dark' : 'light') : mode;
        root.dataset.darkMode = theme;
        root.dataset.darkModePreference = mode;
        root.style.colorScheme = theme;
        document.dispatchEvent(new CustomEvent('craft-dark-mode:change', {
            detail: { mode, theme, source },
        }));
    }
    apply();
    const onSystemChange = () => { if (mode === 'auto') apply(mode, 'system'); };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else media.addListener(onSystemChange);
    window.addEventListener('storage', event => {
        if (event.key === config.storageKey && valid(event.newValue)) apply(event.newValue, 'storage');
    });
    window.CraftDarkMode = Object.freeze({
        get mode() { return mode; },
        get theme() { return root.dataset.darkMode; },
        apply,
        cache(value) {
            try { localStorage.setItem(config.storageKey, value); } catch (_) {}
        },
    });
})();
