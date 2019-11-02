/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import * as azdata from 'azdata';
import * as vscode from 'vscode';
import 'mocha';

import { azureResource } from '../../azureResource/azure-resource';
import { AzureResourceService } from '../../azureResource/resourceService';
import { AzureResourceResourceTreeNode } from '../../azureResource/resourceTreeNode';
import { AppContext } from '../../appContext';
import { ApiWrapper } from '../../apiWrapper';
import { AzureResourceServiceNames } from '../../azureResource/constants';

// Mock test data
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
	properties: undefined,
	isStale: false
};

const mockSubscription: azureResource.AzureResourceSubscription = {
	id: 'mock_subscription',
	name: 'mock subscription'
};

const mockTenantId: string = 'mock_tenant';

const mockResourceProviderId: string = 'mock_resource_provider';

const mockResourceRootNode: azureResource.IAzureResourceNode = {
	account: mockAccount,
	subscription: mockSubscription,
	tenantId: mockTenantId,
	treeItem: {
		id: 'mock_resource_root_node',
		label: 'mock resource root node',
		iconPath: undefined,
		collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
		contextValue: 'mock_resource_root_node'
	}
};

const mockResourceNode1: azureResource.IAzureResourceNode = {
	account: mockAccount,
	subscription: mockSubscription,
	tenantId: mockTenantId,
	treeItem: {
		id: 'mock_resource_node_1',
		label: 'mock resource node 1',
		iconPath: undefined,
		collapsibleState: vscode.TreeItemCollapsibleState.None,
		contextValue: 'mock_resource_node'
	}
};

const mockResourceNode2: azureResource.IAzureResourceNode = {
	account: mockAccount,
	subscription: mockSubscription,
	tenantId: mockTenantId,
	treeItem: {
		id: 'mock_resource_node_2',
		label: 'mock resource node 2',
		iconPath: undefined,
		collapsibleState: vscode.TreeItemCollapsibleState.None,
		contextValue: 'mock_resource_node'
	}
};

const mockResourceNodes: azureResource.IAzureResourceNode[] = [mockResourceNode1, mockResourceNode2];

let mockResourceTreeDataProvider: TypeMoq.IMock<azureResource.IAzureResourceTreeDataProvider>;
let mockResourceProvider: TypeMoq.IMock<azureResource.IAzureResourceProvider>;
let resourceService: AzureResourceService;
let appContext: AppContext;

describe('AzureResourceResourceTreeNode.info', function (): void {
	beforeEach(() => {
		mockResourceTreeDataProvider = TypeMoq.Mock.ofType<azureResource.IAzureResourceTreeDataProvider>();
		mockResourceTreeDataProvider.setup((o) => o.getTreeItem(mockResourceRootNode)).returns(() => mockResourceRootNode.treeItem);
		mockResourceTreeDataProvider.setup((o) => o.getChildren(mockResourceRootNode)).returns(() => Promise.resolve(mockResourceNodes));

		mockResourceProvider = TypeMoq.Mock.ofType<azureResource.IAzureResourceProvider>();
		mockResourceProvider.setup((o) => o.providerId).returns(() => mockResourceProviderId);
		mockResourceProvider.setup((o) => o.getTreeDataProvider()).returns(() => mockResourceTreeDataProvider.object);
		resourceService = new AzureResourceService();
		resourceService.clearResourceProviders();
		resourceService.registerResourceProvider(mockResourceProvider.object);
		resourceService.areResourceProvidersLoaded = true;

		appContext = new AppContext(undefined, new ApiWrapper());
		appContext.registerService(AzureResourceServiceNames.resourceService, resourceService);
	});

	it('Should be correct when created.', async function (): Promise<void> {
		const resourceTreeNode = new AzureResourceResourceTreeNode({
			resourceProviderId: mockResourceProviderId,
			resourceNode: mockResourceRootNode
		}, undefined, appContext);

		assert.equal(resourceTreeNode.nodePathValue, mockResourceRootNode.treeItem.id);

		const treeItem = await resourceTreeNode.getTreeItem();
		assert.equal(treeItem.id, mockResourceRootNode.treeItem.id);
		assert.equal(treeItem.label, mockResourceRootNode.treeItem.label);
		assert.equal(treeItem.collapsibleState, mockResourceRootNode.treeItem.collapsibleState);
		assert.equal(treeItem.contextValue, mockResourceRootNode.treeItem.contextValue);

		const nodeInfo = resourceTreeNode.getNodeInfo();
		assert.equal(nodeInfo.label, mockResourceRootNode.treeItem.label);
		assert.equal(nodeInfo.isLeaf, mockResourceRootNode.treeItem.collapsibleState === vscode.TreeItemCollapsibleState.None);
		assert.equal(nodeInfo.nodeType, mockResourceRootNode.treeItem.contextValue);
		assert.equal(nodeInfo.iconType, mockResourceRootNode.treeItem.contextValue);
	});
});

describe('AzureResourceResourceTreeNode.getChildren', function (): void {
	beforeEach(() => {
		mockResourceTreeDataProvider = TypeMoq.Mock.ofType<azureResource.IAzureResourceTreeDataProvider>();
		mockResourceTreeDataProvider.setup((o) => o.getChildren(mockResourceRootNode)).returns(() => Promise.resolve(mockResourceNodes));

		mockResourceProvider = TypeMoq.Mock.ofType<azureResource.IAzureResourceProvider>();
		mockResourceProvider.setup((o) => o.providerId).returns(() => mockResourceProviderId);
		mockResourceProvider.setup((o) => o.getTreeDataProvider()).returns(() => mockResourceTreeDataProvider.object);

		resourceService = new AzureResourceService();
		resourceService.clearResourceProviders();
		resourceService.registerResourceProvider(mockResourceProvider.object);
		resourceService.areResourceProvidersLoaded = true;

		appContext = new AppContext(undefined, new ApiWrapper());
		appContext.registerService(AzureResourceServiceNames.resourceService, resourceService);
	});

	it('Should return resource nodes when it is container node.', async function (): Promise<void> {
		const resourceTreeNode = new AzureResourceResourceTreeNode({
			resourceProviderId: mockResourceProviderId,
			resourceNode: mockResourceRootNode
		},
			undefined, appContext);

		const children = await resourceTreeNode.getChildren();

		mockResourceTreeDataProvider.verify((o) => o.getChildren(mockResourceRootNode), TypeMoq.Times.once());

		assert(Array.isArray(children));
		assert.equal(children.length, mockResourceNodes.length);

		for (let ix = 0; ix < children.length; ix++) {
			const child = children[ix];

			assert(child instanceof AzureResourceResourceTreeNode);

			const childNode = (child as AzureResourceResourceTreeNode).resourceNodeWithProviderId;
			assert.equal(childNode.resourceProviderId, mockResourceProviderId);
			assert.equal(childNode.resourceNode.account, mockAccount);
			assert.equal(childNode.resourceNode.subscription, mockSubscription);
			assert.equal(childNode.resourceNode.tenantId, mockTenantId);
			assert.equal(childNode.resourceNode.treeItem.id, mockResourceNodes[ix].treeItem.id);
			assert.equal(childNode.resourceNode.treeItem.label, mockResourceNodes[ix].treeItem.label);
			assert.equal(childNode.resourceNode.treeItem.collapsibleState, mockResourceNodes[ix].treeItem.collapsibleState);
			assert.equal(childNode.resourceNode.treeItem.contextValue, mockResourceNodes[ix].treeItem.contextValue);
		}
	});

	it('Should return empty when it is leaf node.', async function (): Promise<void> {
		const resourceTreeNode = new AzureResourceResourceTreeNode({
			resourceProviderId: mockResourceProviderId,
			resourceNode: mockResourceNode1
		}, undefined, appContext);

		const children = await resourceTreeNode.getChildren();

		mockResourceTreeDataProvider.verify((o) => o.getChildren(), TypeMoq.Times.exactly(0));

		assert(Array.isArray(children));
		assert.equal(children.length, 0);
	});
});
