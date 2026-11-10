<?php

declare(strict_types=1);

namespace Solspace\DarkMode\web;

use Craft;
use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;

final class DarkModeAsset extends AssetBundle
{
    /** Plugin adapters own their assets, release boundaries, and optional CP sections. */
    private const ADAPTERS = [
        'commerce' => [['css' => ['commerce.css'], 'js' => ['commerce.js']]],
        'campaign' => [['css' => ['compatibility/campaign.css']]],
        'calendar' => [['css' => ['compatibility/calendar.css'], 'from' => '5.0', 'before' => '6.0']],
        'ckeditor' => [['css' => ['compatibility/ckeditor.css']]],
        'feed-me' => [['css' => ['compatibility/feed-me.css']]],
        'field-manager' => [['css' => ['compatibility/field-manager.css']]],
        'formie' => [['css' => ['compatibility/formie.css'], 'js' => ['formie.js']]],
        'freeform' => [
            // Widgets also render on Craft's dashboard. Builder/portal selectors
            // belong only on Freeform pages: their relational rules otherwise
            // invalidate styles while unrelated dashboard charts build their DOM.
            ['css' => ['compatibility/freeform-widgets.css'], 'from' => '5.0', 'before' => '5.18'],
            ['css' => ['compatibility/freeform.css'], 'from' => '5.0', 'before' => '5.18', 'sections' => ['freeform']],
            // Freeform 5.18 owns its theme integration, including prereleases.
            [
                'css' => ['compatibility/freeform-legacy.css', 'compatibility/freeform-legacy-creation.css', 'compatibility/freeform-legacy-editors.css'],
                'js' => ['freeform-legacy.js'],
                'from' => '5.0', 'before' => '5.18',
                'sections' => ['freeform'],
            ],
            ['js' => ['freeform-legacy-charts.js'], 'from' => '5.0', 'before' => '5.18'],
        ],
        'hyper' => [['css' => ['compatibility/hyper.css']]],
        'navigation' => [['css' => ['compatibility/navigation.css'], 'js' => ['navigation.js']]],
        'neo' => [['css' => ['compatibility/neo.css']]],
        'seo' => [['css' => ['compatibility/seo.css']]],
        'seomatic' => [['css' => ['compatibility/seomatic.css']]],
        'simplemap' => [
            // Map fields can render in editors and slideouts throughout the CP.
            ['css' => ['compatibility/maps.css']],
            // The standalone settings screen also styles its enclosing #content.
            // Keep its relational selectors off unrelated element indexes.
            ['css' => ['compatibility/maps-settings.css'], 'sections' => ['maps', 'settings']],
        ],
        'tablemaker' => [['css' => ['compatibility/tablemaker.css'], 'js' => ['tablemaker.js']]],
        'sprig' => [['css' => ['compatibility/sprig.css']]],
        'retour' => [['css' => ['compatibility/retour.css']]],
        'vizy' => [['css' => ['compatibility/vizy.css'], 'js' => ['vizy.js']]],
    ];

    public function init(): void
    {
        $this->sourcePath = __DIR__ . '/assets';
        $this->depends = [CpAsset::class];
        $this->css = ['dark-mode.css', 'compatibility.css', 'components.css', 'plugin-store.css', 'picker.css', 'compatibility/code-editors.css'];
        $this->js = ['picker.js', 'code-editors.js'];
        $plugins = Craft::$app->getPlugins();
        $section = Craft::$app->getRequest()->getSegment(1);
        foreach (self::ADAPTERS as $handle => $adapters) {
            if (!$plugins->isPluginEnabled($handle)) {
                continue;
            }
            foreach ($adapters as $adapter) {
                if (isset($adapter['sections']) && !in_array($section, $adapter['sections'], true)) {
                    continue;
                }
                if (isset($adapter['from'], $adapter['before']) && !self::supportsRelease($plugins->getPlugin($handle)->version, $adapter['from'], $adapter['before'])) {
                    continue;
                }
                array_push($this->css, ...($adapter['css'] ?? []));
                array_push($this->js, ...($adapter['js'] ?? []));
            }
        }
        // Verbb shares its footer component across several plugins.
        $this->css[] = 'compatibility/verbb.css';
        parent::init();
    }

    /**
     * Compare release lines, so a "before 5.18" adapter also excludes 5.18 betas.
     * An x-dev branch qualifies only when its entire possible range is supported.
     */
    private static function supportsRelease(string $version, string $from, string $before): bool
    {
        if (preg_match('/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(\.x-dev|[-+].*)?$/', $version, $matches) !== 1) {
            return false;
        }
        $parts = [(int)$matches[1]];
        foreach ([2, 3] as $index) {
            if (!isset($matches[$index]) || $matches[$index] === '') {
                break;
            }
            $parts[] = (int)$matches[$index];
        }
        $release = implode('.', array_pad($parts, 3, 0));
        $from = implode('.', array_pad(explode('.', $from), 3, 0));
        $before = implode('.', array_pad(explode('.', $before), 3, 0));
        if (version_compare($release, $from, '<') || version_compare($release, $before, '>=')) {
            return false;
        }
        if (str_ends_with($version, '.x-dev')) {
            $parts[count($parts) - 1]++;
            $branchEnd = implode('.', array_pad($parts, 3, 0));
            return version_compare($branchEnd, $before, '<=');
        }
        return true;
    }
}
