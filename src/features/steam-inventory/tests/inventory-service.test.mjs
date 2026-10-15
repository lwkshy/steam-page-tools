import assert from 'node:assert/strict';
import test from 'node:test';

import { fixture, loadModules, plain } from './helpers.mjs';

const modules = await loadModules([
    'types.js',
    'inventory-service.js',
]);

test('loads paginated inventories, preserves stacks, and deduplicates assets', async () => {
    const pages = [
        await fixture('inventory-page-1.json'),
        await fixture('inventory-page-2.json'),
    ];
    const calls = [];
    const service = modules.inventoryService.createInventoryService({
        api: {
            async loadInventoryPage(input) {
                calls.push(input);
                return pages.shift();
            },
        },
        nowImpl: () => 1234,
    });
    const items = await service.loadContext(
        '76561198000000000',
        {
            appId: '753',
            appName: 'Steam',
            contextId: '6',
            contextName: 'Community',
        }
    );

    assert.equal(calls.length, 2);
    assert.equal(calls[1].startAssetId, '200');
    assert.equal(items.length, 3);
    assert.equal(items.find((item) => item.assetId === '100').quantity, 5);
    assert.equal(
        items.find((item) => item.assetId === '100').name,
        '<img src=x onerror=alert(1)>'
    );
    assert.equal(items.find((item) => item.assetId === '100').gem.eligible, true);
    assert.equal(
        items.find((item) => item.assetId === '100').gem.sourceAppId,
        '440'
    );
    assert.equal(items.find((item) => item.assetId === '100').gem.itemType, '2');
    assert.equal(
        items.find((item) => item.assetId === '100').gem.borderColor,
        'AABBCC'
    );
});

test('waits for the native request gate before every inventory page', async () => {
    const pages = [
        await fixture('inventory-page-1.json'),
        await fixture('inventory-page-2.json'),
    ];
    const events = [];
    const service = modules.inventoryService.createInventoryService({
        api: {
            async loadInventoryPage() {
                events.push('request');
                return pages.shift();
            },
        },
    });

    await service.loadContext(
        '76561198000000000',
        {
            appId: '753',
            appName: 'Steam',
            contextId: '6',
            contextName: 'Community',
        },
        {
            beforePage: async ({ pageNumber }) => {
                events.push(`gate:${pageNumber}`);
            },
        }
    );

    assert.deepEqual(events, [
        'gate:1',
        'request',
        'gate:2',
        'request',
    ]);
});

test('keeps compatibility with legacy three-argument Gems actions', () => {
    const gem = modules.inventoryService.parseGemMetadata({
        market_fee_app: 570,
        owner_actions: [{
            link: "javascript:GetGooValue( '570', '3', '0' )",
            name: 'Turn into Gems...',
        }],
    });

    assert.equal(gem.eligible, true);
    assert.equal(gem.sourceAppId, '570');
    assert.equal(gem.itemType, '3');
    assert.equal(gem.borderColor, '0');
});

test('preserves Steam Market bucket filters for grouped item variants', () => {
    const filters = modules.inventoryService.parseMarketListingFilters({
        market_bucket_group_id: 'G183D20193004',
        tags: [
            { category: 'Quality', internal_name: 'normal' },
            { category: 'Exterior', internal_name: 'WearCategory3' },
            { category: 'Weapon', internal_name: 'weapon_usp_silencer' },
        ],
    });

    assert.deepEqual(plain(filters), {
        category_Exterior: 'WearCategory3',
        category_Quality: 'normal',
    });
    assert.deepEqual(
        plain(modules.inventoryService.parseMarketListingFilters({
            tags: [{ category: 'Exterior', internal_name: 'WearCategory3' }],
        })),
        {}
    );
});

test('reports partial inventory failures while retaining successful tabs', async () => {
    const page = await fixture('inventory-page-2.json');
    const service = modules.inventoryService.createInventoryService({
        api: {
            async loadInventoryPage({ contextId }) {
                if (contextId === '9') {
                    throw new Error('private');
                }
                return page;
            },
        },
    });
    const result = await service.loadAll(
        '76561198000000000',
        [
            { appId: '753', appName: 'Steam', contextId: '6' },
            { appId: '730', appName: 'CS2', contextId: '9' },
        ]
    );

    assert.equal(result.items.length, 1);
    assert.equal(result.failures.length, 1);
    assert.equal(result.failures[0].contextId, '9');
});

test('halts all inventory loading when Steam authentication fails', async () => {
    let calls = 0;
    const service = modules.inventoryService.createInventoryService({
        api: {
            async loadInventoryPage() {
                calls += 1;
                throw Object.assign(new Error('signed out'), {
                    code: 'authentication',
                });
            },
        },
    });

    await assert.rejects(
        service.loadAll(
            '76561198000000000',
            [
                { appId: '753', appName: 'Steam', contextId: '6' },
                { appId: '730', appName: 'CS2', contextId: '2' },
            ]
        ),
        { code: 'authentication' }
    );
    assert.equal(calls, 1);
});

test('lists concrete contexts without duplicating app-wide context zero', () => {
    const contexts = modules.inventoryService.listContexts({
        753: {
            name: 'Steam',
            rgContexts: {
                0: { name: 'All', asset_count: 5 },
                6: { name: 'Community', asset_count: 5 },
            },
        },
    });

    assert.equal(contexts.length, 1);
    assert.equal(contexts[0].contextId, '6');
});

test('prices temporary CS2 holds but excludes permanent unmarketable items', () => {
    const context = {
        appId: '730',
        appName: 'Counter-Strike 2',
        contextId: '2',
    };
    const asset = {
        appid: '730',
        assetid: '100',
        classid: '200',
        contextid: '2',
    };
    const tradeProtected = modules.inventoryService.normalizeAsset(asset, {
        cache_expiration: '1760000000',
        market_hash_name: 'AK-47 | Redline (Field-Tested)',
        marketable: 0,
        name: 'AK-47 | Redline (Field-Tested)',
    }, context, 1234);
    const permanentCollectible = modules.inventoryService.normalizeAsset({
        ...asset,
        assetid: '101',
    }, {
        descriptions: [{
            color: 'ff4040',
            value: 'Not Tradable, Not Marketable',
        }],
        market_hash_name: '5 Year Veteran Coin',
        marketable: 0,
        name: '5 Year Veteran Coin',
    }, context, 1234);
    const dateOnlyHold = modules.inventoryService.normalizeAsset({
        ...asset,
        assetid: '102',
    }, {
        market_hash_name: 'AWP | Asiimov (Field-Tested)',
        marketable: 0,
        name: 'AWP | Asiimov (Field-Tested)',
        owner_descriptions: [{
            color: 'ff4040',
            value: 'Tradable After Oct 14, 2026',
        }],
    }, context, 1234);

    assert.equal(tradeProtected.hasTemporaryHold, true);
    assert.equal(modules.inventoryService.hasMarketValue(tradeProtected), true);
    assert.equal(dateOnlyHold.hasTemporaryHold, true);
    assert.equal(modules.inventoryService.hasMarketValue(dateOnlyHold), true);
    assert.equal(permanentCollectible.hasTemporaryHold, false);
    assert.equal(
        modules.inventoryService.hasMarketValue(permanentCollectible),
        false
    );
});
