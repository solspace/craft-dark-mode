(() => {
    'use strict';
    // Plugin Kit's editable table has one fixed light action-cell background
    // inside its shadow root. Keep this shim limited to Table Maker tables.
    const styles = new Set();
    const seen = new WeakSet();
    const watched = new WeakSet();
    const selector = '.tablemaker-field pk-editable-table, .tm-columns-schema-dialog pk-editable-table, .tm-options-dialog pk-editable-table';

    function sync() {
        const dark = document.documentElement.dataset.darkMode === 'dark';
        for (const style of styles) {
            if (!style.isConnected) styles.delete(style);
            else style.media = dark ? 'all' : 'not all';
        }
    }

    async function attach() {
        for (const table of document.querySelectorAll(selector)) {
            if (seen.has(table)) continue;
            seen.add(table);
            await table.updateComplete;
            if (!table.shadowRoot) {
                seen.delete(table);
                continue;
            }
            const style = document.createElement('style');
            style.textContent = `
                tbody td.actions { background: var(--dm-raised) !important; }
                tbody > tr:not([data-tone], .sel, .selected, [aria-selected="true"]):hover > td { background: var(--dm-row-hover) !important; }
                pk-date-picker::part(popup) {
                    background: var(--dm-overlay);
                    box-shadow: var(--modal-shadow);
                }
            `;
            table.shadowRoot.appendChild(style);
            styles.add(style);
        }
        sync();
    }

    function mount() {
        for (const host of document.querySelectorAll('.tablemaker-field [data-tablemaker-editor]')) {
            if (watched.has(host)) continue;
            watched.add(host);
            // Table Maker creates/rebuilds its table asynchronously. Watch only
            // this field's direct mount children, including schema rebuilds.
            new MutationObserver(attach).observe(host, { childList: true });
        }
        attach();
    }

    document.addEventListener('craft-dark-mode:change', sync);
    // Dialogs announce their own lifecycle; no document observer or polling.
    document.addEventListener('pk-show', attach, true);
    document.addEventListener('focusin', event => {
        if (event.target.closest?.('.tablemaker-field, .tm-columns-schema-dialog, .tm-options-dialog')) attach();
    });
    customElements.whenDefined('pk-editable-table').then(mount);
    window.addEventListener('load', mount, { once: true });
    if (window.Garnish && window.Craft?.CpScreenSlideout) {
        Garnish.on(Craft.CpScreenSlideout, 'load', mount);
    }
})();
