/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import * as azdata from 'azdata';
import * as vscode from 'vscode';
import 'mocha';

import { azureResource } from '../../../../azureResource/azure-resource';
import { ApiWrapper } from '../../../../apiWrapper';
import { AzureResourceDatabaseServerTreeDataProvider } from '../../../../azureResource/providers/databaseServer/databaseServerTreeDataProvider';
import { AzureResourceItemType } from '../../../../azureResource/constants';
import { IAzureResourceService, AzureResourceDatabaseServer } from '../../../../azureResource/interfaces';
import { isUndefinedOrNull } from '../../../common/types';

// Mock services
let mockDatabaseServerService: TypeMoq.IMock<IAzureResourceService<AzureResourceDatabaseServer>>;
let mockApiWrapper: TypeMoq.IMock<ApiWrapper>;
let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;

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

const mockTokens: { [key: string]: any } = {};
mockTokens[mockTenantId] = {
	token: 'mock_token',
	tokenType: 'Bearer'
};

const mockDatabaseServers: AzureResourceDatabaseServer[] = [
	{
		name: 'mock database server 1',
		fullName: 'mock database server full name 1',
		loginName: 'mock login',
		defaultDatabaseName: 'master'
	},
	{
		name: 'mock database server 2',
		fullName: 'mock database server full name 2',
		loginName: 'mock login',
		defaultDatabaseName: 'master'
	}
];

describe('AzureResourceDatabaseServerTreeDataProvider.info', function (): void {
	beforeEach(() => {
		mockDatabaseServerService = TypeMoq.Mock.ofType<IAzureResourceService<AzureResourceDatabaseServer>>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
	});

	it('Should be correct when created.', async function (): Promise<void> {
		const treeDataProvider = new AzureResourceDatabaseServerTreeDataProvider(mockDatabaseServerService.object, mockApiWrapper.object, mockExtensionContext.object);

		const treeItem = await treeDataProvider.getTreeItem(mockResourceRootNode);
		assert.equal(treeItem.id, mockResourceRootNode.treeItem.id);
		assert.equal(treeItem.label, mockResourceRootNode.treeItem.label);
		assert.equal(treeItem.collapsibleState, mockResourceRootNode.treeItem.collapsibleState);
		assert.equal(treeItem.contextValue, mockResourceRootNode.treeItem.contextValue);
	});
});

describe('AzureResourceDatabaseServerTreeDataProvider.getChildren', function (): void {
	beforeEach(() => {
		mockDatabaseServerService = TypeMoq.Mock.ofType<IAzureResourceService<AzureResourceDatabaseServer>>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();

		mockApiWrapper.setup((o) => o.getSecurityToken(mockAccount, azdata.AzureResource.ResourceManagement)).returns(() => Promise.resolve(mockTokens));
		mockDatabaseServerService.setup((o) => o.getResources(mockSubscription, TypeMoq.It.isAny())).returns(() => Promise.resolve(mockDatabaseServers));
		mockExtensionContext.setup((o) => o.asAbsolutePath(TypeMoq.It.isAnyString())).returns(() => TypeMoq.It.isAnyString());
	});

	it('Should return container node when element is undefined.', async function (): Promise<void> {
		const treeDataProvider = new AzureResourceDatabaseServerTreeDataProvider(mockDatabaseServerService.object, mockApiWrapper.object, mockExtensionContext.object);

		const children = await treeDataProvider.getChildren();

		assert(Array.isArray(children));
		assert.equal(children.length, 1);

		const child = children[0];
		assert(isUndefinedOrNull(child.account));
		assert(isUndefinedOrNull(child.subscription));
		assert(isUndefinedOrNull(child.tenantId));
		assert.equal(child.treeItem.id, 'azure.resource.providers.databaseServer.treeDataProvider.databaseServerContainer');
		assert.equal(child.treeItem.label, 'SQL Servers');
		assert.equal(child.treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
		assert.equal(child.treeItem.contextValue, 'azure.resource.itemType.databaseServerContainer');
	});

	it('Should return resource nodes when it is container node.', async function (): Promise<void> {
		const treeDataProvider = new AzureResourceDatabaseServerTreeDataProvider(mockDatabaseServerService.object, mockApiWrapper.object, mockExtensionContext.object);

		const children = await treeDataProvider.getChildren(mockResourceRootNode);

		assert(Array.isArray(children));
		assert.equal(children.length, mockDatabaseServers.length);

		for (let ix = 0; ix < children.length; ix++) {
			const child = children[ix];
			const databaseServer = mockDatabaseServers[ix];

			assert.equal(child.account, mockAccount);
			assert.equal(child.subscription, mockSubscription);
			assert.equal(child.tenantId, mockTenantId);
			assert.equal(child.treeItem.id, `databaseServer_${databaseServer.name}`);
			assert.equal(child.treeItem.label, databaseServer.name);
			assert.equal(child.treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
			assert.equal(child.treeItem.contextValue, AzureResourceItemType.databaseServer);
		}
	});
});
