/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import * as azdata from 'azdata';
import * as vscode from 'vscode';
import 'mocha';
import { TokenCredentials } from '@azure/ms-rest-js';
import { AppContext } from '../../../appContext';

import { azureResource } from '../../../azureResource/azure-resource';
import {
	IAzureResourceCacheService,
	IAzureResourceSubscriptionService,
	IAzureResourceSubscriptionFilterService,
	IAzureResourceTenantService
} from '../../../azureResource/interfaces';
import { IAzureResourceTreeChangeHandler } from '../../../azureResource/tree/treeChangeHandler';
import { AzureResourceAccountTreeNode } from '../../../azureResource/tree/accountTreeNode';
import { AzureResourceSubscriptionTreeNode } from '../../../azureResource/tree/subscriptionTreeNode';
import { AzureResourceItemType, AzureResourceServiceNames } from '../../../azureResource/constants';
import { AzureResourceMessageTreeNode } from '../../../azureResource/messageTreeNode';
import { ApiWrapper } from '../../../apiWrapper';
import { generateGuid } from '../../../azureResource/utils';

// Mock services
let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;
let mockApiWrapper: TypeMoq.IMock<ApiWrapper>;
let mockCacheService: TypeMoq.IMock<IAzureResourceCacheService>;
let mockSubscriptionService: TypeMoq.IMock<IAzureResourceSubscriptionService>;
let mockSubscriptionFilterService: TypeMoq.IMock<IAzureResourceSubscriptionFilterService>;
let mockTenantService: TypeMoq.IMock<IAzureResourceTenantService>;
let mockAppContext: AppContext;

let mockTreeChangeHandler: TypeMoq.IMock<IAzureResourceTreeChangeHandler>;

// Mock test data
const mockTenantId = 'mock_tenant_id';

const mockAccount: azdata.Account = {
	key: {
		accountId: 'mock_account',
		providerId: 'mock_provider'
	},
	displayInfo: {
		displayName: 'mock_account@test.com',
		accountType: 'Microsoft',
		contextualDisplayName: 'test',
		userId: 'test@email.com'
	},
	properties: {
		tenants: [
			{
				id: mockTenantId
			}
		]
	},
	isStale: false
};

const mockSubscription1: azureResource.AzureResourceSubscription = {
	id: 'mock_subscription_1',
	name: 'mock subscription 1'
};

const mockSubscription2: azureResource.AzureResourceSubscription = {
	id: 'mock_subscription_2',
	name: 'mock subscription 2'
};

const mockSubscriptions = [mockSubscription1, mockSubscription2];

const mockFilteredSubscriptions = [mockSubscription1];

const mockTokens: { [key: string]: any } = {};
mockTokens[mockTenantId] = {
	token: 'mock_token',
	tokenType: 'Bearer'
};

const mockCredential = new TokenCredentials(mockTokens[mockTenantId].token, mockTokens[mockTenantId].tokenType);

let mockSubscriptionCache: azureResource.AzureResourceSubscription[] = [];

describe('AzureResourceAccountTreeNode.info', function (): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockCacheService = TypeMoq.Mock.ofType<IAzureResourceCacheService>();
		mockSubscriptionService = TypeMoq.Mock.ofType<IAzureResourceSubscriptionService>();
		mockSubscriptionFilterService = TypeMoq.Mock.ofType<IAzureResourceSubscriptionFilterService>();
		mockTenantService = TypeMoq.Mock.ofType<IAzureResourceTenantService>();

		mockTreeChangeHandler = TypeMoq.Mock.ofType<IAzureResourceTreeChangeHandler>();

		mockSubscriptionCache = [];

		mockAppContext = new AppContext(mockExtensionContext.object, mockApiWrapper.object);
		mockAppContext.registerService<IAzureResourceCacheService>(AzureResourceServiceNames.cacheService, mockCacheService.object);
		mockAppContext.registerService<IAzureResourceSubscriptionService>(AzureResourceServiceNames.subscriptionService, mockSubscriptionService.object);
		mockAppContext.registerService<IAzureResourceSubscriptionFilterService>(AzureResourceServiceNames.subscriptionFilterService, mockSubscriptionFilterService.object);
		mockAppContext.registerService<IAzureResourceTenantService>(AzureResourceServiceNames.tenantService, mockTenantService.object);

		mockApiWrapper.setup((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement)).returns(() => Promise.resolve(mockTokens));
		mockCacheService.setup((o) => o.generateKey(TypeMoq.It.isAnyString())).returns(() => generateGuid());
		mockCacheService.setup((o) => o.get(TypeMoq.It.isAnyString())).returns(() => mockSubscriptionCache);
		mockCacheService.setup((o) => o.update(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => mockSubscriptionCache = mockSubscriptions);
		mockTenantService.setup((o) => o.getTenantId(TypeMoq.It.isAny())).returns(() => Promise.resolve(mockTenantId));
	});

	it('Should be correct when created.', async function (): Promise<void> {
		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const accountTreeNodeId = `account_${mockAccount.key.accountId}`;
		const accountTreeNodeLabel = `${mockAccount.displayInfo.displayName} (${mockAccount.key.accountId})`;

		assert.equal(accountTreeNode.nodePathValue, accountTreeNodeId);

		const treeItem = await accountTreeNode.getTreeItem();
		assert.equal(treeItem.id, accountTreeNodeId);
		assert.equal(treeItem.label, accountTreeNodeLabel);
		assert.equal(treeItem.contextValue, AzureResourceItemType.account);
		assert.equal(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);

		const nodeInfo = accountTreeNode.getNodeInfo();
		assert.equal(nodeInfo.label, accountTreeNodeLabel);
		assert(!nodeInfo.isLeaf);
		assert.equal(nodeInfo.nodeType, AzureResourceItemType.account);
		assert.equal(nodeInfo.iconType, AzureResourceItemType.account);
	});

	it('Should be correct when there are subscriptions listed.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(mockSubscriptions));
		mockSubscriptionFilterService.setup((o) => o.getSelectedSubscriptions(mockAccount)).returns(() => Promise.resolve(undefined));

		const accountTreeNodeLabel = `${mockAccount.displayInfo.displayName} (${mockAccount.key.accountId}) (${mockSubscriptions.length} / ${mockSubscriptions.length} subscriptions)`;

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const subscriptionNodes = await accountTreeNode.getChildren();

		assert(Array.isArray(subscriptionNodes));
		assert.equal(subscriptionNodes.length, mockSubscriptions.length);

		const treeItem = await accountTreeNode.getTreeItem();
		assert.equal(treeItem.label, accountTreeNodeLabel);

		const nodeInfo = accountTreeNode.getNodeInfo();
		assert.equal(nodeInfo.label, accountTreeNodeLabel);
	});

	it('Should be correct when there are subscriptions filtered.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(mockSubscriptions));
		mockSubscriptionFilterService.setup((o) => o.getSelectedSubscriptions(mockAccount)).returns(() => Promise.resolve(mockFilteredSubscriptions));

		const accountTreeNodeLabel = `${mockAccount.displayInfo.displayName} (${mockAccount.key.accountId}) (${mockFilteredSubscriptions.length} / ${mockSubscriptions.length} subscriptions)`;

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const subscriptionNodes = await accountTreeNode.getChildren();

		assert(Array.isArray(subscriptionNodes));
		assert.equal(subscriptionNodes.length, mockFilteredSubscriptions.length);

		const treeItem = await accountTreeNode.getTreeItem();
		assert.equal(treeItem.label, accountTreeNodeLabel);

		const nodeInfo = accountTreeNode.getNodeInfo();
		assert.equal(nodeInfo.label, accountTreeNodeLabel);
	});
});

describe('AzureResourceAccountTreeNode.getChildren', function (): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockCacheService = TypeMoq.Mock.ofType<IAzureResourceCacheService>();
		mockSubscriptionService = TypeMoq.Mock.ofType<IAzureResourceSubscriptionService>();
		mockSubscriptionFilterService = TypeMoq.Mock.ofType<IAzureResourceSubscriptionFilterService>();
		mockTenantService = TypeMoq.Mock.ofType<IAzureResourceTenantService>();

		mockTreeChangeHandler = TypeMoq.Mock.ofType<IAzureResourceTreeChangeHandler>();

		mockSubscriptionCache = [];

		mockAppContext = new AppContext(mockExtensionContext.object, mockApiWrapper.object);
		mockAppContext.registerService<IAzureResourceCacheService>(AzureResourceServiceNames.cacheService, mockCacheService.object);
		mockAppContext.registerService<IAzureResourceSubscriptionService>(AzureResourceServiceNames.subscriptionService, mockSubscriptionService.object);
		mockAppContext.registerService<IAzureResourceSubscriptionFilterService>(AzureResourceServiceNames.subscriptionFilterService, mockSubscriptionFilterService.object);
		mockAppContext.registerService<IAzureResourceTenantService>(AzureResourceServiceNames.tenantService, mockTenantService.object);

		mockApiWrapper.setup((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement)).returns(() => Promise.resolve(mockTokens));
		mockCacheService.setup((o) => o.generateKey(TypeMoq.It.isAnyString())).returns(() => generateGuid());
		mockCacheService.setup((o) => o.get(TypeMoq.It.isAnyString())).returns(() => mockSubscriptionCache);
		mockCacheService.setup((o) => o.update(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => mockSubscriptionCache = mockSubscriptions);
		mockTenantService.setup((o) => o.getTenantId(TypeMoq.It.isAny())).returns(() => Promise.resolve(mockTenantId));
	});

	it('Should load subscriptions from scratch and update cache when it is clearing cache.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(mockSubscriptions));
		mockSubscriptionFilterService.setup((o) => o.getSelectedSubscriptions(mockAccount)).returns(() => Promise.resolve([]));

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const children = await accountTreeNode.getChildren();

		mockApiWrapper.verify((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement), TypeMoq.Times.once());
		mockSubscriptionService.verify((o) => o.getSubscriptions(mockAccount, mockCredential), TypeMoq.Times.once());
		mockCacheService.verify((o) => o.get(TypeMoq.It.isAnyString()), TypeMoq.Times.exactly(0));
		mockCacheService.verify((o) => o.update(TypeMoq.It.isAnyString(), TypeMoq.It.isAny()), TypeMoq.Times.once());
		mockSubscriptionFilterService.verify((o) => o.getSelectedSubscriptions(mockAccount), TypeMoq.Times.once());

		mockTreeChangeHandler.verify((o) => o.notifyNodeChanged(accountTreeNode), TypeMoq.Times.once());

		assert.equal(accountTreeNode.totalSubscriptionCount, mockSubscriptions.length);
		assert.equal(accountTreeNode.selectedSubscriptionCount, mockSubscriptions.length);
		assert(!accountTreeNode.isClearingCache);

		assert(Array.isArray(children));
		assert.equal(children.length, mockSubscriptions.length);

		assert.deepEqual(mockSubscriptionCache, mockSubscriptions);

		for (let ix = 0; ix < mockSubscriptions.length; ix++) {
			const child = children[ix];
			const subscription = mockSubscriptions[ix];

			assert(child instanceof AzureResourceSubscriptionTreeNode);
			assert.equal(child.nodePathValue, `account_${mockAccount.key.accountId}.subscription_${subscription.id}.tenant_${mockTenantId}`);
		}
	});

	it('Should load subscriptions from cache when it is not clearing cache.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(mockSubscriptions));
		mockSubscriptionFilterService.setup((o) => o.getSelectedSubscriptions(mockAccount)).returns(() => Promise.resolve(undefined));

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		await accountTreeNode.getChildren();
		const children = await accountTreeNode.getChildren();

		mockApiWrapper.verify((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement), TypeMoq.Times.once());
		mockSubscriptionService.verify((o) => o.getSubscriptions(mockAccount, mockCredential), TypeMoq.Times.once());
		mockCacheService.verify((o) => o.get(TypeMoq.It.isAnyString()), TypeMoq.Times.once());
		mockCacheService.verify((o) => o.update(TypeMoq.It.isAnyString(), TypeMoq.It.isAny()), TypeMoq.Times.once());

		assert.equal(children.length, mockSubscriptionCache.length);

		for (let ix = 0; ix < mockSubscriptionCache.length; ix++) {
			assert.equal(children[ix].nodePathValue, `account_${mockAccount.key.accountId}.subscription_${mockSubscriptionCache[ix].id}.tenant_${mockTenantId}`);
		}
	});

	it('Should handle when there is no subscriptions.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(undefined));

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const children = await accountTreeNode.getChildren();

		assert.equal(accountTreeNode.totalSubscriptionCount, 0);

		assert(Array.isArray(children));
		assert.equal(children.length, 1);
		assert(children[0] instanceof AzureResourceMessageTreeNode);
		assert(children[0].nodePathValue.startsWith('message_'));
		assert.equal(children[0].getNodeInfo().label, 'No Subscriptions found.');
	});

	it('Should honor subscription filtering.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(mockSubscriptions));
		mockSubscriptionFilterService.setup((o) => o.getSelectedSubscriptions(mockAccount)).returns(() => Promise.resolve(mockFilteredSubscriptions));

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const children = await accountTreeNode.getChildren();

		mockSubscriptionFilterService.verify((o) => o.getSelectedSubscriptions(mockAccount), TypeMoq.Times.once());

		assert.equal(accountTreeNode.selectedSubscriptionCount, mockFilteredSubscriptions.length);
		assert.equal(children.length, mockFilteredSubscriptions.length);

		for (let ix = 0; ix < mockFilteredSubscriptions.length; ix++) {
			assert.equal(children[ix].nodePathValue, `account_${mockAccount.key.accountId}.subscription_${mockFilteredSubscriptions[ix].id}.tenant_${mockTenantId}`);
		}
	});

	it('Should handle errors.', async function (): Promise<void> {
		mockSubscriptionService.setup((o) => o.getSubscriptions(mockAccount, mockCredential)).returns(() => Promise.resolve(mockSubscriptions));

		const mockError = 'Test error';
		mockSubscriptionFilterService.setup((o) => o.getSelectedSubscriptions(mockAccount)).returns(() => { throw new Error(mockError); });

		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);

		const children = await accountTreeNode.getChildren();

		mockApiWrapper.verify((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement), TypeMoq.Times.once());
		mockSubscriptionService.verify((o) => o.getSubscriptions(mockAccount, mockCredential), TypeMoq.Times.once());
		mockSubscriptionFilterService.verify((o) => o.getSelectedSubscriptions(mockAccount), TypeMoq.Times.once());
		mockCacheService.verify((o) => o.get(TypeMoq.It.isAnyString()), TypeMoq.Times.never());
		mockCacheService.verify((o) => o.update(TypeMoq.It.isAnyString(), TypeMoq.It.isAny()), TypeMoq.Times.once());

		assert(Array.isArray(children));
		assert.equal(children.length, 1);
		assert(children[0] instanceof AzureResourceMessageTreeNode);
		assert(children[0].nodePathValue.startsWith('message_'));
		assert.equal(children[0].getNodeInfo().label, `Error: ${mockError}`);
	});
});

describe('AzureResourceAccountTreeNode.clearCache', function (): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockCacheService = TypeMoq.Mock.ofType<IAzureResourceCacheService>();
		mockSubscriptionService = TypeMoq.Mock.ofType<IAzureResourceSubscriptionService>();
		mockSubscriptionFilterService = TypeMoq.Mock.ofType<IAzureResourceSubscriptionFilterService>();
		mockTenantService = TypeMoq.Mock.ofType<IAzureResourceTenantService>();

		mockTreeChangeHandler = TypeMoq.Mock.ofType<IAzureResourceTreeChangeHandler>();

		mockSubscriptionCache = [];

		mockAppContext = new AppContext(mockExtensionContext.object, mockApiWrapper.object);
		mockAppContext.registerService<IAzureResourceCacheService>(AzureResourceServiceNames.cacheService, mockCacheService.object);
		mockAppContext.registerService<IAzureResourceSubscriptionService>(AzureResourceServiceNames.subscriptionService, mockSubscriptionService.object);
		mockAppContext.registerService<IAzureResourceSubscriptionFilterService>(AzureResourceServiceNames.subscriptionFilterService, mockSubscriptionFilterService.object);
		mockAppContext.registerService<IAzureResourceTenantService>(AzureResourceServiceNames.tenantService, mockTenantService.object);

		mockApiWrapper.setup((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement)).returns(() => Promise.resolve(mockTokens));
		mockCacheService.setup((o) => o.generateKey(TypeMoq.It.isAnyString())).returns(() => generateGuid());
		mockCacheService.setup((o) => o.get(TypeMoq.It.isAnyString())).returns(() => mockSubscriptionCache);
		mockCacheService.setup((o) => o.update(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => mockSubscriptionCache = mockSubscriptions);
		mockTenantService.setup((o) => o.getTenantId(TypeMoq.It.isAny())).returns(() => Promise.resolve(mockTenantId));
	});

	it('Should clear cache.', async function (): Promise<void> {
		const accountTreeNode = new AzureResourceAccountTreeNode(mockAccount, mockAppContext, mockTreeChangeHandler.object);
		accountTreeNode.clearCache();
		assert(accountTreeNode.isClearingCache);
	});
});
