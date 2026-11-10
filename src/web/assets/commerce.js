(() => {
    'use strict';
    let attached;
    const nativeLabels = new WeakMap();
    const isCommerceWidget = chart => chart.canvas?.closest('.widget')?.dataset.type?.startsWith('craft\\commerce\\widgets\\');

    function theme(chart) {
        if (!isCommerceWidget(chart)) return;
        const labels = chart.options.legend?.labels;
        if (!labels) return;
        if (document.documentElement.dataset.darkMode === 'dark') {
            if (!nativeLabels.has(chart)) nativeLabels.set(chart, labels.fontColor);
            labels.fontColor = getComputedStyle(document.documentElement).getPropertyValue('--dm-text').trim();
        } else if (nativeLabels.has(chart)) {
            const original = nativeLabels.get(chart);
            if (original === undefined) delete labels.fontColor;
            else labels.fontColor = original;
            nativeLabels.delete(chart);
        }
    }

    function sync() {
        if (!attached) return;
        for (const chart of Object.values(attached.instances)) {
            if (isCommerceWidget(chart)) chart.update(0);
        }
    }

    function attach() {
        // Chart.js 2 exposes these legacy APIs, but has no public version property.
        const Chart = window.Chart;
        if (!Chart?.defaults?.global || !Chart.plugins?.register || !Chart.instances || attached === Chart) return;
        attached = Chart;
        Chart.plugins.register({ beforeUpdate: theme });
        document.removeEventListener('load', onScriptLoad, true);
        sync();
    }

    function onScriptLoad(event) {
        if (event.target?.tagName === 'SCRIPT') attach();
    }

    document.addEventListener('craft-dark-mode:change', sync);
    document.addEventListener('load', onScriptLoad, true);
    window.addEventListener('load', attach, { once: true });
    attach();
})();
