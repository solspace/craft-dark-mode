import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/commerce.js', import.meta.url), 'utf8');
function setup({ mode = 'dark', loaded = true, modern = false } = {}) {
    const events = new Map();
    const plugins = [];
    const root = { dataset: { darkMode: mode } };
    const Chart = { defaults: modern ? {} : { global: {} }, instances: {}, plugins: { register(p) { plugins.push(p); } } };
    function chart(type, color) {
        const c = {
            canvas: { closest() { return { dataset: { type } }; } },
            options: { legend: { labels: color === undefined ? {} : { fontColor: color } } },
            data: { datasets: [{ backgroundColor: ['blue', 'red'], data: [15, 10] }] },
            updates: 0,
            update() { this.updates++; for (const plugin of plugins) plugin.beforeUpdate(this); },
        };
        Chart.instances[Object.keys(Chart.instances).length] = c;
        return c;
    }
    const commerce = chart('craft\\commerce\\widgets\\TotalOrdersByCountry', '#666');
    const other = chart('verbb\\formie\\widgets\\RecentSubmissions', '#555');
    const window = { addEventListener(name, cb) { events.set(`window:${name}`, cb); } };
    if (loaded) window.Chart = Chart;
    vm.runInNewContext(source, {
        document: { documentElement: root, addEventListener(name, cb) { events.set(name, cb); }, removeEventListener(name) { events.delete(name); } },
        window,
        getComputedStyle() { return { getPropertyValue() { return ' #c9d1d9 '; } }; },
    });
    return { commerce, other, Chart, window, root, events, plugins, chart };
}

test('Commerce canvas legends follow appearance and preserve native light colors and series', () => {
    const app = setup();
    const data = JSON.stringify(app.commerce.data);
    assert.equal(app.commerce.options.legend.labels.fontColor, '#c9d1d9');
    assert.equal(app.other.options.legend.labels.fontColor, '#555');
    assert.equal(app.other.updates, 0);
    app.root.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(app.commerce.options.legend.labels.fontColor, '#666');
    app.root.dataset.darkMode = 'dark';
    app.events.get('craft-dark-mode:change')();
    assert.equal(app.commerce.options.legend.labels.fontColor, '#c9d1d9');
    assert.equal(JSON.stringify(app.commerce.data), data);
});

test('late chart loading and later widgets inherit the active mode without duplicate hooks', () => {
    const app = setup({ loaded: false });
    app.window.Chart = app.Chart;
    app.events.get('load')({ target: { tagName: 'SCRIPT' } });
    app.events.get('window:load')();
    assert.equal(app.plugins.length, 1);
    const later = app.chart('craft\\commerce\\widgets\\TotalRevenue');
    later.update();
    assert.equal(later.options.legend.labels.fontColor, '#c9d1d9');
    app.root.dataset.darkMode = 'light';
    app.events.get('craft-dark-mode:change')();
    assert.equal(Object.hasOwn(later.options.legend.labels, 'fontColor'), false);
});

test('native light legends are untouched and incompatible chart APIs are ignored', () => {
    const light = setup({ mode: 'light' });
    assert.equal(light.commerce.options.legend.labels.fontColor, '#666');
    assert.equal(setup({ modern: true }).plugins.length, 0);
});
