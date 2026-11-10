import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = readFileSync(new URL('../src/web/assets/comparison.js', import.meta.url), 'utf8');

test('comparison assets and labels require the environment opt-in as well as devMode and login', () => {
    const stub = `
        namespace craft\\base { class Plugin { public function init(): void {} public function trigger($name, $event): void {} } }
        namespace craft\\events { class RegisterComponentTypesEvent { public array $types = []; } }
        namespace craft\\helpers {
            class App { public static $flag; public static function env($name) { return $name === 'DARK_MODE_ENABLE_COMPARISON' ? self::$flag : null; } }
            class Json { public static function htmlEncode($data) { return json_encode($data); } }
            class UrlHelper { public static function cpUrl() { return 'https://craft.test/admin'; } }
        }
        namespace craft\\web { class View { const POS_HEAD = 1; } }
        namespace {
            class Craft {
                public static $app;
                public static function t($category, $label) {
                    if ($category === 'app') return $label;
                    $messages = require dirname($GLOBALS['argv'][1]) . '/translations/de/' . $category . '.php';
                    return $messages[$label] ?? $label;
                }
            }
            $view = new class {
                public array $assets = []; public string $js = '';
                public function hook($name, $callback) { $context = []; $callback($context); }
                public function registerAssetBundle($asset) { $this->assets[] = $asset; }
                public function registerJs($js, $position, $key) { $this->js = $js; }
            };
            Craft::$app = new class($view) {
                public bool $authenticated = true; public bool $devMode = true;
                public function __construct(public $view) {}
                public function onInit($callback) { $callback(); }
                public function getRequest() { return new class {
                    public function getIsConsoleRequest() { return false; }
                    public function getIsCpRequest() { return true; }
                }; }
                public function getView() { return $this->view; }
                public function getUser() { return new class($this->authenticated) {
                    public function __construct(private bool $authenticated) {}
                    public function getIdentity() { return $this->authenticated ? new class {
                        public string $uid = 'test-user';
                        public function getPreference($key, $default) { return $default; }
                    } : null; }
                }; }
                public function getConfig() { return new class($this->devMode) {
                    public function __construct(private bool $devMode) {}
                    public function getGeneral() { return (object)['devMode' => $this->devMode]; }
                }; }
            };
            require $argv[1];
            $results = [];
            foreach ([[null,true,true], ['false',true,true], ['0',true,true], ['invalid',true,true], ['true',true,true], ['1',true,true], ['true',false,true], ['true',true,false]] as [$flag,$dev,$login]) {
                \\craft\\helpers\\App::$flag = $flag;
                Craft::$app->devMode = $dev; Craft::$app->authenticated = $login;
                $view->assets = [];
                (new \\Solspace\\DarkMode\\Plugin())->init();
                preg_match('/window.CraftDarkModeConfig = (.*);/', $view->js, $match);
                $config = json_decode($match[1], true);
                $results[] = [$config['developerTools'], $config['comparisonLabels'] !== null, in_array('Solspace\\\\DarkMode\\\\web\\\\ComparisonAsset', $view->assets, true)];
            }
            echo json_encode(['checks' => $results, 'config' => $config]);
        }
    `;
    const plugin = fileURLToPath(new URL('../src/Plugin.php', import.meta.url));
    const results = JSON.parse(execFileSync('php', ['-r', stub, plugin], { encoding: 'utf8' }));
    const composer = JSON.parse(readFileSync(new URL('../composer.json', import.meta.url), 'utf8'));
    const absent = [false, false, false], present = [true, true, true];
    assert.deepEqual(results.checks, [absent, absent, absent, absent, present, present, absent, absent]);
    assert.equal(results.config.saveAction, `${composer.extra.handle}/preferences/save`);
    assert.equal(results.config.labels.appearance, 'Erscheinungsbild');
    assert.match(results.config.storageKey, /^craft-dark-mode:/);
});

function setup({ developerTools = true, authenticated = true, theme = 'dark' } = {}) {
    const listeners = {}, windowListeners = {}, timers = new Map();
    let serial = 0, snapshots = 0;
    class Element {
        children = []; dataset = {}; style = {}; attributes = []; events = {}; scrollHeight = 0; clientHeight = 0; scrollWidth = 0; clientWidth = 0;
        constructor(tag) { this.tagName = tag.toUpperCase(); }
        setAttribute(name, value) { this.removeAttribute(name); this.attributes.push({ name, value }); }
        getAttribute(name) { return this.attributes.find(a => a.name === name)?.value ?? null; }
        removeAttribute(name) { this.attributes = this.attributes.filter(a => a.name !== name); }
        toggleAttribute(name, on) { this.removeAttribute(name); if (on) this.setAttribute(name, ''); }
        append(...nodes) { for (const n of nodes) { n.parent = this; this.children.push(n); } }
        prepend(n) { n.parent = this; this.children.unshift(n); }
        remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
        addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
        click() { for (const fn of this.events.click ?? []) fn({ stopPropagation() {} }); }
        focus() {}
        closest(selector) { return selector.startsWith('input') ? this.editable : this.dataset.dmComparisonUi !== undefined; }
        querySelectorAll(selector) {
            return this.children.flatMap(n => [...(selector === '*' ? [n] : []), ...n.querySelectorAll(selector)]);
        }
        querySelector(selector) { return selector === 'head' ? head : null; }
        cloneNode() { snapshots++; return new Element(this.tagName); }
        get outerHTML() { return '<html></html>'; }
    }
    const head = new Element('head'), body = new Element('body'), section = new Element('section'), root = new Element('html');
    root.dataset.darkMode = theme;
    const document = {
        documentElement: root, body, readyState: 'complete', baseURI: 'https://craft5.test/admin/',
        querySelector: s => s === '#account-menu' ? section : null,
        createElement: tag => new Element(tag),
        addEventListener(type, fn) { (listeners[type] ??= []).push(fn); },
    };
    const window = {
        CraftDarkModeConfig: { developerTools, authenticated, labels: { light: 'Light' }, comparisonLabels: { compare: 'Compare', hint: 'Hint', refresh: 'Refresh', close: 'Close', size: 'Size' } },
        addEventListener(type, fn) { (windowListeners[type] ??= []).push(fn); },
    };
    const context = { window, document, innerWidth: 1200, innerHeight: 800, scrollX: 0, scrollY: 0,
        setTimeout(fn) { timers.set(++serial, fn); return serial; }, clearTimeout(id) { timers.delete(id); },
        requestAnimationFrame(fn) { return ++serial; }, cancelAnimationFrame() {},
    };
    vm.runInNewContext(script, context);
    const emit = (type, props = {}, target = new Element('div')) => {
        const event = { key: '', altKey: false, shiftKey: false, target, preventDefault() {}, stopPropagation() {}, ...props };
        for (const fn of listeners[type] ?? []) fn(event);
    };
    return {
        root, body, section, listeners, windowListeners, timers,
        emit, get snapshots() { return snapshots; },
        get frames() { return body.children.filter(e => e.tagName === 'IFRAME'); },
        get toggle() { return section.children.find(e => e.tagName === 'BUTTON'); },
        editable() { const n = new Element('input'); n.editable = true; return n; },
    };
}

test('comparison installs no controls or listeners for production or anonymous sessions', () => {
    for (const config of [{ developerTools: false }, { authenticated: false }]) {
        const ui = setup(config);
        assert.equal(ui.section.children.length, 0);
        assert.deepEqual(Object.keys(ui.listeners), []);
        assert.deepEqual(Object.keys(ui.windowListeners), []);
    }
});

test('hold shortcut creates one script-disabled frame and releases without persistence', () => {
    const ui = setup();
    ui.emit('keydown', { key: 'Shift', altKey: true, shiftKey: true });
    assert.equal(ui.frames.length, 1);
    assert.equal(ui.frames[0].getAttribute('sandbox'), 'allow-same-origin');
    assert.equal(ui.frames[0].getAttribute('tabindex'), '-1');
    assert.equal(ui.frames[0].getAttribute('aria-hidden'), 'true');
    assert.equal(ui.snapshots, 1);
    ui.emit('keydown', { key: 'Shift', altKey: true, shiftKey: true, repeat: true });
    assert.equal(ui.snapshots, 1);
    ui.emit('keyup', { key: 'Shift', altKey: true });
    assert.equal(ui.frames.length, 0);
    assert.equal(ui.toggle.getAttribute('aria-pressed'), 'false');
});

test('typing, unrelated shortcuts and light mode never activate the lens', () => {
    const ui = setup();
    ui.emit('keydown', { key: 'Shift', altKey: true, shiftKey: true }, ui.editable());
    ui.emit('keydown', { key: 'Shift', altKey: true, shiftKey: true, composedPath: () => [ui.editable()] });
    ui.emit('keydown', { key: 'Shift', altKey: true, shiftKey: true, ctrlKey: true });
    ui.emit('keydown', { key: 'A', altKey: true, shiftKey: true });
    assert.equal(ui.snapshots, 0);
    const light = setup({ theme: 'light' });
    assert.equal(light.toggle.disabled, true);
    light.emit('keydown', { key: 'Alt', altKey: true, shiftKey: true });
    assert.equal(light.snapshots, 0);
});

test('pinned lens survives shortcut release, then Escape removes all overlay elements', () => {
    const ui = setup(); ui.toggle.click();
    assert.equal(ui.frames.length, 1);
    ui.emit('keydown', { key: 'Alt', altKey: true, shiftKey: true });
    ui.emit('keyup', { key: 'Alt' });
    assert.equal(ui.frames.length, 1);
    ui.emit('keydown', { key: 'Escape' });
    assert.equal(ui.body.children.length, 0);
    assert.equal(ui.toggle.getAttribute('aria-pressed'), 'false');
});

test('window blur and appearance changes clean up snapshots and pending refreshes', () => {
    const ui = setup(); ui.toggle.click(); ui.emit('input');
    assert.equal(ui.timers.size, 1);
    ui.windowListeners.blur[0]();
    assert.equal(ui.frames.length, 0); assert.equal(ui.timers.size, 0);
    ui.toggle.click(); ui.root.dataset.darkMode = 'light'; ui.emit('craft-dark-mode:change');
    assert.equal(ui.frames.length, 0); assert.equal(ui.toggle.disabled, true);
});
