import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function assets(handle, versions, enabled = true, section = 'freeform') {
    const stub = `
        namespace craft\\web { class AssetBundle { public $sourcePath, $depends, $css, $js; public function init(): void {} } }
        namespace craft\\web\\assets\\cp { class CpAsset {} }
        namespace {
            class Craft { public static $app; }
            $plugins = new class($argv[2], $argv[4] === '1') {
                public $version;
                public function __construct(private $handle, private $enabled) {}
                public function isPluginEnabled($handle) { return $this->enabled && $handle === $this->handle; }
                public function getPlugin($handle) { return (object)['version' => $this->version]; }
            };
            Craft::$app = new class($plugins) {
                public function __construct(private $plugins) {}
                public function getPlugins() { return $this->plugins; }
                public function getRequest() { return new class { public function getSegment($num) { return $GLOBALS['argv'][5]; } }; }
            };
            require $argv[1];
            $results = [];
            foreach (json_decode($argv[3], true) as $version) {
                $plugins->version = $version;
                $asset = new \\Solspace\\DarkMode\\web\\DarkModeAsset();
                $asset->init();
                $results[$version] = ['css' => $asset->css, 'js' => $asset->js];
            }
            echo json_encode($results);
        }
    `;
    const path = fileURLToPath(new URL('../src/web/DarkModeAsset.php', import.meta.url));
    return JSON.parse(execFileSync('php', ['-r', stub, path, handle, JSON.stringify(versions), enabled ? '1' : '0', section], { encoding: 'utf8' }));
}

test('legacy Freeform adapter spans older 5.x releases and stops before the entire 5.18 release line', () => {
    const included = ['5.0.0', '5.15.17', '5.16.7', '5.17.8', '5.17.9', 'v5.17.9', '5.17.9-beta.1', '5.17.9+build.2', '5.17.x-dev'];
    const excluded = ['4.1.0', '5.18.0-dev', '5.18.0-alpha.1', '5.18.0-beta.1', '5.18.0-RC1', '5.18.0', '5.19.0', '6.0.0-alpha.1', '6.0.0', '5.x-dev', 'dev-main', 'unknown'];
    const result = assets('freeform', [...included, ...excluded]);
    for (const version of included) {
        for (const file of ['freeform.css', 'freeform-widgets.css', 'freeform-legacy.css', 'freeform-legacy-creation.css', 'freeform-legacy-editors.css']) {
            assert.ok(result[version].css.includes(`compatibility/${file}`), `${version}: ${file}`);
        }
        assert.ok(result[version].js.includes('freeform-legacy.js'), version);
        assert.ok(result[version].js.includes('freeform-legacy-charts.js'), version);
    }
    for (const version of excluded) {
        assert.ok(!result[version].css.some(asset => asset.includes('freeform')), version);
        assert.ok(!result[version].js.includes('freeform-legacy.js'), version);
        assert.ok(!result[version].js.includes('freeform-legacy-charts.js'), version);
    }
    const disabled = assets('freeform', ['5.17.9'], false)['5.17.9'];
    assert.ok(!disabled.css.includes('compatibility/freeform-legacy.css'));
    assert.ok(!disabled.css.includes('compatibility/freeform.css'));
});

test('the shared registry keeps enabled plugin CSS and JavaScript together and omits both when disabled', () => {
    for (const [handle, css, js] of [
        ['commerce', 'commerce.css', 'commerce.js'],
        ['formie', 'compatibility/formie.css', 'formie.js'],
        ['navigation', 'compatibility/navigation.css', 'navigation.js'],
        ['tablemaker', 'compatibility/tablemaker.css', 'tablemaker.js'],
        ['vizy', 'compatibility/vizy.css', 'vizy.js'],
    ]) {
        const enabled = assets(handle, ['1.0.0'])['1.0.0'];
        assert.equal(enabled.css.filter(asset => asset === css).length, 1, handle);
        assert.equal(enabled.js.filter(asset => asset === js).length, 1, handle);
        assert.deepEqual(enabled.js.slice(0, 2), ['picker.js', 'code-editors.js']);
        const disabled = assets(handle, ['1.0.0'], false)['1.0.0'];
        assert.ok(!disabled.css.includes(css), handle);
        assert.ok(!disabled.js.includes(js), handle);
    }
});

// These are distinct execution contexts, not just selector spelling checks:
// Freeform's widget remains themed across the CP; its editor does not load there.
test('Maps fields remain available globally while settings selectors stay off element indexes', () => {
    for (const section of ['content', 'entries', 'assets', 'dashboard', 'commerce', 'maps', 'settings']) {
        const result = assets('simplemap', ['5.0.0'], true, section)['5.0.0'];
        assert.ok(result.css.includes('compatibility/maps.css'), section);
        assert.equal(result.css.includes('compatibility/maps-settings.css'), ['maps', 'settings'].includes(section), section);
    }
    const disabled = assets('simplemap', ['5.0.0'], false, 'maps')['5.0.0'];
    assert.ok(!disabled.css.some(file => file.startsWith('compatibility/maps')));
});

test('Freeform page adapters stay off other CP sections while widgets retain their version boundaries', () => {
    for (const section of ['dashboard', 'content', 'commerce', 'formie', 'settings', '']) {
        const result = assets('freeform', ['5.17.9', '5.18.0-dev', '6.0.0'], true, section);
        for (const version of ['5.17.9']) {
            assert.ok(result[version].css.includes('compatibility/freeform-widgets.css'), section);
            assert.ok(!result[version].css.includes('compatibility/freeform.css'), section);
            assert.ok(!result[version].css.some(file => file.includes('freeform-legacy')), section);
            assert.ok(!result[version].js.includes('freeform-legacy.js'), section);
        }
        assert.ok(result['5.17.9'].js.includes('freeform-legacy-charts.js'), section);
        assert.ok(!result['5.18.0-dev'].js.includes('freeform-legacy-charts.js'), section);
        assert.ok(!result['5.18.0-dev'].css.some(file => file.includes('freeform')), section);
        assert.ok(!result['6.0.0'].css.includes('compatibility/freeform-widgets.css'), section);
    }
    const disabled = assets('freeform', ['5.17.9'], false, 'dashboard')['5.17.9'];
    assert.ok(!disabled.css.includes('compatibility/freeform-widgets.css'));
    assert.ok(!disabled.js.includes('freeform-legacy-charts.js'));
});
