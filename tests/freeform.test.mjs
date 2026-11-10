import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/freeform-legacy.js', import.meta.url), 'utf8');

function events(target = {}) {
    const handlers = new Map();
    target.addEventListener = (name, callback) => {
        if (!handlers.has(name)) handlers.set(name, new Set());
        handlers.get(name).add(callback);
    };
    target.removeEventListener = (name, callback) => handlers.get(name)?.delete(callback);
    target.emit = (name, event) => [...(handlers.get(name) || [])].forEach(callback => callback(event));
    target.on = target.addEventListener;
    return target;
}

function editorDocument() {
    const styles = [];
    const attrs = new Set();
    return {
        body: { innerHTML: '<p style="color:red">Authored email</p><img src="logo.png">' },
        documentElement: {
            toggleAttribute(name, on) { on ? attrs.add(name) : attrs.delete(name); },
            removeAttribute(name) { attrs.delete(name); },
            hasAttribute(name) { return attrs.has(name); },
        },
        head: { appendChild(style) { styles.push(style); } },
        createElement() {
            const style = { dataset: {}, textContent: '', remove() { styles.splice(styles.indexOf(style), 1); } };
            return style;
        },
        styles,
    };
}

function editor(notification = true) {
    const instance = events({ plugins: notification ? { 'freeform-tokens': {} } : {} });
    instance.doc = editorDocument();
    instance.getDoc = () => instance.doc;
    return instance;
}

function setup({ late = false, existing = [], previews = [] } = {}) {
    const manager = events({ get: () => existing });
    const document = events({ documentElement: { dataset: { darkMode: 'dark' } }, readyState: 'complete' });
    document.querySelectorAll = () => previews.filter(frame => frame.isConnected);
    const window = events({ tinymce: late ? undefined : manager });
    vm.runInNewContext(source, {
        document, window,
        getComputedStyle: () => ({ getPropertyValue: name => ({ '--text-color': '#c9d1d9', '--input-bg': '#21262d', '--input-border-color': '#555e69', '--link-color': '#82b2e2', '--bg-selection-light': '#30363d' })[name] }),
    });
    return { manager, document, window };
}

const attribute = 'data-dark-mode-freeform-editor';

test('legacy Freeform themes notification editing documents and leaves unrelated editors and previews alone', () => {
    const notification = editor();
    const richText = editor(false);
    const preview = editorDocument();
    const authored = notification.doc.body.innerHTML;
    setup({ existing: [notification, richText] });
    assert.equal(notification.doc.documentElement.hasAttribute(attribute), true);
    assert.match(notification.doc.styles[0].textContent, /#21262d/);
    assert.equal(notification.doc.body.innerHTML, authored);
    assert.equal(richText.doc.styles.length, 0);
    assert.equal(preview.styles.length, 0);
});

test('Freeform field and favorite editors receive dark defaults without overriding authored content paints', () => {
    const field = editor(false);
    field.getElement = () => ({ closest: () => ({}) });
    const authored = field.doc.body.innerHTML;
    const app = setup({ existing: [field] });
    assert.equal(field.doc.documentElement.hasAttribute(attribute), true);
    assert.match(field.doc.styles[0].textContent, /body \{ color: #c9d1d9/);
    assert.doesNotMatch(field.doc.styles[0].textContent, /color: inherit !important|background-color: transparent !important/);
    assert.equal(field.doc.body.innerHTML, authored);
    app.document.documentElement.dataset.darkMode = 'light';
    app.document.emit('craft-dark-mode:change');
    assert.equal(field.doc.documentElement.hasAttribute(attribute), false);
    field.emit('remove');
    assert.equal(field.doc.styles.length, 0);
});

test('email preview defaults follow appearance and reloads without rewriting authored HTML', () => {
    const frame = { isConnected: true, contentDocument: editorDocument(), getAttribute: () => 'Email Preview' };
    const authored = frame.contentDocument.body.innerHTML;
    const app = setup({ previews: [frame] });
    const marker = 'data-dark-mode-freeform-preview';
    assert.equal(frame.contentDocument.documentElement.hasAttribute(marker), true);
    assert.match(frame.contentDocument.styles[0].textContent, /:where\(html\[data-dark-mode-freeform-preview\] body\)/);
    assert.doesNotMatch(frame.contentDocument.styles[0].textContent, /!important/);
    assert.equal(frame.contentDocument.body.innerHTML, authored);
    app.document.documentElement.dataset.darkMode = 'light';
    app.document.emit('craft-dark-mode:change');
    assert.equal(frame.contentDocument.documentElement.hasAttribute(marker), false);
    const retired = frame.contentDocument;
    frame.contentDocument = editorDocument();
    app.document.documentElement.dataset.darkMode = 'dark';
    app.document.emit('craft-dark-mode:change');
    assert.equal(retired.styles.length, 0);
    assert.equal(frame.contentDocument.styles.length, 1);
    frame.isConnected = false;
    app.document.emit('craft-dark-mode:change');
    assert.equal(frame.contentDocument.styles.length, 0);
});

test('late TinyMCE and later notification editors follow appearance once and restore light mode', () => {
    const app = setup({ late: true });
    app.window.tinymce = app.manager;
    app.document.emit('load', { target: { tagName: 'SCRIPT' } });
    app.window.emit('load');
    const notification = editor();
    app.manager.emit('AddEditor', { editor: notification });
    notification.emit('init');
    assert.equal(notification.doc.styles.length, 1);
    app.document.documentElement.dataset.darkMode = 'light';
    app.document.emit('craft-dark-mode:change');
    assert.equal(notification.doc.documentElement.hasAttribute(attribute), false);
    app.document.documentElement.dataset.darkMode = 'dark';
    app.document.emit('craft-dark-mode:change');
    assert.equal(notification.doc.documentElement.hasAttribute(attribute), true);
    assert.equal(notification.doc.styles.length, 1);
});

test('replaced and closed Freeform editing documents release their styles and theme listeners', () => {
    const notification = editor();
    const app = setup({ existing: [notification] });
    const retired = notification.doc;
    notification.doc = editorDocument();
    app.document.emit('craft-dark-mode:change');
    assert.equal(retired.styles.length, 0);
    assert.equal(retired.documentElement.hasAttribute(attribute), false);
    assert.equal(notification.doc.styles.length, 1);
    notification.emit('remove');
    assert.equal(notification.doc.styles.length, 0);
    assert.equal(notification.doc.documentElement.hasAttribute(attribute), false);
    app.document.emit('craft-dark-mode:change');
    assert.equal(notification.doc.styles.length, 0);
});
