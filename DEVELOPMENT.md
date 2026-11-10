# Dark Mode development notes

A control-panel appearance plugin with **Auto / Light / Dark** on an icon-only control in Craft’s top bar. Craft CMS 5 and PHP 8.2 or newer are required; Craft 6 is excluded by the Composer constraint.

This is the development checkout for Dark Mode 1.0.0, installed on `craft5.test`. It has been exercised on Craft 5.11.5.1 and 5.12.0.1. GitHub inspired the quiet neutral surfaces and list hierarchy; Craft retains its own typography, layout, controls, red primary actions, teal enabled state, and status meanings.

## Installation

Clone the `v1` branch into a persistent directory:

```sh
git clone --branch v1 https://github.com/solspace/craft-dark-mode.git /absolute/path/to/craft-dark-mode
```

From the Craft project, add a Composer path repository pointing to the checkout's actual location:

```sh
composer config repositories.dark-mode path /absolute/path/to/craft-dark-mode
composer require solspace/craft-dark-mode:1.0.0
php craft plugin/install dark-mode
```

Open the control panel and click the appearance icon beside your avatar to cycle Auto → Light → Dark → Auto. Auto follows the operating system immediately when it changes. Each signed-in user has their own Craft user preference, synchronized across tabs on the same installation. The server preference takes precedence when a page loads.

No asset compilation is required for this package. Composer must permit the normal Craft Composer installer. The package is registered on Packagist; until the `1.0.0` tag is published, use the local checkout. The plugin is not yet listed in the Craft Plugin Store.

The package version is maintained explicitly in `composer.json`; keep it synchronized with the changelog and release tags. Local path installs use this explicit version. Existing local beta projects should update their checkout and run `composer require solspace/craft-dark-mode:1.0.0` to update the project's requirement without uninstalling the plugin.

The early local beta used `kmartens/craft-dark-mode` and the `Kmartens\DarkMode` PHP namespace. Update those Composer requirements and developer API imports to `solspace/craft-dark-mode` and `Solspace\DarkMode` together. Keep the plugin installed under the same `dark-mode` handle; no preference or content migration is needed. Do not uninstall it as part of the rename.

Public user documentation belongs at `https://docs.solspace.com/craft/dark-mode/v1/`. Before publishing a release, verify that the hosted guide and compatibility page are available and contain the installation, appearance, troubleshooting, and performance guidance. The former local guides are preserved in the pre-cleanup recovery branch and an ignored `output/docs-before-removal/` copy; their removal from this package does not publish them to the documentation site.

## Implementation

Browser targets are current stable Chrome, Edge, Firefox, and Safari. Do not add legacy-browser shims to match Craft’s older published minimums. Visual QA so far has used Chrome; a browser target is not evidence that its engine has been tested. PHP syntax checks pass on 8.2, 8.3, 8.4, and 8.5; this is separate from full Craft runtime testing.

- Uses Craft’s `cp.layouts.base` hook and an AssetBundle depending on `CpAsset`.
- Sets the root appearance and native `color-scheme` in the head before the body paints.
- Overrides Craft’s semantic color roles and neutral palette, with scoped adapters for components that ship fixed colors. No Craft vendor files or templates are replaced.
- Preserves normal control dimensions, keyboard behavior, focus rings, images, authored document colors, and website previews.
- Saves only the current user’s `darkModeAppearance` preference through a login-protected, CP-only POST action with Craft’s CSRF validation. The client cannot choose a user ID.
- Serializes rapid preference saves, applies the appearance immediately, and provides a retry control if saving fails. Storage failure does not disable the theme.
- Uses Craft 5.12’s TanStack Highlight variables for code surfaces and a scoped adapter for the embedded Plugin Store’s compiled neutral palette.
- Keeps normal buttons and read-only list rows borderless, with background hover states and visible keyboard focus.
- Adds no polling or body-wide DOM observer.

## Plugin interoperability

Plugins that use Craft’s classes and semantic variables inherit the theme. Custom interfaces should use roles such as `--body-bg`, `--pane-bg`, `--secondary-pane-bg`, `--modal-bg`, `--input-bg`, `--text-color`, `--light-text-color`, `--hairline-color`, and Craft’s UI-control and selection colors. Literal white can still represent white artwork, so it is deliberately not remapped globally.

Keep third-party overrides in `src/web/assets/compatibility/<plugin>.css`, registered by plugin handle in `DarkModeAsset`. Commerce retains its existing `commerce.css`. Shared editor chrome lives in `compatibility/code-editors.css`, and Verbb’s shared footer has its own adapter. Keep Craft component rules in `compatibility.css` and `components.css`; scope plugin rules to the component that owns the fixed colors. Never theme rendered website output or user-uploaded images through these adapters.

Calendar's compatibility sheet is restricted to major version 5. Calendar 6 must receive a separate adapter even when selectors overlap. Formie's named shadow hosts receive palette variables and a component stylesheet through `formie.js`, with theme-event updates and a host-only readiness observer that disconnects after mounting. On-demand nested editors are discovered inside those isolated roots; standalone notification/export dialogs use public Plugin Kit show events. Keep public component-part selectors separate from authored content. Generated email preview defaults use zero-specificity theme rules so explicit template colours win. Builder HTML frames receive a default body text color only, preserving authored backgrounds and colours; website previews remain untouched.

Navigation's builder uses five named shadow roots. Keep its palette and component overrides in `compatibility/navigation.css` and `navigation.js`; module-load attachment covers late mounting without a page observer. Pending-row and sticky-action backgrounds must use the same opaque mix to avoid doubled alpha tinting.

The root exposes `data-dark-mode="dark|light"` and `data-dark-mode-preference="auto|light|dark"`. JavaScript integrations can listen for:

```js
document.addEventListener('craft-dark-mode:change', ({ detail }) => {
    // detail: { mode, theme, source }
    // Redraw charts or other canvas content using the current semantic colors.
});
```

An integration can register a compatibility AssetBundle after Dark Mode’s core assets:

```php
use Solspace\DarkMode\Plugin;
use yii\base\Event;

Event::on(Plugin::class, Plugin::EVENT_REGISTER_COMPATIBILITY_ASSETS,
    function ($event) {
        $event->types[] = MyCompatibilityAsset::class;
    }
);
```

`window.CraftDarkMode` exposes `mode`, `theme`, `apply()`, and `cache()` for local integration. The header control owns authenticated persistence; calling `apply()` alone does not save a server preference.

## Versioned plugin adapters

`DarkModeAsset::ADAPTERS` lists each enabled plugin's adapters, keeping CSS, JavaScript, and optional `from`/`before` release boundaries together. A plugin can have shared assets and additional adapters for specific release ranges. Boundaries include the lower release and exclude the upper release, including its prereleases: `before: 5.18` excludes 5.18 alpha, beta, and dev builds as well as stable releases. An `x-dev` branch loads an adapter only if its entire possible release range is covered. Unknown versions skip version-limited adapters. Keep version checks here rather than duplicating them in stylesheets or script registration.

An optional `sections` list limits an adapter to named CP path segments, without the CP trigger. Keep embedded-field and widget adapters separate from page-only rules: Freeform's builder and portal adapters load only in its section, while its legacy widget and chart adapters remain available elsewhere in the CP. All Freeform compatibility adapters stop before 5.18, including prereleases; later releases maintain their appearance integration natively.

Freeform 5.x uses `compatibility/freeform.css`, extracted from the shared compatibility sheet. Freeform 5.0–5.17 additionally loads the legacy component, creation, and editor stylesheets, plus `freeform-legacy.js` and `freeform-legacy-charts.js`. These map legacy neutral tokens inside Freeform roots and use component structure rather than compiled styled-components hashes. TinyMCE notification editing documents follow public editor lifecycle events; dashboard charts receive a per-chart plugin through Freeform's public factory. Neither integration adds observers or polling. Authored HTML, imagery, signature colours, front-end preview frames, chart series colours, and native control geometry are preserved. Dark custom dropdowns use a faint inset edge matching 5.18; Light retains its native styling. Older releases receive best-effort coverage; a matching version gate is not an appearance certification. See the [local QA report](dev/local-plugin-qa.md) for actual browser coverage.

Maps fields keep `compatibility/maps.css` available throughout the CP, including entry slideouts. Its standalone settings rules live in `compatibility/maps-settings.css`, restricted to the `maps` and `settings` sections. In particular, keep the settings-only `#content:has(.maps-header)` selector off element indexes: it makes unrelated table mutations invalidate the content pane's styles. Split page chrome from embedded-field rules before adding section restrictions; never drop field support merely because the main CP section belongs to another plugin.

## Freeform 5.18 and later

Freeform changes are maintained separately in its `feat/v5.18` checkout. They replace custom light surfaces, borders, selection colors, editor chrome, and monochrome icon paints with Craft roles. The legacy adapter is excluded from 5.18 and later. Built Freeform client, script, and stylesheet assets are regenerated in that checkout.

The accompanying source patch is relative to the existing working files when this work began; it does not contain unrelated pre-existing changes. The development checkout remains the authoritative implementation.

## Private comparison helper

The comparison lens is hidden by default, including its account-menu control, hint, and keyboard shortcut. To opt in on a development installation, add this to its `.env` file:

```dotenv
DARK_MODE_ENABLE_COMPARISON=true
```

Craft’s `devMode` must also be enabled. Remove the flag or set it to `false` and reload to hide the helper again. This is a developer convenience, not an access-control boundary; the flag enables it for signed-in users on that development installation. Keep it out of the public user guide.

When explicitly enabled, signed-in users can choose **Compare appearance** from the account menu in dark mode. A 440px circle follows the pointer and reveals a light-mode snapshot of the current page, including unsaved field values. Use the size slider to resize it, Refresh to capture it again, or Close / Escape to dismiss it. The toggle does not persist across page loads.

For a quick look, hold **Alt + Shift** (Option + Shift on macOS) outside a text field; release either key to dismiss. The shortcut does not activate while typing. Switching appearance, leaving the tab or window, and navigating also dismiss the lens. On-screen controls provide an alternative if the operating system reserves that shortcut.

The lens is an inert, script-free copy of the rendered HTML, styled with Craft’s normal light-mode CSS. It never reloads the control-panel application, submits forms, saves preferences, or sends the snapshot to a service. Clicks pass through to the actual page, and scroll positions stay aligned. It refreshes after input/click changes and can be refreshed manually after asynchronous updates; no polling or DOM observer is used.

This is a visual aid, not a second live application: canvas charts retain their captured colors, embedded frames are omitted, and script-managed editor themes, closed shadow roots or transient hover/focus states may differ. Use the normal Light option for final verification of those interfaces. The helper assets, labels, shortcut listeners, and controls are absent unless the environment flag is enabled, devMode is on, and the user is signed in.

## Validation and limits

See the [local QA report](dev/local-plugin-qa.md) for verified surfaces, test results, and limitations. Commerce adapters were reviewed against Commerce 5 source; Commerce 5.7.8 is installed on the QA site; a full live Commerce workflow audit remains pending. A third-party plugin’s fixed-color artwork, shadow DOM, cross-origin document, or separate iframe may need its own adapter. Future Craft updates should receive a visual regression pass.

Run the package’s focused checks with:

```sh
node --test tests/*.test.mjs
find src -name '*.php' -exec php -l {} \;
composer validate --no-check-publish
```

GitHub Actions runs these checks on pushes and pull requests targeting `v1`, with a manual run available from the Actions tab. The PHP 8.2–8.5 matrix runs both syntax checks and the Node suite, whose asset-registration and translation tests invoke PHP. Node 24 supplies the test runner; no npm dependencies or Composer installation are needed. These checks do not replace full Craft runtime or browser QA. Actions are pinned to commit hashes, with weekly Dependabot updates targeting `v1`.

Uninstalling the plugin restores Craft’s normal presentation. Existing appearance preferences are harmless if retained.

## Translations

Complete catalogs are included for all 33 languages and regional variants bundled in Craft’s [current 5.x translation directory](https://github.com/craftcms/cms/tree/5.x/src/translations), plus explicit `en-US`, Craft’s default CP locale. All 13 messages are translated, including the appearance choices, help text, saving/success/failure states, retry action, controller validation errors, and the development comparison control. Craft selects the catalog from the user's control-panel language through `Craft::t()`; no separate plugin language setting is needed.

Catalogs: `ar`, `cs`, `cy`, `da`, `de`, `de-CH`, `el`, `en`, `en-GB`, `en-US`, `es`, `fa`, `fr`, `fr-CA`, `he`, `hu`, `id`, `is`, `it`, `ja`, `ko`, `ky`, `nb`, `nl`, `nn`, `pl`, `pt`, `ru`, `sk`, `sv`, `th`, `tr`, `uk`, `zh`.

The icon-only header control supports right-to-left layouts and uses translated accessible labels and tooltips without changing size. Catalog parity is covered by the package tests; update every catalog when introducing a new message.

Release archives omit tests, `dev/`, and development instructions through `.gitattributes`. Keep runtime assets and the public README in the package; detailed user guides are maintained on the hosted documentation site.
