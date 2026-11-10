(() => {
    'use strict';
    const selector = '.formie-defaults, .formie-field-palette, .formie-form-builder, .formie-reports-dashboard, .formie-reports-editor, .formie-reports-viewer, [id^="formie-send-notification-"], [id^="formie-resend-"], [id^="formie-submission-export-"]';
    const roots = new Map();
    const watched = new WeakSet();
    const componentRoots = new WeakSet();
    const previewFrames = new WeakSet();
    const previewStyles = new Map();
    // These are Plugin Kit's public component parts and Formie's dialog chrome.
    // Authored field content is preserved; email preview defaults are themed separately.
    const darkStyles = `
        pk-lightswitch {
            --pk-lightswitch-border-color: var(--gray-350);
            --pk-lightswitch-track-off: var(--gray-350);
            --pk-lightswitch-focus-shadow: var(--focus-ring-outset);
        }
        pk-lightswitch::part(thumb) {
            --pk-lightswitch-track-on: var(--dm-heading);
            background: var(--dm-surface); color: var(--dm-heading);
            box-shadow: inset 0 0 0 1px var(--dm-border);
        }
        pk-checkbox { --pk-checkbox-border-color: var(--input-border-color); }
        pk-field {
            --pk-color-blue-500: var(--dm-link);
            --pk-color-sky-700: var(--dm-link);
            --pk-color-sky-100: var(--dm-selected);
            --pk-color-sky-300: var(--dm-link);
            --pk-color-amber-100: var(--bg-warning);
            --pk-color-amber-300: var(--fg-warning);
            --pk-color-red-100: var(--bg-error);
            --pk-color-red-300: var(--fg-error);
        }
        .text-gray-500[class~="[&_a]:text-blue-600"] a { color: var(--dm-link); }
        .text-gray-500[class~="[&_a]:text-blue-600"] a:hover { color: var(--dm-heading); }
        pk-button:is([variant="primary"], [variant="secondary"]) { --pk-color-white: #fff; }
        pk-button[variant="secondary"]::part(base) { color: var(--dm-text); background: var(--dm-raised); border-color: var(--dm-border); }
        pk-button[variant="secondary"]:hover::part(base) { background: var(--dm-hover); }
        pk-button[variant="outline"]::part(base) { color: var(--dm-text); border-color: var(--dm-border); }
        pk-button[variant="outline"]:hover::part(base) { background: var(--dm-hover); }
        pk-button[aria-pressed=""]::part(base), pk-button[aria-pressed="true"]::part(base) { color: var(--dm-link); background: var(--dm-selected); }
        pk-popover[flush] pk-button-group pk-button[aria-pressed]::part(base) { border-color: transparent; }
        .border-sky-200.bg-sky-50 { color: var(--dm-text); background: var(--dm-selected); border-color: var(--dm-border); }
        span.bg-sky-100.text-sky-800 { color: var(--dm-link); background: var(--dm-selected); --tw-ring-color: var(--dm-border); }
        span.bg-emerald-100.text-emerald-800 { color: var(--fg-success); background: var(--bg-success); --tw-ring-color: var(--dm-border); }
        pk-alert {
            --pk-alert-background: var(--dm-selected); --pk-alert-color: var(--dm-link);
            --pk-alert-accent: var(--dm-link); --pk-alert-border: var(--dm-link);
        }
        pk-alert[variant="success"] {
            --pk-alert-background: var(--bg-success); --pk-alert-color: var(--fg-success);
            --pk-alert-accent: var(--fg-success); --pk-alert-border: var(--fg-success);
        }
        pk-alert[variant="warning"] {
            --pk-alert-background: var(--bg-warning); --pk-alert-color: var(--fg-warning);
            --pk-alert-accent: var(--fg-warning); --pk-alert-border: var(--fg-warning);
        }
        pk-alert[variant="error"] {
            --pk-alert-background: var(--bg-error); --pk-alert-color: var(--fg-error);
            --pk-alert-accent: var(--fg-error); --pk-alert-border: var(--fg-error);
        }
        pk-tabs::part(base) { box-shadow: none; border-color: var(--dm-border-muted); }
        pk-select::part(panel), pk-combobox::part(panel),
        pk-dropdown-menu::part(panel), pk-popover::part(panel) {
            color: var(--dm-text); background: var(--dm-overlay);
            border: 1px solid var(--dm-border); box-shadow: var(--menu-shadow);
        }
        pk-tabs[variant="pane"] {
            --pk-tabs-root-shadow: 0 0 0 1px var(--dm-border-muted);
            --pk-tabs-trigger-hover-bg: var(--dm-hover);
            --pk-tabs-trigger-selected-border-top: 2px solid var(--dm-tab-accent);
            --pk-tabs-trigger-selected-shadow: -1px 0 0 var(--dm-border-muted), 1px 0 0 var(--dm-border-muted);
            --pk-tabs-list-shadow: inset 0 -1px 0 var(--dm-border-muted);
        }
        .form-builder-page-toolbar { box-shadow: 0 0 0 1px var(--dm-border-muted), 0 1px 5px rgb(0 0 0 / 25%); }
        .form-builder-page-tabs pk-button.form-builder-page-tab-button[size="none"]:not(.has-errors)::part(base) { color: var(--dm-muted); }
        .form-builder-page-tabs pk-button.form-builder-page-tab-button[size="none"]:not(.has-errors):is(.is-active, :hover)::part(base) { color: var(--dm-heading); }
        .form-builder-page-tabs pk-button.form-builder-page-tab-button.is-active[size="none"]::part(base)::after { background: var(--dm-link); }
        pk-popover > pk-button[variant="none"][slot="trigger"] {
            color: var(--dm-muted); border-color: var(--dm-border-muted); background: var(--input-bg);
        }
        pk-tiptap-editor [slot="toolbar-end"] pk-button::part(base) { color: var(--dm-text); }
        pk-tiptap-editor [slot="toolbar-end"] pk-button:hover::part(base) { background: var(--dm-hover); }
        .formie-field-palette-group { background: var(--dm-surface); border-color: var(--dm-border-muted); }
        .formie-field-palette-group-header { background: var(--dm-raised); border-color: var(--dm-border-muted); }
        .formie-field-preview-input, .formie-field-preview-select,
        .formie-field-preview-select:not([multiple]):not([size]) {
            color: var(--dm-text); background-color: var(--input-bg); border-color: var(--input-border-color);
        }
        .formie-field-preview-select:not([multiple]):not([size]) {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 4'%3E%3Cpath d='m1 .5 3 3 3-3' fill='none' stroke='%238b949e'/%3E%3C/svg%3E");
        }
        .formie-field-preview-input::placeholder { color: var(--dm-muted); }
        .formie-field-preview-table th { color: var(--dm-text); background: var(--dm-canvas); border-color: var(--dm-border-muted); }
        .formie-field-preview-table td { border-color: var(--dm-border-muted); }
        .formie-field-preview-static-content { color: var(--dm-text); background: var(--dm-overlay); border-color: var(--dm-border); }
        .formie-field-preview-signature { color: var(--dm-text); background: var(--input-bg); border-color: var(--input-border-color); }
        .formie-field-preview-note { color: var(--dm-text); background: var(--dm-raised); border-color: var(--dm-muted); }
        .formie-field-preview-note[class~="bg-[#f0f9ff]"] { color: var(--dm-link); background: var(--dm-selected); border-color: var(--dm-link); }
        .formie-field-preview-note[class~="bg-[#fffbeb]"] { color: var(--fg-warning); background: var(--bg-warning); border-color: var(--fg-warning); }
        .formie-field-preview-note[class~="bg-[#fef2f2]"] { color: var(--fg-error); background: var(--bg-error); border-color: var(--fg-error); }
        .formie-field-preview-note pk-icon { color: inherit; }
        .formie-field-preview-file::file-selector-button {
            color: var(--dm-text); background: var(--dm-raised); border-color: var(--dm-border);
        }
        .formie-field-preview-upload-manager { background: var(--input-bg); border-color: var(--dm-border); }
        .formie-field-preview-upload-manager-prompt { color: var(--dm-muted); }
        .formie-field-preview-control--phone-combined { background: var(--input-bg); border-color: var(--input-border-color); }
        .formie-field-preview-phone-country-trigger { color: var(--dm-text); border-color: var(--dm-border-muted); }
        .formie-field-preview-phone-country-trigger::after { filter: brightness(0) invert(.65); }
        .formie-field-preview-phone-country-code { color: var(--dm-text); }
        .formie-field-preview-phone-country-flag { background: var(--dm-border); }
        .formie-field-preview-control--phone-combined .formie-field-preview-input--phone-inline { background: transparent; }
        .formie-field-preview-sub-label { color: var(--dm-muted); }
        .formie-field-preview-sub-label::before { background: var(--dm-surface); }
        [data-field-id]:hover .formie-field-preview-sub-label::before { background: var(--dm-hover); }
        .formie-field-edit-header { background: var(--dm-overlay); border-color: var(--dm-border-muted); }
        .formie-field-edit-title { color: var(--dm-heading); }
        .formie-field-edit-type-pill { background: var(--dm-raised); color: var(--dm-muted); }
        .formie-page-settings-sidebar { background: var(--dm-surface); border-color: var(--dm-border-muted); }
        pk-popover [class~="bg-[#f3f7fd]"] { background: var(--dm-raised); }
        .formie-page-settings-page-list > [role="button"] { color: var(--dm-text); background: transparent; border-color: var(--dm-border-muted); }
        .formie-page-settings-page-list > [aria-current="page"] { background: var(--dm-selected); }
        .formie-page-settings-drag-handle::part(base) { color: var(--dm-muted); background: transparent; }
        :is(.formie-existing-notifications-dialog, .formie-existing-fields-dialog) [class~="bg-[#f3f7fc]"] { background: var(--dm-surface); border-color: var(--dm-border-muted); }
        .formie-existing-picker-nav-item::part(base) { color: var(--dm-text); background: transparent; }
        :is(.formie-existing-notifications-dialog, .formie-existing-fields-dialog) pk-button.formie-existing-picker-nav-item.is-selected[size="none"]::part(base),
        :is(.formie-existing-notifications-dialog, .formie-existing-fields-dialog) pk-button.formie-existing-picker-nav-item.is-selected[size="none"]:hover::part(base) { color: var(--dm-link); background: var(--dm-selected); }
        :is(.formie-existing-notifications-dialog, .formie-existing-fields-dialog) .bg-blue-50 { background: var(--dm-selected); border-color: var(--dm-link); }
        .formie-existing-fields-dialog [class~="after:bg-[#e2e8f0]"]::after { background: var(--dm-border-muted); }
        .formie-existing-fields-dialog [class~="after:bg-[#e2e8f0]"] > .bg-white { background: var(--dm-overlay); }
        [class~="bg-[#f3f7fc]"]:has(.form-builder-integrations-nav-item) { background: var(--dm-surface); border-color: var(--dm-border-muted); }
        pk-button.form-builder-integrations-nav-item[size="none"]::part(base) { color: var(--dm-text); background: transparent; }
        pk-button.form-builder-integrations-nav-item.is-selected[size="none"]::part(base),
        pk-button.form-builder-integrations-nav-item.is-selected[size="none"]:hover::part(base) { color: var(--dm-link); background: var(--dm-selected); }
        .form-builder-integrations-nav-item img:is([src*="/icons/elements/entry.svg"], [src*="/icons/elements/user.svg"]) { filter: grayscale(1) brightness(0) invert(.8); }
        .form-builder-integrations-nav-item img[src*="/icons/email-marketing/mailchimp.svg"] { filter: grayscale(1) invert(.85); }
        pk-button.form-builder-integrations-nav-item.is-selected pk-status[status="disabled"] { --pk-status-ring: var(--dm-muted); }
        section[aria-label] > div.border:has(> span.grow) { border-color: var(--dm-border-muted); }
        .formie-notification-edit-dialog div:has(> div > iframe) {
            background: var(--dm-surface); box-shadow: 0 0 0 1px var(--dm-border-muted);
        }
        .formie-notification-edit-dialog div:has(> div > iframe) > div { border-color: var(--dm-border-muted); }
        .formie-notification-edit-dialog [class~="bg-[#f5f8fc]"] { background: var(--dm-raised); }
        .formie-notification-edit-dialog [class~="text-[#60758a]"] { color: var(--dm-muted); }
        pk-tabs[variant="modal"] {
            --pk-tabs-root-shadow: none;
            --pk-tabs-list-bg: var(--modal-bg);
            --pk-tabs-panel-bg: var(--modal-bg);
            --pk-tabs-list-border-bottom: 1px solid var(--dm-border-muted);
            --pk-tabs-list-shadow: none;
            --pk-tabs-list-inset-shadow: none;
            --pk-tabs-trigger-color: var(--dm-muted);
            --pk-tabs-trigger-selected-color: var(--dm-heading);
            --pk-tabs-trigger-hover-bg: var(--dm-raised);
            --pk-tabs-trigger-hover-color: var(--dm-heading);
            --pk-tabs-trigger-selected-hover-color: var(--dm-heading);
        }
        pk-tabs[variant="modal"] > pk-tab[selected]::part(trigger)::after { background: var(--dm-tab-accent); }
        :is([data-id], [data-field-id]) [class~="bg-[#f0faff]"] { color: var(--dm-link); background: var(--dm-selected); border-color: var(--dm-link); }
        :is([data-id], [data-field-id]) [class~="bg-[#fffaf0]"] { color: var(--fg-warning); background: var(--bg-warning); border-color: var(--fg-warning); }
        div:has(> [aria-label="Edit page buttons"]):hover { background: var(--dm-hover); }
        [class~="border-[#6ec2f7]"][class~="bg-[#e5f5f8]"] {
            background: var(--dm-selected); border-color: var(--dm-link);
        }
        .form-builder-canvas-scroll .border-dashed[class~="border-[#9fb4cb]"] { background: var(--dm-surface); border-color: var(--dm-border); }
        .form-builder-canvas-scroll [class~="bg-[#e5f5f8]"] { background: var(--dm-selected); border-color: var(--dm-link); }
        .form-builder-canvas-scroll .border-dashed [class~="text-[#60758a]"] { color: var(--dm-muted); }
        .border-dashed:has(.form-builder-empty-dropzone-field-select) { border-color: var(--dm-border); }
        .border-dashed:has(.form-builder-empty-dropzone-field-select) [class~="text-[#33475b]"] { color: var(--dm-text); }
        .border-dashed:has(.form-builder-empty-dropzone-field-select) [class~="text-[#2563eb]"] { color: var(--dm-link); }
        .border-dashed[class~="border-[#0D99F2]"]:has(.form-builder-empty-dropzone-field-select) { border-color: var(--dm-link); background: var(--dm-selected); }
        [data-id]:has(> button[aria-roledescription="draggable"]) { color: var(--dm-text); }
        [data-id]:has(> button[aria-roledescription="draggable"]):hover { background: var(--dm-hover); }
        .form-builder-canvas-scroll [data-field-id] > [class~="text-[#33475b]"] { color: var(--dm-text); }
        .form-builder-canvas-scroll [data-field-id] > [class~="hover:bg-[#f1f5f8]"]:hover { background: var(--dm-hover); }
        [role="button"][aria-roledescription="draggable"] {
            color: var(--dm-text); border-color: var(--dm-border); background: var(--dm-surface);
        }
        [role="button"][aria-roledescription="draggable"]:hover { background: var(--dm-hover); }
        pk-popover[flush] [aria-roledescription="draggable"] { background: transparent; border-color: transparent; }
        pk-popover[flush] > .grid > .bg-gray-50 { background: var(--dm-surface); }
        pk-popover[flush] > .grid > [class~="border-gray-200"] { border-color: var(--dm-border-muted); }
        .formie-report-table thead th { background: var(--dm-canvas); border-bottom: 1px solid var(--dm-border-muted); }
        .formie-report-table thead th.is-sorted { background: var(--dm-raised); }
        .formie-report-table > tbody > tr:not(.sel, .selected, .disabled, [aria-selected="true"]):hover > :is(th, td) { background: var(--dm-row-hover); }
        [data-dnd-overlay="true"] [class~="text-[#33475b]"] {
            color: var(--dm-text); background: var(--dm-surface); border-color: var(--dm-border);
        }
        .formie-custom-field-adapter-dialog [class~="text-[#33475b]"] { color: var(--dm-text); }
        .formie-custom-field-adapter-dialog [slot="start"] svg { fill: currentColor; }
        .formie-field-preview-icon { color: var(--dm-muted); }
        :is(.formie-field-preview-checkbox, .formie-field-preview-radio) label::before {
            background-color: var(--input-bg); border-color: var(--input-border-color);
        }
        :is(.formie-field-preview-checkbox, .formie-field-preview-radio) input:checked + label::before {
            background-color: var(--dm-link); border-color: var(--dm-link);
        }
        .formie-field-preview-container :is(input[type="checkbox"], input[type="radio"]) { color-scheme: dark; }
        pk-dialog::part(panel) { background: var(--modal-bg); color: var(--dm-text); }
        pk-dialog::part(header), pk-dialog::part(footer) { background: var(--dm-overlay); border-color: var(--dm-border-muted); }
        pk-dialog::part(title) { color: var(--dm-heading); }
        .fui-email-preview { color: var(--dm-text); background: var(--dm-surface); box-shadow: 0 0 0 1px var(--dm-border-muted); }
        .fui-email-header, .fui-email-footer { background: var(--dm-raised); border-color: var(--dm-border-muted); }
        .fui-email-meta { border-color: var(--dm-border-muted); }
        .fui-email-meta-label { color: var(--dm-muted); }
        pk-dialog::part(panel)::backdrop { background: #01040999; }
        pk-state-panel::part(title) { color: var(--dm-heading); }
        pk-state-panel::part(body) { color: var(--dm-muted); }
        pk-state-panel::part(icon) { color: var(--dm-muted); }
        pk-state-panel::part(icon-shell) { background: var(--dm-raised); }
        pk-tooltip::part(content) { color: var(--dm-text); background: var(--dm-overlay); }
        pk-tooltip::part(content)::after { background: var(--dm-overlay); }
    `;
    const variableStyles = `
        .pk-variable-tag {
            color: var(--link-color); background: color-mix(in srgb, var(--link-color) 10%, var(--input-bg));
            border-color: var(--input-border-color); box-shadow: inset 0 0 0 1px var(--input-border-color);
        }
        .pk-variable-tag :is(.pk-variable-tag__label, .pk-variable-tag__remove) { color: inherit; }
    `;
    const nestedStyles = `
        pk-checkbox { --pk-checkbox-border-color: var(--input-border-color); }
        pk-button:is([variant="primary"], [variant="secondary"]) { --pk-color-white: #fff; }
        .shell { background: var(--input-bg); border-color: var(--input-border-color); }
        .toolbar { background: var(--dm-surface); border-color: var(--dm-border-muted); box-shadow: none; }
        .toolbar-btn { color: var(--dm-text); }
        .toolbar-btn:hover:not(:disabled) { background: var(--dm-hover); }
        .toolbar-btn[data-state="active"] { background: var(--dm-selected); color: var(--dm-link); }
        .toolbar-separator { background: var(--dm-border-muted); }
        pk-tooltip::part(content) { color: var(--dm-text); background: var(--dm-overlay); }
        pk-tooltip::part(content)::after { background: var(--dm-overlay); }
        .editor-mount { color: var(--dm-text); background: var(--input-bg); }
        .editor-mount > .tiptap { color: var(--dm-text); background: var(--input-bg); }
        :host .editor-mount .cm-editor { color: var(--dm-text); background: var(--input-bg); }
        :host .editor-mount .cm-content { caret-color: var(--dm-text); }
        :host .editor-mount .cm-editor .cm-gutters { color: var(--dm-muted); background: var(--dm-surface); border-color: var(--dm-border-muted); }
        :host .editor-mount .cm-editor .cm-activeLine { background: var(--dm-raised); }
        :host .editor-mount .cm-editor .cm-activeLineGutter { background: var(--dm-selected); }
        :host .editor-mount .cm-cursor { border-left-color: var(--dm-text); }
        /* Plugin Kit bundles a fixed light syntax palette. Invert only its
           highlighted glyphs, without touching editor surfaces or code values. */
        :host .editor-mount .cm-line > span { filter: invert(.85); }
        :host([readonly]) :is(.shell, .editor-mount, .editor-mount > .tiptap) { background: transparent; }
        .pk-variable-tag {
            color: var(--dm-link); background: var(--dm-selected);
            border-color: var(--dm-border); box-shadow: inset 0 0 0 1px var(--dm-border);
        }
        .pk-variable-tag :is(.pk-variable-tag__label, .pk-variable-tag__remove) { color: inherit; }
        .pk-variable-tag__remove:hover { background: var(--dm-hover); }
        .et td.actions { background: var(--dm-surface); border: 0; border-top: 1px solid var(--pk-et-gridline); box-shadow: none; }
        .et th.actions { background: var(--dm-canvas); border: 0; box-shadow: none; }
        .et tbody tr[data-tone="warning"] > td { background: color-mix(in srgb, var(--fg-warning) 7%, var(--dm-surface)); }
        .et tbody tr[data-tone="muted"] > td { background: var(--dm-raised); }
    `;

    function mountContentPreview(frame) {
        // Only Formie's generated email or builder HTML frame; never website previews.
        const doc = frame.contentDocument;
        if (!doc?.head) return;
        let style = doc.querySelector('style[data-dark-mode-email-preview]');
        if (!style) {
            style = doc.createElement('style');
            style.setAttribute('data-dark-mode-email-preview', '');
            doc.head.append(style);
        }
        // A reload replaces this frame’s previous document and style reference.
        previewStyles.set(frame, { style, html: frame.matches?.('.formie-field-preview-html-iframe') });
        sync();
    }

    function sync() {
        const dark = document.documentElement.dataset.darkMode === 'dark';
        for (const [style, css] of roots) {
            const next = dark ? css.dark : css.light;
            if (style.textContent !== next) style.textContent = next;
        }
        const theme = previewStyles.size && dark ? getComputedStyle(document.documentElement) : null;
        for (const [frame, { style, html }] of previewStyles) {
            if (frame.isConnected === false) {
                previewStyles.delete(frame);
                continue;
            }
            // Zero specificity lets authored template colours/backgrounds take precedence.
            // Builder HTML has a fixed body text rule, unlike email templates.
            // Match only that default; inline and authored content colours still win.
            const next = dark ? (html
                ? `:where(html), body { color: ${theme.getPropertyValue('--dm-text')}; }`
                : `:where(html, body) { color: ${theme.getPropertyValue('--dm-text')}; background-color: ${theme.getPropertyValue('--dm-surface')}; }`) : '';
            if (style.textContent !== next) style.textContent = next;
        }
    }

    function watchEmailPreviews(root) {
        for (const frame of root.querySelectorAll?.('.formie-notification-edit-dialog iframe, .fui-email-preview iframe.email-iframe, .formie-field-preview-html-iframe') ?? []) {
            if (previewFrames.has(frame)) {
                if (!previewStyles.has(frame)) mountContentPreview(frame);
                continue;
            }
            previewFrames.add(frame);
            frame.addEventListener('load', () => mountContentPreview(frame));
            mountContentPreview(frame);
        }
    }

    function mountNested(root) {
        watchEmailPreviews(root);
        for (const element of root.querySelectorAll?.('pk-tiptap-editor, pk-tiptap-input, pk-editable-table, pk-code-editor') ?? []) {
            const nested = element.shadowRoot;
            if (!nested || componentRoots.has(nested)) continue;
            componentRoots.add(nested);
            const style = document.createElement('style');
            style.setAttribute('data-dark-mode-formie-component', '');
            nested.append(style);
            roots.set(style, { dark: nestedStyles, light: variableStyles });
        }
        sync();
    }

    function mount(host) {
        const root = host.shadowRoot;
        if (!root) return false;
        let style = root.querySelector('style[data-dark-mode-formie]');
        if (!style) {
            style = document.createElement('style');
            style.setAttribute('data-dark-mode-formie', '');
            root.append(style);
        }
        roots.set(style, { dark: darkStyles, light: '' });
        if (!componentRoots.has(root)) {
            componentRoots.add(root);
            // React mounts field dialogs and their nested Lit components on demand.
            // Watch only this isolated Formie root, never the page or editor content.
            const observer = new MutationObserver(() => queueMicrotask(() => mountNested(root)));
            observer.observe(root, { childList: true, subtree: true });
            mountNested(root);
        }
        sync();
        return true;
    }

    function attach() {
        watchEmailPreviews(document);
        for (const host of document.querySelectorAll(selector)) {
            if (mount(host) || watched.has(host)) continue;
            watched.add(host);
            // Formie adds its ready class after attaching and mounting its root.
            // Observe only that named component, then disconnect immediately.
            const observer = new MutationObserver(() => {
                if (mount(host)) observer.disconnect();
            });
            observer.observe(host, { attributes: true, attributeFilter: ['class'] });
        }
    }

    document.addEventListener('craft-dark-mode:change', sync);
    function attachDialog(event) {
        // Standalone notification dialogs mount after a dynamic import.
        const host = event.target;
        if (host.matches?.(selector)) mount(host);
    }
    document.addEventListener('pk-show', attachDialog);
    document.addEventListener('pk-after-show', attachDialog);
    document.addEventListener('click', event => {
        if (event.target.closest?.('.js-fui-submission-modal-send-btn, .js-fui-notification-modal-resend-btn')) {
            // Formie creates these named roots in its click handler. No page observer.
            queueMicrotask(attach);
        }
    });
    document.addEventListener('load', event => {
        if (event.target?.tagName === 'SCRIPT') attach();
    }, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
    attach();
})();
