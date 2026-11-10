(() => {
    'use strict';
    let manager;
    const attached = new WeakSet();
    const previews = new WeakMap();
    const previewFrames = new Set();

    function syncPreview(frame) {
        if (frame.getAttribute?.('title') !== 'Email Preview') return;
        const doc = frame.contentDocument;
        if (!doc?.head) return;
        let record = previews.get(frame);
        if (!record) previewFrames.add(new WeakRef(frame));
        if (record?.doc !== doc || record.style.isConnected === false) {
            record?.style.remove();
            record?.doc.documentElement.removeAttribute('data-dark-mode-freeform-preview');
            const style = doc.createElement('style');
            style.dataset.darkModeFreeformPreview = '';
            doc.head.appendChild(style);
            record = { doc, style };
            previews.set(frame, record);
        }
        const dark = document.documentElement.dataset.darkMode === 'dark';
        doc.documentElement.toggleAttribute('data-dark-mode-freeform-preview', dark);
        const theme = getComputedStyle(document.documentElement);
        const color = name => theme.getPropertyValue(name).trim();
        // Zero specificity lets all authored template rules and inline paints win.
        record.style.textContent = `
            :where(html[data-dark-mode-freeform-preview]) { color-scheme: dark; background: ${color('--input-bg')}; color: ${color('--text-color')}; }
            :where(html[data-dark-mode-freeform-preview] body) { background: ${color('--input-bg')}; color: ${color('--text-color')}; }
            :where(html[data-dark-mode-freeform-preview] a) { color: ${color('--link-color')}; }
        `;
    }

    function syncPreviews() {
        for (const reference of previewFrames) {
            const frame = reference.deref();
            if (!frame?.isConnected) {
                const record = frame && previews.get(frame);
                record?.style.remove();
                record?.doc.documentElement.removeAttribute('data-dark-mode-freeform-preview');
                if (frame) previews.delete(frame);
                previewFrames.delete(reference);
            }
        }
        document.querySelectorAll?.('body:has(#freeform-client) iframe[title="Email Preview"]').forEach(syncPreview);
    }

    function attachEditor(editor) {
        if (!editor || attached.has(editor)) return;
        attached.add(editor);
        let style;
        let editorDocument;

        function sync() {
            // Notification editing owns its token presentation. Other Freeform
            // editing documents receive defaults only, preserving authored paints.
            const notification = Boolean(editor.plugins?.['freeform-tokens']);
            if (!notification && !editor.getElement?.()?.closest('#freeform-client, .freeform-slideout, #pop-up-portal, .freeform-slideout-popups')) return;
            const doc = editor.getDoc();
            if (!doc?.head) return;
            if (editorDocument && editorDocument !== doc) {
                style?.remove();
                editorDocument.documentElement.removeAttribute('data-dark-mode-freeform-editor');
                style = undefined;
            }
            editorDocument = doc;
            if (!style) {
                style = doc.createElement('style');
                style.dataset.darkModeFreeformEditor = '';
                doc.head.appendChild(style);
            }
            const dark = document.documentElement.dataset.darkMode === 'dark';
            doc.documentElement.toggleAttribute('data-dark-mode-freeform-editor', dark);
            if (!dark) return;
            const theme = getComputedStyle(document.documentElement);
            const color = name => theme.getPropertyValue(name).trim();
            const text = color('--text-color');
            const background = color('--input-bg');
            const border = color('--input-border-color');
            const link = color('--link-color');
            const selection = color('--bg-selection-light');
            const defaults = `
                html[data-dark-mode-freeform-editor] { color-scheme: dark; background: ${background}; }
                html[data-dark-mode-freeform-editor] body { color: ${text} !important; background: ${background} !important; caret-color: ${text}; }
                html[data-dark-mode-freeform-editor] body a:not([style*="color"]) { color: ${link}; }
                html[data-dark-mode-freeform-editor] ::selection { background: ${selection}; color: ${text}; }
            `;
            style.textContent = defaults + (notification ? `
                html[data-dark-mode-freeform-editor] body :is(div, p, span, h1, h2, h3, h4, h5, h6, table, thead, tbody, tfoot, tr, th, td, ul, ol, li, blockquote, strong, em, b, i, font) { color: inherit !important; background-color: transparent !important; }
                html[data-dark-mode-freeform-editor] body :is(a, a span) { color: ${link} !important; }
                html[data-dark-mode-freeform-editor] body :is(table, th, td, hr) { border-color: ${border} !important; }
                html[data-dark-mode-freeform-editor] body :is(code, pre, span[data-freeform-token]) { color: ${text} !important; background: ${selection} !important; border-color: ${border} !important; }
                html[data-dark-mode-freeform-editor] ::selection { background: ${selection}; color: ${text}; }
            ` : '');
        }

        editor.on('init', sync);
        document.addEventListener('craft-dark-mode:change', sync);
        editor.on('remove', () => {
            document.removeEventListener('craft-dark-mode:change', sync);
            style?.remove();
            editorDocument?.documentElement.removeAttribute('data-dark-mode-freeform-editor');
        });
        sync();
    }

    function attach() {
        const next = window.tinymce;
        if (!next?.on || next === manager) return;
        manager = next;
        manager.on('AddEditor', event => attachEditor(event.editor));
        // TinyMCE 6/7/8 expose their existing editors through get().
        (manager.get?.() || []).forEach(attachEditor);
    }

    document.addEventListener('load', event => {
        if (event.target?.tagName === 'SCRIPT') attach();
        if (event.target?.tagName === 'IFRAME' && document.querySelector?.('#freeform-client')) syncPreviews();
    }, true);
    document.addEventListener('craft-dark-mode:change', syncPreviews);
    document.addEventListener('DOMContentLoaded', syncPreviews, { once: true });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
    window.addEventListener('load', attach, { once: true });
    attach();
    syncPreviews();
})();
