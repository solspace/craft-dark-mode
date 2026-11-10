import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const scripts = ['bootstrap', 'picker'].map(name => readFileSync(new URL(`../src/web/assets/${name}.js`, import.meta.url), 'utf8'));
const flush = () => new Promise(resolve => setImmediate(resolve));

function picker({ header = true } = {}) {
    class Element {
        children = []; dataset = {}; attributes = {}; listeners = {}; hidden = false;
        constructor(tag) { this.tagName = tag; }
        setAttribute(name, value) { this.attributes[name] = value; }
        append(...children) { children.forEach(child => { child.parentElement = this; }); this.children.push(...children); }
        insertBefore(child, before) { child.parentElement = this; this.children.splice(before ? this.children.indexOf(before) : this.children.length, 0, child); }
        addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
        click() { for (const fn of this.listeners.click ?? []) fn({ stopPropagation() {} }); }
        querySelectorAll(selector) {
            const matches = e => selector === '[data-appearance]' ? !!e.dataset.appearance : selector === 'button' ? e.tagName === 'button' : selector === 'hr' ? e.tagName === 'hr' : selector.startsWith('.') && (e.className || '').split(' ').includes(selector.slice(1));
            return this.children.flatMap(child => [...(matches(child) ? [child] : []), ...child.querySelectorAll(selector)]);
        }
        querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
    }
    const menu = new Element('div'); menu.append(new Element('hr'));
    const body = new Element('body'), wrapper = new Element('div'), account = new Element('button');
    wrapper.append(account);
    const requests = [], writes = [], listeners = {};
    const root = { dataset: {}, style: {} };
    const context = {
        window: {
            CraftDarkModeConfig: { mode: 'auto', authenticated: true, storageKey: 'installation:user', saveAction: 'darkmode/preferences/save', labels: {appearance: 'Appearance',auto: 'Auto',light: 'Light',dark: 'Dark',saving: 'Saving',saved: 'Saved',failed: 'Failed',retry: 'Retry'} },
            matchMedia: () => ({matches: false, addEventListener() {}}), addEventListener() {},
        },
        document: {
            readyState: 'complete', documentElement: root, body,
            querySelector: selector => selector === '#account-menu' ? menu : selector === '#user-info' && header ? account : null,
            createElement: tag => new Element(tag),
            addEventListener(name, fn) { (listeners[name] ??= []).push(fn); },
            dispatchEvent(event) { for (const fn of listeners[event.type] ?? []) fn(event); },
        },
        localStorage: { getItem: () => null, setItem: (key, value) => writes.push([key, value]) },
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        Craft: { sendActionRequest(method, action, options) {
            return new Promise((resolve, reject) => requests.push({method, action, mode: options.data.mode, resolve, reject}));
        } },
    };
    const sandbox = vm.createContext(context);
    scripts.forEach(script => vm.runInContext(script, sandbox));
    return {
        root, requests, writes,
        choose(mode) { for (let i = 0; i < 3 && root.dataset.darkModePreference !== mode; i++) wrapper.querySelector('.dm-appearance-trigger').click(); },
        get status() { return wrapper.querySelector('.dm-appearance__status').textContent; },
        get retry() { return wrapper.querySelector('.dm-appearance__retry'); },
        menu, wrapper, account,
        get trigger() { return wrapper.querySelector('.dm-appearance-trigger'); },
    };
}

test('header-only icon cycles Auto, Light, Dark, then Auto with an accessible current-mode label', async () => {
    const ui = picker();
    assert.equal(ui.wrapper.children[0].querySelector('.dm-appearance-trigger'), ui.trigger);
    assert.equal(ui.wrapper.children[1], ui.account);
    assert.equal(ui.trigger.attributes['aria-controls'], undefined);
    assert.equal(ui.trigger.attributes['aria-pressed'], undefined);
    assert.equal(ui.trigger.attributes['aria-label'], 'Appearance: Auto');
    assert.match(ui.trigger.innerHTML, /aria-hidden="true"/);
    assert.equal(ui.menu.querySelector('.dm-appearance'), null);
    ui.trigger.click();
    assert.equal(ui.root.dataset.darkModePreference, 'light');
    assert.equal(ui.trigger.attributes['aria-label'], 'Appearance: Light');
    await flush();
    ui.requests[0].resolve({ data: { success: true } });
    await flush();
    assert.equal(ui.status, 'Saved');
    ui.trigger.click();
    assert.equal(ui.root.dataset.darkModePreference, 'dark');
    assert.equal(ui.trigger.title, 'Appearance: Dark');
    assert.match(ui.trigger.innerHTML, /M20.9/);
    ui.trigger.click();
    assert.equal(ui.root.dataset.darkModePreference, 'auto');
    assert.equal(ui.trigger.title, 'Appearance: Auto');
    await flush();
    ui.requests[1].resolve({data: {success: true}});
    await flush();
});

test('an alternate layout without the account header installs no picker', () => {
    const ui = picker({header: false});
    assert.equal(ui.trigger, null);
    assert.equal(ui.menu.querySelector('.dm-appearance'), null);
});

test('rapid appearance selections apply immediately and save only the latest pending choice', async () => {
    const ui = picker();
    ui.choose('dark'); ui.choose('light');
    assert.equal(ui.root.dataset.darkMode, 'light');
    assert.equal(ui.trigger.attributes['aria-label'], 'Appearance: Light');
    await flush();
    assert.deepEqual(ui.requests.map(r => r.mode), ['light']);
    assert.equal(ui.requests[0].method, 'POST');
    assert.equal(ui.requests[0].action, 'darkmode/preferences/save');
    ui.requests[0].resolve({data: {success: true}}); await flush();
    assert.equal(ui.status, 'Saved');
    assert.deepEqual(ui.writes, [['installation:user', 'light']]);
});

test('a delayed response cannot replace a later choice, and writes remain serialized', async () => {
    const ui = picker(); ui.choose('dark'); await flush();
    ui.choose('light'); ui.choose('auto'); await flush();
    assert.equal(ui.requests.length, 1);
    assert.equal(ui.root.dataset.darkModePreference, 'auto');
    ui.requests[0].resolve({data: {success: true}}); await flush();
    assert.deepEqual(ui.requests.map(r => r.mode), ['dark', 'auto']);
    assert.deepEqual(ui.writes, []);
    ui.requests[1].resolve({data: {success: true}}); await flush();
    assert.equal(ui.root.dataset.darkModePreference, 'auto');
    assert.deepEqual(ui.writes, [['installation:user', 'auto']]);
});

test('failed saves retain the chosen theme, expose retry, and recover without losing the preference', async () => {
    const ui = picker(); ui.choose('dark'); await flush();
    ui.requests[0].reject(new Error('Offline')); await flush();
    assert.equal(ui.root.dataset.darkMode, 'dark');
    assert.equal(ui.status, 'Failed'); assert.equal(ui.retry.hidden, false);
    assert.deepEqual(ui.writes, []);
    ui.retry.click(); await flush();
    assert.equal(ui.requests[1].mode, 'dark');
    ui.requests[1].resolve({data: {success: true}}); await flush();
    assert.equal(ui.status, 'Saved'); assert.equal(ui.retry.hidden, true);
    assert.deepEqual(ui.writes, [['installation:user', 'dark']]);
});
