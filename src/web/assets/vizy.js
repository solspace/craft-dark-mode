(() => {
    'use strict';
    const hosts = new WeakSet();
    const editors = new Map();
    const tooltips = new Map();
    const tooltipSelector = 'vizy-toolbar, vizy-bubble';
    const selector = 'vizy-editor-config-settings';
    const styles = `
        .cm-editor.cm-editor { background: var(--dm-canvas); color: var(--dm-text); }
        .cm-editor.cm-editor .cm-gutters { background: var(--dm-surface); color: var(--dm-muted); border-color: var(--dm-border); }
        .cm-editor.cm-editor .cm-activeLine, .cm-editor.cm-editor .cm-activeLineGutter { background: var(--dm-raised); }
        .cm-editor.cm-editor .cm-content { caret-color: var(--dm-text); }
        .cm-editor.cm-editor .cm-cursor { border-left-color: var(--dm-text); }
        /* The component has no dark syntax-theme API. Keep every token readable. */
        .cm-editor.cm-editor .cm-line span { color: inherit; }
    `;

    const tooltipStyles = 'pk-tooltip::part(content) { color: var(--dm-text); background: var(--dm-tooltip-bg); } pk-tooltip::part(content)::after { background: var(--dm-tooltip-bg); }';

    function mountTooltipStyles(event) {
        // The toolbar's manual tooltip opens shortly after pointerover. Attach
        // through its own root before it opens, including portaled bubbles.
        // This also covers late mounts without observing editor content.
        for (const host of event.composedPath()) {
            if (!host.matches?.(tooltipSelector) || !host.shadowRoot || tooltips.has(host)) continue;
            const style = document.createElement('style');
            style.dataset.darkModeVizyTooltip = '';
            host.shadowRoot.append(style);
            tooltips.set(host, style);
        }
        sync();
    }

    function sync() {
        const dark = document.documentElement.dataset.darkMode === 'dark';
        for (const [host, style] of editors) {
            if (!host.isConnected) {
                editors.delete(host);
                continue;
            }
            const next = dark ? styles : '';
            if (style.textContent !== next) style.textContent = next;
        }
        for (const [host, style] of tooltips) {
            if (!host.isConnected) {
                tooltips.delete(host);
                continue;
            }
            const next = dark ? tooltipStyles : '';
            if (style.textContent !== next) style.textContent = next;
        }
    }

    function mountEditors(root) {
        for (const host of root.querySelectorAll('pk-code-editor')) {
            if (!host.shadowRoot || editors.has(host)) continue;
            const style = document.createElement('style');
            style.dataset.darkModeVizy = '';
            host.shadowRoot.append(style);
            editors.set(host, style);
        }
        sync();
    }

    function attach() {
        for (const host of document.querySelectorAll(selector)) {
            if (hosts.has(host)) continue;
            hosts.add(host);
            // Vizy rebuilds this settings component when switching Visual/Advanced.
            // Observe only its configuration UI, never the page or authored content.
            const observer = new MutationObserver(() => mountEditors(host));
            observer.observe(host, { childList: true, subtree: true });
            mountEditors(host);
        }
    }

    document.addEventListener('pointerover', mountTooltipStyles, true);
    document.addEventListener('focusin', mountTooltipStyles, true);
    document.addEventListener('craft-dark-mode:change', sync);
    document.addEventListener('load', event => {
        if (event.target?.tagName === 'SCRIPT') attach();
    }, true);
    if (window.Garnish && window.Craft?.CpScreenSlideout) {
        Garnish.on(Craft.CpScreenSlideout, 'load', attach);
    }
    customElements.whenDefined('vizy-editor-config-settings').then(attach);
    customElements.whenDefined('pk-code-editor').then(() => {
        for (const host of document.querySelectorAll(selector)) mountEditors(host);
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
    attach();
})();
