# Solspace Dark Mode for Craft CMS 5

A free, MIT-licensed Solspace plugin with comfortable dark mode for Craft’s control panel, with an icon in Craft’s top bar that cycles through **Auto**, **Light**, and **Dark**. Each user chooses their own appearance; Auto follows their operating system.

<img src="src/icon.svg" alt="Dark Mode icon" width="64" height="64">

Dark Mode preserves Craft’s layout, typography, keyboard controls and status meanings, with quiet surfaces, readable colors and scoped compatibility styles. It affects the control panel; website content and authored images retain their colors.

## Requirements

- Craft CMS 5.9 or later within 5.x (Craft 6 is not supported).
- PHP 8.2 or later, meeting the installed Craft version’s requirements.
- A current version of Chrome, Edge, Firefox, or Safari. Legacy browser versions are not supported.

## Installation

The package is registered on [Packagist](https://packagist.org/packages/solspace/craft-dark-mode). Until the `1.0.0` release tag is published, install it from a local checkout of the `v1` branch:

```sh
git clone --branch v1 https://github.com/solspace/craft-dark-mode.git /absolute/path/to/craft-dark-mode
```

Keep the checkout in a persistent directory. From your Craft project, replace the path below with that checkout's actual location and run:

```sh
composer config repositories.dark-mode path /absolute/path/to/craft-dark-mode
composer require solspace/craft-dark-mode:1.0.0
php craft plugin/install dark-mode
```

Composer uses the local package's explicit `1.0.0` version. The plugin has not yet been listed in the Craft Plugin Store. Composer must permit the normal Craft Composer installer. No asset compilation is required.

For an existing local beta installation, update the checkout and run the same `composer require` command to change the project's version constraint to `1.0.0`. Keep the plugin installed under its existing `dark-mode` handle.

After installation, click the appearance icon beside your account avatar. Each click cycles **Auto → Light → Dark → Auto**.

Preferences belong to each signed-in user and synchronize across tabs on the same installation. If saving fails, your chosen appearance remains applied in the current tab; use **Retry** beside the icon to save again.

## Updating and uninstalling

Back up the database, Composer files and project config, update the local checkout, then run:

```sh
composer update solspace/craft-dark-mode --with-dependencies
```

Follow Craft's normal deployment process for pending migrations or project config. Review the changelog and check your plugins' control-panel screens after updating.

To uninstall, remove **Dark Mode** through Craft's Settings → Plugins, then remove the Composer package if desired. Craft returns to its normal appearance. Retained appearance preferences are harmless.

## Documentation and support

- [Dark Mode documentation](https://docs.solspace.com/craft/dark-mode/v1/)
- [Plugin compatibility](https://docs.solspace.com/craft/dark-mode/v1/compatibility/)
- [Changelog](CHANGELOG.md)
- [Source code](https://github.com/solspace/craft-dark-mode)
- [Report an issue](https://github.com/solspace/craft-dark-mode/issues)
- [Private support ticket](https://docs.solspace.com/support/)
- [Craft Stack Exchange](https://craftcms.stackexchange.com/questions/tagged/solspace)

Fixed-color third-party interfaces, shadow DOM and independently styled iframes may need an adapter. Compatibility checks cover representative screens and versions; they do not guarantee every plugin workflow.

When requesting support, include your Craft, PHP, Dark Mode and affected plugin versions, browser, and steps to reproduce the issue.

For development checks, translation coverage and local integration notes, see [Development](DEVELOPMENT.md).

© Solspace, Inc.

## License

Dark Mode is free and open source under the [MIT license](LICENSE).
