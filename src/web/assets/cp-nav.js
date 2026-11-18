(() => {
    'use strict';
    const selector = '#cpnav-builder-app, #cpnav-builder-header-root, #cpnav-builder-actions-root';
    const styles = new Set();
    const roots = new Set();
    const popupStyles = new Set();
    const imageStyles = new Set();
    const imageCss = `
        pk-tooltip::part(content) {
            background: var(--dm-raised);
            color: var(--dm-heading);
            box-shadow: 0 0 0 1px var(--dm-border), var(--menu-shadow);
        }
        pk-tooltip::part(content)::after { background: var(--dm-raised); }
    `;
    const popupCss = `
        pk-popup::part(arrow) {
            background: var(--dm-overlay);
            box-sizing: border-box;
            border: solid var(--dm-border);
            border-width: 1px 0 0 1px;
        }
        pk-popup[data-current-placement^="top"]::part(arrow) { border-width: 0 1px 1px 0; }
        pk-popup[data-current-placement^="left"]::part(arrow) { border-width: 1px 1px 0 0; }
        pk-popup[data-current-placement^="right"]::part(arrow) { border-width: 0 0 1px 1px; }
    `;
    const css = `
        [data-cpnav-shadow-root] { color: var(--dm-text); }
        [role="columnheader"] { background: var(--dm-overlay); color: var(--dm-muted); }
        [data-tree-row] { color: var(--dm-text); }
        [data-tree-row] a { color: var(--dm-link); }
        [data-tree-row] button[data-cpnav-editor-anchor] { color: var(--dm-link); }
        .cpnav-type-craft { color: var(--dm-link) !important; }
        .cpnav-type-plugin { color: #c4a5ff !important; }
        .cpnav-type-manual { color: #5cc8bc !important; }
        [data-tree-row] > [role="cell"]:last-child { background: var(--dm-surface); }
        [data-tree-row]:not([aria-selected="true"]):hover,
        [data-tree-row]:not([aria-selected="true"]):hover > [role="cell"]:last-child { background: var(--dm-row-hover); }
        [data-tree-row][aria-selected="true"],
        [data-tree-row][aria-selected="true"] > [role="cell"]:last-child { background: var(--dm-selected); }
        pk-lightswitch::part(thumb) { background: var(--dm-muted); }
        pk-lightswitch[checked]::part(thumb) {
            --pk-lightswitch-track-on: var(--dm-heading);
            background: var(--dm-surface);
            box-shadow: inset 0 0 0 1px var(--dm-border);
        }
        pk-lightswitch:not([checked])::part(switch) { background: var(--dm-raised); border-color: var(--dm-border); }
        pk-button[variant="primary"] { --pk-color-white: #fff; }
        pk-button[variant="secondary"]::part(base) { color: var(--dm-text); background: var(--dm-raised); }
        pk-popover { --pk-popup-arrow-color: var(--dm-overlay); }
        pk-select::part(panel), pk-combobox::part(panel), pk-dropdown-menu::part(panel), pk-popover::part(panel), pk-image-browser::part(panel) {
            color: var(--dm-text); background: var(--dm-overlay); border: 1px solid var(--dm-border); box-shadow: var(--menu-shadow);
        }
        pk-image-browser::part(panel-input) { color: var(--dm-text); background: var(--input-bg); border-color: var(--input-border-color); }
        pk-image-browser { --pk-color-gray-050: var(--dm-selected); }
        pk-image-browser::part(option):hover { background: var(--dm-hover); }
        pk-image-browser::part(option):focus-visible { background: var(--dm-selected); }
        [role="menu"] { color: var(--dm-text); background: var(--dm-overlay); border-color: var(--dm-border); }
        form[aria-label] > .border-t { background: var(--dm-surface); border-color: var(--dm-border-muted); }
        .border-sky-200 pk-button { --pk-action-fill: var(--dm-hover); --pk-action-fill-hover: var(--dm-selected); --pk-action-on: var(--dm-heading); }
        .border-sky-200 pk-button::part(base) { box-shadow: inset 0 0 0 1px var(--input-border-color); }
        .border-sky-200 pk-button:focus-within::part(base) { box-shadow: var(--focus-ring), inset 0 0 0 1px var(--input-border-color); }
    `;
    function sync() {
        const next = document.documentElement.dataset.darkMode === 'dark' ? css : '';
        for (const style of styles) if (style.textContent !== next) style.textContent = next;
        const popupNext = next ? popupCss : '';
        for (const style of popupStyles) if (style.textContent !== popupNext) style.textContent = popupNext;
        const imageNext = next ? imageCss : '';
        for (const style of imageStyles) if (style.textContent !== imageNext) style.textContent = imageNext;
    }
    function attachImageBrowser(browser) {
        if (!roots.has(browser.getRootNode()) || !browser.shadowRoot) return;
        let style = browser.shadowRoot.querySelector('style[data-dark-mode-cp-nav-icons]');
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-dark-mode-cp-nav-icons', '');
            browser.shadowRoot.append(style);
        }
        imageStyles.add(style);
        sync();
    }
    function attachPopover(popover) {
        if (!roots.has(popover.getRootNode()) || !popover.shadowRoot) return;
        let style = popover.shadowRoot.querySelector('style[data-dark-mode-cp-nav-arrow]');
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-dark-mode-cp-nav-arrow', '');
            popover.shadowRoot.append(style);
        }
        popupStyles.add(style);
        sync();
    }
    function attach() {
        for (const host of document.querySelectorAll(selector)) {
            const root = host.shadowRoot;
            if (!root) continue;
            roots.add(root);
            let style = root.querySelector('style[data-dark-mode-cp-nav]');
            if (!style) {
                style = document.createElement('style');
                style.setAttribute('data-dark-mode-cp-nav', '');
                root.append(style);
            }
            styles.add(style);
            for (const popover of root.querySelectorAll('pk-popover')) attachPopover(popover);
            for (const browser of root.querySelectorAll('pk-image-browser')) attachImageBrowser(browser);
        }
        sync();
    }
    document.addEventListener('craft-dark-mode:change', sync);
    // Popovers mount on demand. Use their public show event and public arrow part.
    document.addEventListener('pk-show', event => {
        const popover = event.composedPath().find(node => node.tagName === 'PK-POPOVER');
        if (popover) attachPopover(popover);
        const browser = event.composedPath().find(node => node.tagName === 'PK-IMAGE-BROWSER');
        if (browser) attachImageBrowser(browser);
    });
    // Builder modules mount these known roots; their load events cover late setup.
    document.addEventListener('load', event => {
        if (event.target?.tagName === 'SCRIPT') attach();
    }, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
    attach();
})();
