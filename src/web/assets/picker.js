(() => {
    'use strict';
    const config = window.CraftDarkModeConfig;
    const appearance = window.CraftDarkMode;
    if (!config || !appearance) return;
    const icons = {
        auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/>',
        light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
        dark: '<path d="M20.9 13.1A9 9 0 0 1 10.9 3a9 9 0 1 0 10 10.1Z"/>',
    };
    const modes = Object.keys(icons);
    let revision = 0;
    let queue = Promise.resolve();
    let section;
    let status;
    let retry;
    let trigger;

    function refresh() {
        if (!section) return;
        trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + icons[appearance.mode] + '</svg>';
        const label = config.labels.appearance + ': ' + config.labels[appearance.mode];
        trigger.setAttribute('aria-label', label);
        trigger.title = label;
    }

    function save(mode) {
        appearance.apply(mode);
        if (!config.authenticated) {
            appearance.cache(mode);
            return;
        }
        const current = ++revision;
        status.textContent = config.labels.saving;
        retry.hidden = true;
        // Serialize writes so rapid selections cannot leave the server on an older mode.
        queue = queue.catch(() => {}).then(async () => {
            if (current !== revision) return;
            try {
                const response = await Craft.sendActionRequest('POST', config.saveAction, { data: { mode }, timeout: 10000 });
                if (!response.data?.success) throw new Error('Appearance was not saved.');
                if (current !== revision) return;
                appearance.cache(mode);
                status.textContent = config.labels.saved;
            } catch (_) {
                if (current !== revision) return;
                status.textContent = config.labels.failed;
                retry.hidden = false;
                Craft.cp?.displayError(config.labels.failed);
            }
        });
    }

    function mount() {
        const account = document.querySelector('#user-info');
        if (!account?.parentElement || document.querySelector('.dm-appearance')) return false;
        section = document.createElement('span');
        section.className = 'dm-appearance';
        trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'btn dm-appearance-trigger';
        trigger.addEventListener('click', event => {
            event.stopPropagation();
            save(modes[(modes.indexOf(appearance.mode) + 1) % modes.length]);
        });
        status = document.createElement('span');
        status.className = 'dm-appearance__status visually-hidden';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'btn dm-appearance__retry';
        retry.textContent = config.labels.retry;
        retry.title = config.labels.failed;
        retry.hidden = true;
        retry.addEventListener('click', event => { event.stopPropagation(); save(appearance.mode); });
        section.append(trigger, status, retry);
        account.parentElement.insertBefore(section, account);
        refresh();
        return true;
    }

    document.addEventListener('craft-dark-mode:change', refresh);
    // Mount once in Craft’s header. No observer or polling is needed.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
