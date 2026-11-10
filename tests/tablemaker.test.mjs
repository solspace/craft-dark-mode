import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/tablemaker.js', import.meta.url), 'utf8');

test('Table Maker handles late dialogs once and restores native light styling', async () => {
    const events = new Map();
    const styles = [];
    const host = {};
    const observers = [];
    const table = () => ({ updateComplete: Promise.resolve(), shadowRoot: {
        appendChild(style) { style.isConnected = true; styles.push(style); },
    } });
    let tables = [table()];
    const document = {
        documentElement: { dataset: { darkMode: 'dark' } },
        querySelectorAll(selector) {
            if (selector === '.tablemaker-field [data-tablemaker-editor]') return [host];
            assert.match(selector, /^\.tablemaker-field pk-editable-table/);
            assert.doesNotMatch(selector, /^pk-editable-table/);
            return tables;
        },
        createElement: () => ({}),
        addEventListener: (name, callback) => events.set(name, callback),
    };
    vm.runInNewContext(source, {
        document, window: { addEventListener() {} },
        customElements: { whenDefined: () => Promise.resolve() },
        MutationObserver: class {
            constructor(callback) { this.callback = callback; }
            observe(root, options) { observers.push({ root, options, callback: this.callback }); }
        },
    });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(styles.length, 1);
    assert.equal(styles[0].media, 'all');
    assert.equal(observers.length, 1);
    assert.equal(observers[0].root, host);
    assert.deepEqual(Object.keys(observers[0].options), ['childList']);
    tables.push(table());
    await observers[0].callback();
    assert.equal(styles.length, 2);
    await events.get('pk-show')();
    assert.equal(styles.length, 2);
    document.documentElement.dataset.darkMode = 'light';
    events.get('craft-dark-mode:change')();
    assert.ok(styles.every(style => style.media === 'not all'));
    styles[0].isConnected = false;
    document.documentElement.dataset.darkMode = 'dark';
    events.get('craft-dark-mode:change')();
    assert.equal(styles[0].media, 'not all');
    assert.equal(styles[1].media, 'all');
});
