import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Craft 5.x translation directory, checked against upstream on 2026-11-07.
// en-US is also explicit because it is Craft's default control-panel locale.
const locales = 'ar cs cy da de de-CH el en en-GB en-US es fa fr fr-CA he hu id is it ja ko ky nb nl nn pl pt ru sk sv th tr uk zh'.split(' ').sort();
const root = fileURLToPath(new URL('../src/translations/', import.meta.url));
const catalogs = JSON.parse(execFileSync('php', ['-r', `
    $result = [];
    foreach (glob($argv[1] . '/*/darkmode.php') as $file) {
        $result[basename(dirname($file))] = require $file;
    }
    echo json_encode($result, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
`, root], { encoding: 'utf8' }));
const sourceKeys = Object.keys(catalogs.en).sort();

test('all Craft 5 catalogs and the default en-US locale are present', () => {
    assert.deepEqual(readdirSync(root).sort(), locales);
    assert.deepEqual(Object.keys(catalogs).sort(), locales);
});

test('every catalog has every UI and validation message, with no empty or placeholder values', () => {
    assert.equal(sourceKeys.length, 12);
    for (const [locale, messages] of Object.entries(catalogs)) {
        assert.deepEqual(Object.keys(messages).sort(), sourceKeys, locale);
        for (const [key, value] of Object.entries(messages)) {
            assert.equal(typeof value, 'string', `${locale}: ${key}`);
            assert.ok(value.trim().length, `${locale}: ${key}`);
            assert.doesNotMatch(value, /\b(?:TODO|FIXME|TRANSLATE)\b|\uFFFD/, `${locale}: ${key}`);
        }
        if (!locale.startsWith('en')) assert.notDeepEqual(messages, catalogs.en, locale);
    }
});

test('controller errors use the same translatable category as the picker', () => {
    const controller = readFileSync(new URL('../src/controllers/PreferencesController.php', import.meta.url), 'utf8');
    for (const key of ['Control panel access required.', 'Appearance must be auto, light, or dark.']) {
        assert.ok(controller.includes(`Craft::t('darkmode', '${key}')`));
    }
});
