(() => {
    'use strict';
    let attached;
    const themeName = 'craft-dark-mode';

    function sync() {
        if (!attached) return;
        const dark = document.documentElement.dataset.darkMode === 'dark';
        if (dark) {
            const css = getComputedStyle(document.documentElement);
            const color = name => css.getPropertyValue(name).trim();
            attached.defineTheme(themeName, {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': color('--dm-canvas'),
                    'editor.foreground': color('--dm-text'),
                    'editorGutter.background': color('--dm-canvas'),
                    'editorLineNumber.foreground': color('--dm-muted'),
                    'editorCursor.foreground': color('--dm-text'),
                    'editor.selectionBackground': color('--dm-selected'),
                    'editorWidget.background': color('--dm-overlay'),
                    'editorWidget.border': color('--dm-border'),
                    'editorSuggestWidget.background': color('--dm-overlay'),
                    'editorSuggestWidget.foreground': color('--dm-text'),
                    'editorSuggestWidget.border': color('--dm-border'),
                    'editorSuggestWidget.selectedBackground': color('--dm-selected'),
                    'focusBorder': color('--focus-ring-color'),
                },
            });
        }
        attached.setTheme(dark ? themeName : 'vs');
    }

    function attach(editor = window.monaco?.editor) {
        if (!editor || attached === editor) return;
        attached = editor;
        // Monaco can also be created later inside Craft field-setting slideouts.
        // React's Monaco wrapper applies its default theme immediately after
        // creation. Reapply ours once that synchronous mount has finished.
        editor.onDidCreateEditor(() => queueMicrotask(sync));
        sync();
        document.removeEventListener('load', onScriptLoad, true);
    }

    function onScriptLoad(event) {
        if (event.target?.tagName !== 'SCRIPT') return;
        attach();
        // Recent Monaco AMD bundles finish asynchronously after their script's
        // load event. Subscribe to the public module instead of polling globals.
        if (/\/vs\/editor\/editor\.main\.js(?:[?#]|$)/.test(event.target.src || '') && typeof window.require === 'function') {
            window.require(['vs/editor/editor.main'], monaco => attach(monaco?.editor));
        }
    }

    document.addEventListener('craft-dark-mode:change', sync);
    document.addEventListener('load', onScriptLoad, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => attach(), { once: true });
    window.addEventListener('load', () => attach(), { once: true });
    attach();
})();
