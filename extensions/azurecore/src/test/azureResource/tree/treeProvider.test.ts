/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import * as azdata from 'azdata';
import 'mocha';
import { AppContext } from '../../../appContext';
import { ApiWrapper } from '../../../apiWrapper';

import { IAzureResourceCacheService, IAzureResourceAccountService } from '../../../azureResource/interfaces';
import { AzureResourceTreeProvider } from '../../../azureResource/tree/treeProvider';
import { AzureResourceAccountTreeNode } from '../../../azureResource/tree/accountTreeNode';
import { AzureResourceAccountNotSignedInTreeNode } from '../../../azureResource/tree/accountNotSignedInTreeNode';
import { AzureResourceMessageTreeNode } from '../../../azureResource/messageTreeNode';
import { AzureResourceServiceNames } from '../../../azureResource/constants';
import { generateGuid } from '../../../azureResource/utils';

// Mock services
let mockAppContext: AppContext;

let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;
let mockApiWrapper: TypeMoq.IMock<ApiWrapper>;
let mockCacheService: TypeMoq.IMock<IAzureResourceCacheService>;
let mockAccountService: TypeMoq.IMock<IAzureResourceAccountService>;

// Mock test data
const mockAccount1: azdata.Account = {
	key: {
		accountId: 'mock_account_1',
		providerId: 'mock_provider'
	},
	displayInfo: {
		displayName: 'mock_account_1@test.com',
		accountType: 'Microsoft',
		contextualDisplayName: 'test',
		userId: 'test@email.com'
	},
	properties: undefined,
	isStale: false
};
const mockAccount2: azdata.Account = {
	key: {
		accountId: 'mock_account_2',
		providerId: 'mock_provider'
	},
	displayInfo: {
		displayName: 'mock_account_2@test.com',
		accountType: 'Microsoft',
		contextualDisplayName: 'test',
		userId: 'test@email.com'
	},
	properties: undefined,
	isStale: false
};
const mockAccounts = [mockAccount1, mockAccount2];

describe('AzureResourceTreeProvider.getChildren', function(): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockCacheService = TypeMoq.Mock.ofType<IAzureResourceCacheService>();
		mockAccountService = TypeMoq.Mock.ofType<IAzureResourceAccountService>();

		mockAppContext = new AppContext(mockExtensionContext.object, mockApiWrapper.object);

		mockAppContext.registerService<IAzureResourceCacheService>(AzureResourceServiceNames.cacheService, mockCacheService.object);
		mockAppContext.registerService<IAzureResourceAccountService>(AzureResourceServiceNames.accountService, mockAccountService.object);

		mockCacheService.setup((o) => o.generateKey(TypeMoq.It.isAnyString())).returns(() => generateGuid());
	});

	xit('Should load accounts.', async function(): Promise<void> {
		mockAccountService.setup((o) => o.getAccounts()).returns(() => Promise.resolve(mockAccounts));

		const treeProvider = new AzureResourceTreeProvider(mockAppContext);
		treeProvider.isSystemInitialized = true;

		const children = await treeProvider.getChildren(undefined);

		mockAccountService.verify((o) => o.getAccounts(), TypeMoq.Times.once());

		assert(Array.isArray(children));
		assert.equal(children.length, mockAccounts.length);

		for (let ix = 0; ix < mockAccounts.length; ix++) {
			const child = children[ix];
			const account = mockAccounts[ix];

			assert(child instanceof AzureResourceAccountTreeNode);
			assert.equal(child.nodePathValue, `account_${account.key.accountId}`);
		}
	});

	it('Should handle when there is no accounts.', async function(): Promise<void> {
		mockAccountService.setup((o) => o.getAccounts()).returns(() => Promise.resolve(undefined));

		const treeProvider = new AzureResourceTreeProvider(mockAppContext);
		treeProvider.isSystemInitialized = true;

		const children = await treeProvider.getChildren(undefined);

		assert(Array.isArray(children));
		assert.equal(children.length, 1);
		assert(children[0] instanceof AzureResourceAccountNotSignedInTreeNode);
	});

	xit('Should handle errors.', async function(): Promise<void> {
		const mockAccountError = 'Test account error';
		mockAccountService.setup((o) => o.getAccounts()).returns(() => { throw new Error(mockAccountError); });

		const treeProvider = new AzureResourceTreeProvider(mockAppContext);
		treeProvider.isSystemInitialized = true;

		const children = await treeProvider.getChildren(undefined);

		mockAccountService.verify((o) => o.getAccounts(), TypeMoq.Times.once());

		assert(Array.isArray(children));
		assert.equal(children.length, 1);
		assert(children[0] instanceof AzureResourceMessageTreeNode);
		assert(children[0].nodePathValue.startsWith('message_'));
		assert.equal(children[0].getNodeInfo().label, `Error: ${mockAccountError}`);
	});
});
