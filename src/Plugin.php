<?php

declare(strict_types=1);

namespace Solspace\DarkMode;

use Craft;
use craft\base\Plugin as BasePlugin;
use craft\events\RegisterComponentTypesEvent;
use craft\helpers\App;
use craft\helpers\Json;
use craft\helpers\UrlHelper;
use craft\web\View;
use Solspace\DarkMode\web\DarkModeAsset;
use Solspace\DarkMode\web\ComparisonAsset;

final class Plugin extends BasePlugin
{
    public const PREFERENCE = 'darkModeAppearance';
    public const MODES = ['auto', 'light', 'dark'];
    /** Register optional AssetBundle classes after darkMode's core assets. */
    public const EVENT_REGISTER_COMPATIBILITY_ASSETS = 'registerCompatibilityAssets';
    public bool $hasCpSettings = false;
    public bool $hasCpSection = false;

    public function init(): void
    {
        parent::init();

        // Craft's base-layout hook runs for CP pages, including login, before head().
        // No vendor templates are replaced, and API/AJAX responses are untouched.
        // Defer Request and View access until Craft initializes core components.
        Craft::$app->onInit(function(): void {
            $request = Craft::$app->getRequest();
            if ($request->getIsConsoleRequest() || !$request->getIsCpRequest()) {
                return;
            }
            Craft::$app->getView()->hook('cp.layouts.base', function(array &$context): string {
                $view = Craft::$app->getView();
                $user = Craft::$app->getUser()->getIdentity();
                $mode = $user?->getPreference(self::PREFERENCE, 'auto') ?? 'auto';
                if (!in_array($mode, self::MODES, true)) {
                    $mode = 'auto';
                }

                $developerTools = $user !== null
                    && Craft::$app->getConfig()->getGeneral()->devMode
                    && filter_var(App::env('DARK_MODE_ENABLE_COMPARISON'), FILTER_VALIDATE_BOOLEAN);
                $config = Json::htmlEncode([
                    'developerTools' => $developerTools,
                    'comparisonLabels' => $developerTools ? [
                        'compare' => Craft::t('darkmode', 'Compare appearance'),
                        'hint' => Craft::t('darkmode', 'Hold Alt + Shift to compare. Escape to close.'),
                        'refresh' => Craft::t('app', 'Refresh'),
                        'close' => Craft::t('app', 'Close'),
                        'size' => Craft::t('app', 'Size'),
                    ] : null,
                    'mode' => $mode,
                    // Storage is scoped to this installation AND user (never just hostname).
                    'storageKey' => 'craft-dark-mode:' . sha1(UrlHelper::cpUrl()) . ':' . ($user?->uid ?? 'guest'),
                    'authenticated' => $user !== null,
                    'saveAction' => 'darkmode/preferences/save',
                    'labels' => array_combine(
                        ['appearance', 'auto', 'light', 'dark', 'saved', 'saving', 'failed', 'retry'],
                        array_map(fn(string $label): string => Craft::t('darkmode', $label), [
                            'Appearance', 'Auto', 'Light', 'Dark',
                            'Appearance saved.', 'Saving appearance…',
                            'Could not save. Your appearance is applied in this tab.', 'Retry',
                        ]),
                    ),
                ]);

                $view->registerAssetBundle(DarkModeAsset::class);
                if ($developerTools) {
                    $view->registerAssetBundle(ComparisonAsset::class);
                }
                $event = new RegisterComponentTypesEvent();
                $this->trigger(self::EVENT_REGISTER_COMPATIBILITY_ASSETS, $event);
                foreach ($event->types as $assetClass) {
                    $view->registerAssetBundle($assetClass);
                }
                // Runs in the head before the first body paint. The authenticated server
                // preference wins over browser caches, so account changes are respected.
                $view->registerJs("window.CraftDarkModeConfig = $config;\n" . file_get_contents(__DIR__ . '/web/assets/bootstrap.js'), View::POS_HEAD, 'dark-mode-bootstrap');
                return '';
            });
        });
    }
}
