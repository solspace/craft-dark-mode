import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/cp-nav.js', import.meta.url), 'utf8');

test('CP Nav themes late builder roots once and restores native light styling', () => {
    const events = new Map();
    function host() {
        const sheets = [];
        return { sheets, shadowRoot: {
            querySelector: () => sheets[0] ?? null,
            querySelectorAll: () => [],
            append: style => sheets.push(style),
        } };
    }
    const first = host();
    const late = host();
    const hosts = [first];
    const document = {
        readyState: 'complete',
        documentElement: { dataset: { darkMode: 'dark' } },
        querySelectorAll(selector) {
            assert.equal(selector, '#cpnav-builder-app, #cpnav-builder-header-root, #cpnav-builder-actions-root');
            return hosts;
        },
        createElement: () => ({ textContent: '', setAttribute() {} }),
        addEventListener: (name, callback) => events.set(name, callback),
    };
    // No DOM observer or timer APIs: mounting must use the builder's module load.
    vm.runInNewContext(source, { document });
    assert.equal(first.sheets.length, 1);
    assert.match(first.sheets[0].textContent, /\[data-tree-row\].*:hover/);
    const popup = host();
    popup.tagName = 'PK-POPOVER';
    popup.getRootNode = () => first.shadowRoot;
    events.get('pk-show')({ composedPath: () => [popup] });
    assert.equal(popup.sheets.length, 1);
    assert.match(popup.sheets[0].textContent, /pk-popup::part\(arrow\)/);
    events.get('pk-show')({ composedPath: () => [popup] });
    assert.equal(popup.sheets.length, 1);
    const unrelated = host();
    unrelated.tagName = 'PK-POPOVER';
    unrelated.getRootNode = () => ({});
    events.get('pk-show')({ composedPath: () => [unrelated] });
    assert.equal(unrelated.sheets.length, 0);
    const icons = host();
    icons.tagName = 'PK-IMAGE-BROWSER';
    icons.getRootNode = () => first.shadowRoot;
    events.get('pk-show')({ composedPath: () => [icons, popup] });
    events.get('pk-show')({ composedPath: () => [icons, popup] });
    assert.equal(icons.sheets.length, 1);
    assert.match(icons.sheets[0].textContent, /pk-tooltip::part\(content\)/);
    document.documentElement.dataset.darkMode = 'light';
    events.get('craft-dark-mode:change')();
    assert.equal(first.sheets[0].textContent, '');
    assert.equal(popup.sheets[0].textContent, '');
    assert.equal(icons.sheets[0].textContent, '');
    hosts.push(late);
    events.get('load')({ target: { tagName: 'SCRIPT' } });
    assert.equal(first.sheets.length, 1);
    assert.equal(late.sheets.length, 1);
    assert.equal(late.sheets[0].textContent, '');
    document.documentElement.dataset.darkMode = 'dark';
    events.get('craft-dark-mode:change')();
    assert.ok(first.sheets[0].textContent.length > 0);
    assert.ok(popup.sheets[0].textContent.length > 0);
    assert.ok(icons.sheets[0].textContent.length > 0);
    assert.equal(late.sheets[0].textContent, first.sheets[0].textContent);
    events.get('load')({ target: { tagName: 'SCRIPT' } });
    assert.equal(first.sheets.length, 1);
    assert.equal(late.sheets.length, 1);
});
