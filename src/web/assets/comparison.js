(() => {
    'use strict';
    const config = window.CraftDarkModeConfig;
    if (!config?.developerTools || !config.authenticated) return;
    const labels = config.comparisonLabels;
    const root = document.documentElement;
    let pinned = false;
    let held = false;
    let frame;
    let ring;
    let toolbar;
    let toggle;
    let refreshTimer;
    let moveFrame;
    let radius = 220;
    let point = { x: innerWidth / 2, y: innerHeight / 2 };
    let scrollPairs = [];
    const active = () => (pinned || held) && root.dataset.darkMode === 'dark';
    const editing = target => target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]');
    const helper = node => node?.closest?.('[data-dm-comparison-ui]');

    function position() {
        moveFrame = undefined;
        if (!frame || !ring) return;
        frame.style.clipPath = `circle(${radius}px at ${point.x}px ${point.y}px)`;
        ring.style.width = ring.style.height = `${radius * 2}px`;
        ring.style.left = `${point.x - radius}px`;
        ring.style.top = `${point.y - radius}px`;
    }

    function syncScroll() {
        if (!frame?.contentDocument) return;
        frame.contentWindow.scrollTo(scrollX, scrollY);
        for (const [source, index] of scrollPairs) {
            const copy = frame.contentDocument.querySelector(`[data-dm-scroll="${index}"]`);
            if (copy) { copy.scrollTop = source.scrollTop; copy.scrollLeft = source.scrollLeft; }
        }
    }

    function snapshot() {
        if (!active()) return;
        const copy = root.cloneNode(true);
        // Match the rendered DOM, including unsaved input values and nested scroll positions.
        // Never reload the CP URL: no duplicate Craft/plugin initialization or form actions.
        const sources = [root, ...root.querySelectorAll('*')];
        const targets = [copy, ...copy.querySelectorAll('*')];
        scrollPairs = [];
        sources.forEach((source, index) => {
            const target = targets[index];
            if (source.scrollHeight > source.clientHeight || source.scrollWidth > source.clientWidth) {
                target.dataset.dmScroll = String(index);
                scrollPairs.push([source, index]);
            }
            if (source.tagName === 'INPUT') {
                target.setAttribute('value', source.type === 'password' ? '' : source.value);
                target.toggleAttribute('checked', source.checked);
            } else if (source.tagName === 'TEXTAREA') target.textContent = source.value;
            else if (source.tagName === 'OPTION') target.toggleAttribute('selected', source.selected);
            else if (source.tagName === 'DETAILS' || source.tagName === 'DIALOG') target.toggleAttribute('open', source.open);
            else if (source.tagName === 'CANVAS') {
                try {
                    const image = document.createElement('img');
                    image.src = source.toDataURL();
                    image.style.cssText = target.style.cssText;
                    image.width = source.clientWidth; image.height = source.clientHeight;
                    target.replaceWith(image);
                } catch (_) { /* A cross-origin canvas cannot be copied. */ }
            }
            for (const attribute of [...target.attributes]) {
                if (/^on/i.test(attribute.name)) target.removeAttribute(attribute.name);
            }
        });
        copy.querySelectorAll('script, noscript, iframe, object, embed, audio, video, base, meta[http-equiv], link[rel="preload"], link[rel="modulepreload"], [data-dm-comparison-ui]').forEach(node => node.remove());
        copy.dataset.darkMode = 'light';
        copy.dataset.darkModePreference = 'light';
        copy.style.colorScheme = 'light';
        const base = document.createElement('base');
        base.href = document.baseURI;
        copy.querySelector('head').prepend(base);
        const style = document.createElement('style');
        style.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}#account-menu{display:none!important}';
        copy.querySelector('head').append(style);
        const next = document.createElement('iframe');
        next.className = 'dm-comparison-frame';
        next.dataset.dmComparisonUi = '';
        next.setAttribute('sandbox', 'allow-same-origin'); // Deliberately NO scripts, forms, navigation or popups.
        next.setAttribute('aria-hidden', 'true');
        next.setAttribute('tabindex', '-1');
        next.title = labels.compare;
        next.style.visibility = 'hidden'; // No unstyled flash while linked styles load.
        next.addEventListener('load', () => {
            if (frame !== next || !active()) return;
            syncScroll();
            next.style.visibility = '';
        }, { once: true });
        next.srcdoc = '<!doctype html>' + copy.outerHTML;
        frame?.remove();
        frame = next;
        document.body.append(next);
        position();
    }

    function scheduleSnapshot() {
        if (!active()) return;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(snapshot, 120);
    }

    function stop() {
        pinned = held = false;
        update();
    }

    function update() {
        toggle?.setAttribute('aria-pressed', String(pinned));
        if (!active()) {
            clearTimeout(refreshTimer);
            if (moveFrame) cancelAnimationFrame(moveFrame);
            frame?.remove(); frame = undefined;
            ring?.remove(); ring = undefined;
            toolbar?.remove(); toolbar = undefined;
            scrollPairs = [];
            return;
        }
        if (!ring) {
            ring = document.createElement('div');
            ring.className = 'dm-comparison-ring';
            ring.dataset.dmComparisonUi = '';
            ring.setAttribute('aria-hidden', 'true');
            document.body.append(ring);
        }
        if (pinned && !toolbar) {
            toolbar = document.createElement('section');
            toolbar.className = 'dm-comparison-toolbar';
            toolbar.dataset.dmComparisonUi = '';
            toolbar.setAttribute('aria-label', labels.compare);
            const title = document.createElement('span');
            title.textContent = config.labels.light;
            const refresh = document.createElement('button');
            refresh.type = 'button'; refresh.className = 'btn'; refresh.textContent = labels.refresh;
            refresh.addEventListener('click', snapshot);
            const size = document.createElement('input');
            size.type = 'range'; size.min = '100'; size.max = '360'; size.value = String(radius);
            size.setAttribute('aria-label', labels.size);
            size.addEventListener('input', () => { radius = Number(size.value); position(); });
            const close = document.createElement('button');
            close.type = 'button'; close.className = 'btn'; close.textContent = labels.close;
            close.addEventListener('click', () => { stop(); toggle?.focus(); });
            toolbar.append(title, refresh, size, close);
            document.body.append(toolbar);
        }
        if (!frame) snapshot();
        position();
    }

    function mount() {
        const section = document.querySelector('#account-menu');
        if (!section) return;
        toggle = document.createElement('button');
        toggle.type = 'button'; toggle.className = 'btn dm-comparison-toggle';
        toggle.dataset.dmComparisonUi = '';
        toggle.textContent = labels.compare;
        toggle.setAttribute('aria-pressed', 'false');
        const hint = document.createElement('p');
        hint.className = 'dm-comparison-hint'; hint.dataset.dmComparisonUi = '';
        hint.id = 'dm-comparison-hint'; hint.textContent = labels.hint;
        toggle.setAttribute('aria-describedby', hint.id);
        toggle.addEventListener('click', event => {
            event.stopPropagation();
            if (root.dataset.darkMode !== 'dark') return;
            pinned = !pinned;
            // Close Craft's native account disclosure before taking the snapshot.
            document.querySelector('[aria-controls="account-menu"][aria-expanded="true"]')?.click();
            update();
        });
        section.append(toggle, hint);
        const themeChanged = () => {
            toggle.disabled = root.dataset.darkMode !== 'dark';
            if (toggle.disabled) stop();
        };
        document.addEventListener('craft-dark-mode:change', themeChanged);
        themeChanged();
    }

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && active()) {
            event.preventDefault(); event.stopPropagation(); stop(); return;
        }
        if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey || editing(event.target) || event.composedPath?.().some(editing)) return;
        if (event.key !== 'Alt' && event.key !== 'Shift') return;
        if (root.dataset.darkMode !== 'dark' || held) return;
        event.preventDefault(); held = true; update();
    }, true);
    document.addEventListener('keyup', event => {
        if (held && (!event.altKey || !event.shiftKey)) { held = false; update(); }
    }, true);
    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    window.addEventListener('resize', scheduleSnapshot);
    document.addEventListener('scroll', syncScroll, true);
    document.addEventListener('pointermove', event => {
        if (helper(event.target)) return;
        point = { x: event.clientX, y: event.clientY };
        if (active() && !moveFrame) moveFrame = requestAnimationFrame(position);
    }, { passive: true });
    for (const name of ['click', 'input', 'change']) document.addEventListener(name, event => {
        if (!helper(event.target)) scheduleSnapshot();
    }, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
    else mount();
})();
