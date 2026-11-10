<?php

declare(strict_types=1);

namespace Solspace\DarkMode\web;

use craft\web\AssetBundle;

/** Loaded only for authenticated CP requests with devMode and the comparison env opt-in. */
final class ComparisonAsset extends AssetBundle
{
    public function init(): void
    {
        $this->sourcePath = __DIR__ . '/assets';
        $this->depends = [DarkModeAsset::class];
        $this->css = ['comparison.css'];
        $this->js = ['comparison.js'];
        parent::init();
    }
}
