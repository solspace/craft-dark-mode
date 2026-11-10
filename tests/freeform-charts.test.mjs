import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/web/assets/freeform-legacy-charts.js', import.meta.url), 'utf8');
function events(target = {}) {
    const listeners = new Map();
    target.addEventListener = (name, callback) => {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(callback);
    };
    target.emit = (name, event) => listeners.get(name)?.forEach(callback => callback(event));
    return target;
}
function setup(late = false, mode = 'dark') {
    const document = events({ documentElement: { dataset: { darkMode: mode } } });
    const charts = [];
    const factory = (root, config) => {
        if (!root) return;
        const chart = {
            canvas: { isConnected: true }, config, data: config.data, updates: 0,
            constructor: { defaults: { color: '#666', borderColor: 'rgba(0,0,0,.1)', scale: { ticks: { backdropColor: 'rgba(255,255,255,.75)' } }, elements: { arc: { borderColor: '#fff' } } } },
            update() { this.updates++; config.plugins?.forEach(plugin => plugin.beforeUpdate?.(chart)); },
            destroy() { config.plugins?.forEach(plugin => plugin.afterDestroy?.(chart)); },
        };
        config.plugins?.forEach(plugin => plugin.beforeInit?.(chart));
        chart.update();
        charts.push(chart);
        return chart;
    };
    const window = events({ FreeformDashboardChart: late ? undefined : factory });
    vm.runInNewContext(source, { window, document, getComputedStyle: () => ({ getPropertyValue: key => ({ '--dm-muted': '#8b949e', '--dm-surface': '#171c24', '--dm-border-muted': '#30363d' })[key] }) });
    return { window, document, charts, factory, root: { matches: selector => selector === '.freeform-dashboard-chart' } };
}
function config(type = 'line') {
    return { type, options: { scales: { y: { ticks: { color: 'gray' }, grid: { color: 'silver' } } } }, data: { labels: ['A'], datasets: [{ data: [5], backgroundColor: ['red'], borderColor: 'blue' }] } };
}
test('legacy Freeform chart axes and radial outlines follow appearance and restore native options', () => {
    const app = setup();
    const input = config('polarArea');
    const native = JSON.stringify(input);
    const chart = app.window.FreeformDashboardChart(app.root, input);
    assert.equal(chart.config.options.scales.y.ticks.color(), '#8b949e');
    assert.equal(chart.data.datasets[0].borderColor(), '#171c24');
    assert.deepEqual(chart.data.datasets[0].backgroundColor, ['red']);
    app.document.documentElement.dataset.darkMode = 'light';
    app.document.emit('craft-dark-mode:change');
    assert.equal(chart.config.options.scales.y.ticks.color(), 'gray');
    assert.equal(chart.config.options.scales.y.border.color(), 'rgba(0,0,0,.1)');
    assert.equal(chart.data.datasets[0].borderColor(), 'blue');
    app.document.documentElement.dataset.darkMode = 'dark';
    app.document.emit('craft-dark-mode:change');
    assert.equal(chart.config.options.scales.y.ticks.color(), '#8b949e');
    chart.destroy();
    assert.equal(JSON.stringify({ ...input, plugins: undefined }), native);
    const updates = chart.updates;
    app.document.emit('craft-dark-mode:change');
    assert.equal(chart.updates, updates);
});
test('late Freeform factories are wrapped once, preserve plugins and leave unrelated charts alone', () => {
    const app = setup(true, 'light');
    app.window.FreeformDashboardChart = app.factory;
    app.document.emit('load', { target: { tagName: 'SCRIPT' } });
    const wrapped = app.window.FreeformDashboardChart;
    app.window.emit('load');
    assert.equal(app.window.FreeformDashboardChart, wrapped);
    const input = config();
    const existing = { id: 'existing' };
    input.plugins = [existing];
    const chart = wrapped(app.root, input);
    wrapped(app.root, input);
    assert.equal(input.plugins.length, 2);
    assert.equal(input.plugins[0], existing);
    assert.equal(chart.config.options.scales.y.ticks.color(), 'gray');
    chart.canvas.isConnected = false;
    app.document.emit('craft-dark-mode:change');
    assert.equal(chart.updates, 1);
    const other = config();
    wrapped({ matches: () => false }, other);
    assert.equal(other.plugins, undefined);
});
