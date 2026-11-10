import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/code-editors.js', import.meta.url), 'utf8');
function setup({ mode = 'dark', loaded = true } = {}) {
    const events = new Map();
    const themes = [];
    const definitions = [];
    let created;
    let subscriptions = 0;
    const editor = {
        defineTheme(name, theme) { definitions.push({ name, theme }); },
        setTheme(name) { themes.push(name); },
        onDidCreateEditor(callback) { created = callback; subscriptions++; },
    };
    const root = { dataset: { darkMode: mode } };
    const document = {
        documentElement: root, readyState: 'complete',
        addEventListener(name, callback) { events.set(name, callback); },
        removeEventListener(name) { events.delete(name); },
    };
    const window = { addEventListener(name, callback) { events.set(`window:${name}`, callback); } };
    if (loaded) window.monaco = { editor };
    vm.runInNewContext(source, {
        document, window, queueMicrotask,
        getComputedStyle() { return { getPropertyValue() { return ' #161b22 '; } }; },
    });
    return { window, root, editor, events, themes, definitions,
        created() { created(); }, get subscriptions() { return subscriptions; } };
}

test('Monaco follows dark/light appearance without changing editor models', () => {
    const app = setup();
    assert.equal(app.themes.at(-1), 'craft-dark-mode');
    assert.equal(app.definitions[0].theme.colors['editor.background'], '#161b22');
    assert.equal(app.definitions[0].theme.base, 'vs-dark');
    app.root.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(app.themes.at(-1), 'vs');
});

test('a late-loaded Monaco module and later slideout editors get the active appearance', async () => {
    const app = setup({ loaded: false });
    assert.equal(app.themes.length, 0);
    app.window.monaco = { editor: app.editor };
    app.events.get('load')({ target: { tagName: 'SCRIPT' } });
    assert.equal(app.themes.at(-1), 'craft-dark-mode');
    assert.equal(app.events.has('load'), false);
    app.created();
    await Promise.resolve();
    assert.equal(app.themes.at(-1), 'craft-dark-mode');
    app.events.get('window:load')();
    assert.equal(app.subscriptions, 1);
});

test('asynchronous AMD Monaco and React mounts receive the active theme after initialization', async () => {
    const app = setup({ loaded: false });
    let resolveModule;
    app.window.require = (modules, callback) => {
        assert.deepEqual(Array.from(modules), ['vs/editor/editor.main']);
        resolveModule = callback;
    };
    app.events.get('load')({ target: { tagName: 'SCRIPT', src: 'https://cdn.example/vs/editor/editor.main.js' } });
    assert.equal(app.themes.length, 0);
    resolveModule({ editor: app.editor });
    assert.equal(app.themes.at(-1), 'craft-dark-mode');
    app.created();
    app.editor.setTheme('vs'); // The wrapper's default theme follows create().
    await Promise.resolve();
    assert.equal(app.themes.at(-1), 'craft-dark-mode');
    assert.equal(app.subscriptions, 1);
});

test('appearance changes before Monaco loads are honored when it arrives', () => {
    const app = setup({ loaded: false });
    app.root.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    app.window.monaco = { editor: app.editor };
    app.events.get('load')({ target: { tagName: 'SCRIPT' } });
    assert.equal(app.themes.at(-1), 'vs');
    assert.equal(app.definitions.length, 0);
});
