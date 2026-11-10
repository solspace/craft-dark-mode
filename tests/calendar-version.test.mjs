import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('Calendar 5 adapters never load for Calendar 6, including prereleases', () => {
    const stub = `
        namespace craft\\web { class AssetBundle { public $sourcePath, $depends, $css, $js; public function init(): void {} } }
        namespace craft\\web\\assets\\cp { class CpAsset {} }
        namespace {
            class Craft { public static $app; }
            $plugins = new class {
                public $version;
                public function isPluginEnabled($handle) { return $handle === 'calendar'; }
                public function getPlugin($handle) { return (object)['version' => $this->version]; }
            };
            Craft::$app = new class($plugins) {
                public function __construct(private $plugins) {}
                public function getPlugins() { return $this->plugins; }
                public function getRequest() { return new class { public function getSegment($num) { return 'dashboard'; } }; }
            };
            require $argv[1];
            $results = [];
            foreach (['5.0.33', '5.x-dev', '6.0.0-alpha.1', '6.0.0', '4.0.17'] as $version) {
                $plugins->version = $version;
                $asset = new \\Solspace\\DarkMode\\web\\DarkModeAsset();
                $asset->init();
                $results[$version] = in_array('compatibility/calendar.css', $asset->css, true);
            }
            echo json_encode($results);
        }
    `;
    const path = fileURLToPath(new URL('../src/web/DarkModeAsset.php', import.meta.url));
    const result = JSON.parse(execFileSync('php', ['-r', stub, path], { encoding: 'utf8' }));
    assert.deepEqual(result, { '5.0.33': true, '5.x-dev': true, '6.0.0-alpha.1': false, '6.0.0': false, '4.0.17': false });
});
