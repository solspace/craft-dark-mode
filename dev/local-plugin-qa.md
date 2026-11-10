# Local plugin QA — 2026-11-07

Site: `craft5.test`. Craft CMS 5.12.0.1, PHP 8.3.36. Paid plugin editions are local trials; no purchases or live payment processing were performed.

## Installed plugins

| Handle | Version | Edition |
| --- | --- | --- |
| aws-s3 | 2.3.2 | standard |
| blitz | 5.14.4 | standard |
| calendar | 5.0.33 | pro |
| ckeditor | 5.9.0 | standard |
| commerce | 5.7.8 | pro |
| contact-form | 3.1.0 | standard |
| dark-mode | 1.0.0-beta.1 | standard |
| expanded-singles | 3.0.11 | standard |
| feed-me | 6.17.0 | standard |
| field-manager | 4.0.12 | standard |
| formie | 4.0.7 | standard |
| freeform | 5.18.0-dev | pro |
| hyper | 3.0.4 | standard |
| imager-x | 6.2.0 | pro |
| mcp | v1.7.1 | pro |
| multi-translator | 2.31.1 | standard |
| navigation | 4.1.0 | standard |
| retour | 5.0.14 | standard |
| seo | 5.0.0 | standard |
| seomatic | 5.1.22 | standard |
| sprig | 3.7.3 | standard |
| super-table | 4.0.9 | standard |
| vite | 5.0.2 | standard |

The requested selection consists of ten paid and ten free plugins. Commerce, Calendar, and Dark Mode are also installed. Calendar was updated to the latest available 5.x release, 5.0.33, and Craft migrations completed. MCP remains on 1.7.1: the attempted 1.8.1 upgrade requires `mcp/sdk ^0.9`, while Craft 5.12.0.1 requires exactly 0.8.1. Composer rejected that combination; no dependency aliases or core downgrade were used. The Craft constraint prevents the backtracking error.

## Sample data

- 24 QA products and 30 variants, including physical and digital goods.
- 12 synthetic customer profiles, 24 saved addresses, and dummy payment profiles.
- 36 completed orders: 24 paid, 4 partially paid, and 8 unpaid (including fully refunded examples).
- 6 carts and 6 subscription examples with two dummy plans.
- Shipping methods, tax categories/rates, coupons, order statuses, stock levels, and a second inventory location.
- Three Feed Me imports (JSON, CSV, XML), each mapped to four Commerce products, successfully run with add/update matching by SKU.
- Feed files are private local files in the site’s `storage/qa-fixtures` directory. The pre-existing Test feed is unchanged.
- Formie 4.0.7: eight QA forms covering contact, project quotes, workshops, surveys, applications, support, newsletter signup, and three-page onboarding. Includes active, draft, and archived forms, two groups, three submission statuses, and two reports.
- 96 synthetic Formie submissions: 80 complete, eight spam, and eight incomplete. Includes multilingual names, long text, option fields, numbers, and agreements. The application form has an optional PDF upload field; no attachments were seeded.
- Sixteen Formie notification examples are disabled. No email was sent. The user's migrated forms were left unchanged.
- 32 synthetic Sent Notification history items cover all eight QA forms: 24 successes and eight simulated transport failures. Subjects are marked `[QA DEMO]`, recipients use `example.test`, and stored delivery metadata identifies fixtures. Seeding calls no mail transport or queue. Independently resent records are retained.
- Repeatable Formie seed payloads/scripts and stored-value verification results are preserved in `storage/qa-fixtures/tools`.
- Four QA Navigation menus (Primary, Footer, Documentation, Utility) contain 67 seeded items, including three-level nesting, four Commerce product links, five existing entry links, passive headings, external/mail/telephone/anchor links, three disabled examples, and long/multilingual labels. Placeholder destinations use `/qa/` or `example.test`. The user's subsequently added nodes are retained; exports and repeatable seed scripts are stored with the other QA fixtures.

## Implementation

Third-party styles are separated under `src/web/assets/compatibility`, with plugin-enabled registration in `DarkModeAsset`. Shared Craft rules remain in the core sheets; Commerce keeps its existing separate sheet. Freeform fixes are in the Freeform 5.18 source checkout and rebuilt assets. No Craft vendor files or templates were modified.

Covered reported surfaces include CKEditor/Monaco, native setting diagrams, dashed Add buttons, SEO title tokens and badges, SEOmatic charts/selectors/previews, Sprig variable controls, Retour charts, Verbb’s footer, Field Manager audit headings, Feed Me mappings/log details, and Commerce customer initials/order links. Sprig’s rendered output retains authored website styles.

Calendar's adapter loads only for major version 5. Calendar 6, including prereleases, is explicitly excluded even if CSS component names overlap. Calendar 5 popovers, recurrence controls, and installer file lists were checked in the browser.

Calendar 5 dashboard Agenda, Mini, Upcoming Events, and Event widgets were checked in both modes. Dark grid cells and today highlights follow the palette; event hues remain intact. Date/time controls share equal heights and centered icons, and upcoming-event dividers are subdued. Retour's widget has separately scoped readable legends and quieter donut/marker outlines. Plugin Store cart glyphs are brighter in dark mode; screenshot pagination retains one continuous dim track with a brighter active segment, checked in both modes.

Formie's named builder, defaults, palette, and report roots use their exposed palette variables and public component parts. A short-lived observer watches only a known host's ready class when its shadow root mounts late; it disconnects immediately afterward. A child-list observer stays inside the isolated component to find on-demand nested editors. Standalone send/resend/export dialogs attach through Plugin Kit's public show events. No document-wide observer or polling was added.

Navigation's separate adapter maps the five named builder roots' Plugin Kit/Tailwind roles. Its isolated component stylesheet attaches at module-load/DOMContentLoaded without observers or polling, clears in light mode, and preserves node data and custom imagery. Builder panels, sidebar accordions, type badges, and pending-addition row/action surfaces were checked visually. Node-editor Type dropdowns blend into metadata cells in dark mode. Pending rows retain their native faint yellow treatment in light mode and use an opaque amber mix in dark mode so sticky cells do not double the tint.

Generated email-preview defaults follow the theme at the user's request, including saved notification and resend previews. Zero-specificity body rules preserve explicitly authored colours and backgrounds; images and website previews remain unchanged. Formie's existing front-end preview layout is deliberately preserved.

Builder rich-text previews and Note variants now use semantic theme roles, including a stronger neutral Info border. HTML builder frames receive only a default text color, with no background override; this lifecycle is covered by an automated check. The nested CodeMirror settings editor is scoped to `pk-code-editor`; highlighted glyphs are adapted without changing editor data. The editor and rich-text/Note surfaces were visually checked in both modes. Craft's inline project-config alert background is overridden with its semantic error surface; the banner itself was not present during this browser check.

The follow-up pass covers builder loading chrome, modal headers, instructions/editor notes, table action cells and hidden/disabled row tones, floating name/address sub-labels, hover surfaces, drag/drop targets, existing-field/notification pickers, variable chips, calculation toolbar buttons, integration icons/status rings/dispatch cards, and report headers/view controls. Table preview headers, upload dropzones, native file-chooser buttons, and combined phone controls were also checked together in both modes, including vertical icon/control alignment. Feed Me mapping dropdown rounding now applies in both modes. Invalid RadioButtons fixture definitions were corrected to Formie's Radio type without changing the user's migrated forms.

Commerce's newly added order-item highlight uses a dark selection surface immediately, retaining the fade. Retour's handled-hit chart line remains distinguishable in muted gray. SEOmatic content-table headers, removable robot chips, and Sprig's output wrapper also received scoped corrections.

## Verification

- Dark Mode: 29 Node tests passed, including Calendar major-version gating, on-demand Formie dialogs/editors, and email/HTML-preview lifecycle checks; changed PHP passed syntax check; Composer validation passed with the existing version-field warning.
- Freeform: 24 focused builder tests and the full 937-test client suite passed. Client production and Sass builds passed. AI introduction artwork is now inline trusted SVG so semantic colours inherit correctly; shared AI/Form Monitor backgrounds use a faint ink mix in both modes.
- Browser checks separately covered representative reported screens, including open Feed Me and SEOmatic menus, expanded log details, customer initials, immediate order-item highlights, selected cards, Formie builder/defaults/palette/report-dialog/provider controls, Calendar 5 controls/file lists/popovers, and icon/text alignment.
- These are compatibility and fixture checks, not an exhaustive functional certification of every installed plugin.


## 2026-11-08 cleanup review

- Removed obsolete account-menu picker selectors, its unused Auto hint/config/catalog entries, duplicate GraphiQL session styling, and modern FullCalendar variables unused by Calendar 5's bundled FullCalendar 3.
- Simplified header refreshes and plugin-service access. Consolidated Formie dark/light stylesheet registration; preview tracking now replaces a frame's old document on reload and drops detached frames. Regression coverage checks retired documents are not updated and reconnected frames recover.
- Condensed the beta changelog to current behavior. Release archives exclude tests, development instructions, and this local QA report through `.gitattributes`.
- Automated: all 32 Node tests pass; every source PHP file passes syntax checks; Composer validation passes with its existing explicit-version advisory; `git diff --check` passes. Export-ignore attributes were verified for development files and remain unset for runtime source.
- Browser: verified Formie's notification editor/preview in dark and light modes, including preview refresh; Calendar 5 dashboard widgets in dark mode; GraphiQL's editor/session surfaces in dark mode. Header cycle, half-filled Auto icon, transparent blue hover, focus clearing after pointer departure, and matching 40px control heights were checked live. German and Arabic/RTL header fixtures were visually checked for alignment. These were focused cleanup checks, not a new audit of every plugin workflow.
- Comparison UI/assets are absent by default in the live CP. Environment opt-in, login, and devMode combinations are covered by automated tests.

## Complex entry fixture — 2026-11-08

Entry **12902**, **QA Complex Super Table & Neo — Entry Review**, is in **Entries → QA Plugin Playground**. Its dedicated entry type has Overview, Super Table, and Neo tabs; the section has no public URLs.

- Super Table field **60** (`qaComplexSuperTable`): five inline blocks across Feature and Pricing entry types. Includes text, multiline descriptions, URL links, dropdowns, switches, audience checkboxes, embedded-asset relations, prices, date/time, and specification tables. One row is disabled.
- Neo field **61** (`qaComplexNeo`): eleven blocks across six colored types, with three levels of nesting, a collapsed section, and a disabled CTA. The Pricing comparison block contains another two Super Table rows.
- Independently reloaded through Craft's element queries: five outer rows, eleven Neo blocks at levels 1–3, two nested rows, and one disabled item in each outer field. Browser entry view rendered both tabs without visible validation errors; icon/control alignment was visually checked in dark mode. This fixture pass made no runtime styling changes.

## Nested entry appearance pass — 2026-11-08

Super Table 4.0.9 and Neo 5.5.13 were reviewed on entry 12902 in Light and Dark. Matrix-based Super Table rows now use their supplied colour ramp for dark outlines and headers, without relying on selection variables that Matrix does not provide. Neo's nested separators, collapsed-stack edges and preview dividers are muted; its clipped-text fade matches the coloured header. Neutral blocks reset their accent, and error/preview highlighting remains distinct.

The changes are scoped to dark component chrome. Light mode uses the plugins' native styling. No entry values were saved or discarded during the review.


## Additional plugin fixtures and appearance — 2026-11-08

Entry **12955**, **QA Links, Maps, Code & Tables**, is in **Entries → QA Plugin Playground**, with Overview, Linkit, Maps, Code Field, and Table Maker tabs. Four Linkit examples cover URL/entry/email/telephone values; Maps includes full and compact location fields; Code Field includes JavaScript and nested JSON; Table Maker includes heading, multiline, number, dropdown, checkbox, and date columns plus a caption. The user's provisional draft and subsequent edits were preserved.

Installed Linkit 5.0.0, Maps 5.0.4, Code Field 5.0.2, Table Maker 5.1.7, and Image Resizer 4.0.20. Expanded Singles 3.0.6 and Imager X were already present. Image Optimize could not be installed alongside this Imager X dependency set: their required color-thief-php major versions conflict. Composer reverted the unsuccessful install.

Three generated QA images live in a separate QA Image Processing volume. Image Resizer is limited to that volume with non-destructive originals retained; six Imager X transforms were generated successfully. No mail was sent.

Maps' adapter themes its search, address grid, icons, controls, attribution, and standalone settings. The selected map-style image and tiles are preserved. The overlapping settings wrapper stays transparent; an empty Vue API-key card no longer casts an underline below the map-style selector. Native light settings and corrected dark settings were checked visually, including label/arrow alignment. API-backed tile rendering remains unverified without a valid key.

Table Maker uses scoped Plugin Kit tokens and public parts for fields and configuration dialogs. Its fixed light shadow-DOM action cells need a small isolated shim. A direct-child observer watches only known Table Maker mount hosts so asynchronously created/rebuilt tables are styled before field focus; no document-wide observer or polling was added. A fresh dark page was inspected before any field interaction, confirming all action cells were dark. The date popup has a raised overlay, subtle border, and shadow. Field, caption, Configure button, calendar alignment, and light restoration were checked visually.

Linkit entry/email/telephone fields and Code Field JavaScript/JSON editors were checked in both appearances. Code Field uses the shared editor adjustment; no dedicated Linkit adapter was needed.

Automated verification: **34 Node tests passed**, including Table Maker late mounting, duplicate prevention, theme restoration, and detached-node cleanup. Changed DarkModeAsset.php passed PHP syntax checking. Composer validation passed with the existing explicit-version advisory. `git diff --check` passed.

Vizy's block-group headers/footers, colour input, image-picker popup, availability dialog, and configurator switch thumbs now use scoped appearance tokens. Browser checks covered dark icon/image pickers and availability dialog, native light icon-picker restoration, and icon/control alignment. The image picker had no available preview images, so image selection itself was not tested. Maps settings dividers now use the muted border token; the dark divider was checked visually. The 34 Node tests and whitespace checks still pass.

Dashboard inventory: Calendar's four widgets, Formie's recent submissions, Freeform's four available widget types, Retour, Blitz, and representative Craft widgets are present. Campaign Stats and Mailing List Stats are also present. Commerce includes Total Orders, Top Customers, Top Products, Total Revenue, Recent Orders, and Orders by Shipping Country. Commerce chart legends follow appearance changes while preserving the native light colours; shared chart tooltips use a dark overlay in Dark. Browser checks confirmed the country legend, tooltip, and marker alignment. Craft's support-widget hover is more subtle, and native radio controls use cooler surfaces while retaining keyboard selection and visible focus.

The Docusaurus compatibility chart now includes all **31 installed third-party plugins**, plus Craft CMS and the existing Calendar 6 draft parent row. Installed versions were reconciled against composer.lock; checked dates are **November 8, 2026**. Expanded Singles is currently **3.0.11**. The Calendar 6 placeholder still has no checked date. Image Optimize is excluded because its installation did not succeed.

Final automated verification: **37 Node tests passed**, including Commerce legend restoration and late chart loading. DarkModeAsset.php passed PHP syntax checking; Composer validation passed with its existing explicit-version advisory. Whitespace checks passed in both repositories.

## Freeform legacy adapter and 5.18 comparison — 2026-11-09

The legacy runtime was Freeform **5.17.6** on `craft5upgrade.test` (Craft **5.11.5.1**, PHP **8.4.27**), with Dark Mode installed from this repository. The native reference was Freeform **5.18.0-dev**, built from `feat/v5.18` commit **fec31068f**, on `craft5.test` (Craft **5.12.0.1**, PHP **8.3.36**). An isolated source clone supplied the temporary native reference. The original Freeform source link, Composer files, and autoload paths were restored afterward; the primary Freeform checkout remains clean.

The versioned registry now groups each plugin's CSS and JavaScript together, with optional release boundaries. Freeform's shared adapter covers 5.x, and the additional legacy assets cover 5.0 through 5.17. The entire 5.18 prerelease line is excluded from legacy assets. Version matching and asset inclusion are automated checks; releases such as 5.16 receive best-effort compatibility, not the same browser certification as the installed 5.17 runtime.

Browser coverage included:

- Forms overview in card/list layouts, groups, the creation chooser, guided setup through its preview step, quick setup, and the AI setup form. No AI generation or form creation was submitted.
- Builder layout and field-property controls; notification configuration and existing template dialogs; rule minimap and unsaved condition rows; form integration sidebar, enable controls and element mapping; all seven form-settings sections; front-end preview chrome. Unsaved appearance-only edits were discarded by reloading.
- TinyMCE notification editor canvas, tokens, formatting menu and source dialog; notification configuration/advanced/template tabs; global file/database/wrapper template editors and PDF editor. Ace's active line was checked after losing focus. The notification editing iframe follows appearance without changing its saved HTML; front-end preview documents retain their own styling.
- All 55 available provider configuration routes in each installation, with category-level visual checks and additional checks of Post Forwarding, hCaptcha suggestions, OpenAI model selection, and initial integration loading. Viewing configured providers can perform their existing automatic authorization checks; no authorization or model-refresh buttons were used.
- General, behavior, queue, builder, limited-user profile, template manager, PDF, status, demo, spam, AI, survey, notice, diagnostics and classic-log settings. Diagnostics' Health Checks panel was inspected without running repair actions. Native-only setup, logging and activity-log screens were also reviewed.
- Submission and spam indexes, representative submission/payment detail and native spam detail, A/B report and edit modal, export profiles/notifications and their editors, Freeform import/export trees, and the native Formie v3 import tree. The native Quick Export dialog opened correctly. Legacy Quick Export did not open during this session, so that dialog remains unverified on 5.17; no export/import was executed.
- Dashboard line/bar/donut/pie/polar charts, recent-submission controls and quick-form chrome; embedded Freeform form selectors in Craft categories/entries and the submission-relation picker. Existing fixtures and relations were preserved.

Corrections cover older fixed surfaces, popup/search/selection states, dropdown boundaries and placeholders, provider glyphs, mapping controls, wizard and editor chrome, export-tree controls, chart axes/outlines, log syntax, submission panels and A/B winner contrast. Dark custom dropdowns use an inset edge without changing their heights. Shared Craft corrections soften element-row hover and replace Selectize's hard-coded pale open-control separator. False boolean indicators are dim **filled** circles in Dark; native Light styling remains unchanged. The A/B winner uses a quieter green with dark label/checkmark ink. Limited-user permission chips use the same `--bg-enabled` teal as Craft toggles, with dark text/checkmarks; live computed backgrounds matched at `rgb(17, 166, 151)` on the legacy site.

Visual checks included vertical icon/text alignment, centered glyphs, adjacent control heights, and live Dark/Light restoration for charts and representative controls/editors. Provider brand paints, chart series colors, authored HTML, imagery, signatures and rendered front-end templates are preserved. Native layout/feature differences between releases were not recreated in the adapter.

Follow-up checks confirmed the limited-user teal chips and dark checkmarks, the dim filled false-boolean dots in Craft and Freeform dropdowns, the muted native open-control separator, and light text on a hovered, unselected integration link. The AI chart's unintended outer shadow came from an overly broad A/B selector; it is now limited to A/B sections containing variant articles. The AI usage section was reloaded and verified with no outer border/shadow.

The export-password label/help wrapper also matched a structural dropdown selector. Dropdown selectors now exclude containers with a direct label child. Browser inspection confirmed the heading group has a transparent background, zero border and no shadow, while the password input keeps its border and focus treatment.

The SolspaceAI credit-purchase dialog was checked while loading and after the plans arrived. Its payment-history header/alternate loading row now use dark surfaces, and each plan card has a clearer input-border outline. Log pagination SVGs inherit button text color; both paginators on the four-page email log were checked, including enabled arrows, the existing 50% disabled treatment, and vertical centering. No purchase action or log-clear action was used. All 44 Node tests and whitespace checks still pass.

Additional screenshot follow-ups covered archived-form controls, tooltip portals, card and builder loading placeholders, bulk-label change marks, sample-data pickers, field palettes and configured group colors, property popups and tables, nested rich-text editing, calculation previews and suggestions, notification token menus and email-preview defaults, and undo/redo and Save/Submit controls. Popup shadows and tab hover paints are darker; main tabs keep their white active edge and page tabs use a blue underline. Field palette icons retain configured Field Manager colors, with a muted fallback for default black glyphs. Refresh controls, table action cells, opinion-scale choices, multiselect chips, cards and image placeholders no longer use fixed light paints. Browser checks included icon centering, matching adjacent control heights, muted palette edit icons, Restore mouse hover, and visible table boundaries. Temporary fields, instructions and calculation edits were discarded by reloading; no form or template was saved.

Field instructions were verified at `rgb(139, 148, 158)` and the selected source segment at `rgb(75, 85, 99)` with light text. Calculation suggestions were checked with both selected and unselected items. Monaco's asynchronous AMD initialization now uses its public module callback, and editor creation reapplies appearance after React's default-theme assignment. The HTML editor was reopened and visually checked with a dark canvas, readable syntax and active-line chrome, preserving the existing source. Validation labels, messages and input borders now use the semantic error color; the specific server-generated AI error state from the screenshot was not recreated because that would require submitting a form save.

Builder tabs with `.errors` now retain the semantic error pink on their text and inherited warning glyph, including active/hover states. The existing live Layout error indicator was inspected for text/icon alignment without refreshing or discarding the user's validation state. Its updated paint will appear after the adapter stylesheet is reloaded.

The follow-up error audit moved property validation into shared Freeform compatibility and extended it to page/overflow tabs, sidebar selections, editable titles, required indicators, error-banner icons, field label glyphs and borders, and metadata JSON feedback. Authored preview descendants are excluded. Invalid metadata was entered temporarily in Cards Layout: the status icon, label and parser message all computed to `rgb(255, 123, 114)`, with a dark error tint. Guided setup's missing-name alert, invalid choice field, type/choices icons, popup label and textarea border were checked in the same pink. These client-only errors were discarded; no form save or AI generation was submitted. Server/connected-service failure variants were reviewed in source rather than deliberately triggered.

Attribute preview names now use a lighter teal (`rgb(86, 212, 199)`), while edit cues use the standard link blue (`rgb(130, 178, 226)`). Favorite-field Plain Text/Rich Text segments were visually checked with dark neutral inactive and brighter selected fills, light text, and matching 28px heights. Cards Layout outlines now use the muted border; card controls and adjacent actions remain aligned.

Wizard follow-ups remove paint from invisible insertion hit areas and icon backplates, soften the selected purpose fill, make Advanced blend into its panel, theme Choices/add-field popups, and darken drag-handle focus/hover fills while retaining focus rings. The real field-row layout and invalid Choices popup were checked visually; insertion wrappers computed transparent. The live-preview canvas matches its surrounding overlay at `rgb(28, 33, 40)`, while the Form Preview iframe retains its authored white background. AI reference-file rows, generation summary/ring and failure-banner paints were corrected from their source hooks without uploading references or repeating generation. A local fixture preview was blocked by browser URL policy; live application checks supplied the verification above.

The final focused wizard drag handle was checked at `rgb(41, 46, 54)` with a centered 18px icon in a 28px control and its blue focus ring intact. The background builder intentionally remains lightly dimmed to direct attention to the wizard; palette text remains readable through that dimming. The temporary wizard draft was discarded afterward.

Quick setup exposed another portal scope: its controls sit outside the application root and slideout wrappers. Shared validation now includes Freeform's styled modal hub. With an empty name, Quick setup's local validation produced matching `rgb(255, 123, 114)` label, asterisk, input border and message; it returned before the form-creation request. The modal was closed without creating a form. The builder palette's inset sidebar shadow overlapped the property panel's right border. The duplicate shadow is removed, leaving one `1px solid rgb(61, 68, 77)` edge; palette and open property-panel views were checked visually, including label/icon alignment.

Dashboard follow-ups theme the shared external HTML tooltip used by Freeform dashboard/usage charts. Line and pie tooltips were opened and checked at `rgb(28, 33, 40)` with readable text, aligned swatches/counts and the original series colors retained. Quick Form's phone-country control now receives scoped phone palette variables: its trigger matches the input background (`rgb(29, 35, 43)`), and its menu/search use the overlay surface. Flags retain their colors; the 32px selector stays centered inside the 34px phone input. The country menu was opened without changing selection or submitting the form.

Quick Form's active page tab now uses the neutral selected surface (`rgb(48, 54, 61)`) and heading ink; inactive labels remain muted. Browser inspection confirmed all three tabs have matching 28px heights and centered labels. Widget error/success banners now use semantic ink and dark tinted surfaces instead of fixed pale backgrounds, and invalid field labels follow the error pink. Banner selectors were checked against widget source; no submission was made to force those states.

Freeform-owned rich-text editing documents receive dark defaults without changing saved HTML. Email Preview frames receive zero-specificity defaults so authored template CSS and inline paints still win; actual front-end preview documents remain unchanged. Theme changes, replacement documents and detached preview cleanup have automated coverage. Automatic approval review blocked the Create New Template action because it could create persistent application state; the existing Notification template supplied the safe visual-check route instead.

Automated verification: **47 Node tests passed**, including release boundaries, grouped asset registration, asynchronous Monaco loading and React mounts, TinyMCE lifecycle/cleanup, preview reloads and late dashboard-chart initialization, Light restoration and data preservation. Changed DarkModeAsset.php passed PHP syntax checking. Composer validation passed with its existing explicit-version advisory; whitespace checks passed. The isolated native Freeform reference separately passed its 944-test client suite, 24 focused builder tests, and client/script/Sass builds.

This is a broad appearance audit of the available pages and representative states, not a certification of every workflow, older patch release, browser engine, or externally connected integration. No notification was sent, form submitted, payment made, file uploaded, integration authorized, content saved, permission changed, or data imported/exported as part of these visual checks. Formie/Express Forms importer availability differs between the two installations.

## Dashboard performance follow-up — 2026-11-09

On `craft5.test` with Freeform `5.18.0-dev` (`feat/v5.18`, `fec31068f`), isolated Dark Mode CSS/JS and recorded Navigation Timing, Long Tasks, and Long Animation Frames. Freeform's page/portal stylesheet caused substantial forced style/layout during unrelated dashboard widget initialization; excluding Dark Mode JavaScript did not remove it. Keep widget CSS separate and use the registry's optional `sections` filter for page-only assets. The legacy editor assets are limited to Freeform's CP section, while the pre-5.18 dashboard chart adapter remains available elsewhere. All existing CSS rules were preserved exactly in the split.

Five alternating original/optimized dashboard pairs produced medians of 2308.1/1298.1 ms (43.8% lower), with 6–7 original long tasks versus zero in each optimized measured load. Three complex-entry pairs produced 1640.6/836.8 ms (49.0% lower). These are warmed local Dev Mode navigation-load measurements, excluding subsequent AJAX readiness. Original controls restored the unchanged pre-fix Freeform CSS while retaining the other current assets. Data and methodology: `output/dark-mode-profile-2026-11-09/report.html` and `results.json`.

Automated: 48 Node tests passed, changed PHP syntax passed, Composer valid with the existing version-field advisory. Browser: dashboard chart tooltip, Quick Form, native Freeform builder and bulk-label modal visually checked, including centered icons and matching control heights. No content was changed or saved. Temporary profiling/isolation code was removed by restoring the site config byte-for-byte; normal dashboard load confirmed dark appearance, widget CSS present, Freeform page CSS absent, and no probe attribute. Freeform remains on 5.18; Dark Mode remains enabled.

## Hyper entry-field appearance — 2026-11-10

Hyper 3.0.5 on `craft5.test`, entry **12982**, **QA Freeform Link Integration**: extended the existing Hyper stylesheet to cover link headers, type controls, layout tabs, compact tab-menu triggers, portal-body backgrounds, and action icons. Plugin Kit palette overrides now also inherit within Hyper inputs and its bulk-dialog body. Overrides remain restricted to Dark Mode and Hyper's own chrome, without changing field content or control dimensions.

Chrome browser checks covered Content and Advanced panels, the Settings menu, the compact tab dropdown at a 500px viewport, and restoration of native Light colours. Header tabs retain their 31px height; adjacent action buttons remain 24×24px with vertically centred icons. The temporary viewport was reset and the user's Dark preference restored. No entry save or discard action was used.

Automated: all 49 Node tests passed; Composer validation passed with the existing explicit-version advisory; whitespace checks passed. No PHP files changed.
