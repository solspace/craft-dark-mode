(() => {
    'use strict';
    const selector = '#navigation-builder-app, #navigation-builder-header-root, #navigation-builder-instructions-root, #navigation-builder-actions-root, #navigation-builder-sidebar-root';
    const styles = new Set();
    const css = `
        [data-navigation-shadow-root] { color: var(--dm-text); }
        [data-navigation-shadow-root] > [class*="shadow-"], #accordion {
            box-shadow: 0 0 0 1px var(--dm-border-muted);
        }
        #accordion > ul > li > button {
            color: var(--dm-text); background: var(--dm-surface); border-color: var(--dm-border-muted);
        }
        #accordion > ul > li > button:hover { background: var(--dm-hover); }
        pk-lightswitch::part(thumb) { background: var(--dm-muted); }
        pk-lightswitch[checked]::part(thumb) { background: #fff; }
        pk-lightswitch:not([checked])::part(switch) { background: var(--dm-raised); border-color: var(--dm-border); }
        pk-checkbox { --pk-checkbox-border-color: var(--input-border-color); }
        pk-button[variant="primary"] { --pk-color-white: #fff; }
        pk-button[variant="secondary"]::part(base) { color: var(--dm-text); background: var(--dm-raised); }
        pk-select::part(panel), pk-combobox::part(panel), pk-dropdown-menu::part(panel), pk-popover::part(panel) {
            color: var(--dm-text); background: var(--dm-overlay); border: 1px solid var(--dm-border); box-shadow: var(--menu-shadow);
        }
        .node-type-custom, .node-type-dynamic, .node-type-asset { color: var(--dm-link) !important; }
        .node-type-entry { color: var(--fg-success) !important; }
        .node-type-group-column { color: var(--dm-muted) !important; }
        .node-type-passive { color: var(--fg-warning) !important; }
        .node-type-product { color: #c4a5ff !important; }
        /* Pending additions tint the whole row, including its sticky actions. */
        [data-tree-row][class~="bg-orange-50/40"],
        [data-tree-row] > [class~="bg-orange-50/40"] { background: color-mix(in srgb, var(--fg-warning) 7%, var(--dm-surface)); }
        [data-tree-row][aria-selected="true"],
        [data-tree-row][aria-selected="true"] > [role="cell"]:last-child { background: var(--dm-selected); }
        [data-tree-row]:not([aria-selected="true"], [aria-disabled="true"], [class~="bg-orange-50/40"], :has(> [class~="bg-orange-50/40"])):hover,
        [data-tree-row]:not([aria-selected="true"], [aria-disabled="true"], [class~="bg-orange-50/40"], :has(> [class~="bg-orange-50/40"])):hover > [role="cell"]:last-child { background: var(--dm-row-hover); }
    `;
    function sync() {
        const next = document.documentElement.dataset.darkMode === 'dark' ? css : '';
        for (const style of styles) if (style.textContent !== next) style.textContent = next;
    }
    function attach() {
        for (const host of document.querySelectorAll(selector)) {
            const root = host.shadowRoot;
            if (!root) continue;
            let style = root.querySelector('style[data-dark-mode-navigation]');
            if (!style) {
                style = document.createElement('style');
                style.setAttribute('data-dark-mode-navigation', '');
                root.append(style);
            }
            styles.add(style);
        }
        sync();
    }
    document.addEventListener('craft-dark-mode:change', sync);
    // Navigation attaches its named roots while its builder module executes.
    // Module load events cover late attachment without observers or polling.
    document.addEventListener('load', event => {
        if (event.target?.tagName === 'SCRIPT') attach();
    }, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
    attach();
})();
