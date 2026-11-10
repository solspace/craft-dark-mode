import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/formie.js', import.meta.url), 'utf8');
function setup({ ready = true } = {}) {
    const events = new Map();
    const observations = [];
    const styles = [];
    const components = [];
    const frames = [];
    const shadow = {
        authoredContent: '<p style="color:red">Sample</p>',
        querySelector() { return styles[0]; },
        append(style) { styles.push(style); },
        querySelectorAll(selector) { return selector.includes('iframe') ? frames : components; },
    };
    const host = { shadowRoot: ready ? shadow : null };
    const document = {
        documentElement: { dataset: { darkMode: 'dark' } },
        readyState: 'complete',
        querySelectorAll(selector) { return selector.includes('iframe') ? [] : [host]; },
        createElement() { return { textContent: '', setAttribute() {} }; },
        addEventListener(name, callback) { events.set(name, callback); },
    };
    class MutationObserver {
        constructor(callback) { this.callback = callback; }
        observe(target, options) { observations.push({ target, options, observer: this }); }
        disconnect() { this.disconnected = true; }
    }
    vm.runInNewContext(source, {
        document, MutationObserver, queueMicrotask,
        getComputedStyle() { return { getPropertyValue(name) { return name === '--dm-text' ? '#c9d1d9' : '#161b22'; } }; },
    });
    return { document, host, shadow, styles, events, observations, components, frames };
}

test('Formie shadow chrome follows appearance without replacing authored content', () => {
    const app = setup();
    const darkCss = app.styles[0].textContent;
    assert.ok(darkCss.length > 0);
    app.document.documentElement.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(app.styles[0].textContent, '');
    app.document.documentElement.dataset.darkMode = 'dark';
    app.events.get('craft-dark-mode:change')();
    assert.equal(app.styles[0].textContent, darkCss);
    assert.equal(app.shadow.authoredContent, '<p style="color:red">Sample</p>');
    assert.equal(app.observations.length, 1);
    assert.equal(app.observations[0].target, app.shadow);
    assert.equal(app.observations[0].options.childList, true);
});

test('standalone notification dialogs attach through public show events without observing the page', () => {
    const app = setup();
    const styles = [];
    const root = {
        querySelector() { return styles[0]; },
        querySelectorAll() { return []; },
        append(style) { styles.push(style); },
    };
    const host = { shadowRoot: root, matches() { return true; } };
    app.events.get('pk-show')({ target: host });
    app.events.get('pk-after-show')({ target: host });
    assert.equal(styles.length, 1);
    assert.ok(styles[0].textContent.includes('pk-dialog::part(header)'));
    assert.ok(app.observations.every(({ target }) => target !== app.document));
    app.document.documentElement.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(styles[0].textContent, '');
});

test('on-demand nested editors mount once, follow both themes, and do not rewrite unchanged styles', async () => {
    const app = setup();
    const nestedStyles = [];
    const nested = { append(style) { nestedStyles.push(style); } };
    app.components.push({ shadowRoot: nested });
    app.observations[0].observer.callback();
    await Promise.resolve();
    assert.equal(nestedStyles.length, 1);
    const style = nestedStyles[0];
    const dark = style.textContent;
    let writes = 0;
    let content = dark;
    Object.defineProperty(style, 'textContent', {
        get() { return content; },
        set(value) { writes++; content = value; },
    });
    app.observations[0].observer.callback();
    await Promise.resolve();
    assert.equal(nestedStyles.length, 1);
    assert.equal(writes, 0);
    app.document.documentElement.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.ok(style.textContent.includes('.pk-variable-tag'));
    assert.ok(!style.textContent.includes('.et td.actions'));
    app.document.documentElement.dataset.darkMode = 'dark';
    app.events.get('craft-dark-mode:change')();
    assert.equal(style.textContent, dark);
    assert.equal(writes, 2);
});

test('generated email preview defaults follow appearance and are reattached after frame reload', async () => {
    const app = setup();
    const makeDocument = () => {
        const styles = [];
        return {
            styles,
            head: { append(style) { styles.push(style); } },
            querySelector() { return styles[0]; },
            createElement: app.document.createElement,
        };
    };
    const events = new Map();
    const frame = { contentDocument: makeDocument(), addEventListener(name, callback) { events.set(name, callback); } };
    app.frames.push(frame);
    app.observations[0].observer.callback();
    await Promise.resolve();
    assert.match(frame.contentDocument.styles[0].textContent, /:where\(html, body\)/);
    assert.match(frame.contentDocument.styles[0].textContent, /#c9d1d9/);
    app.document.documentElement.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(frame.contentDocument.styles[0].textContent, '');
    const retiredStyle = frame.contentDocument.styles[0];
    retiredStyle.textContent = 'retired document';
    frame.contentDocument = makeDocument();
    events.get('load')();
    assert.equal(frame.contentDocument.styles.length, 1);
    assert.equal(frame.contentDocument.styles[0].textContent, '');
    app.document.documentElement.dataset.darkMode = 'dark';
    app.events.get('craft-dark-mode:change')();
    assert.match(frame.contentDocument.styles[0].textContent, /#161b22/);
    assert.equal(retiredStyle.textContent, 'retired document');
    frame.isConnected = false;
    app.document.documentElement.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.match(frame.contentDocument.styles[0].textContent, /#161b22/);
    frame.isConnected = true;
    app.observations[0].observer.callback();
    await Promise.resolve();
    assert.equal(frame.contentDocument.styles[0].textContent, '');
    assert.ok(!frame.contentDocument.styles[0].textContent.includes('!important'));
});

test('a late Formie mount observes only its host and disconnects after readiness', () => {
    const app = setup({ ready: false });
    assert.equal(app.observations.length, 1);
    const { observer, target, options } = app.observations[0];
    assert.equal(target, app.host);
    assert.equal(options.subtree, undefined);
    assert.deepEqual(Array.from(options.attributeFilter), ['class']);
    app.host.shadowRoot = app.shadow;
    observer.callback();
    assert.equal(observer.disconnected, true);
    app.events.get('load')({ target: { tagName: 'SCRIPT' } });
    assert.equal(app.styles.length, 1);
    assert.equal(app.observations.length, 2);
    assert.equal(app.observations[1].target, app.shadow);
});

test('builder HTML frame defaults are themed without setting authored backgrounds', async () => {
    const app = setup();
    const styles = [];
    const frame = {
        matches(selector) { return selector === '.formie-field-preview-html-iframe'; },
        addEventListener() {},
        contentDocument: {
            head: { append(style) { styles.push(style); } },
            querySelector() { return styles[0]; },
            createElement: app.document.createElement,
        },
    };
    app.frames.push(frame);
    app.observations[0].observer.callback();
    await Promise.resolve();
    assert.match(styles[0].textContent, /:where\(html\), body/);
    assert.ok(!styles[0].textContent.includes('background'));
    app.document.documentElement.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(styles[0].textContent, '');
});
