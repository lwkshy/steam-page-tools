// Copyright (C) 2026 x0697x
(function () {
    'use strict';

    const STEAM_COMMUNITY_ORIGIN = 'https://steamcommunity.com';
    const STEAM_STORE_ORIGIN = 'https://store.steampowered.com';
    const STEAMSETS_PROFILE_ORIGIN = 'https://steamsets.com';
    const STEAMSETS_BADGE_SEARCH_URL =
        'https://beta.steamsets.com/badges/search';
    const STEAM_ICON_ORIGIN =
        'https://community.fastly.steamstatic.com/economy/image/';
    const STEAM_ID64_ACCOUNT_BASE = 76561197960265728n;

    function parsePinnedSteamUrl(value, requiredOrigin, base = requiredOrigin) {
        try {
            const url = new URL(value, base);

            return url.origin === requiredOrigin ? url : null;
        } catch {
            return null;
        }
    }

    function requirePinnedSteamUrl(value, requiredOrigin, base) {
        const url = parsePinnedSteamUrl(value, requiredOrigin, base);

        if (!url) {
            const err = new Error(
                `Refusing a URL outside ${requiredOrigin}`
            );

            err.fatal = true;
            throw err;
        }

        return url;
    }

    function requirePinnedSteamResponseUrl(
        response,
        requiredOrigin,
        requestUrl
    ) {
        return requirePinnedSteamUrl(
            response.url || requestUrl,
            requiredOrigin,
            requestUrl
        );
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function getSessionId() {
        if (window.g_sessionID) {
            return window.g_sessionID;
        }

        const match = document.cookie.match(/(?:^|;\s*)sessionid=([^;]+)/);

        return match ? decodeURIComponent(match[1]) : null;
    }

    function bindButtonActivation(element, handler) {
        element.addEventListener('click', handler);
        element.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handler();
            }
        });
    }

    function buildSteamSetsProfileButton(profileUrl) {
        const promo = document.createElement('a');

        promo.id = 'spt-steamsets-profile';
        promo.href = profileUrl;
        promo.target = '_blank';
        promo.rel = 'noopener noreferrer';
        promo.referrerPolicy = 'no-referrer';
        promo.title = 'Open this Steam user on SteamSets';
        promo.setAttribute(
            'aria-label',
            'View this Steam user on SteamSets (opens in a new tab)'
        );
        promo.style.cssText =
            'display:inline-flex; align-items:center; align-self:center; gap:5px; width:auto; height:32px; box-sizing:border-box; padding:4px 7px 4px 5px; border:1px solid rgba(178,99,236,.42); border-radius:3px; background:rgba(13,12,19,.72); color:#fff; text-decoration:none; font-family:"Motiva Sans",Arial,sans-serif; flex:0 0 auto; transition:background-color .15s,border-color .15s,box-shadow .15s;';

        // Match the self-contained badge-search mark without fetching a
        // SteamSets image or other remote runtime asset.
        const icon = document.createElement('span');

        icon.setAttribute('aria-hidden', 'true');
        icon.style.cssText =
            'display:flex; width:21px; height:21px; flex:0 0 21px;';
        icon.innerHTML = `
            <svg viewBox="0 0 134 130" fill="none" style="display:block;width:100%;height:100%;" xmlns="http://www.w3.org/2000/svg">
                <path d="M117.646 45.2406L133.817 107.179C134.569 110.018 132.939 112.341 130.181 112.341H65.4969C63.8671 112.341 63.7417 113.373 65.2462 114.535L66.1238 115.18C69.3835 117.89 69.0074 118.793 65.2462 117.245L33.4042 104.34C30.0191 102.92 30.0191 101.888 33.2789 101.888H72.3925C77.9089 101.888 81.1687 97.2418 79.7896 91.5636L67.7536 45.1115C67.0014 42.2724 68.6313 39.9495 71.3895 39.9495H111.506C114.136 40.0785 117.02 42.4014 117.646 45.2406Z" fill="url(#spt-steamsets-profile-gradient)"/>
                <path d="M16.3536 85.7563L.183 23.821C-.569 20.982 1.061 18.659 3.819 18.659H68.506C70.136 18.659 70.261 17.627 68.757 16.465L67.879 15.82C64.62 13.11 64.996 12.207 68.757 13.755L100.599 26.66C103.984 28.08 103.984 29.112 100.724 29.112H61.736C56.22 29.112 52.96 33.758 54.339 39.436L66.375 85.889C67.127 88.728 65.497 91.051 62.739 91.051H22.622C19.864 90.918 16.981 88.595 16.354 85.756Z" fill="url(#spt-steamsets-profile-gradient)"/>
                <defs>
                    <linearGradient id="spt-steamsets-profile-gradient" x1="0" y1="18.441" x2="133.051" y2="112.649" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#7652C9"/>
                        <stop offset="1" stop-color="#B263EC"/>
                    </linearGradient>
                </defs>
            </svg>
        `;

        const copy = document.createElement('span');

        copy.style.cssText =
            'display:flex; flex-direction:column; align-items:flex-start; line-height:1; white-space:nowrap;';

        const eyebrow = document.createElement('span');

        eyebrow.textContent = 'VIEW ON';
        eyebrow.style.cssText =
            'margin-bottom:1px; color:#9da4ad; font-size:6px; font-weight:600; line-height:6px; letter-spacing:.5px;';

        const wordmark = document.createElement('span');

        wordmark.style.cssText =
            'color:#fff; font-size:11px; font-weight:700; line-height:11px; letter-spacing:-.2px;';
        wordmark.appendChild(document.createTextNode('Steam'));

        const sets = document.createElement('span');

        sets.textContent = 'Sets';
        sets.style.color = '#a75ce5';
        wordmark.appendChild(sets);

        copy.appendChild(eyebrow);
        copy.appendChild(wordmark);
        promo.appendChild(icon);
        promo.appendChild(copy);

        function setHighlighted(isHighlighted) {
            promo.style.background = isHighlighted
                ? 'rgba(48,38,68,.92)'
                : 'rgba(13,12,19,.72)';
            promo.style.borderColor = isHighlighted
                ? 'rgba(178,99,236,.8)'
                : 'rgba(178,99,236,.42)';
            promo.style.boxShadow = isHighlighted
                ? '0 0 0 1px rgba(118,82,201,.18)'
                : '';
        }

        promo.addEventListener('mouseenter', () => setHighlighted(true));
        promo.addEventListener('mouseleave', () => setHighlighted(false));
        promo.addEventListener('focus', () => setHighlighted(true));
        promo.addEventListener('blur', () => setHighlighted(false));

        return promo;
    }

    function initSteamProfileTools() {
        if (
            !/^\/(?:id\/[^/]+|profiles\/\d+)\/?$/i
                .test(location.pathname)
        ) {
            return;
        }

        function getProfileSteamId() {
            const numericPath = location.pathname.match(
                /^\/profiles\/(\d{17})\/?$/i
            );

            if (numericPath) {
                return numericPath[1];
            }

            const pageSteamId = String(
                window.g_rgProfileData?.steamid || ''
            );

            if (/^\d{17}$/.test(pageSteamId)) {
                return pageSteamId;
            }

            const avatar = document.querySelector(
                '.profile_header [data-miniprofile]'
            );
            const accountIdText = avatar?.getAttribute('data-miniprofile')
                || '';

            if (!/^\d{1,10}$/.test(accountIdText)) {
                return null;
            }

            const accountId = BigInt(accountIdText);

            if (accountId > 0xffffffffn) {
                return null;
            }

            return (STEAM_ID64_ACCOUNT_BASE + accountId).toString();
        }

        function insertProfileButton() {
            if (document.getElementById('spt-steamsets-profile')) {
                return true;
            }

            const actions = document.querySelector(
                '.profile_header_actions'
            );
            const steamId = getProfileSteamId();

            if (!actions || !steamId) {
                return false;
            }

            const profileUrl = new URL(
                `/account/${steamId}`,
                STEAMSETS_PROFILE_ORIGIN
            );
            const button = buildSteamSetsProfileButton(profileUrl);
            const popup = actions.querySelector('.popup_block');

            actions.insertBefore(button, popup);

            return true;
        }

        // Profile metadata and actions can finish rendering after the content
        // script starts. Poll briefly and keep insertion idempotent.
        let attempts = 0;

        const interval = setInterval(() => {
            attempts += 1;

            if (insertProfileButton() || attempts > 20) {
                clearInterval(interval);
            }
        }, 250);
    }

    async function initEnabledFeatures() {
        const settings = await globalThis.SteamPageToolsSettings
            .waitForPageSettings();

        if (!settings.enabled) {
            return;
        }

        if (location.origin === STEAM_COMMUNITY_ORIGIN) {
            if (settings.profileTools) {
                initSteamProfileTools();
                initProfileCommentClearer();
            }

            if (settings.badgeTools) {
                initBadgesPageTools();
            }

            if (settings.friendsComments) {
                initFriendsPageTools();
            }

            if (settings.marketTools) {
                initMarketTools();
            }
        } else if (
            location.origin === STEAM_STORE_ORIGIN &&
            settings.storeTools
        ) {
            initSearchBulkCart();
            initWishlistWiper();
        }
    }

    initEnabledFeatures();

    // Profile comment removal shares the Profile tools setting with the
    // SteamSets profile shortcut.
    function initProfileCommentClearer() {
        if (
            !/^\/(?:my|id\/[^/]+|profiles\/\d{17})(?:\/allcomments)?\/?$/i
                .test(location.pathname)
        ) {
            return;
        }

        const LOCK_KEY = 'spt-profile-comment-clear-lock';
        const LOCK_TTL_MS = 30 * 1000;
        const DELETE_DELAY_MS = 800;
        const lockOwner =
            `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let heartbeat = null;
        let running = false;
        let stopRequested = false;

        function injectStyles() {
            if (document.querySelector('#spt-profile-comment-clear-styles')) {
                return;
            }

            const style = document.createElement('style');

            style.id = 'spt-profile-comment-clear-styles';
            style.textContent = `
                #spt-profile-comment-separator,
                #spt-clear-profile-comments,
                #spt-clear-profile-comments-status {
                    color: #ffffff !important;
                    display: block;
                    float: none;
                    font-family: "Motiva Sans", sans-serif !important;
                    font-size: 12px !important;
                    font-weight: 400 !important;
                    line-height: 30px !important;
                    text-decoration: none;
                }

                #spt-clear-profile-comments {
                    cursor: pointer;
                }

                #spt-clear-profile-comments:hover {
                    color: #e35d5b !important;
                }
            `;
            document.head.appendChild(style);
        }

        function signedInSteamId() {
            const knownSteamId = String(
                window.g_steamID || window.UserYou?.strSteamId || ''
            );

            if (/^\d{17}$/.test(knownSteamId)) {
                return knownSteamId;
            }

            // The profile comments page does not always expose g_steamID.
            // Steam does identify the signed-in author of its own comment box
            // with a 32-bit account ID, which can be converted locally.
            const accountId = document.querySelector(
                '.commentthread_entry .commentthread_user_avatar [data-miniprofile]'
            )?.getAttribute('data-miniprofile') || '';

            if (!/^\d+$/.test(accountId)) {
                return '';
            }

            try {
                return String(STEAM_ID64_ACCOUNT_BASE + BigInt(accountId));
            } catch {
                return '';
            }
        }

        function profileSteamId() {
            if (/^\/my(?:\/allcomments)?\/?$/i.test(location.pathname)) {
                return signedInSteamId();
            }

            const profileId = String(window.g_rgProfileData?.steamid || '');

            if (/^\d{17}$/.test(profileId)) {
                return profileId;
            }

            const numericPathId = location.pathname.match(
                /^\/profiles\/(\d{17})(?:\/|$)/i
            )?.[1];

            if (numericPathId) {
                return numericPathId;
            }

            // Steam's all-comments route does not consistently expose
            // g_rgProfileData. Its comment-thread key still names the profile
            // owner, both in the page DOM and after Steam initializes it.
            const threadKeys = [
                ...Object.keys(window.g_rgCommentThreads || {}),
                ...[...document.querySelectorAll('[id*="Profile_"]')]
                    .map((element) => element.id),
            ];

            for (const key of threadKeys) {
                const threadOwnerId = String(key).match(
                    /Profile_(\d{17})(?:_|$)/i
                )?.[1];

                if (threadOwnerId) {
                    return threadOwnerId;
                }
            }

            return '';
        }

        let ownerId = '';

        function ownProfileSteamId() {
            const signedInId = signedInSteamId();
            const profileId = profileSteamId();

            return /^\d{17}$/.test(signedInId) && profileId === signedInId
                ? profileId
                : '';
        }

        function readLock() {
            try {
                return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null');
            } catch {
                return null;
            }
        }

        function writeLock() {
            try {
                localStorage.setItem(
                    LOCK_KEY,
                    JSON.stringify({ owner: lockOwner, time: Date.now() })
                );
                return readLock()?.owner === lockOwner;
            } catch {
                return false;
            }
        }

        function acquireLock() {
            const lock = readLock();

            if (
                lock &&
                lock.owner !== lockOwner &&
                Number.isFinite(lock.time) &&
                Date.now() - lock.time < LOCK_TTL_MS
            ) {
                return false;
            }

            if (!writeLock()) {
                return false;
            }

            heartbeat = setInterval(writeLock, 10 * 1000);
            return true;
        }

        function releaseLock() {
            if (heartbeat !== null) {
                clearInterval(heartbeat);
                heartbeat = null;
            }

            try {
                if (readLock()?.owner === lockOwner) {
                    localStorage.removeItem(LOCK_KEY);
                }
            } catch {
                // A stale lock expires automatically if storage is unavailable.
            }
        }

        function sessionId() {
            if (window.g_sessionID) {
                return window.g_sessionID;
            }

            const match = document.cookie.match(
                /(?:^|;\s*)sessionid=([^;]+)/
            );

            return match ? decodeURIComponent(match[1]) : '';
        }

        async function loadCurrentComments(currentSessionId) {
            const url = requirePinnedSteamUrl(
                `/comment/Profile/render/${ownerId}/-1/`,
                STEAM_COMMUNITY_ORIGIN
            );
            const body = new URLSearchParams({
                count: '100',
                start: '0',
                newest_first: 'true',
                sessionid: currentSessionId,
            });
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                body: body.toString(),
            });

            requirePinnedSteamResponseUrl(
                response,
                STEAM_COMMUNITY_ORIGIN,
                url
            );

            if (!response.ok) {
                throw new Error(
                    `Steam returned HTTP ${response.status} while loading comments.`
                );
            }

            const result = await response.json();
            const doc = new DOMParser().parseFromString(
                String(result?.comments_html || ''),
                'text/html'
            );
            const commentIds = [...new Set(
                [...doc.querySelectorAll('[id^="comment_"]')]
                    .map((element) => element.id.slice('comment_'.length))
                    .filter((commentId) => /^\d+$/.test(commentId))
            )];

            const total = Number(result?.total_count);

            return {
                commentIds,
                total: Number.isSafeInteger(total) && total >= commentIds.length
                    ? total
                    : null,
            };
        }

        async function deleteComment(commentId, currentSessionId) {
            const url = requirePinnedSteamUrl(
                `/comment/Profile/delete/${ownerId}/-1/`,
                STEAM_COMMUNITY_ORIGIN
            );
            const body = new URLSearchParams({
                gidcomment: commentId,
                sessionid: currentSessionId,
            });
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                body: body.toString(),
            });

            requirePinnedSteamResponseUrl(
                response,
                STEAM_COMMUNITY_ORIGIN,
                url
            );

            let result = null;

            try {
                result = await response.json();
            } catch {
                // Steam can return HTML if the session expires.
            }

            if (
                response.ok &&
                (result?.success === 1 || result?.success === '1' ||
                    result?.success === true)
            ) {
                return;
            }

            throw new Error(
                String(result?.error ||
                    `Steam returned HTTP ${response.status} while deleting a comment.`)
            );
        }

        function installControl() {
            if (document.querySelector('#spt-clear-profile-comments')) {
                return true;
            }

            ownerId = ownProfileSteamId();

            if (!ownerId) {
                return false;
            }

            const subscription = document.querySelector(
                '.commentthread_subscribe_checkbox_ctn'
            );

            if (!subscription) {
                return false;
            }

            injectStyles();

            const separator = document.createElement('span');
            const button = document.createElement('a');
            const status = document.createElement('span');

            separator.textContent = '|';
            separator.id = 'spt-profile-comment-separator';
            separator.className = 'commentthread_subscribe_desc';
            separator.style.margin = '0 8px';
            button.id = 'spt-clear-profile-comments';
            button.className = 'commentthread_subscribe_desc';
            button.href = '#';
            button.textContent = 'Clear all comments';
            button.title = 'Delete every comment on this profile';
            button.style.cssText = 'float:none; margin:0;';
            status.id = 'spt-clear-profile-comments-status';
            status.setAttribute('aria-live', 'polite');
            status.style.marginLeft = '6px';
            subscription.append(separator, button, status);

            const setStatus = (message) => {
                status.textContent = message;
            };
            const resetButton = () => {
                button.textContent = 'Clear all comments';
                button.removeAttribute('aria-disabled');
            };

            button.addEventListener('click', async (event) => {
                event.preventDefault();

                if (running) {
                    stopRequested = true;
                    button.textContent = 'Stopping…';
                    button.setAttribute('aria-disabled', 'true');
                    setStatus('Stopping after the current request…');
                    return;
                }

                const currentSessionId = sessionId();

                if (!currentSessionId) {
                    setStatus('Your Steam session is unavailable. Reload and sign in again.');
                    return;
                }

                button.setAttribute('aria-disabled', 'true');
                button.textContent = 'Checking comments…';

                let firstPage;

                try {
                    firstPage = await loadCurrentComments(currentSessionId);
                } catch (err) {
                    resetButton();
                    setStatus(`Could not load comments: ${err.message}`);
                    return;
                }

                if (!firstPage.commentIds.length) {
                    resetButton();
                    setStatus('There are no comments to clear.');
                    return;
                }

                const count = firstPage.total ?? firstPage.commentIds.length;

                if (!window.confirm(
                    `Delete ${count} profile comment${count === 1 ? '' : 's'}?\n\n` +
                    'This cannot be undone. The extension will delete one comment at a time and stop if Steam rejects a request.'
                )) {
                    resetButton();
                    setStatus('Clear cancelled.');
                    return;
                }

                if (!acquireLock()) {
                    resetButton();
                    setStatus('Another tab is already clearing profile comments.');
                    return;
                }

                running = true;
                stopRequested = false;
                let deleted = 0;

                try {
                    let page = firstPage;

                    while (page.commentIds.length && !stopRequested) {
                        for (const commentId of page.commentIds) {
                            if (stopRequested) {
                                break;
                            }

                            button.textContent = 'Stop clearing';
                            button.removeAttribute('aria-disabled');
                            setStatus(`Deleted ${deleted} of ${count}…`);
                            await deleteComment(commentId, currentSessionId);
                            deleted += 1;

                            if (!stopRequested) {
                                await sleep(DELETE_DELAY_MS);
                            }
                        }

                        if (!stopRequested) {
                            page = await loadCurrentComments(currentSessionId);
                        }
                    }

                    setStatus(stopRequested
                        ? `Stopped after deleting ${deleted} comment${deleted === 1 ? '' : 's'}.`
                        : `Deleted ${deleted} comment${deleted === 1 ? '' : 's'}. Reload to update the page.`);
                } catch (err) {
                    setStatus(
                        `Stopped after ${deleted} deletion${deleted === 1 ? '' : 's'}: ${err.message}`
                    );
                } finally {
                    releaseLock();
                    running = false;
                    resetButton();
                }
            });

            return true;
        }

        let attempts = 0;
        const interval = setInterval(() => {
            attempts += 1;

            if (installControl() || attempts >= 40) {
                clearInterval(interval);
            }
        }, 250);
    }

    // Friends page tools.
    function initFriendsPageTools() {
        if (
            !/^\/(?:my\/friends|id\/[^/]+\/friends|profiles\/\d+\/friends)\/?$/i
                .test(location.pathname)
        ) {
            return;
        }

        const COMMENT_DELAY_MS = 3 * 1000;
        const FAILURE_DELAY_MS = 20 * 1000;
        const COOLDOWN_MIN_MS = 10 * 1000;
        const COOLDOWN_MAX_MS = 15 * 1000;
        const MAX_COOLDOWN_RETRIES = 3;
        const COMMENT_LOCK_KEY = 'spt-friends-comment-lock';
        const INVITE_LOCK_KEY = 'spt-friends-invite-lock';
        const COMMENT_SELECTION_KEY = 'spt-friends-comment-selection';
        const INVITE_SELECTION_KEY = 'spt-friends-invite-selection';
        const COMMENT_LOCK_TTL_MS = 30 * 1000;
        const lockOwner =
            `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let lockHeartbeat = null;
        let stopRequested = false;

        injectFriendsCommentStyles();

        let scanAttempts = 0;
        const scanInterval = setInterval(() => {
            scanAttempts += 1;

            const titleBar = document.querySelector(
                '.profile_friends.title_bar'
            );

            if (titleBar) {
                addFriendsCommentButton(titleBar);
                clearInterval(scanInterval);
            } else if (scanAttempts >= 40) {
                clearInterval(scanInterval);
            }
        }, 250);

        function getFriends() {
            const friends = new Map();

            document
                .querySelectorAll('.friend_block_v2[data-steamid]')
                .forEach((row) => {
                    const steamid = row.dataset.steamid;

                    if (!/^\d{17}$/.test(steamid || '')) {
                        return;
                    }

                    const nameElement = row.querySelector(
                        '.friend_block_content'
                    );
                    const nameNode = nameElement
                        ? [...nameElement.childNodes].find(
                            (node) => node.nodeType === 3 &&
                                node.textContent.trim()
                        )
                        : null;
                    const name = nameNode
                        ? nameNode.textContent.trim()
                        : `Steam ${steamid}`;
                    const avatarElement = row.querySelector(
                        '.player_avatar img'
                    );
                    const avatarUrl = avatarElement
                        ? String(
                            avatarElement.currentSrc ||
                            avatarElement.getAttribute('src') ||
                            ''
                        )
                        : '';

                    friends.set(steamid, { steamid, name, avatarUrl });
                });

            return [...friends.values()];
        }

        function readCommentLock() {
            try {
                return JSON.parse(
                    localStorage.getItem(
                        lockKeyForAction()
                    ) || 'null'
                );
            } catch {
                return null;
            }
        }

        function lockKeyForAction() {
            return currentAction === 'invite'
                ? INVITE_LOCK_KEY
                : COMMENT_LOCK_KEY;
        }

        function selectionKeyForAction() {
            return currentAction === 'invite'
                ? INVITE_SELECTION_KEY
                : COMMENT_SELECTION_KEY;
        }

        function writeCommentLock() {
            try {
                localStorage.setItem(
                    lockKeyForAction(),
                    JSON.stringify({ owner: lockOwner, time: Date.now() })
                );

                return readCommentLock()?.owner === lockOwner;
            } catch (err) {
                console.error(
                    'Steam Page Tools: failed to write friends comment lock',
                    err
                );
                return false;
            }
        }

        function acquireCommentLock() {
            const lock = readCommentLock();

            if (
                lock &&
                lock.owner !== lockOwner &&
                Number.isFinite(lock.time) &&
                Date.now() - lock.time < COMMENT_LOCK_TTL_MS
            ) {
                return false;
            }

            if (!writeCommentLock()) {
                return false;
            }

            lockHeartbeat = setInterval(writeCommentLock, 10 * 1000);
            return true;
        }

        function releaseCommentLock() {
            if (lockHeartbeat !== null) {
                clearInterval(lockHeartbeat);
                lockHeartbeat = null;
            }

            try {
                if (readCommentLock()?.owner === lockOwner) {
                    localStorage.removeItem(lockKeyForAction());
                }
            } catch (err) {
                console.warn(
                    'Steam Page Tools: failed to release friends comment lock',
                    err
                );
            }
        }

        // Restore the last explicitly chosen recipients. Missing, malformed,
        // or no-longer-listed Steam IDs are ignored so a first visit still
        // starts with nobody selected.
        function loadSavedFriendSelection() {
            try {
                const raw = localStorage.getItem(selectionKeyForAction());

                if (!raw) {
                    return [];
                }

                const parsed = JSON.parse(raw);

                if (!Array.isArray(parsed)) {
                    return [];
                }

                return [...new Set(
                    parsed
                        .map((steamid) => String(steamid))
                        .filter((steamid) => /^\d{17}$/.test(steamid))
                )];
            } catch (err) {
                console.error(
                    'Steam Page Tools: failed to read saved friend selection',
                    err
                );
                return [];
            }
        }

        function saveFriendSelection(steamids) {
            try {
                localStorage.setItem(
                    selectionKeyForAction(),
                    JSON.stringify([...steamids])
                );
            } catch (err) {
                console.error(
                    'Steam Page Tools: failed to save friend selection',
                    err
                );
            }
        }

        function getRetryAfterMs(response) {
            const value = response.headers.get('Retry-After');

            if (!value) {
                return 0;
            }

            const seconds = Number(value);

            if (Number.isFinite(seconds) && seconds >= 0) {
                return seconds * 1000;
            }

            const time = Date.parse(value);

            return Number.isFinite(time)
                ? Math.max(0, time - Date.now())
                : 0;
        }

        function isCommentDisabledError(message) {
            return /comments?.*(?:disabled|private|not\s+allowed|not\s+permitted)|(?:does\s+not|doesn't|do\s+not|don't).*allow.*comments?|settings?.*allow.*comments?|not\s+allowed\s+to\s+(?:add\s+)?comments?|permission.*comments?|comment\s+privileges?|blocked/i
                .test(message);
        }

        function isCooldownError(response, message) {
            return response.status === 429 || /too\s+many|rate[\s-]?limit|slow\s+down|too\s+(?:frequently|often)|try\s+again\s+(?:in|later)|temporarily|cooldown/i
                .test(message);
        }

        async function postProfileComment(friend, comment, sessionid) {
            const postUrl = requirePinnedSteamUrl(
                `/comment/Profile/post/${friend.steamid}/-1/`,
                STEAM_COMMUNITY_ORIGIN
            );

            // Ask Steam for stable English error strings so cooldown and
            // privacy-setting responses can be classified on any locale.
            postUrl.searchParams.set('l', 'english');

            const body = new URLSearchParams({
                comment,
                count: '6',
                sessionid,
                feature2: '-1',
            });
            const response = await fetch(postUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                body: body.toString(),
            });

            requirePinnedSteamResponseUrl(
                response,
                STEAM_COMMUNITY_ORIGIN,
                postUrl
            );

            let result = null;

            try {
                result = await response.json();
            } catch {
                // Steam can return an HTML error page for expired sessions.
            }

            if (response.ok && result?.success) {
                return;
            }

            const message = String(
                result?.error || `Steam returned HTTP ${response.status}`
            ).trim();
            const err = new Error(message);

            err.commentDisabled = isCommentDisabledError(message);
            err.cooldown =
                !err.commentDisabled && isCooldownError(response, message);
            err.cooldownMs = Math.max(
                getRetryAfterMs(response),
                COOLDOWN_MIN_MS + Math.floor(
                    Math.random() *
                    (COOLDOWN_MAX_MS - COOLDOWN_MIN_MS + 1)
                )
            );
            throw err;
        }

        function getSignedInSteamId() {
            const pageOwnerId = /^\/my\/friends\/?$/i.test(
                location.pathname
            )
                ? window.g_rgProfileData?.steamid
                : '';
            const steamid = String(
                window.g_steamID ||
                window.UserYou?.strSteamId ||
                pageOwnerId ||
                ''
            );

            return /^\d{17}$/.test(steamid) ? steamid : '';
        }

        function isOwnFriendsPage() {
            const currentSteamId = getSignedInSteamId();

            if (!currentSteamId) {
                return false;
            }

            if (/^\/my\/friends\/?$/i.test(location.pathname)) {
                return true;
            }

            const profileMatch = location.pathname.match(
                /^\/profiles\/(\d{17})\/friends\/?$/i
            );
            const pageSteamId = profileMatch?.[1] ||
                String(window.g_rgProfileData?.steamid || '');

            return pageSteamId === currentSteamId;
        }

        async function loadInviteGroups() {
            const steamid = getSignedInSteamId();

            if (!steamid || !isOwnFriendsPage()) {
                throw new Error(
                    'Group invitations are available only on your own friends page.'
                );
            }

            const groupsUrl = requirePinnedSteamUrl(
                `/profiles/${steamid}/ajaxgroupinvite`,
                STEAM_COMMUNITY_ORIGIN
            );

            groupsUrl.searchParams.set('new_profile', '1');
            groupsUrl.searchParams.set('bulk', '1');

            const response = await fetch(groupsUrl, {
                credentials: 'include',
                headers: { Accept: 'text/html' },
            });

            requirePinnedSteamResponseUrl(
                response,
                STEAM_COMMUNITY_ORIGIN,
                groupsUrl
            );

            if (!response.ok) {
                throw new Error(
                    `Steam returned HTTP ${response.status} while loading groups.`
                );
            }

            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const groups = new Map();

            doc.querySelectorAll(
                '.group_list_results [data-groupid]'
            ).forEach((element) => {
                const groupId = element.getAttribute('data-groupid') || '';

                if (!/^\d{17,20}$/.test(groupId)) {
                    return;
                }

                const name = element.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

                groups.set(groupId, {
                    groupId,
                    name: name || `Steam group ${groupId}`,
                });
            });

            if (!groups.size) {
                throw new Error(
                    'Steam did not return any groups you can invite friends to.'
                );
            }

            return [...groups.values()];
        }

        async function inviteFriendToGroup(friend, groupId, sessionid) {
            const inviteUrl = requirePinnedSteamUrl(
                '/actions/GroupInvite',
                STEAM_COMMUNITY_ORIGIN
            );
            const body = new URLSearchParams({
                group: groupId,
                invitee: friend.steamid,
                json: '1',
                sessionID: sessionid,
                type: 'groupInvite',
            });
            const response = await fetch(inviteUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                },
                body: body.toString(),
            });

            requirePinnedSteamResponseUrl(
                response,
                STEAM_COMMUNITY_ORIGIN,
                inviteUrl
            );

            let result = null;

            try {
                result = await response.json();
            } catch {
                // Steam can return an HTML error page for expired sessions.
            }

            if (response.ok) {
                return {
                    duplicate: result?.duplicate === true ||
                        result?.duplicate === 1 ||
                        result?.duplicate === '1',
                };
            }

            const message = String(
                result?.error || `Steam returned HTTP ${response.status}`
            ).trim();
            const err = new Error(message);

            err.cooldown =
                response.status === 429 ||
                /too\s+many|rate[\s-]?limit|slow\s+down|try\s+again\s+later|cooldown/i
                    .test(message);
            throw err;
        }

        function addFriendsCommentButton(titleBar) {
            if (document.querySelector('#spt-friends-comment-button')) {
                return;
            }

            const button = document.createElement('button');

            button.id = 'spt-friends-comment-button';
            button.type = 'button';
            button.className =
                'profile_friends manage_link ' +
                'btnv6_blue_hoverfade btn_medium';

            const label = document.createElement('span');

            label.textContent = 'Comment friends';
            button.appendChild(label);
            button.addEventListener('click', () => {
                openFriendsDialog('comment');
            });

            const addButton = titleBar.querySelector('#add_friends_button');
            const manageButton = Array.from(
                titleBar.querySelectorAll('.profile_friends.manage_link')
            ).find((candidate) => candidate !== addButton);
            const getTitleBarItem = (element) => {
                let item = element;

                while (item && item.parentElement !== titleBar) {
                    item = item.parentElement;
                }

                return item?.parentElement === titleBar ? item : null;
            };
            const manageItem = getTitleBarItem(manageButton);
            const addItem = getTitleBarItem(addButton);
            const actions = document.createElement('span');

            actions.id = 'spt-friends-title-actions';
            titleBar.insertBefore(actions, manageItem || addItem || null);

            if (manageItem) {
                actions.appendChild(manageItem);
            }

            if (isOwnFriendsPage()) {
                const inviteButton = document.createElement('button');

                inviteButton.id = 'spt-friends-invite-button';
                inviteButton.type = 'button';
                inviteButton.className =
                    'profile_friends manage_link ' +
                    'btnv6_blue_hoverfade btn_medium';

                const inviteLabel = document.createElement('span');

                inviteLabel.textContent = 'Invite to group';
                inviteButton.appendChild(inviteLabel);
                inviteButton.addEventListener(
                    'click',
                    openFriendsInviteDialog
                );
                actions.appendChild(inviteButton);
            }

            actions.appendChild(button);

            if (addItem && addItem !== manageItem) {
                actions.appendChild(addItem);
            }
        }

        async function openFriendsInviteDialog(event) {
            const button = event.currentTarget;
            const label = button.querySelector('span');

            button.disabled = true;
            label.textContent = 'Loading groups...';

            try {
                const groups = await loadInviteGroups();

                openFriendsDialog('invite', groups);
            } catch (err) {
                console.error(
                    'Steam Page Tools: failed to load groups for invitations',
                    err
                );
                window.alert(
                    `Could not load your Steam groups: ${err.message}`
                );
            } finally {
                button.disabled = false;
                label.textContent = 'Invite to group';
            }
        }

        let currentAction = 'comment';

        function openFriendsDialog(action, inviteGroups = []) {
            if (document.querySelector('#spt-friends-comment-overlay')) {
                return;
            }

            currentAction = action;
            const isInvite = action === 'invite';
            const friends = getFriends();

            if (!friends.length) {
                window.alert(
                    'Steam Page Tools could not find any friends on this page.'
                );
                return;
            }

            stopRequested = false;

            const overlay = document.createElement('div');

            overlay.id = 'spt-friends-comment-overlay';

            const dialog = document.createElement('div');

            dialog.id = 'spt-friends-comment-dialog';
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            dialog.setAttribute('aria-labelledby', 'spt-friends-comment-title');

            const header = document.createElement('div');

            header.className = 'spt-friends-comment-header';

            const title = document.createElement('div');

            title.id = 'spt-friends-comment-title';
            title.textContent = isInvite
                ? 'Invite friends to a group'
                : 'Post a comment to friends';

            const closeButton = document.createElement('button');

            closeButton.type = 'button';
            closeButton.className = 'spt-friends-comment-close';
            closeButton.textContent = '\u00d7';
            closeButton.title = 'Close';
            closeButton.setAttribute('aria-label', 'Close');

            header.appendChild(title);
            header.appendChild(closeButton);

            const content = document.createElement('div');

            content.className = 'spt-friends-comment-content';

            const description = document.createElement('p');

            const pace = document.createElement('p');

            pace.className = 'spt-friends-comment-note';
            pace.textContent = isInvite
                ? 'Invitations are sent one at a time with a 3-second delay. ' +
                    'Steam may limit invitations.'
                : 'There is a 3-second delay between comments. Profiles that ' +
                    'do not accept comments are skipped automatically.';

            const knownSteamIds = new Set(
                friends.map((friend) => friend.steamid)
            );
            const selectedSteamIds = new Set(
                loadSavedFriendSelection().filter((steamid) =>
                    knownSteamIds.has(steamid)
                )
            );
            const selector = document.createElement('section');

            selector.className = 'spt-friends-selector';
            selector.setAttribute(
                'aria-labelledby',
                'spt-friends-selector-title'
            );

            const selectorHeader = document.createElement('div');

            selectorHeader.className = 'spt-friends-selector-header';

            const selectorTitle = document.createElement('div');

            selectorTitle.id = 'spt-friends-selector-title';
            selectorTitle.className = 'spt-friends-selector-title';
            selectorTitle.textContent = isInvite
                ? 'Choose friends to invite'
                : 'Choose friends';

            const selectionCount = document.createElement('div');

            selectionCount.className = 'spt-friends-selection-count';
            selectionCount.setAttribute('aria-live', 'polite');

            selectorHeader.appendChild(selectorTitle);
            selectorHeader.appendChild(selectionCount);

            const selectorControls = document.createElement('div');

            selectorControls.className = 'spt-friends-selector-controls';

            const friendSearch = document.createElement('input');

            friendSearch.type = 'search';
            friendSearch.className = 'spt-friends-search';
            friendSearch.placeholder = 'Search friends...';
            friendSearch.autocomplete = 'off';
            friendSearch.spellcheck = false;
            friendSearch.setAttribute('aria-label', 'Search friends');

            const selectShownButton = makeDialogButton(
                'Select shown',
                false
            );
            const clearShownButton = makeDialogButton(
                'Clear shown',
                false
            );

            selectShownButton.title =
                'Select every friend matching the current search';
            clearShownButton.title =
                'Clear every friend matching the current search';

            selectorControls.appendChild(friendSearch);
            selectorControls.appendChild(selectShownButton);
            selectorControls.appendChild(clearShownButton);

            const friendList = document.createElement('div');

            friendList.className = 'spt-friends-selector-list';
            friendList.setAttribute('role', 'group');
            friendList.setAttribute(
                'aria-label',
                isInvite
                    ? 'Friends who will receive a group invitation'
                    : 'Friends who will receive the profile comment'
            );

            const friendOptions = friends.map((friend) => {
                const row = document.createElement('label');

                row.className = 'spt-friends-selector-row';

                const checkbox = document.createElement('input');

                checkbox.type = 'checkbox';
                checkbox.value = friend.steamid;
                checkbox.checked = selectedSteamIds.has(friend.steamid);
                checkbox.setAttribute(
                    'aria-label',
                    isInvite
                        ? `Invite ${friend.name} to the selected group`
                        : `Post the comment to ${friend.name}`
                );

                let avatar;

                if (friend.avatarUrl) {
                    avatar = document.createElement('img');
                    avatar.src = friend.avatarUrl;
                    avatar.alt = '';
                    avatar.loading = 'lazy';
                    avatar.referrerPolicy = 'no-referrer';
                } else {
                    avatar = document.createElement('span');
                    avatar.textContent = friend.name.slice(0, 1);
                    avatar.setAttribute('aria-hidden', 'true');
                }

                avatar.className = 'spt-friends-selector-avatar';

                const name = document.createElement('span');

                name.className = 'spt-friends-selector-name';
                name.textContent = friend.name;

                row.appendChild(checkbox);
                row.appendChild(avatar);
                row.appendChild(name);
                friendList.appendChild(row);

                return {
                    checkbox,
                    friend,
                    row,
                    searchText: normalizeFriendSearch(friend.name),
                };
            });

            const noFriendMatches = document.createElement('div');

            noFriendMatches.className = 'spt-friends-selector-empty';
            noFriendMatches.textContent = 'No friends match this search.';
            noFriendMatches.hidden = true;
            friendList.appendChild(noFriendMatches);

            selector.appendChild(selectorHeader);
            selector.appendChild(selectorControls);
            selector.appendChild(friendList);

            const groupControl = document.createElement('div');

            groupControl.className = 'spt-friends-group-control';
            groupControl.hidden = !isInvite;

            const groupLabel = document.createElement('label');

            groupLabel.htmlFor = 'spt-friends-group-select';
            groupLabel.textContent = 'Group';

            const groupSelect = document.createElement('select');

            groupSelect.id = 'spt-friends-group-select';
            groupSelect.className = 'spt-friends-group-select';
            groupSelect.setAttribute('aria-label', 'Choose a Steam group');

            const emptyGroupOption = document.createElement('option');

            emptyGroupOption.value = '';
            emptyGroupOption.textContent = 'Select a group...';
            groupSelect.appendChild(emptyGroupOption);

            inviteGroups.forEach((group) => {
                const option = document.createElement('option');

                option.value = group.groupId;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });

            groupControl.appendChild(groupLabel);
            groupControl.appendChild(groupSelect);

            let textarea;
            let characterCount;
            if (!isInvite) {
                textarea = document.createElement('textarea');

                textarea.id = 'spt-friends-comment-text';
                textarea.className = 'commentthread_textarea';
                textarea.rows = 5;
                textarea.maxLength = 1000;
                textarea.placeholder = 'Enter the profile comment to post';
                textarea.setAttribute('aria-label', 'Profile comment');

                characterCount = document.createElement('div');

                characterCount.className = 'spt-friends-character-count';
                characterCount.textContent = '0 / 1000';
            }

            const progress = document.createElement('div');

            progress.className = 'spt-friends-progress';
            progress.hidden = true;

            const progressTrack = document.createElement('div');

            progressTrack.className = 'spt-friends-progress-track';

            const progressFill = document.createElement('div');

            progressFill.className = 'spt-friends-progress-fill';
            progressTrack.appendChild(progressFill);

            const counters = document.createElement('div');

            counters.className = 'spt-friends-counters';

            const status = document.createElement('div');

            status.className = 'spt-friends-comment-status';
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');

            progress.appendChild(progressTrack);
            progress.appendChild(counters);
            progress.appendChild(status);

            const actions = document.createElement('div');

            actions.className = 'spt-friends-comment-actions';

            const cancelButton = makeDialogButton('Cancel', false);
            const startButton = makeDialogButton(
                isInvite ? 'Start inviting' : 'Start posting',
                true
            );
            const stopButton = makeDialogButton('Stop after current', false);

            stopButton.hidden = true;
            actions.appendChild(cancelButton);
            actions.appendChild(stopButton);
            actions.appendChild(startButton);

            content.appendChild(description);
            content.appendChild(pace);
            content.appendChild(selector);
            content.appendChild(groupControl);
            if (!isInvite) {
                content.appendChild(textarea);
                content.appendChild(characterCount);
            }
            content.appendChild(progress);
            content.appendChild(actions);
            dialog.appendChild(header);
            dialog.appendChild(content);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            let running = false;

            function makeDialogButton(text, primary) {
                const button = document.createElement('button');

                button.type = 'button';
                button.className = primary
                    ? 'btnv6_blue_hoverfade btn_medium'
                    : 'btn_grey_white_innerfade btn_medium';

                const label = document.createElement('span');

                label.textContent = text;
                button.appendChild(label);
                return button;
            }

            function normalizeFriendSearch(value) {
                return String(value || '')
                    .normalize('NFKD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .toLocaleLowerCase();
            }

            let visibleFriendCount = friends.length;

            function updateSelectionSummary() {
                const selectedCount = selectedSteamIds.size;

                description.textContent = isInvite
                    ? `A group invitation will be sent to ${selectedCount} ` +
                        'selected friend(s), one at a time.'
                    : 'The same public profile comment will be posted to ' +
                        `${selectedCount} selected friend(s), one at a time.`;
                selectionCount.textContent =
                    `${selectedCount} selected · ` +
                    `${visibleFriendCount} shown`;
                startButton.disabled = selectedCount === 0 ||
                    (isInvite && !groupSelect.value);
            }

            function applyFriendFilter() {
                const query = normalizeFriendSearch(friendSearch.value);

                visibleFriendCount = 0;

                friendOptions.forEach((option) => {
                    const isVisible =
                        !query || option.searchText.includes(query);

                    option.row.hidden = !isVisible;
                    visibleFriendCount += isVisible ? 1 : 0;
                });

                noFriendMatches.hidden = visibleFriendCount !== 0;
                updateSelectionSummary();
            }

            function setShownFriendsSelected(selected) {
                friendOptions.forEach((option) => {
                    if (option.row.hidden) {
                        return;
                    }

                    option.checkbox.checked = selected;

                    if (selected) {
                        selectedSteamIds.add(option.friend.steamid);
                    } else {
                        selectedSteamIds.delete(option.friend.steamid);
                    }
                });

                saveFriendSelection(selectedSteamIds);
                updateSelectionSummary();
            }

            function disableFriendSelector() {
                friendSearch.disabled = true;
                selectShownButton.disabled = true;
                clearShownButton.disabled = true;
                groupSelect.disabled = true;

                friendOptions.forEach((option) => {
                    option.checkbox.disabled = true;
                });
            }

            function closeDialog() {
                if (!running) {
                    document.removeEventListener('keydown', onKeyDown);
                    overlay.remove();
                }
            }

            function onKeyDown(event) {
                if (event.key !== 'Escape' || running) {
                    return;
                }

                closeDialog();
            }

            function setStatus(text) {
                status.textContent = text;
            }

            function setCounters(posted, skipped, failed) {
                counters.textContent = isInvite
                    ? `Invited: ${posted}  |  Skipped: ${skipped}  |  ` +
                        `Failed: ${failed}`
                    : `Posted: ${posted}  |  Skipped: ${skipped}  |  ` +
                        `Failed: ${failed}`;
            }

            function setProgress(completed, total) {
                const percentage = total
                    ? (completed / total) * 100
                    : 0;

                progressFill.style.width = `${percentage}%`;
            }

            async function waitWithStatus(milliseconds, label) {
                const endTime = Date.now() + milliseconds;

                while (!stopRequested && Date.now() < endTime) {
                    const seconds = Math.ceil(
                        (endTime - Date.now()) / 1000
                    );

                    setStatus(`${label} ${seconds}s...`);
                    await sleep(Math.min(1000, endTime - Date.now()));
                }

                return !stopRequested;
            }

            async function run() {
                const comment = isInvite ? '' : textarea.value.trim();
                const selectedGroup = isInvite
                    ? inviteGroups.find(
                        (group) => group.groupId === groupSelect.value
                    )
                    : null;

                if (!isInvite && !comment) {
                    setStatus('Enter a comment before starting.');
                    textarea.focus();
                    return;
                }

                if (isInvite && !selectedGroup) {
                    setStatus('Choose a group before starting.');
                    groupSelect.focus();
                    return;
                }

                const selectedFriends = friends.filter((friend) =>
                    selectedSteamIds.has(friend.steamid)
                );

                if (!selectedFriends.length) {
                    setStatus('Select at least one friend before starting.');
                    friendSearch.focus();
                    return;
                }

                const sessionid = getSessionId();

                if (!sessionid) {
                    setStatus(
                        'Could not find your Steam session ID. Refresh the page and try again.'
                    );
                    return;
                }

                const confirmed = isInvite
                    ? window.confirm(
                        `Invite ${selectedFriends.length} friend(s) to ` +
                        `${selectedGroup.name}?\n\n` +
                        'Invitations will be sent one at a time. You can stop ' +
                        'after the current request.'
                    )
                    : window.confirm(
                        `Post this comment publicly to ` +
                        `${selectedFriends.length} friend profile(s)?\n\n` +
                        'The run can take a long time. You can stop it after ' +
                        'the current request, but comments already posted ' +
                        'will remain.'
                    );

                if (!confirmed) {
                    return;
                }

                if (!acquireCommentLock()) {
                    setStatus(
                        isInvite
                            ? 'Another group-invitation run is already active in a Steam tab.'
                            : 'Another friends-comment run is already active in a Steam tab.'
                    );
                    return;
                }

                running = true;
                if (!isInvite) {
                    textarea.disabled = true;
                }
                disableFriendSelector();
                startButton.hidden = true;
                cancelButton.hidden = true;
                closeButton.disabled = true;
                stopButton.hidden = false;
                progress.hidden = false;

                let posted = 0;
                let skipped = 0;
                let failed = 0;
                let completed = 0;
                let stoppedForCooldown = false;

                setCounters(posted, skipped, failed);

                try {
                    for (
                        let index = 0;
                        index < selectedFriends.length;
                        index += 1
                    ) {
                        if (stopRequested) {
                            break;
                        }

                        const friend = selectedFriends[index];
                        let cooldownRetries = 0;
                        let handled = false;
                        let failedRequest = false;

                        while (!stopRequested && !handled) {
                            setStatus(
                                `${isInvite ? 'Inviting' : 'Posting'} ` +
                                `${index + 1} of ` +
                                `${selectedFriends.length}: ` +
                                `${friend.name}...`
                            );

                            try {
                                if (isInvite) {
                                    const result = await inviteFriendToGroup(
                                        friend,
                                        selectedGroup.groupId,
                                        sessionid
                                    );

                                    if (result.duplicate) {
                                        skipped += 1;
                                    } else {
                                        posted += 1;
                                    }
                                } else {
                                    await postProfileComment(
                                        friend,
                                        comment,
                                        sessionid
                                    );
                                    posted += 1;
                                }
                                handled = true;
                            } catch (err) {
                                console.error(
                                    isInvite
                                        ? 'Steam Page Tools: failed to invite friend to group'
                                        : 'Steam Page Tools: failed to post profile comment',
                                    friend.steamid,
                                    err
                                );

                                if (err.cooldown) {
                                    if (isInvite) {
                                        failed += 1;
                                        failedRequest = true;
                                        handled = true;
                                        stoppedForCooldown = true;
                                        stopRequested = true;
                                        continue;
                                    }

                                    cooldownRetries += 1;

                                    if (
                                        cooldownRetries >
                                        MAX_COOLDOWN_RETRIES
                                    ) {
                                        stoppedForCooldown = true;
                                        stopRequested = true;
                                        break;
                                    }

                                    const cooldownSeconds = Math.ceil(
                                        err.cooldownMs / 1000
                                    );
                                    const canContinue = await waitWithStatus(
                                        err.cooldownMs,
                                        `Steam requested a cooldown. Retrying ` +
                                        `${friend.name} in`
                                    );

                                    if (!canContinue) {
                                        break;
                                    }

                                    setStatus(
                                        `Cooldown of ${cooldownSeconds}s finished.`
                                    );
                                    continue;
                                }

                                if (err.commentDisabled) {
                                    skipped += 1;
                                } else {
                                    failed += 1;
                                    failedRequest = true;
                                }

                                handled = true;
                            }
                        }

                        if (handled) {
                            completed += 1;
                            setProgress(
                                completed,
                                selectedFriends.length
                            );
                            setCounters(posted, skipped, failed);
                        }

                        if (
                            !stopRequested &&
                            index < selectedFriends.length - 1
                        ) {
                            await waitWithStatus(
                                failedRequest
                                    ? isInvite
                                        ? COMMENT_DELAY_MS
                                        : FAILURE_DELAY_MS
                                    : COMMENT_DELAY_MS,
                                failedRequest
                                    ? isInvite
                                        ? `Invite failed for ${friend.name}. ` +
                                            'Continuing with the next friend in'
                                        : `Failed on ${friend.name}. ` +
                                            'Continuing with the next profile in'
                                    : 'Waiting before the next profile:'
                            );
                        }
                    }

                    if (stoppedForCooldown) {
                        setStatus(
                            isInvite
                                ? 'Stopped because Steam requested a cooldown. Wait before starting another invitation run.'
                                : 'Stopped after Steam kept requesting a cooldown. ' +
                                    'Wait before starting a new run.'
                        );
                    } else if (stopRequested) {
                        setStatus(
                            isInvite
                                ? `Stopped. ${posted} invited, ${skipped} skipped, ${failed} failed.`
                                : `Stopped. ${posted} posted, ${skipped} skipped, ${failed} failed.`
                        );
                    } else {
                        setStatus(
                            isInvite
                                ? `Finished. ${posted} invited, ${skipped} skipped, ${failed} failed.`
                                : `Finished. ${posted} posted, ${skipped} skipped, ${failed} failed.`
                        );
                    }
                } finally {
                    releaseCommentLock();
                    running = false;
                    stopButton.hidden = true;
                    closeButton.disabled = false;
                    cancelButton.hidden = false;
                    cancelButton.querySelector('span').textContent = 'Close';
                }
            }

            if (!isInvite) {
                textarea.addEventListener('input', () => {
                    characterCount.textContent =
                        `${textarea.value.length} / ${textarea.maxLength}`;
                });
            }
            groupSelect.addEventListener('change', updateSelectionSummary);
            friendOptions.forEach((option) => {
                option.checkbox.addEventListener('change', () => {
                    if (option.checkbox.checked) {
                        selectedSteamIds.add(option.friend.steamid);
                    } else {
                        selectedSteamIds.delete(option.friend.steamid);
                    }

                    saveFriendSelection(selectedSteamIds);
                    updateSelectionSummary();
                });
            });
            friendSearch.addEventListener('input', applyFriendFilter);
            selectShownButton.addEventListener('click', () => {
                setShownFriendsSelected(true);
            });
            clearShownButton.addEventListener('click', () => {
                setShownFriendsSelected(false);
            });
            closeButton.addEventListener('click', closeDialog);
            cancelButton.addEventListener('click', closeDialog);
            startButton.addEventListener('click', run);
            stopButton.addEventListener('click', () => {
                stopRequested = true;
                stopButton.disabled = true;
                stopButton.querySelector('span').textContent = 'Stopping...';
                setStatus('Stopping after the current request...');
            });
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    closeDialog();
                }
            });
            document.addEventListener('keydown', onKeyDown);

            applyFriendFilter();
            (isInvite ? groupSelect : textarea).focus();
        }

        function injectFriendsCommentStyles() {
            if (document.querySelector('#spt-friends-comment-styles')) {
                return;
            }

            const style = document.createElement('style');

            style.id = 'spt-friends-comment-styles';
            style.textContent = `
                #spt-friends-title-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-left: auto;
                }

                #spt-friends-title-actions > * {
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                }

                #spt-friends-comment-button,
                #spt-friends-invite-button {
                    flex: 0 0 auto;
                }

                #spt-friends-comment-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 100000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    box-sizing: border-box;
                    background: rgba(0, 0, 0, 0.72);
                    font-family: "Motiva Sans", Arial, sans-serif;
                }

                #spt-friends-comment-dialog {
                    display: flex;
                    flex-direction: column;
                    width: min(660px, calc(100vw - 32px));
                    max-height: calc(100vh - 32px);
                    color: #d6d7d8;
                    background: #171a21;
                    border: 1px solid #2a475e;
                    box-shadow: 0 0 18px #000000;
                }

                .spt-friends-comment-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 48px;
                    padding: 0 16px;
                    color: #ffffff;
                    background: linear-gradient(
                        90deg,
                        rgba(42, 71, 94, 0.95),
                        rgba(27, 40, 56, 0.95)
                    );
                    font-size: 20px;
                    font-weight: 300;
                }

                .spt-friends-comment-close {
                    border: 0;
                    padding: 0 3px 5px;
                    color: #8f98a0;
                    background: transparent;
                    cursor: pointer;
                    font: 30px/1 Arial, sans-serif;
                }

                .spt-friends-comment-close:hover:not(:disabled) {
                    color: #ffffff;
                }

                .spt-friends-comment-close:disabled {
                    cursor: default;
                    opacity: 0.4;
                }

                .spt-friends-comment-content {
                    overflow-y: auto;
                    padding: 18px;
                    font-size: 14px;
                    line-height: 1.45;
                }

                .spt-friends-comment-content p {
                    margin: 0 0 10px;
                }

                .spt-friends-comment-note {
                    color: #8f98a0;
                    font-size: 12px;
                }

                .spt-friends-selector {
                    margin-top: 14px;
                    overflow: hidden;
                    background: #101820;
                    border: 1px solid #000000;
                    box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.65);
                }

                .spt-friends-selector-header {
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 9px 10px 7px;
                    background: rgba(42, 71, 94, 0.42);
                }

                .spt-friends-selector-title {
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 500;
                }

                .spt-friends-selection-count {
                    color: #8f98a0;
                    font-size: 11px;
                    text-align: right;
                }

                .spt-friends-selector-controls {
                    display: grid;
                    grid-template-columns: minmax(140px, 1fr) auto auto;
                    gap: 6px;
                    padding: 8px;
                    background: #16202b;
                    border-top: 1px solid rgba(103, 193, 241, 0.1);
                }

                .spt-friends-search {
                    box-sizing: border-box;
                    min-width: 0;
                    height: 28px;
                    padding: 4px 8px;
                    color: #d6d7d8;
                    background: #222b35;
                    border: 1px solid #000000;
                    border-radius: 2px;
                    box-shadow: inset 0 0 4px #000000;
                    font: 12px/1.4 "Motiva Sans", Arial, sans-serif;
                }

                .spt-friends-search:focus {
                    border-color: #67c1f1;
                    outline: 0;
                }

                .spt-friends-search::placeholder {
                    color: #6f7882;
                }

                .spt-friends-selector-controls .btn_medium {
                    margin: 0;
                    white-space: nowrap;
                }

                .spt-friends-selector-list {
                    max-height: 220px;
                    overflow-y: auto;
                    scrollbar-color: #4b667a #17212b;
                }

                .spt-friends-selector-row {
                    display: grid;
                    grid-template-columns: 18px 34px minmax(0, 1fr);
                    align-items: center;
                    gap: 9px;
                    min-height: 42px;
                    padding: 4px 10px;
                    color: #c7d5e0;
                    background: rgba(27, 40, 56, 0.58);
                    border-top: 1px solid rgba(255, 255, 255, 0.025);
                    cursor: pointer;
                    box-sizing: border-box;
                }

                .spt-friends-selector-row:nth-child(even) {
                    background: rgba(34, 49, 65, 0.58);
                }

                .spt-friends-selector-row:hover {
                    color: #ffffff;
                    background: rgba(42, 71, 94, 0.82);
                }

                .spt-friends-selector-row input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    margin: 0;
                    cursor: pointer;
                }

                .spt-friends-selector-row input[type="checkbox"]:disabled {
                    cursor: default;
                    opacity: 0.55;
                }

                .spt-friends-selector-avatar {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    overflow: hidden;
                    color: #67c1f1;
                    background: #1b2838;
                    border: 1px solid #3f5364;
                    object-fit: cover;
                    box-sizing: border-box;
                    font-size: 14px;
                    text-transform: uppercase;
                }

                .spt-friends-selector-name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .spt-friends-selector-empty {
                    padding: 18px 10px;
                    color: #8f98a0;
                    text-align: center;
                    font-size: 12px;
                }

                .spt-friends-selector-row[hidden],
                .spt-friends-selector-empty[hidden] {
                    display: none;
                }

                .spt-friends-group-control {
                    display: grid;
                    gap: 6px;
                    margin-top: 14px;
                    color: #c7d5e0;
                    font-size: 12px;
                }

                .spt-friends-group-control[hidden] {
                    display: none;
                }

                .spt-friends-group-select {
                    box-sizing: border-box;
                    width: 100%;
                    min-height: 32px;
                    padding: 5px 8px;
                    color: #d6d7d8;
                    background: #222b35;
                    border: 1px solid #000000;
                    border-radius: 2px;
                    box-shadow: inset 0 0 4px #000000;
                    font: 13px/1.4 "Motiva Sans", Arial, sans-serif;
                }

                .spt-friends-group-select:focus {
                    border-color: #67c1f1;
                    outline: 0;
                }

                .spt-friends-group-select:disabled {
                    opacity: 0.65;
                }

                #spt-friends-comment-text {
                    display: block;
                    box-sizing: border-box;
                    width: 100%;
                    min-height: 110px;
                    margin-top: 14px;
                    padding: 10px;
                    resize: vertical;
                    overflow: auto;
                    color: #d6d7d8;
                    background: #222b35;
                    border: 1px solid #000000;
                    border-radius: 2px;
                    box-shadow: inset 0 0 4px #000000;
                    font: 14px/1.4 "Motiva Sans", Arial, sans-serif;
                }

                #spt-friends-comment-text:focus {
                    border-color: #67c1f1;
                    outline: 0;
                }

                #spt-friends-comment-text:disabled {
                    opacity: 0.65;
                }

                .spt-friends-character-count {
                    margin-top: 4px;
                    color: #8f98a0;
                    text-align: right;
                    font-size: 11px;
                }

                .spt-friends-progress {
                    margin-top: 14px;
                }

                .spt-friends-progress-track {
                    height: 8px;
                    overflow: hidden;
                    background: #0e141b;
                    border: 1px solid #000000;
                }

                .spt-friends-progress-fill {
                    width: 0;
                    height: 100%;
                    background: linear-gradient(90deg, #1a9fff, #66c0f4);
                    transition: width 0.2s ease;
                }

                .spt-friends-counters {
                    margin-top: 8px;
                    color: #8f98a0;
                    font-size: 12px;
                }

                .spt-friends-comment-status {
                    min-height: 38px;
                    margin-top: 6px;
                    color: #c7d5e0;
                    font-size: 12px;
                }

                .spt-friends-comment-actions {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 16px;
                }

                .spt-friends-comment-actions button[hidden],
                .spt-friends-progress[hidden] {
                    display: none;
                }

                @media (max-width: 600px) {
                    .spt-friends-selector-controls {
                        grid-template-columns: 1fr 1fr;
                    }

                    .spt-friends-search {
                        grid-column: 1 / -1;
                    }
                }
            `;

            document.head.appendChild(style);
        }
    }



    // Badge page tools.
    function initBadgesPageTools() {
        if (
            !/^\/(?:id\/[^/]+|profiles\/\d+)\/badges\/?$/i
                .test(location.pathname)
        ) {
            return;
        }

        // Prefer locale-independent markers; use English text only when
        // neither structural marker is available.
        const DROPS_REGEX_FALLBACK = /(\d+)\s*card drops?\s*remaining/i;

        function getRows(root = document) {
            return [...root.querySelectorAll('.badge_row')];
        }

        function normalizeBadgeSearchText(value) {
            return String(value || '')
                .normalize('NFKD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase()
                .replace(/\s+/g, ' ')
                .trim();
        }

        function createBadgeSearchTermPattern(term) {
            const escapedTerm = term.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            return new RegExp(
                `(?:^|[^\\p{L}\\p{N}])${escapedTerm}`,
                'u'
            );
        }

        // A badge_info_title is rendered only when this profile owns the
        // badge. Index both its badge name and the parent game/event title.
        function getOwnedBadgeSearchText(row) {
            const badgeName = row.querySelector(
                '.badge_info_title'
            )?.textContent.trim();

            if (!badgeName) {
                return null;
            }

            const title = row.querySelector('.badge_title');
            const gameName = title
                ? [...title.childNodes]
                    .filter((node) => node.nodeType === 3)
                    .map((node) => node.textContent.trim())
                    .find(Boolean) || ''
                : '';

            return normalizeBadgeSearchText(
                `${gameName} ${badgeName}`
            );
        }

        // Steam renders the "Play Game" control only while a badge has card
        // drops. Its CSS class is stable across interface languages.
        function hasDropsRemaining(row) {
            if (row.querySelector('.badge_title_playgame, .badge_title_stats_playgame')) {
                return true;
            }

            if (row.querySelector('.badge_title_stats_completed')) {
                return false;
            }

            // Fall back to Steam's English status text for ambiguous rows.
            return DROPS_REGEX_FALLBACK.test(row.textContent);
        }

        function getCurrentPageNumber() {
            const page = parseInt(
                requirePinnedSteamUrl(
                    location.href,
                    STEAM_COMMUNITY_ORIGIN
                ).searchParams.get('p') || '1',
                10
            );

            return page > 0 ? page : 1;
        }

        function buildPageUrl(pageNum) {
            const url = requirePinnedSteamUrl(
                location.href,
                STEAM_COMMUNITY_ORIGIN
            );

            url.searchParams.set('p', pageNum);

            return url.toString();
        }

        async function fetchPageRows(pageNum) {
            const pageUrl = requirePinnedSteamUrl(
                buildPageUrl(pageNum),
                STEAM_COMMUNITY_ORIGIN
            );
            const res = await fetch(pageUrl, { credentials: 'include' });

            requirePinnedSteamResponseUrl(
                res,
                STEAM_COMMUNITY_ORIGIN,
                pageUrl
            );

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            return getRows(doc);
        }

        // Read Steam's pagination instead of inferring the page count from
        // fetched content. Callers include the current page, which is a span.
        function getMaxPageFromPagination() {
            const here = requirePinnedSteamUrl(
                location.href,
                STEAM_COMMUNITY_ORIGIN
            );

            const values = [...document.querySelectorAll('a[href*="p="]')]
                .map((a) => {
                    try {
                        const url = parsePinnedSteamUrl(
                            a.href,
                            STEAM_COMMUNITY_ORIGIN,
                            location.href
                        );

                        if (!url || url.pathname !== here.pathname) {
                            return NaN;
                        }

                        return parseInt(url.searchParams.get('p'), 10);
                    } catch {
                        return NaN;
                    }
                })
                .filter((n) => Number.isFinite(n) && n > 0);

            return values.length ? Math.max(...values) : null;
        }

        // Prevent runaway scans if Steam returns malformed pagination.
        const MAX_PAGES = 200;
        const MAX_CRAFT_PASSES = 10;
        const MAX_CRAFT_BATCHES = 500;
        const CRAFT_LOCK_KEY = 'spt-badge-auto-craft-lock';
        const CRAFT_LOCK_TTL_MS = 60 * 1000;
        const craftLockOwner =
            `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        let craftLockUsesStorage = true;

        async function fetchPageRowsWithRetry(pageNum) {
            for (let attempt = 0; attempt < 2; attempt += 1) {
                try {
                    return await fetchPageRows(pageNum);
                } catch (err) {
                    console.error(
                        'Steam Page Tools: failed loading badge page',
                        pageNum,
                        err
                    );

                    if (attempt === 0) {
                        await sleep(500);
                    }
                }
            }

            return null;
        }

        function getProfileUrlFromUrl(url) {
            if (!url) {
                return null;
            }

            try {
                const parsed = parsePinnedSteamUrl(
                    url,
                    STEAM_COMMUNITY_ORIGIN,
                    location.href
                );

                if (!parsed) {
                    return null;
                }

                const match = parsed.pathname.match(
                    /^\/(?:id\/[^/]+|profiles\/\d+)/i
                );

                return match
                    ? `${STEAM_COMMUNITY_ORIGIN}${match[0]}`
                    : null;
            } catch {
                return null;
            }
        }

        function normalizeProfileUrl(url) {
            const profileUrl = getProfileUrlFromUrl(url);

            return profileUrl ? profileUrl.toLowerCase() : null;
        }

        const profileUrl =
            getProfileUrlFromUrl(window.g_strProfileURL) ||
            getProfileUrlFromUrl(location.href);

        // The metadata matches every profile, so compare numeric IDs or the
        // signed-in profile link before exposing account-specific controls.
        function isProbablyOwnProfilePage() {
            if (!profileUrl) {
                return false;
            }

            const numericMatch = new URL(profileUrl).pathname.match(
                /^\/profiles\/(\d+)$/i
            );

            if (
                numericMatch &&
                window.g_steamID &&
                numericMatch[1] === String(window.g_steamID)
            ) {
                return true;
            }

            const signedInProfileLink = document.querySelector(
                '#global_header a.user_avatar[href], ' +
                '#responsive_page_menu .persona a[data-miniprofile][href]'
            );

            return Boolean(
                signedInProfileLink &&
                normalizeProfileUrl(signedInProfileLink.href) ===
                    normalizeProfileUrl(profileUrl)
            );
        }

        // Revalidate ownership through Steam's /my/ redirect immediately
        // before consuming cards.
        async function verifyOwnProfilePage() {
            const numericMatch = profileUrl
                ? new URL(profileUrl).pathname.match(/^\/profiles\/(\d+)$/i)
                : null;

            if (
                numericMatch &&
                window.g_steamID &&
                numericMatch[1] === String(window.g_steamID)
            ) {
                return true;
            }

            try {
                const ownershipUrl = requirePinnedSteamUrl(
                    '/my/badges/',
                    STEAM_COMMUNITY_ORIGIN
                );
                const res = await fetch(ownershipUrl, {
                    credentials: 'include',
                });
                const redirectUrl = requirePinnedSteamResponseUrl(
                    res,
                    STEAM_COMMUNITY_ORIGIN,
                    ownershipUrl
                );

                return Boolean(
                    res.ok &&
                    redirectUrl &&
                    normalizeProfileUrl(redirectUrl) ===
                        normalizeProfileUrl(profileUrl)
                );
            } catch (err) {
                console.error(
                    'Steam Page Tools: failed verifying profile ownership',
                    err
                );
                return false;
            }
        }

        function getBadgeName(row, appid, borderColor) {
            const title = row.querySelector('.badge_title');

            if (title) {
                const textNode = [...title.childNodes]
                    .find((node) => (
                        node.nodeType === 3 && node.textContent.trim()
                    ));

                if (textNode) {
                    return textNode.textContent.trim();
                }
            }

            return `App ${appid}${borderColor === '1' ? ' (foil)' : ''}`;
        }

        // Steam's composite row ID keeps normal and foil badges distinct
        // without relying on localized text.
        function getCraftTarget(row) {
            const button = row.querySelector(
                '.badge_progress_info > a.badge_craft_button[href*="/gamecards/"]'
            );
            const idMatch = row.id.match(
                /^badge_gamebadge_(\d+)_(\d+)_(\d+)$/
            );

            if (!button || !idMatch) {
                return null;
            }

            const detailUrl = parsePinnedSteamUrl(
                button.href,
                STEAM_COMMUNITY_ORIGIN,
                location.href
            );

            if (!detailUrl) {
                return null;
            }

            const appMatch = detailUrl.pathname.match(
                /\/gamecards\/(\d+)(?:\/|$)/i
            );
            const [, appid, series, borderColor] = idMatch;

            if (!appMatch || appMatch[1] !== appid) {
                return null;
            }

            return {
                key: `${appid}:${series}:${borderColor}`,
                appid,
                series,
                borderColor,
                detailUrl: detailUrl.toString(),
                name: getBadgeName(row, appid, borderColor),
            };
        }

        function parseCraftCall(code) {
            if (!code) {
                return null;
            }

            const match = code.match(
                /Profile_CraftGameBadge\(\s*(['"])([^'"]+)\1\s*,\s*['"](\d+)['"]\s*,\s*['"](\d+)['"]\s*,\s*['"](\d+)['"]\s*,\s*(\d+)\s*\)/
            );

            if (!match) {
                return null;
            }

            return {
                profileUrl: match[2],
                appid: match[3],
                series: match[4],
                borderColor: match[5],
                levels: parseInt(match[6], 10),
            };
        }

        async function fetchCraftOptionOnce(target) {
            const detailUrl = requirePinnedSteamUrl(
                target.detailUrl,
                STEAM_COMMUNITY_ORIGIN
            );
            const res = await fetch(detailUrl, {
                credentials: 'include',
            });
            const responseUrl = requirePinnedSteamResponseUrl(
                res,
                STEAM_COMMUNITY_ORIGIN,
                detailUrl
            );

            if (!res.ok) {
                const err = new Error(`HTTP ${res.status}`);

                err.fatal = res.status === 401 || res.status === 403;
                throw err;
            }

            if (res.url) {
                if (/\/login(?:\/|$)/i.test(responseUrl.pathname)) {
                    const err = new Error('Steam asked you to sign in again');

                    err.fatal = true;
                    throw err;
                }
            }

            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            if (doc.querySelector('#loginForm, input[name="password"]')) {
                const err = new Error('Steam asked you to sign in again');

                err.fatal = true;
                throw err;
            }

            const options = [
                ...doc.querySelectorAll(
                    '.gamecard_badge_craftbtn_ctn ' +
                    '.badge_craft_button[onclick*="Profile_CraftGameBadge"]'
                ),
            ]
                .map((button) => parseCraftCall(button.getAttribute('onclick')))
                .filter((option) => (
                    option &&
                    option.appid === target.appid &&
                    option.series === target.series &&
                    option.borderColor === target.borderColor &&
                    normalizeProfileUrl(option.profileUrl) ===
                        normalizeProfileUrl(profileUrl) &&
                    Number.isFinite(option.levels) &&
                    option.levels >= 1 &&
                    option.levels <= 5
                ));

            if (!options.length) {
                return null;
            }

            return options.reduce((largest, option) => (
                option.levels > largest.levels ? option : largest
            ));
        }

        async function fetchCraftOption(target) {
            let lastError = null;

            for (let attempt = 0; attempt < 2; attempt += 1) {
                try {
                    return await fetchCraftOptionOnce(target);
                } catch (err) {
                    lastError = err;

                    if (err.fatal || attempt === 1) {
                        break;
                    }

                    await sleep(600);
                }
            }

            throw lastError;
        }

        function getRetryDelayMs(res) {
            const value = res.headers && res.headers.get('Retry-After');

            if (!value) {
                return 5000;
            }

            const seconds = parseInt(value, 10);

            if (Number.isFinite(seconds)) {
                return Math.min(Math.max(seconds * 1000, 1000), 30000);
            }

            const retryAt = Date.parse(value);

            return Number.isFinite(retryAt)
                ? Math.min(Math.max(retryAt - Date.now(), 1000), 30000)
                : 5000;
        }

        async function postCraft(target, levels, sessionid) {
            const craftUrl = requirePinnedSteamUrl(
                `${profileUrl}/ajaxcraftbadge/`,
                STEAM_COMMUNITY_ORIGIN
            );
            const body = new URLSearchParams({
                appid: target.appid,
                series: target.series,
                border_color: target.borderColor,
                levels: String(levels),
                sessionid,
            });

            let res;

            try {
                res = await fetch(craftUrl, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: body.toString(),
                });
                requirePinnedSteamResponseUrl(
                    res,
                    STEAM_COMMUNITY_ORIGIN,
                    craftUrl
                );
            } catch (cause) {
                if (cause.fatal) {
                    throw cause;
                }

                const err = new Error('The craft response was not received');

                err.ambiguous = true;
                err.cause = cause;
                throw err;
            }

            let text;

            try {
                text = await res.text();
            } catch (cause) {
                const err = new Error('The craft response could not be read');

                err.ambiguous = true;
                err.cause = cause;
                throw err;
            }

            let data = null;

            try {
                data = JSON.parse(text);
            } catch {
                // Validation below rejects non-JSON craft responses.
            }

            if (!res.ok) {
                const message =
                    data && (data.strError || data.message);
                const err = new Error(message || `HTTP ${res.status}`);

                err.status = res.status;
                err.fatal = res.status === 401 || res.status === 403;
                err.retryAfterMs =
                    res.status === 429 ? getRetryDelayMs(res) : 0;
                err.ambiguous = res.status >= 500;
                throw err;
            }

            if (!data || !data.Badge || typeof data.Badge !== 'object') {
                const err = new Error('Steam returned an unexpected craft response');

                err.ambiguous = true;
                throw err;
            }

            return data;
        }

        function readCraftLock() {
            if (!craftLockUsesStorage) {
                return null;
            }

            let raw;

            try {
                raw = localStorage.getItem(CRAFT_LOCK_KEY);
            } catch {
                craftLockUsesStorage = false;
                return null;
            }

            if (!raw) {
                return null;
            }

            try {
                return JSON.parse(raw);
            } catch {
                // Treat malformed lock data as stale without disabling
                // storage-backed cross-tab protection.
                return null;
            }
        }

        function writeCraftLock() {
            if (!craftLockUsesStorage) {
                return true;
            }

            try {
                localStorage.setItem(CRAFT_LOCK_KEY, JSON.stringify({
                    owner: craftLockOwner,
                    expiresAt: Date.now() + CRAFT_LOCK_TTL_MS,
                }));
                return true;
            } catch {
                craftLockUsesStorage = false;
                return true;
            }
        }

        function acquireCraftLock() {
            const current = readCraftLock();

            if (
                current &&
                current.owner !== craftLockOwner &&
                current.expiresAt > Date.now()
            ) {
                return false;
            }

            writeCraftLock();

            const saved = readCraftLock();

            return !craftLockUsesStorage || (
                saved &&
                saved.owner === craftLockOwner
            );
        }

        function refreshCraftLock() {
            const current = readCraftLock();

            if (
                current &&
                current.owner !== craftLockOwner &&
                current.expiresAt > Date.now()
            ) {
                return false;
            }

            return writeCraftLock();
        }

        function releaseCraftLock() {
            const current = readCraftLock();

            if (!craftLockUsesStorage || !current) {
                return;
            }

            if (current.owner === craftLockOwner) {
                try {
                    localStorage.removeItem(CRAFT_LOCK_KEY);
                } catch {
                    craftLockUsesStorage = false;
                }
            }
        }

        // Rows parsed from fetched badge pages retain Steam's transparent
        // placeholder. Steam's page script normally promotes this attribute
        // when a row enters the viewport, but it does not observe our clones.
        function activateDelayedBadgeArtwork(row) {
            row.querySelectorAll('img[data-delayed-image]')
                .forEach((image) => {
                    const source = image.getAttribute(
                        'data-delayed-image'
                    );

                    if (!source) {
                        return;
                    }

                    image.src = source;
                    image.loading = 'lazy';
                    image.decoding = 'async';
                    image.removeAttribute('data-delayed-image');
                    image.removeAttribute('data-delayed-image-group');
                });
        }

        function insertBadgeSearch(container, currentRows) {
            const searchBar = document.createElement('div');

            searchBar.id = 'spt-owned-badge-search';
            searchBar.style.cssText =
                'display:flex; align-items:flex-start; justify-content:flex-start; gap:10px; margin:10px 0; flex-wrap:wrap;';

            const searchField = document.createElement('div');

            searchField.style.cssText =
                'display:flex; flex-direction:column; gap:3px; width:320px; max-width:100%; flex:0 1 320px; min-width:0;';

            const input = document.createElement('input');

            input.id = 'spt-owned-badge-search-input';
            input.type = 'search';
            input.placeholder = 'Search owned badges...';
            input.setAttribute(
                'aria-label',
                'Search this profile\u2019s owned badges'
            );
            input.autocomplete = 'off';
            input.spellcheck = false;
            input.maxLength = 100;
            input.style.cssText =
                'width:100%; height:22px; box-sizing:border-box; padding:0 8px; border:1px solid #000; border-radius:3px; background:#2a3f5a; color:#fff; font-family:"Motiva Sans",Arial,sans-serif; font-size:12px; box-shadow:1px 1px 0 rgba(255,255,255,.1);';

            const searchStatus = document.createElement('span');

            searchStatus.id = 'spt-owned-badge-search-status';
            searchStatus.setAttribute('role', 'status');
            searchStatus.setAttribute('aria-live', 'polite');
            searchStatus.style.cssText =
                'display:block; color:#8f98a0; font-size:12px; line-height:14px; text-align:left;';

            searchField.appendChild(input);
            searchField.appendChild(searchStatus);
            searchBar.appendChild(searchField);
            container.insertBefore(searchBar, currentRows[0]);

            // Search aggregates every matching row onto this page. Preserve
            // Steam's inline pagination styles so the server-side pager can be
            // hidden for search mode and restored exactly when it ends.
            function getPaginationElements() {
                const pagingContainers = [
                    ...document.querySelectorAll('.profile_paging'),
                ];

                return pagingContainers.length
                    ? pagingContainers
                    : [
                        ...document.querySelectorAll(
                            '.profile_paging_summary, .profile_paging_links'
                        ),
                    ];
            }

            const paginationDisplays = new Map();
            const paginationHideReasons = new Set();
            const indexProgressListeners = new Set();
            let indexedBadges = null;
            let buildingBadgeIndex = null;
            let indexPromise = null;
            let resultClones = [];
            let searchActive = false;
            let searchVersion = 0;
            let debounceTimer = null;
            let beforeSearch = () => {};

            function setPaginationHidden(isHidden, reason = 'search') {
                if (isHidden) {
                    paginationHideReasons.add(reason);
                } else {
                    paginationHideReasons.delete(reason);
                }

                if (paginationHideReasons.size) {
                    getPaginationElements().forEach((element) => {
                        if (!paginationDisplays.has(element)) {
                            paginationDisplays.set(element, {
                                value: element.style.getPropertyValue('display'),
                                priority: element.style.getPropertyPriority(
                                    'display'
                                ),
                            });
                        }

                        element.style.setProperty(
                            'display',
                            'none',
                            'important'
                        );
                    });
                    return;
                }

                paginationDisplays.forEach((display, element) => {
                    if (display.value) {
                        element.style.setProperty(
                            'display',
                            display.value,
                            display.priority
                        );
                    } else {
                        element.style.removeProperty('display');
                    }
                });
                paginationDisplays.clear();
            }

            function removeResultClones() {
                resultClones.forEach((row) => row.remove());
                resultClones = [];
            }

            function clearSearch(resetInput = true) {
                window.clearTimeout(debounceTimer);
                searchVersion += 1;
                indexProgressListeners.clear();

                if (resetInput) {
                    input.value = '';
                }

                removeResultClones();

                if (searchActive) {
                    currentRows.forEach((row) => {
                        row.style.display = '';
                    });
                }

                searchActive = false;
                setPaginationHidden(false);
                searchStatus.textContent = '';
            }

            function notifyBadgeIndexProgress(update) {
                indexProgressListeners.forEach((listener) => {
                    listener(update);
                });
            }

            async function buildBadgeIndex() {
                const currentPage = getCurrentPageNumber();
                const detectedMaxPage = Math.max(
                    currentPage,
                    getMaxPageFromPagination() || 1
                );
                const maxPage = Math.min(detectedMaxPage, MAX_PAGES);
                const index = {
                    badges: [],
                    failedPages: 0,
                    loadingPage: null,
                    maxPage,
                    processedPages: 0,
                    truncated: detectedMaxPage > MAX_PAGES,
                };

                buildingBadgeIndex = index;

                for (let page = 1; page <= maxPage; page += 1) {
                    index.loadingPage = page;
                    notifyBadgeIndexProgress({
                        badges: [],
                        index,
                        loading: true,
                        page,
                        snapshot: false,
                    });

                    let pageRows;
                    const pageBadges = [];

                    if (page === currentPage) {
                        pageRows = currentRows;
                    } else {
                        pageRows = await fetchPageRowsWithRetry(page);
                    }

                    if (pageRows === null) {
                        index.failedPages += 1;
                    } else {
                        pageRows.forEach((row) => {
                            const text = getOwnedBadgeSearchText(row);

                            if (text) {
                                const badge = { row, text };

                                index.badges.push(badge);
                                pageBadges.push(badge);
                            }
                        });
                    }

                    index.loadingPage = null;
                    index.processedPages = page;
                    notifyBadgeIndexProgress({
                        badges: pageBadges,
                        index,
                        loading: false,
                        page,
                        snapshot: false,
                    });

                    if (page < maxPage) {
                        await sleep(100);
                    }
                }

                return index;
            }

            async function getBadgeIndex(onProgress) {
                if (indexedBadges) {
                    return indexedBadges;
                }

                const buildAlreadyRunning = Boolean(indexPromise);

                if (onProgress) {
                    indexProgressListeners.add(onProgress);
                }

                try {
                    if (!indexPromise) {
                        indexPromise = buildBadgeIndex()
                            .then((index) => {
                                indexedBadges = index;
                                return index;
                            })
                            .finally(() => {
                                buildingBadgeIndex = null;
                                indexPromise = null;
                            });
                    }

                    if (
                        buildAlreadyRunning &&
                        buildingBadgeIndex &&
                        onProgress
                    ) {
                        onProgress({
                            badges: buildingBadgeIndex.badges,
                            index: buildingBadgeIndex,
                            loading: Boolean(
                                buildingBadgeIndex.loadingPage
                            ),
                            page: buildingBadgeIndex.loadingPage ||
                                buildingBadgeIndex.processedPages,
                            snapshot: true,
                        });
                    }

                    return await indexPromise;
                } finally {
                    if (onProgress) {
                        indexProgressListeners.delete(onProgress);
                    }
                }
            }

            function appendMatchingBadges(badges, termPatterns) {
                let appended = 0;

                badges.forEach(({ row, text }) => {
                    if (
                        !termPatterns.every((pattern) => pattern.test(text))
                    ) {
                        return;
                    }

                    const clone = row.cloneNode(true);

                    clone.removeAttribute('id');
                    clone.dataset.sptBadgeSearchClone = '1';
                    clone.style.display = '';
                    activateDelayedBadgeArtwork(clone);
                    container.appendChild(clone);
                    resultClones.push(clone);
                    appended += 1;
                });

                return appended;
            }

            function renderResultSummary(index, matchCount) {
                // Steam can refresh its paging controls while results render.
                // Re-query and enforce search mode after the clones are added.
                setPaginationHidden(true);

                const countText = matchCount === 1
                    ? '1 owned badge'
                    : `${matchCount} owned badges`;
                const sourcePageText = index.maxPage === 1
                    ? '1 source page'
                    : `${index.maxPage} source pages`;
                const notes = [];

                if (index.failedPages) {
                    notes.push(
                        `${index.failedPages} page(s) could not be loaded`
                    );
                }

                if (index.truncated) {
                    notes.push(`search limited to ${MAX_PAGES} pages`);
                }

                searchStatus.textContent =
                    `Found ${countText} across ${sourcePageText}. ` +
                    'All matches are shown below.' +
                    (notes.length ? ` ${notes.join('; ')}.` : '');
            }

            async function runSearch(rawQuery) {
                const version = ++searchVersion;
                const query = normalizeBadgeSearchText(rawQuery);
                const termPatterns = query
                    .split(' ')
                    .filter(Boolean)
                    .map(createBadgeSearchTermPattern);
                let matchCount = 0;
                let renderedFromProgress = false;

                beforeSearch();
                searchActive = true;
                setPaginationHidden(true);
                removeResultClones();
                currentRows.forEach((row) => {
                    row.style.display = 'none';
                });
                searchStatus.textContent = 'Loading owned badges...';

                function handleProgress(update) {
                    if (
                        version !== searchVersion ||
                        !input.value.trim()
                    ) {
                        return;
                    }

                    if (update.snapshot || !update.loading) {
                        matchCount += appendMatchingBadges(
                            update.badges,
                            termPatterns
                        );
                        renderedFromProgress = true;
                    }

                    setPaginationHidden(true);

                    const countText = matchCount === 1
                        ? '1 owned badge'
                        : `${matchCount} owned badges`;

                    searchStatus.textContent = update.loading
                        ? `Found ${countText} so far. Loading page ` +
                            `${update.page} of ${update.index.maxPage}...`
                        : `Found ${countText} so far. Searched page ` +
                            `${update.page} of ${update.index.maxPage}...`;
                }

                let index;

                try {
                    index = await getBadgeIndex(handleProgress);
                } catch (err) {
                    if (
                        version !== searchVersion ||
                        !input.value.trim()
                    ) {
                        return;
                    }

                    throw err;
                }

                if (
                    version !== searchVersion ||
                    !input.value.trim()
                ) {
                    return;
                }

                if (!renderedFromProgress) {
                    matchCount = appendMatchingBadges(
                        index.badges,
                        termPatterns
                    );
                }

                renderResultSummary(index, matchCount);
            }

            input.addEventListener('input', () => {
                window.clearTimeout(debounceTimer);
                searchVersion += 1;
                indexProgressListeners.clear();

                if (!input.value.trim()) {
                    clearSearch(false);
                    return;
                }

                setPaginationHidden(true);
                debounceTimer = setTimeout(() => {
                    runSearch(input.value).catch((err) => {
                        console.error(
                            'Steam Page Tools: badge search failed',
                            err
                        );

                        if (input.value.trim()) {
                            removeResultClones();
                            currentRows.forEach((row) => {
                                row.style.display = '';
                            });
                            searchActive = false;
                            setPaginationHidden(false);
                            searchStatus.textContent =
                                'Badge search could not be loaded. Try again.';
                        }
                    });
                }, 200);
            });

            input.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && input.value) {
                    event.preventDefault();
                    clearSearch();
                    input.focus();
                }
            });

            return {
                clear: clearSearch,
                element: searchBar,
                setBeforeSearch(handler) {
                    beforeSearch = handler;
                },
                setDisabled(isDisabled) {
                    input.disabled = isDisabled;
                    input.style.opacity = isDisabled ? '0.6' : '';
                },
                setFilterPaginationHidden(isHidden) {
                    setPaginationHidden(isHidden, 'filter');
                },
            };
        }

        function buildSteamSetsPromo() {
            const promo = document.createElement('a');

            promo.id = 'spt-steamsets-promo';
            promo.href = STEAMSETS_BADGE_SEARCH_URL;
            promo.target = '_blank';
            promo.rel = 'noopener noreferrer';
            promo.referrerPolicy = 'no-referrer';
            promo.title = 'Open SteamSets badge search tools';
            promo.setAttribute(
                'aria-label',
                'Search badges with SteamSets (opens in a new tab)'
            );
            promo.style.cssText =
                'display:inline-flex; align-items:center; gap:5px; width:auto; height:22px; box-sizing:border-box; padding:1px 7px 1px 5px; border:1px solid rgba(178,99,236,.42); border-radius:3px; background:rgba(13,12,19,.72); color:#fff; text-decoration:none; font-family:"Motiva Sans",Arial,sans-serif; flex:0 0 auto; transition:background-color .15s,border-color .15s,box-shadow .15s;';

            // Keep the feature self-contained: the inline mark does not load
            // any image, stylesheet, script, or other remote resource.
            const icon = document.createElement('span');

            icon.setAttribute('aria-hidden', 'true');
            icon.style.cssText =
                'display:flex; width:17px; height:17px; flex:0 0 17px;';
            icon.innerHTML = `
                <svg viewBox="0 0 134 130" fill="none" style="display:block;width:100%;height:100%;" xmlns="http://www.w3.org/2000/svg">
                    <path d="M117.646 45.2406L133.817 107.179C134.569 110.018 132.939 112.341 130.181 112.341H65.4969C63.8671 112.341 63.7417 113.373 65.2462 114.535L66.1238 115.18C69.3835 117.89 69.0074 118.793 65.2462 117.245L33.4042 104.34C30.0191 102.92 30.0191 101.888 33.2789 101.888H72.3925C77.9089 101.888 81.1687 97.2418 79.7896 91.5636L67.7536 45.1115C67.0014 42.2724 68.6313 39.9495 71.3895 39.9495H111.506C114.136 40.0785 117.02 42.4014 117.646 45.2406Z" fill="url(#spt-steamsets-gradient)"/>
                    <path d="M16.3536 85.7563L.183 23.821C-.569 20.982 1.061 18.659 3.819 18.659H68.506C70.136 18.659 70.261 17.627 68.757 16.465L67.879 15.82C64.62 13.11 64.996 12.207 68.757 13.755L100.599 26.66C103.984 28.08 103.984 29.112 100.724 29.112H61.736C56.22 29.112 52.96 33.758 54.339 39.436L66.375 85.889C67.127 88.728 65.497 91.051 62.739 91.051H22.622C19.864 90.918 16.981 88.595 16.354 85.756Z" fill="url(#spt-steamsets-gradient)"/>
                    <defs>
                        <linearGradient id="spt-steamsets-gradient" x1="0" y1="18.441" x2="133.051" y2="112.649" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#7652C9"/>
                            <stop offset="1" stop-color="#B263EC"/>
                        </linearGradient>
                    </defs>
                </svg>
            `;

            const copy = document.createElement('span');

            copy.style.cssText =
                'display:flex; flex-direction:column; align-items:flex-start; line-height:1; white-space:nowrap;';

            const eyebrow = document.createElement('span');

            eyebrow.textContent = 'BADGE SEARCH BY';
            eyebrow.style.cssText =
                'margin-bottom:1px; color:#9da4ad; font-size:6px; font-weight:600; line-height:6px; letter-spacing:.5px;';

            const wordmark = document.createElement('span');

            wordmark.style.cssText =
                'color:#fff; font-size:11px; font-weight:700; line-height:11px; letter-spacing:-.2px;';
            wordmark.appendChild(document.createTextNode('Steam'));

            const sets = document.createElement('span');

            sets.textContent = 'Sets';
            sets.style.color = '#a75ce5';
            wordmark.appendChild(sets);

            copy.appendChild(eyebrow);
            copy.appendChild(wordmark);
            promo.appendChild(icon);
            promo.appendChild(copy);

            function setHighlighted(isHighlighted) {
                promo.style.background = isHighlighted
                    ? 'rgba(48,38,68,.92)'
                    : 'rgba(13,12,19,.72)';
                promo.style.borderColor = isHighlighted
                    ? 'rgba(178,99,236,.8)'
                    : 'rgba(178,99,236,.42)';
                promo.style.boxShadow = isHighlighted
                    ? '0 0 0 1px rgba(118,82,201,.18)'
                    : '';
            }

            promo.addEventListener('mouseenter', () => setHighlighted(true));
            promo.addEventListener('mouseleave', () => setHighlighted(false));
            promo.addEventListener('focus', () => setHighlighted(true));
            promo.addEventListener('blur', () => setHighlighted(false));

            return promo;
        }

        function insertControl() {
            const rows = getRows();

            if (!rows.length) {
                return false;
            }

            const container = rows[0].parentElement;
            const badgeSearch = insertBadgeSearch(container, rows);

            // Share the search row so the SteamSets shortcut and account
            // controls align without moving the search field from the left.
            const bar = badgeSearch.element;

            const actionGroup = document.createElement('div');

            actionGroup.id = 'spt-badge-actions';
            actionGroup.style.cssText =
                'display:flex; align-items:center; justify-content:flex-end; gap:3px; flex:0 1 auto; margin-left:auto; flex-wrap:wrap;';

            const steamSetsPromo = buildSteamSetsPromo();

            // Both search options are useful on every profile. Keep
            // destructive and account-specific controls exclusive to the
            // signed-in owner.
            if (!isProbablyOwnProfilePage()) {
                actionGroup.appendChild(steamSetsPromo);
                bar.appendChild(actionGroup);
                return true;
            }

            const currentPage = getCurrentPageNumber();
            const detectedMaxPage = Math.max(
                currentPage,
                getMaxPageFromPagination() || 1
            );
            const maxPage = Math.min(detectedMaxPage, MAX_PAGES);
            const pageRowsPromises = new Map([
                [currentPage, Promise.resolve(rows)],
            ]);

            // The counter and filter scan the same pages. Cache those reads so
            // activating the filter while the count is running does not send a
            // second request for each page.
            function getPageRowsForDrops(page) {
                if (!pageRowsPromises.has(page)) {
                    const pageRowsPromise = fetchPageRowsWithRetry(page)
                        .then((pageRows) => {
                            if (pageRows === null) {
                                pageRowsPromises.delete(page);
                            }

                            return pageRows;
                        });

                    pageRowsPromises.set(page, pageRowsPromise);
                }

                return pageRowsPromises.get(page);
            }

            const statusGroup = document.createElement('div');

            statusGroup.style.cssText =
                'display:flex; align-items:center; justify-content:flex-end; gap:10px; flex:0 1 auto; min-width:0; flex-wrap:wrap;';

            const dropCounterGroup = document.createElement('span');

            dropCounterGroup.setAttribute('role', 'status');
            dropCounterGroup.setAttribute('aria-live', 'polite');
            dropCounterGroup.setAttribute('aria-busy', 'true');
            dropCounterGroup.style.cssText =
                'display:inline-flex; align-items:center; gap:3px; flex:0 0 auto; color:#8f98a0; font-size:12px; white-space:nowrap;';

            const dropCounterLabel = document.createElement('span');

            dropCounterLabel.textContent = 'Games with drops:';

            const dropCounter = document.createElement('span');

            dropCounter.id = 'spt-drops-remaining-count';
            dropCounter.setAttribute(
                'aria-label',
                '0 games with card drops remaining'
            );
            dropCounter.style.cssText =
                'display:inline-block; color:#a4d007; min-width:1ch; font-weight:600; text-align:left; font-variant-numeric:tabular-nums;';
            dropCounter.textContent = '0';
            dropCounter.title = 'Games with card drops remaining';

            const dropCounterLoader = document.createElement('span');

            dropCounterLoader.setAttribute('aria-hidden', 'true');
            dropCounterLoader.style.cssText =
                'display:inline-block; width:10px; height:10px; box-sizing:border-box; border:1.5px solid rgba(143,152,160,.35); border-top-color:#8f98a0; border-radius:50%;';

            const dropCounterLoadingAnimation = window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            ).matches
                ? null
                : dropCounterLoader.animate(
                    [
                        { transform: 'rotate(0deg)' },
                        { transform: 'rotate(360deg)' },
                    ],
                    {
                        duration: 700,
                        iterations: Infinity,
                    }
                );

            dropCounterGroup.appendChild(dropCounterLabel);
            dropCounterGroup.appendChild(dropCounter);
            dropCounterGroup.appendChild(dropCounterLoader);

            const toggle = document.createElement('div');

            toggle.id = 'drop-filter-toggle';
            toggle.className = 'btnv6_blue_hoverfade btn_small';
            toggle.style.cssText = 'cursor:pointer; user-select:none;';
            toggle.setAttribute('role', 'button');
            toggle.setAttribute('aria-pressed', 'false');
            toggle.tabIndex = 0;

            toggle.innerHTML = '<span>Show only drops remaining</span>';

            const craftStatus = document.createElement('span');
            craftStatus.id = 'spt-auto-craft-status';
            craftStatus.style.cssText =
                'color:#8f98a0; font-size:12px; max-width:360px;';

            const autoCraft = document.createElement('div');
            autoCraft.id = 'spt-auto-craft';
            autoCraft.className = 'btnv6_blue_hoverfade btn_small';
            autoCraft.style.cssText = 'cursor:pointer; user-select:none;';
            autoCraft.setAttribute('role', 'button');
            autoCraft.tabIndex = 0;
            autoCraft.title =
                'Craft every complete card set across all badge pages';

            const autoCraftLabel = document.createElement('span');
            autoCraftLabel.textContent = 'Auto Craft All Badges';
            autoCraft.appendChild(autoCraftLabel);

            statusGroup.appendChild(craftStatus);
            actionGroup.appendChild(dropCounterGroup);
            actionGroup.appendChild(toggle);
            actionGroup.appendChild(autoCraft);
            actionGroup.appendChild(steamSetsPromo);
            bar.appendChild(statusGroup);
            bar.appendChild(actionGroup);

            let active = false;
            let busy = false;
            let craftBusy = false;
            let stopCrafting = false;
            let extraRows = [];

            function setBusy(isBusy) {
                busy = isBusy;

                toggle.style.pointerEvents = isBusy ? 'none' : '';
                toggle.style.opacity = isBusy ? '0.6' : '';

                if (!craftBusy) {
                    autoCraft.style.pointerEvents = isBusy ? 'none' : '';
                    autoCraft.style.opacity = isBusy ? '0.6' : '';
                }
            }

            function setCraftBusy(isBusy) {
                craftBusy = isBusy;
                badgeSearch.setDisabled(isBusy);

                toggle.style.pointerEvents = isBusy || busy ? 'none' : '';
                toggle.style.opacity = isBusy || busy ? '0.6' : '';

                autoCraft.style.pointerEvents = '';
                autoCraft.style.opacity = '';
                autoCraftLabel.textContent = isBusy
                    ? 'Stop Auto Craft'
                    : 'Auto Craft All Badges';
                autoCraft.title = isBusy
                    ? 'Stop after the current badge'
                    : 'Craft every complete card set across all badge pages';
            }

            function setCraftStatus(text, withReload = false) {
                craftStatus.textContent = text;

                if (withReload) {
                    craftStatus.appendChild(document.createTextNode(' '));

                    const link = document.createElement('a');

                    link.href = location.href;
                    link.textContent = 'Reload badges';
                    link.style.color = '#67c1f1';

                    craftStatus.appendChild(link);
                }
            }

            // Steam's button styles have no pressed state, so add an inset
            // border while the filter is active.
            function setActiveStyle(isActive) {
                toggle.style.boxShadow =
                    isActive ? 'inset 0 0 0 1px #67c1f1' : '';
                toggle.setAttribute('aria-pressed', String(isActive));
            }

            function finishDropCounterLoading(isComplete) {
                dropCounterLoadingAnimation?.cancel();
                dropCounterLoader.style.cssText =
                    `display:inline-flex; width:10px; height:10px; align-items:center; justify-content:center; color:${isComplete ? '#a4d007' : '#d9a300'}; font-size:10px; font-weight:700; line-height:1;`;
                dropCounterLoader.textContent = isComplete ? '\u2713' : '!';
                dropCounterLoader.title = isComplete
                    ? 'Scan complete'
                    : 'Scan incomplete';
                dropCounterGroup.setAttribute('aria-busy', 'false');
            }

            async function countGamesWithDropsRemaining() {
                let count = 0;
                let failedPages = 0;

                for (let page = 1; page <= maxPage; page += 1) {
                    const pageRows = await getPageRowsForDrops(page);

                    if (pageRows === null) {
                        failedPages += 1;
                    } else {
                        count += pageRows.filter(hasDropsRemaining).length;
                    }

                    const nextCount = String(count);

                    if (dropCounter.textContent !== nextCount) {
                        dropCounter.textContent = nextCount;
                    }

                    if (page < maxPage) {
                        await sleep(100);
                    }
                }

                const incomplete = (
                    failedPages > 0 || detectedMaxPage > MAX_PAGES
                );
                const gameLabel = count === 1 ? 'game' : 'games';

                dropCounter.textContent = incomplete
                    ? `${count}+`
                    : String(count);
                dropCounter.setAttribute(
                    'aria-label',
                    incomplete
                        ? `At least ${count} ${gameLabel} with card drops remaining`
                        : `${count} ${gameLabel} with card drops remaining`
                );

                const notes = [];

                if (failedPages) {
                    notes.push(`${failedPages} page(s) could not be loaded`);
                }

                if (detectedMaxPage > MAX_PAGES) {
                    notes.push(`count limited to ${MAX_PAGES} pages`);
                }

                dropCounter.title = notes.length
                    ? `${notes.join('; ')}.`
                    : 'Number of games with card drops remaining across all badge pages';
                finishDropCounterLoading(!incomplete);
            }

            function resetDropFilter() {
                active = false;
                setActiveStyle(false);
                badgeSearch.setFilterPaginationHidden(false);

                getRows().forEach((row) => {
                    row.style.display = '';
                });

                extraRows.forEach((row) => {
                    row.remove();
                });

                extraRows = [];
                setBusy(false);
            }

            badgeSearch.setBeforeSearch(() => {
                if (active || busy) {
                    resetDropFilter();
                }
            });

            async function runFilter() {
                getRows().forEach((row) => {
                    row.style.display = hasDropsRemaining(row) ? '' : 'none';
                });

                setBusy(true);

                for (let page = 1; page <= maxPage && active; page += 1) {
                    if (page === currentPage) {
                        continue;
                    }

                    const pageWasCached = pageRowsPromises.has(page);

                    const rows = await getPageRowsForDrops(page);

                    if (!active) {
                        break;
                    }

                    if (rows === null) {
                        continue;
                    }

                    // Preserve every row: normal and foil badges share an app
                    // ID and detail URL but represent separate drop states.
                    rows
                        .filter(hasDropsRemaining)
                        .forEach((row) => {
                            const clone = row.cloneNode(true);

                            clone.dataset.sptDropFilterClone = '1';
                            activateDelayedBadgeArtwork(clone);
                            container.appendChild(clone);
                            extraRows.push(clone);
                        });

                    if (!pageWasCached) {
                        await sleep(200);
                    }
                }

                setBusy(false);
            }

            countGamesWithDropsRemaining()
                .catch((err) => {
                    console.error(
                        'Steam Page Tools: failed counting games with card drops',
                        err
                    );
                    dropCounter.textContent = '?';
                    dropCounter.setAttribute(
                        'aria-label',
                        'Card-drop count unavailable'
                    );
                    dropCounter.title =
                        'Reload the page to try counting again.';
                    finishDropCounterLoading(false);
                });

            async function onToggle() {
                if (busy || craftBusy) {
                    return;
                }

                const activating = !active;

                if (activating) {
                    badgeSearch.clear();
                }

                if (!activating) {
                    resetDropFilter();
                    return;
                }

                active = true;
                setActiveStyle(true);
                badgeSearch.setFilterPaginationHidden(true);
                await runFilter();
            }

            async function collectCraftTargets(freshAllPages = false) {
                const currentPage = getCurrentPageNumber();
                const detectedMaxPage = Math.max(
                    currentPage,
                    getMaxPageFromPagination() || 1
                );

                if (detectedMaxPage > MAX_PAGES) {
                    throw new Error(
                        `Badge list has more than the ${MAX_PAGES}-page safety limit`
                    );
                }

                const targets = new Map();

                for (let page = 1; page <= detectedMaxPage; page += 1) {
                    if (stopCrafting) {
                        return {
                            targets: [...targets.values()],
                            cancelled: true,
                        };
                    }

                    setCraftStatus(
                        `Scanning badge page ${page} of ${detectedMaxPage}...`
                    );

                    let pageRows;

                    if (page === currentPage && !freshAllPages) {
                        pageRows = getRows()
                            .filter((row) => (
                                !row.dataset.sptDropFilterClone &&
                                !row.dataset.sptBadgeSearchClone
                            ));
                    } else {
                        pageRows = await fetchPageRowsWithRetry(page);

                        if (pageRows === null) {
                            throw new Error(
                                `Could not scan badge page ${page}`
                            );
                        }
                    }

                    pageRows.forEach((row) => {
                        const target = getCraftTarget(row);

                        if (target) {
                            targets.set(target.key, target);
                        }
                    });

                    if (page !== currentPage || freshAllPages) {
                        await sleep(150);
                    }
                }

                return {
                    targets: [...targets.values()],
                    cancelled: false,
                };
            }

            function requestCraftConfirmation(count) {
                const description =
                    `Found ${count} ready badge type(s). ` +
                    'Craft every complete card set available for them? ' +
                    'Steam Page Tools will use the 5x option when Steam ' +
                    'offers it and will also craft badges made ready by ' +
                    'crafting rewards. This consumes cards and cannot be undone.';

                if (typeof window.ShowConfirmDialog === 'function') {
                    try {
                        return new Promise((resolve) => {
                            window.ShowConfirmDialog(
                                'Auto Craft All Badges',
                                description,
                                'Craft All',
                                'Cancel'
                            )
                                .done(() => resolve(true))
                                .fail(() => resolve(false));
                        });
                    } catch (err) {
                        console.error(
                            'Steam Page Tools: failed opening Steam confirmation',
                            err
                        );
                    }
                }

                return Promise.resolve(window.confirm(description));
            }

            function addCraftFailure(summary, target, err) {
                if (!summary.failed.has(target.key)) {
                    summary.failed.set(target.key, {
                        name: target.name,
                        message: err.message,
                    });
                }
            }

            async function craftEveryLevel(
                target,
                sessionid,
                summary,
                position,
                total
            ) {
                let craftedForTarget = 0;
                let attemptedMutation = false;
                let consecutiveAmbiguous = 0;
                let throttleCount = 0;

                while (
                    !stopCrafting &&
                    summary.batches < MAX_CRAFT_BATCHES
                ) {
                    setCraftStatus(
                        `Checking ${position} of ${total}: ${target.name}...`
                    );

                    let option;

                    try {
                        option = await fetchCraftOption(target);
                    } catch (err) {
                        console.error(
                            'Steam Page Tools: failed checking craft state',
                            target.key,
                            err
                        );

                        if (err.fatal) {
                            throw err;
                        }

                        addCraftFailure(summary, target, err);
                        return craftedForTarget;
                    }

                    if (!option) {
                        if (
                            !craftedForTarget &&
                            !attemptedMutation &&
                            !summary.badges.has(target.key)
                        ) {
                            summary.skipped.add(target.key);
                        }

                        return craftedForTarget;
                    }

                    if (stopCrafting) {
                        return craftedForTarget;
                    }

                    if (!refreshCraftLock()) {
                        const err = new Error(
                            'Another tab took over the badge craft queue'
                        );

                        err.fatal = true;
                        throw err;
                    }

                    const levelWord =
                        option.levels === 1 ? 'level' : 'levels';

                    setCraftStatus(
                        `Crafting ${position} of ${total}: ${target.name} ` +
                        `(${option.levels} ${levelWord})...`
                    );

                    attemptedMutation = true;
                    summary.attempts += 1;

                    try {
                        await postCraft(
                            target,
                            option.levels,
                            sessionid
                        );

                        summary.batches += 1;
                        summary.levels += option.levels;
                        summary.badges.add(target.key);
                        summary.skipped.delete(target.key);
                        craftedForTarget += option.levels;
                        consecutiveAmbiguous = 0;
                        throttleCount = 0;
                    } catch (err) {
                        console.error(
                            'Steam Page Tools: failed crafting badge',
                            target.key,
                            err
                        );

                        if (err.fatal) {
                            throw err;
                        }

                        if (err.status === 429) {
                            throttleCount += 1;

                            if (throttleCount > 3) {
                                addCraftFailure(summary, target, err);
                                return craftedForTarget;
                            }

                            const waitSeconds = Math.ceil(
                                err.retryAfterMs / 1000
                            );

                            setCraftStatus(
                                `Steam is rate limiting requests. ` +
                                `Retrying ${target.name} in ` +
                                `${waitSeconds} seconds...`
                            );

                            await sleep(err.retryAfterMs);
                            continue;
                        }

                        if (err.ambiguous) {
                            summary.uncertain += 1;
                            consecutiveAmbiguous += 1;

                            if (consecutiveAmbiguous >= 3) {
                                addCraftFailure(summary, target, err);
                                return craftedForTarget;
                            }

                            // Reconcile an ambiguous mutation against fresh
                            // badge state before issuing another POST.
                            setCraftStatus(
                                `Rechecking ${target.name} after an ` +
                                'uncertain response...'
                            );
                            await sleep(1500);
                            continue;
                        }

                        addCraftFailure(summary, target, err);
                        return craftedForTarget;
                    }

                    if (!stopCrafting) {
                        await sleep(
                            800 + Math.floor(Math.random() * 401)
                        );
                    }
                }

                return craftedForTarget;
            }

            function renderCraftSummary(summary, runError) {
                const prefix = stopCrafting ? 'Stopped.' : (
                    runError ? 'Stopped after an error.' : 'Finished.'
                );
                const totals = summary.uncertain
                    ? `Confirmed ${summary.levels} level(s) across ` +
                        `${summary.badges.size} badge(s); totals may be higher.`
                    : `Crafted ${summary.levels} level(s) across ` +
                        `${summary.badges.size} badge(s).`;
                const parts = [
                    prefix,
                    totals,
                ];

                if (summary.skipped.size) {
                    parts.push(
                        `${summary.skipped.size} stale badge(s) skipped.`
                    );
                }

                if (summary.failed.size) {
                    parts.push(
                        `${summary.failed.size} badge(s) failed; ` +
                        'details are in the console.'
                    );
                }

                if (summary.uncertain) {
                    parts.push(
                        `${summary.uncertain} response(s) were uncertain; ` +
                        'fresh badge state was checked before continuing.'
                    );
                }

                if (summary.safetyLimit) {
                    parts.push('Stopped at the automatic safety limit.');
                }

                if (runError) {
                    parts.push(runError.message);
                }

                setCraftStatus(
                    parts.join(' '),
                    summary.attempts > 0
                );
            }

            async function onAutoCraft() {
                if (craftBusy) {
                    stopCrafting = true;
                    autoCraftLabel.textContent = 'Stopping...';
                    autoCraft.style.pointerEvents = 'none';
                    autoCraft.style.opacity = '0.6';
                    setCraftStatus(
                        'Stopping after the current badge request...'
                    );
                    return;
                }

                if (busy) {
                    setCraftStatus(
                        'Wait for the card-drop filter to finish first.'
                    );
                    return;
                }

                const sessionid = getSessionId();

                if (!sessionid || !profileUrl) {
                    setCraftStatus(
                        'Could not verify your Steam session. Refresh and try again.'
                    );
                    return;
                }

                stopCrafting = false;
                badgeSearch.clear();
                setCraftBusy(true);

                const summary = {
                    attempts: 0,
                    batches: 0,
                    levels: 0,
                    uncertain: 0,
                    badges: new Set(),
                    skipped: new Set(),
                    failed: new Map(),
                    safetyLimit: false,
                };
                let lockHeld = false;
                let lockHeartbeat = null;
                let runError = null;

                try {
                    setCraftStatus('Verifying this is your badges page...');

                    if (!await verifyOwnProfilePage()) {
                        setCraftStatus(
                            'Auto craft is only available on your own badges page.'
                        );
                        return;
                    }

                    const initialScan = await collectCraftTargets(false);

                    if (initialScan.cancelled || stopCrafting) {
                        setCraftStatus('Auto craft stopped before crafting.');
                        return;
                    }

                    if (!initialScan.targets.length) {
                        setCraftStatus(
                            'No badges are currently ready to craft.'
                        );
                        return;
                    }

                    const confirmed = await requestCraftConfirmation(
                        initialScan.targets.length
                    );

                    if (!confirmed) {
                        setCraftStatus('Auto craft cancelled.');
                        return;
                    }

                    if (!acquireCraftLock()) {
                        setCraftStatus(
                            'Another tab is already auto crafting badges.'
                        );
                        return;
                    }

                    lockHeld = true;
                    lockHeartbeat = setInterval(() => {
                        if (!refreshCraftLock()) {
                            stopCrafting = true;
                            setCraftStatus(
                                'Another tab took over auto craft. ' +
                                'Stopping after the current request...'
                            );
                        }
                    }, 20000);

                    let targets = initialScan.targets;

                    for (
                        let pass = 1;
                        pass <= MAX_CRAFT_PASSES && targets.length;
                        pass += 1
                    ) {
                        const attemptsBeforePass = summary.attempts;

                        for (
                            let index = 0;
                            index < targets.length;
                            index += 1
                        ) {
                            if (
                                stopCrafting ||
                                summary.batches >= MAX_CRAFT_BATCHES
                            ) {
                                break;
                            }

                            const target = targets[index];

                            if (summary.failed.has(target.key)) {
                                continue;
                            }

                            await craftEveryLevel(
                                target,
                                sessionid,
                                summary,
                                index + 1,
                                targets.length
                            );
                        }

                        if (
                            stopCrafting ||
                            summary.batches >= MAX_CRAFT_BATCHES
                        ) {
                            summary.safetyLimit =
                                summary.batches >= MAX_CRAFT_BATCHES;
                            break;
                        }

                        // A pass without mutation attempts indicates stale
                        // rows; stop instead of rescanning indefinitely.
                        if (summary.attempts === attemptsBeforePass) {
                            break;
                        }

                        setCraftStatus(
                            'Rescanning for badges made ready by rewards...'
                        );

                        const nextScan = await collectCraftTargets(true);

                        if (nextScan.cancelled || stopCrafting) {
                            break;
                        }

                        targets = nextScan.targets
                            .filter((target) => (
                                !summary.failed.has(target.key)
                            ));

                        if (
                            pass === MAX_CRAFT_PASSES &&
                            targets.length
                        ) {
                            summary.safetyLimit = true;
                        }
                    }
                } catch (err) {
                    runError = err;
                    console.error(
                        'Steam Page Tools: auto craft stopped',
                        err
                    );
                } finally {
                    if (lockHeartbeat !== null) {
                        clearInterval(lockHeartbeat);
                    }

                    if (lockHeld) {
                        releaseCraftLock();
                    }

                    if (
                        summary.attempts ||
                        summary.skipped.size ||
                        summary.failed.size ||
                        runError
                    ) {
                        renderCraftSummary(summary, runError);
                    }

                    stopCrafting = false;
                    autoCraft.style.pointerEvents = '';
                    autoCraft.style.opacity = '';
                    setCraftBusy(false);
                }
            }

            bindButtonActivation(toggle, onToggle);
            bindButtonActivation(autoCraft, onAutoCraft);

            window.addEventListener('storage', (e) => {
                if (
                    craftBusy &&
                    e.key === CRAFT_LOCK_KEY
                ) {
                    const current = readCraftLock();

                    if (
                        current &&
                        current.owner !== craftLockOwner &&
                        current.expiresAt > Date.now()
                    ) {
                        stopCrafting = true;
                        setCraftStatus(
                            'Another tab started auto craft. ' +
                            'Stopping this queue after the current request...'
                        );
                    }
                }
            });

            return true;
        }

        // Steam may render the badge list after DOMContentLoaded, so poll
        // briefly.
        let attempts = 0;

        const interval = setInterval(() => {
            attempts += 1;

            if (insertControl() || attempts > 20) {
                clearInterval(interval);
            }
        }, 250);
    }

    // Store search bulk actions.
    // Bundle results are skipped because they require bundle-package lookup.
    // Apps with multiple purchase options use Steam's first/default package,
    // matching the primary action on the app page.
    function initSearchBulkCart() {
        if (!/^\/search\/?$/i.test(location.pathname)) {
            return;
        }

        const STORAGE_KEY = 'spt-search-cart-selection';
        const LEGACY_STORAGE_KEY = 'dbf-search-cart-selection';

        // Map app IDs to their display names and rendered checkboxes.
        const selected = new Map();
        let busy = false;

        injectStyles();

        const bar = buildBar();
        document.body.appendChild(bar.el);

        restoreSelection();

        // Persist selections until each game succeeds or the user clears
        // them, including across navigation and browser restarts.
        function loadStoredSelection() {
            try {
                let raw = localStorage.getItem(STORAGE_KEY);

                // Migrate selections saved under the previous script name.
                if (!raw) {
                    raw = localStorage.getItem(LEGACY_STORAGE_KEY);

                    if (raw) {
                        // Restore readable legacy data even if migration is
                        // blocked by storage permissions or quota.
                        try {
                            localStorage.setItem(STORAGE_KEY, raw);
                            localStorage.removeItem(LEGACY_STORAGE_KEY);
                        } catch (err) {
                            console.warn(
                                'Steam Page Tools: could not migrate saved selection',
                                err
                            );
                        }
                    }
                }

                if (!raw) {
                    return new Map();
                }

                return new Map(Object.entries(JSON.parse(raw)));
            } catch (err) {
                console.error('Steam Page Tools: failed to read saved selection', err);
                return new Map();
            }
        }

        function saveSelection() {
            try {
                const obj = {};

                selected.forEach((info, appid) => {
                    obj[appid] = info.name;
                });

                localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
            } catch (err) {
                console.error('Steam Page Tools: failed to save selection', err);
            }
        }

        // Restored selections acquire a checkbox reference when their row is
        // rendered.
        function restoreSelection() {
            const stored = loadStoredSelection();

            if (!stored.size) {
                return;
            }

            stored.forEach((name, appid) => {
                selected.set(appid, { name, box: null });
            });

            updateBar();
            setStatus(`Restored ${stored.size} selected game(s) from before.`);
        }

        function clearSelection() {
            if (busy) {
                return;
            }

            selected.forEach((info) => {
                if (info.box) {
                    info.box.classList.remove('spt-checked');
                    info.box.setAttribute('aria-checked', 'false');
                }
            });

            selected.clear();
            saveSelection();
            updateBar();
        }

        let scanAttempts = 0;

        const scanInterval = setInterval(() => {
            scanAttempts += 1;

            const container =
                document.querySelector('#search_resultsRows') ||
                document.querySelector('.search_results_rows');

            if (container) {
                container
                    .querySelectorAll('.search_result_row')
                    .forEach(processRow);

                observeResults(container);

                clearInterval(scanInterval);
            } else if (scanAttempts > 20) {
                clearInterval(scanInterval);
            }
        }, 250);

        // Observe infinite-scroll results as well as the initial result set.
        function observeResults(container) {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType !== 1) {
                            return;
                        }

                        if (node.matches && node.matches('.search_result_row')) {
                            processRow(node);
                        } else if (node.querySelectorAll) {
                            node
                                .querySelectorAll('.search_result_row')
                                .forEach(processRow);
                        }
                    });
                }
            });

            observer.observe(container, { childList: true, subtree: true });
        }

        function extractAppId(row) {
            const raw = row.getAttribute('data-ds-appid');

            if (raw) {
                // Comma-separated app IDs identify an unsupported bundle.
                const appid = raw.trim();

                return !raw.includes(',') && /^\d+$/.test(appid)
                    ? appid
                    : null;
            }

            // Fall back to the app ID embedded in the result URL.
            const href = row.getAttribute('href') || '';
            const match = href.match(/\/app\/(\d+)\//);

            return match ? match[1] : null;
        }

        function processRow(row) {
            if (row.dataset.sptProcessed) {
                return;
            }

            row.dataset.sptProcessed = '1';

            const appid = extractAppId(row);

            if (!appid) {
                return;
            }

            const nameEl = row.querySelector('.title');
            const name = nameEl ? nameEl.textContent.trim() : `App ${appid}`;

            // Position against the capsule; the full row includes the price
            // column.
            const capsule = row.querySelector('.search_capsule') || row;

            if (getComputedStyle(capsule).position === 'static') {
                capsule.style.position = 'relative';
            }

            const box = document.createElement('div');

            box.className = 'spt-cart-checkbox';
            box.tabIndex = 0;
            box.setAttribute('role', 'checkbox');
            box.setAttribute('aria-checked', 'false');
            box.title = 'Select for bulk cart or wishlist actions';

            if (selected.has(appid)) {
                const info = selected.get(appid);

                info.box = box;
                box.classList.add('spt-checked');
                box.setAttribute('aria-checked', 'true');
            }

            // Prevent the checkbox from following the enclosing result link.
            box.addEventListener('mousedown', (e) => e.stopPropagation());
            box.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSelection(appid, name, box);
            });

            box.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSelection(appid, name, box);
                }
            });

            capsule.appendChild(box);
        }

        function toggleSelection(appid, name, box) {
            if (busy) {
                return;
            }

            if (selected.has(appid)) {
                selected.delete(appid);
                box.classList.remove('spt-checked');
                box.setAttribute('aria-checked', 'false');
            } else {
                selected.set(appid, { name, box });
                box.classList.add('spt-checked');
                box.setAttribute('aria-checked', 'true');
            }

            saveSelection();
            updateBar();
        }

        function updateBar() {
            const count = selected.size;

            bar.cartLabel.textContent = `Add ${count} to Cart`;
            bar.wishlistLabel.textContent = `Add ${count} to Wishlist`;

            if (count > 0) {
                bar.el.classList.add('spt-visible');
            } else if (!busy) {
                bar.el.classList.remove('spt-visible');
                setStatus('');
            }
        }

        function setStatus(text, destination) {
            bar.status.textContent = text;

            if (destination) {
                bar.status.appendChild(document.createTextNode(' '));

                const link = document.createElement('a');

                if (destination === 'wishlist') {
                    link.href = requirePinnedSteamUrl(
                        '/wishlist/',
                        STEAM_STORE_ORIGIN
                    ).href;
                    link.textContent = 'View wishlist';
                } else {
                    link.href = requirePinnedSteamUrl(
                        '/cart/',
                        STEAM_STORE_ORIGIN
                    ).href;
                    link.textContent = 'View cart';
                }

                link.style.color = '#67c1f1';

                bar.status.appendChild(link);
            }
        }

        function readStoreAccount() {
            const configEl = document.querySelector('#application_config');
            let userInfo = {};
            let appConfig = {};

            if (configEl) {
                try {
                    userInfo = JSON.parse(configEl.dataset.userinfo || '{}');
                } catch (err) {
                    console.warn(
                        'Steam Page Tools: could not read Steam user info',
                        err
                    );
                }

                try {
                    appConfig = JSON.parse(configEl.dataset.config || '{}');
                } catch (err) {
                    console.warn(
                        'Steam Page Tools: could not read Steam store config',
                        err
                    );
                }
            }

            const accountid = String(
                userInfo.accountid || window.g_AccountID || ''
            );
            const country = String(
                userInfo.country_code || appConfig.COUNTRY || ''
            ).toUpperCase();

            if (!accountid || accountid === '0' || !country) {
                throw new Error('not signed in or account data is unavailable');
            }

            return { accountid, country };
        }

        function bumpDynamicStoreVersion() {
            try {
                const current =
                    parseInt(
                        localStorage.getItem('unUserdataVersion') || '0',
                        10
                    ) || 0;
                const next = current + 1;

                localStorage.setItem('unUserdataVersion', String(next));

                return next;
            } catch {
                return Date.now();
            }
        }

        // Refresh the complete account wishlist before each run because DOM
        // state can be stale or incomplete.
        async function fetchCurrentWishlist() {
            const { accountid, country } = readStoreAccount();
            const version = bumpDynamicStoreVersion();
            const url = requirePinnedSteamUrl(
                '/dynamicstore/userdata/',
                STEAM_STORE_ORIGIN
            );

            url.searchParams.set('id', accountid);
            url.searchParams.set('cc', country);
            url.searchParams.set('origin', location.origin);
            url.searchParams.set('v', String(version));
            url.searchParams.set('_', String(Date.now()));

            const res = await fetch(url.toString(), {
                credentials: 'include',
                cache: 'no-store',
                headers: { Accept: 'application/json' },
            });

            requirePinnedSteamResponseUrl(
                res,
                STEAM_STORE_ORIGIN,
                url
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const json = await res.json();

            if (!json || !Array.isArray(json.rgWishlist)) {
                throw new Error('Steam returned invalid wishlist data');
            }

            return new Set(json.rgWishlist.map((appid) => String(appid)));
        }

        async function addAppToWishlist(appid, sessionid) {
            const mutationUrl = requirePinnedSteamUrl(
                '/api/addtowishlist',
                STEAM_STORE_ORIGIN
            );
            const body = new URLSearchParams({
                sessionid,
                appid: String(appid),
            });

            const res = await fetch(
                mutationUrl,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Accept: 'application/json',
                    },
                    body: body.toString(),
                }
            );

            requirePinnedSteamResponseUrl(
                res,
                STEAM_STORE_ORIGIN,
                mutationUrl
            );

            if (!res.ok) {
                const err = new Error(`HTTP ${res.status}`);

                err.rateLimited = res.status === 429;
                throw err;
            }

            const json = await res.json();

            if (!json || (json.success !== true && json.success !== 1)) {
                throw new Error('Steam did not confirm the wishlist change');
            }
        }

        function removeHandledSelection(appid, info) {
            selected.delete(appid);

            if (info.box) {
                info.box.classList.remove('spt-checked');
                info.box.setAttribute('aria-checked', 'false');
            }
        }

        function syncDynamicWishlist(appids) {
            const dynamicStore = window.GDynamicStore;

            try {
                if (dynamicStore && dynamicStore.s_rgWishlist) {
                    appids.forEach((appid) => {
                        dynamicStore.s_rgWishlist[appid] = true;
                    });
                }

                if (
                    dynamicStore &&
                    typeof dynamicStore.InvalidateCache === 'function'
                ) {
                    dynamicStore.InvalidateCache();
                } else {
                    bumpDynamicStoreVersion();
                }
            } catch {
                bumpDynamicStoreVersion();
            }
        }

        // Cart mutations require a package (sub) ID, so resolve Steam's
        // default purchase option for each app.
        async function resolveSubId(appid) {
            if (!/^\d+$/.test(String(appid))) {
                throw new Error('invalid Steam app ID');
            }

            const detailsUrl = requirePinnedSteamUrl(
                '/api/appdetails',
                STEAM_STORE_ORIGIN
            );

            detailsUrl.searchParams.set('appids', String(appid));

            const res = await fetch(detailsUrl, { credentials: 'include' });

            requirePinnedSteamResponseUrl(
                res,
                STEAM_STORE_ORIGIN,
                detailsUrl
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const json = await res.json();
            const entry = json[appid];

            if (!entry || !entry.success || !entry.data) {
                throw new Error('no purchase data for this app');
            }

            const groups = entry.data.package_groups;

            if (groups && groups.length && groups[0].subs && groups[0].subs.length) {
                return groups[0].subs[0].packageid;
            }

            if (entry.data.packages && entry.data.packages.length) {
                return entry.data.packages[0];
            }

            throw new Error('no purchasable package found');
        }

        async function addSubToCart(subid, sessionid) {
            if (!/^\d+$/.test(String(subid))) {
                throw new Error('invalid Steam package ID');
            }

            const mutationUrl = requirePinnedSteamUrl(
                '/cart/',
                STEAM_STORE_ORIGIN
            );
            const body = new URLSearchParams({
                action: 'add_to_cart',
                sessionid,
                subid: String(subid),
            });

            const res = await fetch(mutationUrl, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            });

            requirePinnedSteamResponseUrl(
                res,
                STEAM_STORE_ORIGIN,
                mutationUrl
            );

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
        }

        function buildBar() {
            const el = document.createElement('div');

            el.id = 'spt-cart-bar';

            const status = document.createElement('span');

            status.id = 'spt-cart-status';

            const actions = document.createElement('div');

            actions.id = 'spt-store-actions';

            const addWrap = document.createElement('div');

            addWrap.className = 'btn_addtocart';

            const addBtn = document.createElement('a');

            addBtn.id = 'spt-add-to-cart-btn';
            addBtn.className = 'btnv6_green_white_innerfade btn_medium';
            addBtn.setAttribute('role', 'button');
            addBtn.tabIndex = 0;

            const cartLabel = document.createElement('span');

            cartLabel.textContent = 'Add 0 to Cart';

            addBtn.appendChild(cartLabel);
            addWrap.appendChild(addBtn);

            const wishlistWrap = document.createElement('div');

            wishlistWrap.className = 'btn_addtocart';

            const wishlistBtn = document.createElement('a');

            wishlistBtn.id = 'spt-add-to-wishlist-btn';
            wishlistBtn.className = 'btnv6_blue_hoverfade btn_medium';
            wishlistBtn.setAttribute('role', 'button');
            wishlistBtn.tabIndex = 0;
            wishlistBtn.title =
                'Already-wishlisted games are checked and skipped automatically';

            const wishlistLabel = document.createElement('span');

            wishlistLabel.textContent = 'Add 0 to Wishlist';

            wishlistBtn.appendChild(wishlistLabel);
            wishlistWrap.appendChild(wishlistBtn);
            actions.appendChild(addWrap);
            actions.appendChild(wishlistWrap);

            const closeBtn = document.createElement('span');

            closeBtn.id = 'spt-cart-close';
            closeBtn.textContent = '\u2715';
            closeBtn.title = 'Clear selection';
            closeBtn.setAttribute('role', 'button');
            closeBtn.tabIndex = 0;

            closeBtn.addEventListener('click', () => {
                clearSelection();
            });

            closeBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    closeBtn.click();
                }
            });

            el.appendChild(status);
            el.appendChild(actions);
            el.appendChild(closeBtn);

            function setActionBusy(isBusy) {
                busy = isBusy;

                [addBtn, wishlistBtn].forEach((button) => {
                    button.style.pointerEvents = isBusy ? 'none' : '';
                    button.style.opacity = isBusy ? '0.6' : '';
                    button.setAttribute(
                        'aria-disabled',
                        isBusy ? 'true' : 'false'
                    );
                });

                closeBtn.style.pointerEvents = isBusy ? 'none' : '';
                closeBtn.style.opacity = isBusy ? '0.6' : '';
            }

            async function onAddToCart() {
                if (busy || selected.size === 0) {
                    return;
                }

                const sessionid = getSessionId();

                if (!sessionid) {
                    setStatus('Could not find your session ID - try refreshing the page.');
                    return;
                }

                setActionBusy(true);

                const entries = [...selected.entries()];
                const failed = [];

                try {
                    for (let i = 0; i < entries.length; i += 1) {
                        const [appid, info] = entries[i];

                        setStatus(
                            `Adding ${i + 1} of ${entries.length} to cart: ${info.name}...`
                        );

                        try {
                            const subid = await resolveSubId(appid);

                            await addSubToCart(subid, sessionid);

                            removeHandledSelection(appid, info);
                            saveSelection();
                        } catch (err) {
                            console.error(
                                'Steam Page Tools: failed to add to cart',
                                appid,
                                err
                            );
                            failed.push(info.name);
                        }

                        updateBar();

                        if (i < entries.length - 1) {
                            await sleep(400);
                        }
                    }

                    if (failed.length) {
                        setStatus(
                            `Added ${entries.length - failed.length} of ${entries.length} to cart. ${failed.length} failed and stayed selected.`,
                            'cart'
                        );
                    } else {
                        setStatus(
                            `Added ${entries.length} game(s) to cart.`,
                            'cart'
                        );
                    }
                } finally {
                    setActionBusy(false);
                }
            }

            async function onAddToWishlist() {
                if (busy || selected.size === 0) {
                    return;
                }

                const sessionid = getSessionId();

                if (!sessionid) {
                    setStatus(
                        'Could not find your session ID - try refreshing the page.'
                    );
                    return;
                }

                setActionBusy(true);

                try {
                    setStatus('Checking your current Steam wishlist...');

                    let currentWishlist;

                    try {
                        currentWishlist = await fetchCurrentWishlist();
                    } catch (err) {
                        console.error(
                            'Steam Page Tools: failed to verify wishlist',
                            err
                        );
                        setStatus(
                            'Could not verify your current wishlist, so nothing was added. Try refreshing the page.'
                        );
                        return;
                    }

                    const entries = [...selected.entries()];
                    const pending = [];
                    const skipped = [];
                    const addedAppids = [];
                    const failed = [];
                    let rateLimited = false;

                    entries.forEach(([appid, info]) => {
                        if (currentWishlist.has(appid)) {
                            skipped.push(info.name);
                            removeHandledSelection(appid, info);
                        } else {
                            pending.push([appid, info]);
                        }
                    });

                    if (skipped.length) {
                        saveSelection();
                        updateBar();
                    }

                    for (let i = 0; i < pending.length; i += 1) {
                        const [appid, info] = pending[i];

                        setStatus(
                            `Adding ${i + 1} of ${pending.length} to wishlist: ${info.name}...`
                        );

                        try {
                            await addAppToWishlist(appid, sessionid);

                            currentWishlist.add(appid);
                            addedAppids.push(appid);
                            removeHandledSelection(appid, info);
                            saveSelection();
                        } catch (err) {
                            console.error(
                                'Steam Page Tools: failed to add to wishlist',
                                appid,
                                err
                            );
                            failed.push(info.name);

                            if (err.rateLimited) {
                                rateLimited = true;
                            }
                        }

                        updateBar();

                        if (rateLimited) {
                            break;
                        }

                        if (i < pending.length - 1) {
                            await sleep(800);
                        }
                    }

                    if (addedAppids.length) {
                        syncDynamicWishlist(addedAppids);
                    }

                    let message =
                        `Added ${addedAppids.length} game(s) to wishlist.`;

                    if (skipped.length) {
                        message +=
                            ` Skipped ${skipped.length} already wishlisted.`;
                    }

                    if (failed.length) {
                        message +=
                            ` ${failed.length} failed and stayed selected.`;
                    }

                    if (rateLimited) {
                        message +=
                            ' Steam asked to slow down; remaining games stayed selected.';
                    }

                    setStatus(message, 'wishlist');
                } finally {
                    setActionBusy(false);
                }
            }

            bindButtonActivation(addBtn, onAddToCart);
            bindButtonActivation(wishlistBtn, onAddToWishlist);

            return { el, status, cartLabel, wishlistLabel };
        }

        function injectStyles() {
            const style = document.createElement('style');

            style.textContent = `
                .spt-cart-checkbox {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    width: 18px;
                    height: 18px;
                    border-radius: 2px;
                    background: rgba(27, 40, 56, 0.9);
                    border: 1px solid #67c1f1;
                    cursor: pointer;
                    z-index: 5;
                }

                .spt-cart-checkbox.spt-checked {
                    background: #67c1f1;
                }

                .spt-cart-checkbox.spt-checked::after {
                    content: '';
                    position: absolute;
                    left: 5px;
                    top: 1px;
                    width: 5px;
                    height: 9px;
                    border: solid #1b2838;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                #spt-cart-bar {
                    position: fixed;
                    right: 20px;
                    bottom: 20px;
                    z-index: 10000;
                    display: none;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    max-width: calc(100vw - 40px);
                    background: #1b2838;
                    border: 1px solid #2a475e;
                    border-radius: 3px;
                    padding: 10px 14px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                    font-family: "Motiva Sans", Arial, sans-serif;
                }

                #spt-cart-bar.spt-visible {
                    display: flex;
                }

                #spt-cart-status {
                    color: #8f98a0;
                    font-size: 12px;
                    max-width: 280px;
                    flex: 0 1 auto;
                }

                #spt-cart-status:empty {
                    display: none;
                }

                #spt-store-actions {
                    display: flex;
                    align-items: center;
                    flex: 0 0 auto;
                    flex-wrap: nowrap;
                    gap: 4px;
                }

                #spt-store-actions .btn_addtocart {
                    float: none;
                    margin: 0;
                }

                #spt-cart-close {
                    cursor: pointer;
                    color: #8f98a0;
                    font-size: 13px;
                    padding: 2px 4px;
                }

                #spt-cart-close:hover {
                    color: #ffffff;
                }
            `;

            document.head.appendChild(style);
        }
    }

    // Wishlist clearing uses Steam's own rendered removal controls. The
    // current React wishlist does not expose a session ID to page scripts,
    // while its controls retain Steam's native authentication and behavior.
    function initWishlistWiper() {
        if (!/^\/wishlist(?:\/(?:id\/[^/]+|profiles\/\d+))?\/?$/i
            .test(location.pathname)) {
            return;
        }

        const button = document.createElement('button');

        button.id = 'spt-wishlist-wipe';
        button.type = 'button';
        button.textContent = 'Clear my wishlist';
        button.title =
            'Remove every game from your signed-in Steam wishlist after confirmation';
        button.style.cssText =
            'position:fixed;right:20px;bottom:20px;z-index:10000;' +
            'border:1px solid #a34c4c;border-radius:3px;padding:9px 13px;' +
            'background:#5a2020;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.5);' +
            'cursor:pointer;font:13px "Motiva Sans",Arial,sans-serif;';
        document.body.appendChild(button);

        function setState(text, busy = false) {
            button.textContent = text;
            button.disabled = busy;
            button.style.cursor = busy ? 'wait' : 'pointer';
            button.style.opacity = busy ? '.7' : '1';
        }

        function getWishlistCount() {
            const text = document.body.innerText || document.body.textContent;
            const match = text.match(/\b(\d+)\s+ITEMS\b/i);

            return match ? Number.parseInt(match[1], 10) : 0;
        }

        function nativeRemoveButtons() {
            return [...document.querySelectorAll('button')].filter((candidate) => (
                candidate.textContent.trim().toLowerCase() === 'remove' &&
                candidate.closest('[data-rfd-draggable-id^="WishlistItem-"]')
            ));
        }

        function waitForNativeRemoval(row, itemId) {
            if (!row.isConnected || row.dataset.rfdDraggableId !== itemId) {
                return Promise.resolve(true);
            }

            return new Promise((resolve) => {
                let timer;
                const observer = new MutationObserver(() => {
                    if (!row.isConnected || row.dataset.rfdDraggableId !== itemId) {
                        finish(true);
                    }
                });

                function finish(removed) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve(removed);
                }

                observer.observe(document.body, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                });
                timer = setTimeout(() => finish(false), 5000);
            });
        }

        async function clearWishlist() {
            if (button.disabled) {
                return;
            }

            setState('Checking your wishlist…', true);

            const total = getWishlistCount();

            if (!total) {
                setState('Your wishlist is already empty');
                return;
            }

            if (!window.confirm(
                `Remove all ${total} game(s) from your Steam wishlist?\n\n` +
                'Steam will process one native removal at a time.'
            )) {
                setState('Clear my wishlist');
                return;
            }

            let removed = 0;

            while (removed < total) {
                const removeButton = nativeRemoveButtons()[0];

                if (!removeButton) {
                    break;
                }

                const row = removeButton.closest(
                    '[data-rfd-draggable-id^="WishlistItem-"]'
                );
                const itemId = row?.dataset.rfdDraggableId;

                if (!row || !itemId) {
                    break;
                }

                setState(`Removing ${removed + 1} of ${total}…`, true);
                removeButton.click();

                if (!await waitForNativeRemoval(row, itemId)) {
                    break;
                }

                removed += 1;

                if (removed < total) {
                    await sleep(400);
                }
            }

            const remaining = total - removed;

            setState(
                remaining
                    ? `Removed ${removed}; ${remaining} remain. Steam stopped the run.`
                    : `Removed all ${removed} games.`
            );
        }

        button.addEventListener('click', clearWishlist);
    }

    // Market page active listings tools: bulk removal and price editing (cancel & relist).
    function initMarketTools() {
        if (!/^\/market\/?$/i.test(location.pathname)) {
            return;
        }

        const selectedListings = new Map();
        let busy = false;
        let observer = null;
        let scanTimer = null;
        let syncScheduled = false;

        function scheduleSync() {
            if (syncScheduled || busy) {
                return;
            }
            syncScheduled = true;
            const runner = typeof window.requestAnimationFrame === 'function'
                ? (fn) => window.requestAnimationFrame(fn)
                : (fn) => setTimeout(fn, 16);
            runner(() => {
                syncScheduled = false;
                syncListings();
            });
        }

        injectMarketStyles();

        function getOwnerSteamId() {
            const pageSteamId = String(
                window.g_steamID ||
                window.UserYou?.strSteamId ||
                window.g_ActiveUser?.strSteamId ||
                ''
            );
            if (/^\d{17}$/.test(pageSteamId)) {
                return pageSteamId;
            }
            const match = document.cookie.match(/(?:^|;\s*)steamLoginSecure=(\d{17})/);
            return match ? match[1] : '';
        }

        function getWalletData() {
            const wallet = window.g_rgWalletInfo || {};
            const currencyCode = String(wallet.wallet_currency_code || 'USD').toUpperCase();
            const parseBps = (val, fallback) => {
                const num = Number(val);
                return Number.isFinite(num) && num >= 0 ? Math.round(num * 10000) : fallback;
            };
            const feeConfig = {
                steamFeeBps: parseBps(wallet.wallet_fee_percent, 500),
                publisherFeeBps: parseBps(wallet.wallet_publisher_fee_percent_default, 1000),
                steamFeeMinimumMinor: Number(wallet.wallet_fee_minimum) || 1,
                publisherFeeMinimumMinor: Number(wallet.wallet_publisher_fee_minimum) || 1,
                steamFeeBaseMinor: Number(wallet.wallet_fee_base) || 0,
                marketMinimumMinor: Number(wallet.wallet_market_minimum) || 1,
            };

            function calculateBuyerTotal(sellerNetMinor, publisherFeeBps = feeConfig.publisherFeeBps) {
                if (!Number.isSafeInteger(sellerNetMinor) || sellerNetMinor <= 0) {
                    return 0;
                }
                const steamFee = Math.max(
                    feeConfig.steamFeeMinimumMinor,
                    Math.floor((sellerNetMinor * feeConfig.steamFeeBps) / 10000)
                ) + feeConfig.steamFeeBaseMinor;
                const pubFee = publisherFeeBps > 0
                    ? Math.max(
                        feeConfig.publisherFeeMinimumMinor,
                        Math.floor((sellerNetMinor * publisherFeeBps) / 10000)
                    )
                    : 0;
                return sellerNetMinor + steamFee + pubFee;
            }

            function calculateSellerNet(buyerTotalMinor, publisherFeeBps = feeConfig.publisherFeeBps) {
                if (!Number.isSafeInteger(buyerTotalMinor) || buyerTotalMinor <= 0) {
                    return 0;
                }
                let low = 1;
                let high = buyerTotalMinor;
                let bestNet = 1;
                while (low <= high) {
                    const mid = low + Math.floor((high - low) / 2);
                    const buyer = calculateBuyerTotal(mid, publisherFeeBps);
                    if (buyer <= buyerTotalMinor) {
                        bestNet = mid;
                        low = mid + 1;
                    } else {
                        high = mid - 1;
                    }
                }
                return bestNet;
            }

            function formatMinor(minor) {
                if (!Number.isSafeInteger(minor) || minor < 0) {
                    return '--';
                }
                try {
                    return new Intl.NumberFormat(undefined, {
                        style: 'currency',
                        currency: currencyCode,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(minor / 100);
                } catch {
                    return (minor / 100).toFixed(2) + ' ' + currencyCode;
                }
            }

            return {
                calculateBuyerTotal,
                calculateSellerNet,
                currencyCode,
                feeConfig,
                formatMinor,
            };
        }

        function parseInputToMinor(value) {
            const str = String(value || '').trim();
            const tokenMatch = str.match(/\d+(?:[.,]\d{1,2})?/);
            if (!tokenMatch) {
                return null;
            }
            const clean = tokenMatch[0].replace(',', '.');
            const parts = clean.split('.');
            const whole = Number(parts[0]);
            const fraction = (parts[1] || '').padEnd(2, '0');
            const minor = whole * 100 + Number(fraction);
            return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
        }

        function minorToInput(minor) {
            if (!Number.isSafeInteger(minor) || minor <= 0) {
                return '';
            }
            const whole = Math.floor(minor / 100);
            const fraction = String(minor % 100).padStart(2, '0');
            return `${whole}.${fraction}`;
        }

        function extractListingData(row) {
            if (row._sptListingData) {
                return row._sptListingData;
            }

            const removeLink = row.querySelector(
                'a[href*="MarketListing"], a[onclick*="MarketListing"], a[href*="removelisting"], a[onclick*="removelisting"]'
            );
            const linkStr = removeLink
                ? (removeLink.getAttribute('href') || removeLink.getAttribute('onclick') || '')
                : '';
            const match = linkStr.match(
                /(?:RemoveMarketListing|CancelMarketListingConfirmation)\s*\(\s*['"]?([^'",]+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*,\s*['"]?(\d+)['"]?\s*\)/i
            );

            let listingId = '';
            if (match && match[2]) {
                listingId = match[2];
            } else {
                const idMatch = row.id?.match(/^(?:mylisting|listing|myholdlisting)?_?(\d+)$/i) || row.id?.match(/\d+/);
                if (idMatch) {
                    listingId = idMatch[1] || idMatch[0];
                }
            }

            if (!listingId) {
                return null;
            }

            if (!row.id) {
                row.id = `mylisting_${listingId}`;
            }

            let appId = '';
            let contextId = '';
            let assetId = '';

            if (match) {
                appId = match[3];
                contextId = match[4];
                assetId = match[5];
            }

            const nameEl = row.querySelector('.market_listing_item_name, [id$="_name"]');
            const name = nameEl ? nameEl.textContent.trim() : `Listing ${listingId}`;

            const gameEl = row.querySelector('.market_listing_game_name');
            const gameName = gameEl ? gameEl.textContent.trim() : '';

            const priceEl = row.querySelector(
                '.market_listing_price, span[id$="_price"], .market_listing_my_price'
            );
            const priceText = priceEl ? priceEl.textContent.trim() : '';
            const parsedMinor = parseInputToMinor(priceText) || 0;

            const asset = (appId && contextId && assetId && window.g_rgAssets?.[appId]?.[contextId]?.[assetId]) || null;
            const iconHash = asset?.icon_url || '';
            let iconUrl = iconHash && /^[A-Za-z0-9_-]+$/.test(iconHash)
                ? `${STEAM_ICON_ORIGIN}${iconHash}/64fx64f`
                : '';
            if (!iconUrl) {
                const imgEl = row.querySelector('.market_listing_item_img, img[src*="economy/image"]');
                if (imgEl && imgEl.src) {
                    iconUrl = imgEl.src;
                }
            }

            const classId = String(asset?.classid || '');
            const instanceId = String(asset?.instanceid || '0');
            const marketHashName = String(asset?.market_hash_name || asset?.name || name);

            const data = {
                appId,
                asset,
                assetId,
                classId,
                contextId,
                currentPriceMinor: parsedMinor,
                gameName,
                iconUrl,
                instanceId,
                listingId,
                marketHashName,
                name,
                priceText,
                row,
            };

            row._sptListingData = data;
            return data;
        }

        function decorateRow(listing) {
            const image = listing.row.querySelector(
                '.market_listing_item_img, img[src*="economy/image"]'
            );
            const imageBlock = listing.row.querySelector(
                '.market_listing_item_img_container'
            ) || image?.parentElement;

            function positionCheckbox(container) {
                if (!imageBlock) {
                    return;
                }

                const rowRect = listing.row.getBoundingClientRect();
                const imageRect = imageBlock.getBoundingClientRect();
                const checkboxSize = 16;

                container.style.left =
                    `${imageRect.left - rowRect.left - checkboxSize - 4}px`;
                container.style.top =
                    `${imageRect.top - rowRect.top +
                        (imageRect.height - checkboxSize) / 2}px`;
            }

            listing.row.classList.add('spt-market-checkbox-positioning');

            if (listing.row.dataset.sptDecorated === 'true') {
                const existingCb = listing.row.querySelector('.spt-market-row-checkbox');
                if (existingCb) {
                    const shouldBeChecked = selectedListings.has(listing.listingId);
                    if (existingCb.checked !== shouldBeChecked) {
                        existingCb.checked = shouldBeChecked;
                    }

                    const container = existingCb.closest(
                        '.spt-market-checkbox-container'
                    );

                    if (container && container.parentElement !== listing.row) {
                        listing.row.appendChild(container);
                    }

                    if (container) {
                        positionCheckbox(container);
                    }
                }
                return;
            }

            listing.row.dataset.sptDecorated = 'true';

            const container = document.createElement('div');
            container.className = 'spt-market-checkbox-container';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'spt-market-row-checkbox';
            checkbox.dataset.listingId = listing.listingId;
            checkbox.checked = selectedListings.has(listing.listingId);
            checkbox.setAttribute('aria-label', `Select ${listing.name}`);

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedListings.set(listing.listingId, listing);
                } else {
                    selectedListings.delete(listing.listingId);
                }
                updateToolbar();
            });
            container.appendChild(checkbox);
            listing.row.appendChild(container);
            positionCheckbox(container);
        }

        function getVisibleListings() {
            const rows = document.querySelectorAll(
                '#tabContentsMyListings .market_listing_row, ' +
                '.my_listing_section .market_listing_row, ' +
                '#tabContentsMyActiveMarketListingsRows .market_listing_row, ' +
                '#tabContentsMyActiveMarketListingsTable .market_listing_row'
            );
            const list = [];
            const seenIds = new Set();
            for (const row of rows) {
                if (
                    row.classList?.contains('market_listing_header_row') ||
                    row.classList?.contains('market_listing_table_header') ||
                    row.classList?.contains('market_listing_buyorder') ||
                    row.id?.startsWith('mybuyorder_')
                ) {
                    continue;
                }
                const data = extractListingData(row);
                if (data && data.listingId && !seenIds.has(data.listingId)) {
                    seenIds.add(data.listingId);
                    list.push(data);
                }
            }
            return list;
        }

        function syncCheckboxStates() {
            const cbs = document.querySelectorAll('.spt-market-row-checkbox');
            for (const cb of cbs) {
                const shouldBeChecked = selectedListings.has(cb.dataset.listingId);
                if (cb.checked !== shouldBeChecked) {
                    cb.checked = shouldBeChecked;
                }
            }
        }

        function setToolbarStatus(msg) {
            const statusEl = document.getElementById('spt-market-status-msg');
            if (statusEl && statusEl.textContent !== msg) {
                statusEl.textContent = msg;
            }
        }

        function ensureToolbar() {
            let toolbar = document.getElementById('spt-market-toolbar');
            if (toolbar) {
                return toolbar;
            }

            const targetSection =
                document.querySelector('#tabContentsMyListings .my_listing_section') ||
                document.querySelector('#tabContentsMyActiveMarketListingsTable') ||
                document.querySelector('#tabContentsMyActiveMarketListingsRows') ||
                document.querySelector('#tabContentsMyListings');

            if (!targetSection) {
                return null;
            }

            toolbar = document.createElement('div');
            toolbar.id = 'spt-market-toolbar';
            toolbar.className = 'spt-market-toolbar';

            const left = document.createElement('div');
            left.className = 'spt-market-toolbar-left';

            const selectAllLabel = document.createElement('label');
            selectAllLabel.className = 'spt-market-select-all-label';

            const selectAllCb = document.createElement('input');
            selectAllCb.type = 'checkbox';
            selectAllCb.id = 'spt-market-select-all-checkbox';
            selectAllCb.setAttribute('aria-label', 'Select all visible listings');

            selectAllCb.addEventListener('change', () => {
                const rows = getVisibleListings();
                if (selectAllCb.checked) {
                    for (const item of rows) {
                        selectedListings.set(item.listingId, item);
                    }
                } else {
                    for (const item of rows) {
                        selectedListings.delete(item.listingId);
                    }
                }
                syncCheckboxStates();
                updateToolbar();
            });

            const selectAllText = document.createElement('span');
            selectAllText.textContent = 'Select all shown';

            selectAllLabel.appendChild(selectAllCb);
            selectAllLabel.appendChild(selectAllText);

            const countBadge = document.createElement('span');
            countBadge.id = 'spt-market-selected-count';
            countBadge.className = 'spt-market-count-badge';
            countBadge.textContent = '0 selected';

            left.appendChild(selectAllLabel);
            left.appendChild(countBadge);

            const right = document.createElement('div');
            right.className = 'spt-market-toolbar-right';

            const editPriceBtn = document.createElement('button');
            editPriceBtn.type = 'button';
            editPriceBtn.id = 'spt-market-edit-price-btn';
            editPriceBtn.className = 'spt-market-btn spt-market-btn-primary';
            editPriceBtn.textContent = 'Edit price';
            editPriceBtn.disabled = true;
            editPriceBtn.addEventListener('click', openBulkRelistModal);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.id = 'spt-market-remove-btn';
            removeBtn.className = 'spt-market-btn spt-market-btn-danger';
            removeBtn.textContent = 'Remove from Market';
            removeBtn.disabled = true;
            removeBtn.addEventListener('click', promptBulkRemove);

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.id = 'spt-market-clear-btn';
            clearBtn.className = 'spt-market-btn spt-market-btn-secondary';
            clearBtn.textContent = 'Clear';
            clearBtn.style.display = 'none';
            clearBtn.addEventListener('click', () => {
                selectedListings.clear();
                syncCheckboxStates();
                updateToolbar();
            });

            right.appendChild(editPriceBtn);
            right.appendChild(removeBtn);
            right.appendChild(clearBtn);

            const status = document.createElement('div');
            status.id = 'spt-market-status-msg';
            status.className = 'spt-market-status-msg';

            toolbar.appendChild(left);
            toolbar.appendChild(right);
            toolbar.appendChild(status);

            targetSection.parentNode.insertBefore(toolbar, targetSection);
            return toolbar;
        }

        function updateToolbar() {
            ensureToolbar();
            const count = selectedListings.size;
            const countBadge = document.getElementById('spt-market-selected-count');
            if (countBadge) {
                const countText = `${count} selected`;
                if (countBadge.textContent !== countText) {
                    countBadge.textContent = countText;
                }
                const hasSel = count > 0;
                if (countBadge.classList.contains('has-selection') !== hasSel) {
                    countBadge.classList.toggle('has-selection', hasSel);
                }
            }

            const editPriceBtn = document.getElementById('spt-market-edit-price-btn');
            if (editPriceBtn) {
                const disabled = count === 0 || busy;
                if (editPriceBtn.disabled !== disabled) {
                    editPriceBtn.disabled = disabled;
                }
                const editText = count > 0 ? `Edit price (${count})` : 'Edit price';
                if (editPriceBtn.textContent !== editText) {
                    editPriceBtn.textContent = editText;
                }
            }

            const removeBtn = document.getElementById('spt-market-remove-btn');
            if (removeBtn) {
                const disabled = count === 0 || busy;
                if (removeBtn.disabled !== disabled) {
                    removeBtn.disabled = disabled;
                }
                const removeText = count > 0 ? `Remove selected (${count})` : 'Remove from Market';
                if (removeBtn.textContent !== removeText) {
                    removeBtn.textContent = removeText;
                }
            }

            const clearBtn = document.getElementById('spt-market-clear-btn');
            if (clearBtn) {
                const display = count > 0 ? 'inline-block' : 'none';
                if (clearBtn.style.display !== display) {
                    clearBtn.style.display = display;
                }
                if (clearBtn.disabled !== busy) {
                    clearBtn.disabled = busy;
                }
            }

            const selectAllCb = document.getElementById('spt-market-select-all-checkbox');
            if (selectAllCb) {
                const visible = getVisibleListings();
                const allSelected = visible.length > 0 && visible.every((item) => selectedListings.has(item.listingId));
                if (selectAllCb.checked !== allSelected) {
                    selectAllCb.checked = allSelected;
                }
                const disabled = busy || visible.length === 0;
                if (selectAllCb.disabled !== disabled) {
                    selectAllCb.disabled = disabled;
                }
            }
        }

        function syncListings() {
            if (busy) {
                return;
            }
            const visible = getVisibleListings();
            if (visible.length === 0) {
                if (document.getElementById('spt-market-toolbar')) {
                    updateToolbar();
                }
                return;
            }
            ensureToolbar();
            for (const item of visible) {
                decorateRow(item);
            }
            updateToolbar();
        }

        function createProgressModal(titleText) {
            const overlay = document.createElement('div');
            overlay.className = 'spt-market-modal-overlay';

            const modal = document.createElement('div');
            modal.className = 'spt-market-modal spt-market-progress-modal';

            const header = document.createElement('div');
            header.className = 'spt-market-modal-header';
            const title = document.createElement('h3');
            title.textContent = titleText;
            header.appendChild(title);

            const body = document.createElement('div');
            body.className = 'spt-market-modal-body';

            const statusText = document.createElement('div');
            statusText.className = 'spt-market-progress-status';
            statusText.textContent = 'Starting...';

            const progressTrack = document.createElement('div');
            progressTrack.className = 'spt-market-progress-track';

            const progressFill = document.createElement('div');
            progressFill.className = 'spt-market-progress-fill';
            progressFill.style.width = '0%';
            progressTrack.appendChild(progressFill);

            body.appendChild(statusText);
            body.appendChild(progressTrack);

            const footer = document.createElement('div');
            footer.className = 'spt-market-modal-footer';

            const stopBtn = document.createElement('button');
            stopBtn.type = 'button';
            stopBtn.className = 'spt-market-btn spt-market-btn-secondary';
            stopBtn.textContent = 'Stop after current item';

            let stopCallback = null;
            stopBtn.addEventListener('click', () => {
                stopBtn.disabled = true;
                stopBtn.textContent = 'Stopping...';
                if (stopCallback) {
                    stopCallback();
                }
            });

            footer.appendChild(stopBtn);
            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            return {
                close() {
                    overlay.remove();
                },
                onStop(fn) {
                    stopCallback = fn;
                },
                update(msg, current, total) {
                    statusText.textContent = msg;
                    if (total > 0) {
                        const pct = Math.min(100, Math.round((current / total) * 100));
                        progressFill.style.width = `${pct}%`;
                    }
                },
            };
        }

        async function promptBulkRemove() {
            if (busy || !selectedListings.size) {
                return;
            }
            const sessionId = getSessionId();
            if (!sessionId) {
                window.alert('Could not verify your Steam session. Please reload the page.');
                return;
            }
            const items = [...selectedListings.values()];
            const confirmed = window.confirm(
                `Remove ${items.length} selected listing(s) from the Steam Community Market?\n\n` +
                'The items will be delisted and returned to your Steam inventory.'
            );
            if (!confirmed) {
                return;
            }

            busy = true;
            updateToolbar();

            const progress = createProgressModal('Removing Market Listings');
            let stopped = false;
            progress.onStop(() => {
                stopped = true;
            });

            let removed = 0;
            let failed = 0;

            for (let i = 0; i < items.length; i += 1) {
                if (stopped) {
                    break;
                }
                const item = items[i];
                progress.update(
                    `Removing (${i + 1}/${items.length}): ${item.name}`,
                    i + 1,
                    items.length
                );

                try {
                    const url = requirePinnedSteamUrl(
                        `/market/removelisting/${item.listingId}`,
                        STEAM_COMMUNITY_ORIGIN
                    );
                    const body = new URLSearchParams({ sessionid: sessionId });

                    const response = await fetch(url.toString(), {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        },
                        body: body.toString(),
                    });
                    requirePinnedSteamResponseUrl(
                        response,
                        STEAM_COMMUNITY_ORIGIN,
                        url.toString()
                    );

                    if (!response.ok) {
                        if (response.status === 429) {
                            progress.update(
                                'Rate limited by Steam. Waiting 10 seconds before continuing...',
                                i + 1,
                                items.length
                            );
                            await sleep(10000);
                        }
                        throw new Error(`HTTP ${response.status}`);
                    }

                    removed += 1;
                    selectedListings.delete(item.listingId);

                    const row = item.row || document.getElementById(`mylisting_${item.listingId}`);
                    if (row) {
                        row.remove();
                    }

                    const countEl = document.getElementById('my_market_activelistings_number');
                    if (countEl) {
                        const current = parseInt(countEl.textContent, 10) || 0;
                        countEl.textContent = String(Math.max(0, current - 1));
                    }
                } catch (err) {
                    failed += 1;
                    console.warn('Steam Page Tools: failed to remove listing', item.listingId, err);
                }

                if (i < items.length - 1 && !stopped) {
                    await sleep(800);
                }
            }

            progress.close();
            busy = false;
            updateToolbar();
            setToolbarStatus(
                stopped
                    ? `Stopped. Removed ${removed} listing(s)${failed ? `, ${failed} failed` : ''}.`
                    : `Finished. Removed ${removed} listing(s)${failed ? `, ${failed} failed` : ''}.`
            );
        }

        function openBulkRelistModal() {
            if (busy || !selectedListings.size) {
                return;
            }
            const items = [...selectedListings.values()];
            const walletData = getWalletData();

            const proposedPrices = new Map();
            for (const item of items) {
                const initialBuyer = item.currentPriceMinor > 0 ? item.currentPriceMinor : 3;
                const net = walletData.calculateSellerNet(initialBuyer);
                proposedPrices.set(item.listingId, {
                    buyerMinor: initialBuyer,
                    netMinor: net,
                });
            }

            const overlay = document.createElement('div');
            overlay.className = 'spt-market-modal-overlay';

            const modal = document.createElement('div');
            modal.className = 'spt-market-modal';

            const header = document.createElement('div');
            header.className = 'spt-market-modal-header';
            const title = document.createElement('h3');
            title.textContent = `Edit Prices & Relist (${items.length} items)`;
            header.appendChild(title);

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'spt-market-modal-close';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('click', () => overlay.remove());
            header.appendChild(closeBtn);

            const body = document.createElement('div');
            body.className = 'spt-market-modal-body';

            const notice = document.createElement('div');
            notice.className = 'spt-market-modal-notice';
            notice.textContent =
                'Steam requires delisting an item before listing it at a new price. ' +
                'Steam Page Tools will cancel the current listing, locate the returned item in your inventory, ' +
                'and list it with your specified price.';
            body.appendChild(notice);

            const bulkBar = document.createElement('div');
            bulkBar.className = 'spt-market-bulk-bar';

            const setAllLabel = document.createElement('span');
            setAllLabel.textContent = 'Set all buyer prices:';

            const setAllInput = document.createElement('input');
            setAllInput.type = 'text';
            setAllInput.className = 'spt-market-bulk-input';
            setAllInput.placeholder = 'e.g. 1.25';

            const setAllBtn = document.createElement('button');
            setAllBtn.type = 'button';
            setAllBtn.className = 'spt-market-btn spt-market-btn-secondary';
            setAllBtn.textContent = 'Apply to all';

            const adjustLabel = document.createElement('span');
            adjustLabel.textContent = 'Adjust all (%):';

            const adjustInput = document.createElement('input');
            adjustInput.type = 'text';
            adjustInput.className = 'spt-market-bulk-input spt-market-input-small';
            adjustInput.placeholder = '-10';

            const adjustBtn = document.createElement('button');
            adjustBtn.type = 'button';
            adjustBtn.className = 'spt-market-btn spt-market-btn-secondary';
            adjustBtn.textContent = 'Apply %';

            bulkBar.appendChild(setAllLabel);
            bulkBar.appendChild(setAllInput);
            bulkBar.appendChild(setAllBtn);
            bulkBar.appendChild(adjustLabel);
            bulkBar.appendChild(adjustInput);
            bulkBar.appendChild(adjustBtn);
            body.appendChild(bulkBar);

            const table = document.createElement('div');
            table.className = 'spt-market-relist-table';

            const thead = document.createElement('div');
            thead.className = 'spt-market-relist-header';

            const thItem = document.createElement('div');
            thItem.className = 'col-item';
            thItem.textContent = 'Item';

            const thCurr = document.createElement('div');
            thCurr.className = 'col-current';
            thCurr.textContent = 'Current Price';

            const thNew = document.createElement('div');
            thNew.className = 'col-new';
            thNew.textContent = 'New Price (Buyer)';

            const thRec = document.createElement('div');
            thRec.className = 'col-receive';
            thRec.textContent = 'You Receive';

            thead.appendChild(thItem);
            thead.appendChild(thCurr);
            thead.appendChild(thNew);
            thead.appendChild(thRec);
            table.appendChild(thead);

            const rowsContainer = document.createElement('div');
            rowsContainer.className = 'spt-market-relist-rows';

            const rowElements = new Map();

            function updateRowCalculation(listingId, buyerMinor) {
                const netMinor = walletData.calculateSellerNet(buyerMinor);
                proposedPrices.set(listingId, { buyerMinor, netMinor });
                const rowEl = rowElements.get(listingId);
                if (rowEl) {
                    const receiveEl = rowEl.querySelector('.col-receive');
                    if (receiveEl) {
                        receiveEl.textContent = walletData.formatMinor(netMinor);
                    }
                }
                updateTotalsSummary();
            }

            for (const item of items) {
                const rowEl = document.createElement('div');
                rowEl.className = 'spt-market-relist-row';

                const colItem = document.createElement('div');
                colItem.className = 'col-item';

                if (item.iconUrl) {
                    const img = document.createElement('img');
                    img.src = item.iconUrl;
                    img.className = 'spt-market-relist-icon';
                    img.alt = '';
                    colItem.appendChild(img);
                }

                const itemNames = document.createElement('div');
                itemNames.className = 'spt-market-relist-names';
                const itemName = document.createElement('div');
                itemName.className = 'spt-market-relist-name';
                itemName.textContent = item.name;
                const gameName = document.createElement('div');
                gameName.className = 'spt-market-relist-game';
                gameName.textContent = item.gameName;
                itemNames.appendChild(itemName);
                if (item.gameName) {
                    itemNames.appendChild(gameName);
                }
                colItem.appendChild(itemNames);

                const colCurrent = document.createElement('div');
                colCurrent.className = 'col-current';
                colCurrent.textContent = item.priceText || walletData.formatMinor(item.currentPriceMinor);

                const colNew = document.createElement('div');
                colNew.className = 'col-new';

                const priceInput = document.createElement('input');
                priceInput.type = 'text';
                priceInput.className = 'spt-market-price-input';
                priceInput.value = minorToInput(proposedPrices.get(item.listingId).buyerMinor);

                priceInput.addEventListener('input', () => {
                    const parsed = parseInputToMinor(priceInput.value);
                    if (parsed && parsed >= 3) {
                        priceInput.classList.remove('spt-input-error');
                        updateRowCalculation(item.listingId, parsed);
                    } else {
                        priceInput.classList.add('spt-input-error');
                    }
                });
                colNew.appendChild(priceInput);

                const colReceive = document.createElement('div');
                colReceive.className = 'col-receive';
                colReceive.textContent = walletData.formatMinor(proposedPrices.get(item.listingId).netMinor);

                rowEl.appendChild(colItem);
                rowEl.appendChild(colCurrent);
                rowEl.appendChild(colNew);
                rowEl.appendChild(colReceive);

                rowsContainer.appendChild(rowEl);
                rowElements.set(item.listingId, rowEl);
            }

            table.appendChild(rowsContainer);
            body.appendChild(table);

            setAllBtn.addEventListener('click', () => {
                const parsed = parseInputToMinor(setAllInput.value);
                if (!parsed || parsed < 3) {
                    window.alert('Please enter a valid price (minimum $0.03 equivalent).');
                    return;
                }
                for (const item of items) {
                    const rowEl = rowElements.get(item.listingId);
                    if (rowEl) {
                        const input = rowEl.querySelector('.spt-market-price-input');
                        if (input) {
                            input.value = minorToInput(parsed);
                            input.classList.remove('spt-input-error');
                        }
                    }
                    updateRowCalculation(item.listingId, parsed);
                }
            });

            adjustBtn.addEventListener('click', () => {
                const pct = parseFloat(adjustInput.value.replace(',', '.'));
                if (Number.isNaN(pct)) {
                    window.alert('Please enter a valid percentage adjustment, e.g. -10 or +5');
                    return;
                }
                const factor = 1 + (pct / 100);
                for (const item of items) {
                    const base = item.currentPriceMinor > 0 ? item.currentPriceMinor : 3;
                    const adjusted = Math.max(3, Math.round(base * factor));
                    const rowEl = rowElements.get(item.listingId);
                    if (rowEl) {
                        const input = rowEl.querySelector('.spt-market-price-input');
                        if (input) {
                            input.value = minorToInput(adjusted);
                            input.classList.remove('spt-input-error');
                        }
                    }
                    updateRowCalculation(item.listingId, adjusted);
                }
            });

            const footer = document.createElement('div');
            footer.className = 'spt-market-modal-footer';

            const summary = document.createElement('div');
            summary.className = 'spt-market-modal-summary';

            function updateTotalsSummary() {
                let totalBuyer = 0;
                let totalNet = 0;
                for (const { buyerMinor, netMinor } of proposedPrices.values()) {
                    totalBuyer += buyerMinor;
                    totalNet += netMinor;
                }
                summary.textContent =
                    `Total buyer: ${walletData.formatMinor(totalBuyer)} · ` +
                    `Est. proceeds: ${walletData.formatMinor(totalNet)}`;
            }
            updateTotalsSummary();

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'spt-market-btn spt-market-btn-secondary';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => overlay.remove());

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = 'spt-market-btn spt-market-btn-primary';
            confirmBtn.textContent = `Relist ${items.length} item(s)`;

            confirmBtn.addEventListener('click', async () => {
                for (const [, { buyerMinor, netMinor }] of proposedPrices.entries()) {
                    if (!buyerMinor || buyerMinor < 3 || !netMinor || netMinor < 1) {
                        window.alert('Please ensure all items have a valid price of at least $0.03.');
                        return;
                    }
                }

                const confirmed = window.confirm(
                    `Confirm relisting ${items.length} item(s)?\n\n` +
                    'Each item will be delisted, resolved in your inventory, and relisted at your new price.'
                );
                if (!confirmed) {
                    return;
                }

                overlay.remove();
                await executeBulkRelist(items, proposedPrices);
            });

            footer.appendChild(summary);
            footer.appendChild(cancelBtn);
            footer.appendChild(confirmBtn);

            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        }

        async function executeBulkRelist(items, proposedPrices) {
            const sessionId = getSessionId();
            const ownerSteamId = getOwnerSteamId();

            if (!sessionId || !ownerSteamId) {
                window.alert('Could not verify your Steam session or account ID. Please reload the page.');
                return;
            }

            busy = true;
            updateToolbar();

            const progress = createProgressModal('Relisting Market Items');
            let stopped = false;
            progress.onStop(() => {
                stopped = true;
            });

            let relisted = 0;
            let failed = 0;

            const usedAssetIds = new Set();

            for (let i = 0; i < items.length; i += 1) {
                if (stopped) {
                    break;
                }
                const item = items[i];
                const prices = proposedPrices.get(item.listingId);
                const newNet = prices ? prices.netMinor : 1;

                progress.update(
                    `(${i + 1}/${items.length}) Step 1/3: Delisting ${item.name}...`,
                    i + 1,
                    items.length
                );

                try {
                    const removeUrl = requirePinnedSteamUrl(
                        `/market/removelisting/${item.listingId}`,
                        STEAM_COMMUNITY_ORIGIN
                    );
                    const removeBody = new URLSearchParams({ sessionid: sessionId });

                    const removeRes = await fetch(removeUrl.toString(), {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        },
                        body: removeBody.toString(),
                    });
                    requirePinnedSteamResponseUrl(
                        removeRes,
                        STEAM_COMMUNITY_ORIGIN,
                        removeUrl.toString()
                    );

                    if (!removeRes.ok) {
                        if (removeRes.status === 429) {
                            progress.update(
                                'Rate limited by Steam. Waiting 10 seconds before continuing...',
                                i + 1,
                                items.length
                            );
                            await sleep(10000);
                        }
                        throw new Error(`Delist failed: HTTP ${removeRes.status}`);
                    }

                    const row = item.row || document.getElementById(`mylisting_${item.listingId}`);
                    if (row) {
                        row.remove();
                    }
                    selectedListings.delete(item.listingId);

                    progress.update(
                        `(${i + 1}/${items.length}) Step 2/3: Finding returned ${item.name} in inventory...`,
                        i + 1,
                        items.length
                    );

                    await sleep(1500);

                    let foundAssetId = null;
                    for (let attempt = 0; attempt < 3; attempt += 1) {
                        if (stopped) {
                            break;
                        }
                        try {
                            const invUrl = requirePinnedSteamUrl(
                                `/inventory/${ownerSteamId}/${item.appId}/${item.contextId}?count=2000&l=english`,
                                STEAM_COMMUNITY_ORIGIN
                            );
                            const invRes = await fetch(invUrl.toString(), { credentials: 'include' });
                            requirePinnedSteamResponseUrl(
                                invRes,
                                STEAM_COMMUNITY_ORIGIN,
                                invUrl.toString()
                            );
                            if (invRes.ok) {
                                const invData = await invRes.json();
                                const assets = Array.isArray(invData?.assets) ? invData.assets : [];
                                const descriptions = Array.isArray(invData?.descriptions) ? invData.descriptions : [];

                                const descMap = new Map();
                                for (const d of descriptions) {
                                    descMap.set(`${d.classid}_${d.instanceid || '0'}`, d);
                                }

                                for (const a of assets) {
                                    if (usedAssetIds.has(a.assetid)) {
                                        continue;
                                    }
                                    const key = `${a.classid}_${a.instanceid || '0'}`;
                                    const desc = descMap.get(key);

                                    const matchesClass = item.classId && String(a.classid) === String(item.classId);
                                    const matchesHash = desc && (desc.market_hash_name === item.marketHashName || desc.name === item.name);

                                    if ((matchesClass || matchesHash) && desc?.marketable !== 0) {
                                        foundAssetId = String(a.assetid);
                                        usedAssetIds.add(foundAssetId);
                                        break;
                                    }
                                }
                            }
                        } catch (invErr) {
                            console.warn('Inventory fetch error during relist attempt', invErr);
                        }

                        if (foundAssetId || stopped) {
                            break;
                        }
                        await sleep(1500);
                    }

                    if (!foundAssetId) {
                        throw new Error('Item was delisted but could not be located in inventory to relist.');
                    }

                    progress.update(
                        `(${i + 1}/${items.length}) Step 3/3: Relisting ${item.name}...`,
                        i + 1,
                        items.length
                    );

                    const sellUrl = requirePinnedSteamUrl(
                        '/market/sellitem/',
                        STEAM_COMMUNITY_ORIGIN
                    );
                    const sellBody = new URLSearchParams({
                        amount: '1',
                        appid: item.appId,
                        assetid: foundAssetId,
                        contextid: item.contextId,
                        price: String(newNet),
                        sessionid: sessionId,
                    });

                    const sellRes = await fetch(sellUrl.toString(), {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        },
                        body: sellBody.toString(),
                    });
                    requirePinnedSteamResponseUrl(
                        sellRes,
                        STEAM_COMMUNITY_ORIGIN,
                        sellUrl.toString()
                    );

                    const sellData = await sellRes.json().catch(() => null);

                    if (!sellRes.ok || !sellData?.success) {
                        if (sellRes.status === 429) {
                            progress.update(
                                'Rate limited by Steam. Waiting 10 seconds before continuing...',
                                i + 1,
                                items.length
                            );
                            await sleep(10000);
                        }
                        const msg = sellData?.message || `HTTP ${sellRes.status}`;
                        throw new Error(`Relist failed: ${msg}`);
                    }

                    relisted += 1;
                } catch (err) {
                    failed += 1;
                    console.error('Steam Page Tools: Relisting error for', item.name, err);
                }

                if (i < items.length - 1 && !stopped) {
                    await sleep(1500);
                }
            }

            progress.close();
            busy = false;
            updateToolbar();
            setToolbarStatus(
                stopped
                    ? `Stopped. Relisted ${relisted} item(s)${failed ? `, ${failed} failed` : ''}.`
                    : `Finished. Relisted ${relisted} item(s)${failed ? `, ${failed} failed` : ''}. Refreshing market page in 2s...`
            );

            if (relisted > 0) {
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }

        function injectMarketStyles() {
            if (document.getElementById('spt-market-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'spt-market-styles';
            style.textContent = `
                .spt-market-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 10px 14px;
                    margin: 12px 0;
                    background: #17202d;
                    border: 1px solid rgba(103, 193, 241, 0.2);
                    border-radius: 3px;
                    font: 13px/1.4 "Motiva Sans", Arial, sans-serif;
                    color: #c6d4df;
                    box-sizing: border-box;
                }

                .spt-market-toolbar-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .spt-market-select-all-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    user-select: none;
                }

                .spt-market-count-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.3);
                    color: #8f98a0;
                    font-size: 11px;
                }

                .spt-market-count-badge.has-selection {
                    background: rgba(103, 193, 241, 0.2);
                    color: #67c1f1;
                    font-weight: 600;
                }

                .spt-market-toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .spt-market-btn {
                    box-sizing: border-box;
                    border: 0;
                    border-radius: 2px;
                    padding: 6px 14px;
                    font: 12px/1.4 "Motiva Sans", Arial, sans-serif;
                    cursor: pointer;
                    text-decoration: none;
                    transition: opacity 0.15s, background 0.15s;
                }

                .spt-market-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spt-market-btn-primary {
                    background: linear-gradient(to bottom, #799905 5%, #536904 95%);
                    color: #d2efa9;
                }

                .spt-market-btn-primary:not(:disabled):hover {
                    background: linear-gradient(to bottom, #a4d007 5%, #6e8c06 95%);
                    color: #ffffff;
                }

                .spt-market-btn-danger {
                    background: linear-gradient(to bottom, #992305 5%, #691504 95%);
                    color: #efc0a9;
                }

                .spt-market-btn-danger:not(:disabled):hover {
                    background: linear-gradient(to bottom, #c0320a 5%, #881e08 95%);
                    color: #ffffff;
                }

                .spt-market-btn-secondary {
                    background: rgba(255, 255, 255, 0.08);
                    color: #c6d4df;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }

                .spt-market-btn-secondary:not(:disabled):hover {
                    background: rgba(255, 255, 255, 0.16);
                    color: #ffffff;
                }

                .spt-market-status-msg {
                    width: 100%;
                    font-size: 12px;
                    color: #8f98a0;
                    min-height: 16px;
                }

                .spt-market-checkbox-container {
                    position: absolute;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    padding: 0;
                    z-index: 1;
                }

                .market_listing_row.spt-market-checkbox-positioning {
                    position: relative;
                    overflow: visible !important;
                }

                .spt-market-row-checkbox {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    margin: 0;
                }

                .spt-market-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.82);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    font-family: "Motiva Sans", Arial, sans-serif;
                }

                .spt-market-modal {
                    background: #1b2838;
                    border: 1px solid #67c1f1;
                    border-radius: 4px;
                    box-shadow: 0 0 24px rgba(0, 0, 0, 0.85);
                    width: 90%;
                    max-width: 720px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    color: #c6d4df;
                }

                .spt-market-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 18px;
                    background: linear-gradient(to right, #1b2838, #2a475e);
                    border-bottom: 1px solid rgba(103, 193, 241, 0.2);
                }

                .spt-market-modal-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #ffffff;
                }

                .spt-market-modal-close {
                    background: transparent;
                    border: 0;
                    color: #8f98a0;
                    font-size: 22px;
                    cursor: pointer;
                    line-height: 1;
                    padding: 0 4px;
                }

                .spt-market-modal-close:hover {
                    color: #ffffff;
                }

                .spt-market-modal-body {
                    padding: 16px 18px;
                    overflow-y: auto;
                    flex: 1 1 auto;
                }

                .spt-market-modal-notice {
                    font-size: 12px;
                    line-height: 1.5;
                    padding: 8px 12px;
                    background: rgba(103, 193, 241, 0.1);
                    border-left: 3px solid #67c1f1;
                    margin-bottom: 14px;
                    color: #acb9c4;
                }

                .spt-market-bulk-bar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    padding: 10px;
                    background: #121a24;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                    margin-bottom: 14px;
                    font-size: 12px;
                }

                .spt-market-bulk-input {
                    width: 70px;
                    height: 26px;
                    padding: 2px 6px;
                    background: #222b35;
                    border: 1px solid #000000;
                    color: #ffffff;
                    border-radius: 2px;
                    box-sizing: border-box;
                    font-size: 12px;
                }

                .spt-market-input-small {
                    width: 50px;
                }

                .spt-market-relist-table {
                    border: 1px solid rgba(103, 193, 241, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                    font-size: 12px;
                }

                .spt-market-relist-header {
                    display: grid;
                    grid-template-columns: minmax(0, 2fr) 100px 110px 100px;
                    gap: 8px;
                    align-items: center;
                    padding: 8px 10px;
                    background: #16202b;
                    font-weight: 600;
                    color: #8f98a0;
                    border-bottom: 1px solid rgba(103, 193, 241, 0.15);
                }

                .spt-market-relist-rows {
                    max-height: 280px;
                    overflow-y: auto;
                }

                .spt-market-relist-row {
                    display: grid;
                    grid-template-columns: minmax(0, 2fr) 100px 110px 100px;
                    gap: 8px;
                    align-items: center;
                    padding: 8px 10px;
                    background: rgba(27, 40, 56, 0.6);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
                }

                .spt-market-relist-row:nth-child(even) {
                    background: rgba(34, 49, 65, 0.6);
                }

                .col-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    overflow: hidden;
                }

                .spt-market-relist-icon {
                    width: 32px;
                    height: 32px;
                    flex: 0 0 32px;
                    object-fit: contain;
                }

                .spt-market-relist-names {
                    overflow: hidden;
                    min-width: 0;
                }

                .spt-market-relist-name {
                    color: #ffffff;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .spt-market-relist-game {
                    font-size: 11px;
                    color: #8f98a0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .col-current {
                    color: #8f98a0;
                }

                .col-new {
                    display: flex;
                    align-items: center;
                }

                .spt-market-price-input {
                    width: 80px;
                    height: 26px;
                    padding: 2px 6px;
                    background: #222b35;
                    border: 1px solid #000000;
                    color: #ffffff;
                    border-radius: 2px;
                    box-sizing: border-box;
                    font-size: 12px;
                }

                .spt-market-price-input.spt-input-error {
                    border-color: #ff4c4c;
                    background: #3a1e1e;
                }

                .col-receive {
                    color: #a4d007;
                    font-weight: 600;
                }

                .spt-market-modal-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 12px 18px;
                    background: #121a24;
                    border-top: 1px solid rgba(103, 193, 241, 0.2);
                }

                .spt-market-modal-summary {
                    margin-right: auto;
                    font-size: 12px;
                    color: #8f98a0;
                }

                .spt-market-progress-modal {
                    max-width: 480px;
                }

                .spt-market-progress-status {
                    font-size: 13px;
                    color: #c6d4df;
                    margin-bottom: 12px;
                    word-break: break-word;
                }

                .spt-market-progress-track {
                    width: 100%;
                    height: 12px;
                    background: #121a24;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    overflow: hidden;
                }

                .spt-market-progress-fill {
                    height: 100%;
                    background: linear-gradient(to right, #67c1f1, #417a9b);
                    transition: width 0.2s ease;
                }
            `;
            document.head.appendChild(style);
        }

        function isOurElement(node) {
            if (!node || node.nodeType !== 1) {
                return false;
            }
            return (
                node.id === 'spt-market-toolbar' ||
                node.classList?.contains('spt-market-toolbar') ||
                node.classList?.contains('spt-market-checkbox-container') ||
                node.classList?.contains('spt-market-row-checkbox') ||
                node.classList?.contains('spt-market-modal-overlay') ||
                Boolean(node.closest?.('#spt-market-toolbar, .spt-market-checkbox-container, .spt-market-modal-overlay'))
            );
        }

        function attachObserver() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }

            const target =
                document.getElementById('tabContentsMyListings') ||
                document.getElementById('tabContentsMyActiveMarketListingsRows') ||
                document.getElementById('tabContentsMyActiveMarketListingsTable') ||
                document.querySelector('.my_listing_section') ||
                document.body;

            if (!target) {
                return false;
            }

            observer = new MutationObserver((records) => {
                if (busy) {
                    return;
                }

                const hasExternalChanges = records.some((record) => {
                    if (record.target?.closest?.('#spt-market-toolbar, .spt-market-checkbox-container, .spt-market-modal-overlay')) {
                        return false;
                    }
                    return [...record.addedNodes, ...record.removedNodes].some((node) => !isOurElement(node));
                });

                if (hasExternalChanges) {
                    scheduleSync();
                }
            });

            observer.observe(target, { childList: true, subtree: true });
            return true;
        }

        attachObserver();

        let scanCount = 0;
        scanTimer = setInterval(() => {
            scanCount += 1;
            if (!observer) {
                attachObserver();
            }
            syncListings();
            if (document.getElementById('spt-market-toolbar') || scanCount >= 20) {
                clearInterval(scanTimer);
            }
        }, 300);
    }
})();
