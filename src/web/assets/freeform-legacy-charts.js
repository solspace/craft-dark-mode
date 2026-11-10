(() => {
    'use strict';
    let factory;
    const charts = new Set();
    const originals = new WeakMap();

    function at(chart, path) {
        return path.reduce((value, key) => value?.[key], chart);
    }

    function restore(chart) {
        for (const [path, key, value, owned] of (originals.get(chart) || []).reverse()) {
            const object = at(chart, path);
            if (!object) continue;
            if (owned) object[key] = value;
            else delete object[key];
        }
        originals.delete(chart);
    }

    function install(chart) {
        const saved = [];
        const set = (path, key, value) => {
            const object = at(chart, path);
            saved.push([path, key, object[key], Object.hasOwn(object, key)]);
            object[key] = value;
        };
        const group = (path, key) => {
            if (!at(chart, path)[key]) set(path, key, {});
            return [...path, key];
        };
        const paint = (path, key, role, fallback) => {
            const original = at(chart, path)[key];
            set(path, key, (context, options) => {
                if (document.documentElement.dataset.darkMode === 'dark') {
                    return getComputedStyle(document.documentElement).getPropertyValue(role).trim();
                }
                if (typeof original === 'function') return original(context, options);
                return original ?? fallback();
            });
        };
        for (const name of Object.keys(chart.config.options.scales || {})) {
            const scale = ['config', 'options', 'scales', name];
            const defaults = chart.constructor.defaults;
            paint(group(scale, 'ticks'), 'color', '--dm-muted', () => defaults.color);
            paint(group(scale, 'ticks'), 'backdropColor', '--dm-surface', () => defaults.scale.ticks.backdropColor);
            paint(group(scale, 'grid'), 'color', '--dm-border-muted', () => defaults.borderColor);
            paint(group(scale, 'border'), 'color', '--dm-border-muted', () => defaults.borderColor);
            paint(group(scale, 'angleLines'), 'color', '--dm-border-muted', () => defaults.borderColor);
            paint(group(scale, 'pointLabels'), 'color', '--dm-muted', () => defaults.color);
        }
        if (['pie', 'doughnut', 'polarArea'].includes(chart.config.type)) {
            chart.data.datasets.forEach((dataset, index) => {
                paint(['data', 'datasets', index], 'borderColor', '--dm-surface', () => chart.constructor.defaults.elements.arc.borderColor);
            });
        }
        originals.set(chart, saved);
        charts.add(chart);
    }

    const plugin = {
        id: 'craft-dark-mode-freeform',
        beforeInit: install,
        afterDestroy(chart) { restore(chart); charts.delete(chart); },
    };

    function attach() {
        const next = window.FreeformDashboardChart;
        if (typeof next !== 'function' || next === factory) return;
        // Freeform keeps Chart.js private. Supply its public factory with a
        // per-chart plugin instead of accessing private chart instances.
        factory = function (root, config) {
            if (root?.matches('.freeform-dashboard-chart') && config && !config.plugins?.some(item => item.id === plugin.id)) {
                config.plugins = [...(config.plugins || []), plugin];
            }
            return next.apply(this, arguments);
        };
        window.FreeformDashboardChart = factory;
    }

    document.addEventListener('craft-dark-mode:change', () => {
        for (const chart of charts) {
            if (chart.canvas?.isConnected) chart.update('none');
            else { restore(chart); charts.delete(chart); }
        }
    });
    document.addEventListener('load', event => {
        if (event.target?.tagName === 'SCRIPT') attach();
    }, true);
    document.addEventListener('DOMContentLoaded', attach, { once: true });
    window.addEventListener('load', attach, { once: true });
    attach();
})();
