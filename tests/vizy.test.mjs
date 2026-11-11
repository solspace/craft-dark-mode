import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/web/assets/vizy.js', import.meta.url), 'utf8');

test('Vizy themes only configuration code editors, handles late mounts, and restores light mode', async () => {
    const events = new Map();
    const observed = [];
    const styles = [];
    const editor = { isConnected: true, shadowRoot: { append: style => styles.push(style) } };
    const config = { querySelectorAll: () => [editor] };
    let configs = [];
    let onSlideoutLoad;
    const document = {
        documentElement: { dataset: { darkMode: 'dark' } },
        readyState: 'complete',
        querySelectorAll: selector => {
            assert.equal(selector, 'vizy-editor-config-settings');
            return configs;
        },
        createElement: () => ({ dataset: {}, textContent: '' }),
        addEventListener: (event, callback) => events.set(event, callback),
    };
    class MutationObserver {
        constructor(callback) { this.callback = callback; }
        observe(root) { observed.push({ root, callback: this.callback }); }
    }
    const Craft = { CpScreenSlideout: {} };
    const Garnish = { on: (type, event, callback) => {
        assert.equal(type, Craft.CpScreenSlideout);
        assert.equal(event, 'load');
        onSlideoutLoad = callback;
    } };
    vm.runInNewContext(source, {
        document, MutationObserver, Craft, Garnish,
        window: { Craft, Garnish },
        customElements: { whenDefined: () => Promise.resolve() },
    });
    await Promise.resolve();
    assert.equal(styles.length, 0);
    configs = [config];
    onSlideoutLoad();
    assert.equal(observed.length, 1);
    assert.equal(observed[0].root, config);
    assert.match(styles[0].textContent, /background: var\(--dm-canvas\)/);
    onSlideoutLoad();
    observed[0].callback();
    assert.equal(styles.length, 1);
    document.documentElement.dataset.darkMode = 'light';
    events.get('craft-dark-mode:change')();
    assert.equal(styles[0].textContent, '');
    document.documentElement.dataset.darkMode = 'dark';
    events.get('craft-dark-mode:change')();
    assert.match(styles[0].textContent, /\.cm-cursor/);
    editor.isConnected = false;
    events.get('craft-dark-mode:change')();
    assert.equal(observed.some(({ root }) => root === document), false);
});

test('Vizy tooltip roots stay readable across late mounts and theme changes without observing authored content', async () => {
    const events = new Map();
    const observed = [];
    const makeHost = tag => {
        const styles = [];
        return {
            styles,
            isConnected: true,
            matches: selector => {
                assert.equal(selector, 'vizy-toolbar, vizy-bubble');
                return tag === 'vizy-toolbar' || tag === 'vizy-bubble';
            },
            shadowRoot: { append: style => styles.push(style) },
        };
    };
    const document = {
        documentElement: { dataset: { darkMode: 'dark' } },
        readyState: 'complete',
        querySelectorAll: () => [],
        createElement: () => ({ dataset: {}, textContent: '' }),
        addEventListener: (event, callback) => events.set(event, callback),
    };
    class MutationObserver {
        observe(root) { observed.push(root); }
    }
    vm.runInNewContext(source, {
        document, MutationObserver, window: {},
        customElements: { whenDefined: () => Promise.resolve() },
    });
    await Promise.resolve();
    const toolbar = makeHost('vizy-toolbar');
    const hover = host => events.get('pointerover')({ composedPath: () => [host] });
    hover(toolbar);
    assert.equal(toolbar.styles.length, 1);
    assert.match(toolbar.styles[0].textContent, /pk-tooltip::part\(content\).*color: var\(--dm-text\)/);
    hover(toolbar);
    assert.equal(toolbar.styles.length, 1);
    document.documentElement.dataset.darkMode = 'light';
    events.get('craft-dark-mode:change')();
    assert.equal(toolbar.styles[0].textContent, '');
    const bubble = makeHost('vizy-bubble');
    events.get('focusin')({ composedPath: () => [bubble] });
    assert.equal(bubble.styles[0].textContent, '');
    document.documentElement.dataset.darkMode = 'dark';
    events.get('craft-dark-mode:change')();
    assert.match(bubble.styles[0].textContent, /var\(--dm-text\)/);
    const authoredContent = makeHost('div');
    hover(authoredContent);
    assert.equal(authoredContent.styles.length, 0);
    assert.equal(observed.length, 0);
    bubble.isConnected = false;
    events.get('craft-dark-mode:change')();
    document.documentElement.dataset.darkMode = 'light';
    events.get('craft-dark-mode:change')();
    assert.match(bubble.styles[0].textContent, /var\(--dm-text\)/);
    assert.equal(toolbar.styles[0].textContent, '');
});
