/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as vscode from 'vscode';
import 'mocha';

import { AzureResourceItemType } from '../../../azureResource/constants';
import { AzureResourceAccountNotSignedInTreeNode } from '../../../azureResource/tree/accountNotSignedInTreeNode';
import { isUndefinedOrNull } from '../../common/types';

describe('AzureResourceAccountNotSignedInTreeNode.info', function (): void {
	it('Should be correct.', async function (): Promise<void> {
		const label = 'Sign in to Azure...';

		const treeNode = new AzureResourceAccountNotSignedInTreeNode();

		assert.equal(treeNode.nodePathValue, 'message_accountNotSignedIn');

		const treeItem = await treeNode.getTreeItem();
		assert.equal(treeItem.label, label);
		assert.equal(treeItem.contextValue, AzureResourceItemType.message);
		assert.equal(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
		assert(!isUndefinedOrNull(treeItem.command));
		assert.equal(treeItem.command.title, label);
		assert.equal(treeItem.command.command, 'azure.resource.signin');

		const nodeInfo = treeNode.getNodeInfo();
		assert(nodeInfo.isLeaf);
		assert.equal(nodeInfo.label, label);
		assert.equal(nodeInfo.nodeType, AzureResourceItemType.message);
		assert.equal(nodeInfo.iconType, AzureResourceItemType.message);
	});
});
