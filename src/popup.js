// Copyright (C) 2026 x0697x
(function () {
    'use strict';

    const settingsApi = globalThis.SteamPageToolsSettings;
    const extensionApi = globalThis.browser || globalThis.chrome;
    const form = document.getElementById('settings-form');
    const featureSettings = document.getElementById('feature-settings');
    const status = document.getElementById('save-status');
    const reloadSection = document.getElementById('reload-section');
    const reloadHint = document.getElementById('reload-hint');
    const reloadButton = document.getElementById('reload-tabs');
    const controls = [...form.querySelectorAll('[data-setting]')];
    let current = settingsApi.DEFAULTS;
    let saveQueue = Promise.resolve();

    function render(settings) {
        current = settingsApi.normalize(settings);

        for (const control of controls) {
            control.checked = current[control.dataset.setting];
            control.disabled = (
                control.dataset.setting !== 'enabled' &&
                !current.enabled
            );
        }

        featureSettings.classList.toggle('disabled', !current.enabled);
        featureSettings.setAttribute(
            'aria-disabled',
            String(!current.enabled)
        );
    }

    function readControls() {
        return settingsApi.normalize(Object.fromEntries(
            controls.map((control) => [
                control.dataset.setting,
                control.checked,
            ])
        ));
    }

    function setStatus(message, error = false) {
        status.textContent = message;
        status.classList.toggle('error', error);
    }

    function showReload(needed, hint) {
        reloadSection.hidden = !needed;
        if (hint) {
            reloadHint.textContent = hint;
        }
    }

    function save(settings) {
        saveQueue = saveQueue.then(async () => {
            await extensionApi.storage.local.set({
                [settingsApi.STORAGE_KEY]: settings,
            });
            setStatus('Saved.');
            showReload(true, 'Reload your open Steam tabs to apply changes.');
        }).catch((error) => {
            setStatus(`Could not save: ${error.message}`, true);
            showReload(true, 'Reload your open Steam tabs to try again.');
        });
    }

    form.addEventListener('change', () => {
        const next = readControls();

        render(next);
        setStatus('Saving...');
        showReload(false);
        save(next);
    });

    async function init() {
        try {
            const stored = await extensionApi.storage.local.get(
                settingsApi.STORAGE_KEY
            );

            render(stored[settingsApi.STORAGE_KEY]);
            setStatus('Settings loaded.');
            showReload(false);
        } catch (error) {
            render(settingsApi.DEFAULTS);
            setStatus(`Could not load: ${error.message}`, true);
            showReload(true, 'Reload your open Steam tabs to try again.');
        }
    }

    async function reloadTabs() {
        const secure = 'https:';
        const slash = '//';
        const patterns = [
            secure + slash + 'steamcommunity.com/my/friends',
            secure + slash + 'steamcommunity.com/my/inventory',
            secure + slash + 'steamcommunity.com/market/',
            secure + slash + 'steamcommunity.com/id/',
            secure + slash + 'steamcommunity.com/profiles/',
            secure + slash + 'store.steampowered.com/search',
            secure + slash + 'store.steampowered.com/wishlist',
        ];

        setStatus('Reloading Steam tabs…');
        showReload(false);

        const tabs = await extensionApi.tabs.query({});
        for (const tab of tabs) {
            if (tab.id === undefined || !tab.url) {
                continue;
            }
            if (patterns.some((prefix) => tab.url.startsWith(prefix))) {
                await extensionApi.tabs.reload(tab.id);
            }
        }

        setStatus('Tabs reloaded.');
    }

    reloadButton.addEventListener('click', reloadTabs);

    init();
})();
