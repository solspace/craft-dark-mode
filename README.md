# Solspace darkMode for Craft CMS 5

A free Solspace plugin that adds comfortable dark mode to Craft’s control panel while preserving native layouts, controls, and authored content.

<img src="src/icon.svg" alt="darkMode icon" width="64" height="64">

## Requirements

- Craft CMS 5.9+ within 5.x.
- PHP 8.2+, meeting your Craft version’s requirements.
- A current version of Chrome, Edge, Firefox, or Safari.

## Installation

Install from the [Craft Plugin Store](https://plugins.craftcms.com/darkmode), or run these commands from your Craft project:

```sh
composer require solspace/craft-dark-mode -w
php craft plugin/install darkmode
```

No asset compilation is required. Local setup instructions are in [Development](DEVELOPMENT.md).

## Usage

Click the appearance icon beside your account avatar to cycle **Auto → Light → Dark → Auto**. Auto follows your operating system. Each user’s preference is saved and synchronized across tabs.

## Updating and uninstalling

Update through Craft’s Updates screen, or run:

```sh
composer update solspace/craft-dark-mode --with-dependencies
```

Follow Craft’s normal backup and deployment process, and check your plugins’ control-panel screens after updating.

To uninstall, remove **darkMode** through Settings → Plugins, then remove its Composer package.

## Documentation and support

- [Documentation](https://docs.solspace.com/craft/dark-mode/v1/) · [Plugin compatibility](https://docs.solspace.com/craft/dark-mode/v1/compatibility/)
- [Changelog](CHANGELOG.md) · [Development](DEVELOPMENT.md)
- [Source code](https://github.com/solspace/craft-dark-mode) · [Report an issue](https://github.com/solspace/craft-dark-mode/issues)
- [Private support ticket](https://docs.solspace.com/support/)

Some third-party interfaces need compatibility adapters; see the compatibility guide for reviewed plugins and versions.

## License

[MIT](LICENSE) · © Solspace, Inc.
