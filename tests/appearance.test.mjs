import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const bootstrap = readFileSync(new URL('../src/web/assets/bootstrap.js', import.meta.url), 'utf8');

function environment({ mode = 'auto', dark = false, authenticated = true, cached = null, blocked = false } = {}) {
    const root = { dataset: {}, style: {} };
    const systemListeners = [];
    const windowListeners = new Map();
    const events = [];
    const writes = [];
    const media = { matches: dark, addEventListener: (_, fn) => systemListeners.push(fn) };
    const context = {
        window: {
            CraftDarkModeConfig: { mode, authenticated, storageKey: 'site:user-a' },
            matchMedia: () => media,
            addEventListener: (name, fn) => windowListeners.set(name, fn),
        },
        document: { documentElement: root, dispatchEvent: event => events.push(event.detail) },
        localStorage: {
            getItem: () => { if (blocked) throw new Error('Storage disabled'); return cached; },
            setItem: (key, value) => { if (blocked) throw new Error('Storage disabled'); writes.push([key, value]); },
        },
        CustomEvent: class { constructor(name, options) { this.type = name; this.detail = options.detail; } },
    };
    vm.runInNewContext(bootstrap, context);
    return {
        root, events, writes, appearance: context.window.CraftDarkMode,
        system(value) { media.matches = value; systemListeners.forEach(fn => fn()); },
        storage(key, newValue) { windowListeners.get('storage')({ key, newValue }); },
    };
}

test('Auto follows system appearance live and sets native control color scheme', () => {
    const e = environment();
    assert.equal(e.root.dataset.darkMode, 'light');
    e.system(true);
    assert.equal(e.root.dataset.darkMode, 'dark');
    assert.equal(e.root.style.colorScheme, 'dark');
    assert.equal(e.appearance.mode, 'auto');
});

test('explicit modes override system changes; returning to Auto uses the current system', () => {
    const e = environment({ mode: 'light', dark: true });
    e.system(false); e.system(true);
    assert.equal(e.appearance.theme, 'light');
    e.appearance.apply('auto');
    assert.equal(e.appearance.theme, 'dark');
    e.appearance.apply('dark'); e.system(false);
    assert.equal(e.appearance.theme, 'dark');
});

test('authenticated server preference wins over stale browser storage', () => {
    const e = environment({ mode: 'light', cached: 'dark' });
    assert.equal(e.appearance.mode, 'light');
});

test('storage synchronization is scoped to the active account and installation', () => {
    const e = environment();
    e.storage('site:user-b', 'dark');
    assert.equal(e.appearance.mode, 'auto');
    e.storage('site:user-a', 'dark');
    assert.equal(e.appearance.mode, 'dark');
    assert.equal(e.events.at(-1).source, 'storage');
});

test('blocked storage does not prevent theme selection or system updates', () => {
    const e = environment({ authenticated: false, blocked: true });
    e.appearance.apply('dark');
    assert.doesNotThrow(() => e.appearance.cache('dark'));
    assert.equal(e.appearance.theme, 'dark');
});

test('anonymous login storage is honored, but malformed values are rejected', () => {
    assert.equal(environment({ authenticated: false, cached: 'dark' }).appearance.mode, 'dark');
    const e = environment({ mode: 'invalid', authenticated: false, cached: 'invalid' });
    assert.equal(e.appearance.mode, 'auto');
    e.appearance.apply('invalid'); e.storage('site:user-a', 'invalid');
    assert.equal(e.appearance.mode, 'auto');
});

function luminance(hex) {
    const short = hex.replace('#', '');
    const s = short.length === 3 ? [...short].map(c => c + c).join('') : short;
    const rgb = [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255)
        .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

test('key text roles meet WCAG AA normal-text contrast on their actual surfaces', () => {
    const css = readFileSync(new URL('../src/web/assets/dark-mode.css', import.meta.url), 'utf8');
    // Craft's red ramp is retained; dark primary fills blend in 12% surface.
    const vars = new Map([
        ['--red-600', '#dc2626'], ['--red-700', '#b91c1c'], ['--red-800', '#991b1b'],
        ['--primary-button-text-color', '#ffffff'], ['--primary-button-bg', '#dc2626'],
        ['--primary-button-bg--hover', '#b91c1c'], ['--primary-button-bg--active', '#991b1b'],
        ...[...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]),
    ]);
    function resolve(value) {
        const name = value.match(/^var\((--[\w-]+)\)$/)?.[1];
        if (name) return resolve(vars.get(name));
        const mix = value.match(/^color-mix\(in srgb, var\((--[\w-]+)\) (\d+)%, var\((--[\w-]+)\)\)$/);
        if (!mix) return value;
        const [a,b] = [resolve(vars.get(mix[1])),resolve(vars.get(mix[3]))];
        const weight = Number(mix[2]) / 100;
        return '#' + [1,3,5].map(i => Math.round(parseInt(a.slice(i,i+2),16) * weight + parseInt(b.slice(i,i+2),16) * (1-weight)).toString(16).padStart(2,'0')).join('');
    }
    for (const [fg, bg] of [
        ['--dm-text', '--dm-canvas'], ['--dm-text', '--dm-surface'],
        ['--dm-muted', '--dm-surface'], ['--dm-muted', '--dm-raised'],
        ['--dm-link', '--dm-surface'], ['--dm-heading', '--dm-canvas'],
        ['--primary-button-text-color', '--primary-button-bg'],
        ['--primary-button-text-color', '--primary-button-bg--hover'],
        ['--primary-button-text-color', '--primary-button-bg--active'],
    ]) {
        const l = [luminance(resolve(vars.get(fg))), luminance(resolve(vars.get(bg)))].sort((a,b) => b-a);
        assert.ok((l[0] + .05) / (l[1] + .05) >= 4.5, `${fg} on ${bg}`);
    }
});

test('Composer requires Craft 5.9 or later within Craft 5', () => {
    const composer = JSON.parse(readFileSync(new URL('../composer.json', import.meta.url), 'utf8'));
    assert.equal(composer.require['craftcms/cms'], '^5.9');
});
