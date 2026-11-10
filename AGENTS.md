# Dark Mode development

- Support Craft CMS 5 only. Keep the Composer constraint below Craft 6.
- Use Craft's layout hooks, asset bundles, user-preference API, classes, and semantic colour variables. Do not edit Craft vendor files or replace core templates.
- Keep compatibility selectors scoped to the relevant component. Preserve authored content, image colours, and front-end previews.
- Avoid page-wide DOM observers and polling for theme application.
- Keep all translation catalogs complete when adding user-facing messages.
- For every style change or UI feature, visually double-check vertical icon/text alignment, icon centering within controls, and matching heights of adjacent controls before marking it complete. Include long translated labels and RTL layouts when the picker changes.
- Run `node --test tests/*.test.mjs`, PHP syntax checks on changed PHP files, and `composer validate --no-check-publish` as appropriate. Distinguish automated verification from browser checks.
