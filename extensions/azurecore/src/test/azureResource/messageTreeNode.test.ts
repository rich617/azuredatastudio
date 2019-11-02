/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as vscode from 'vscode';
import 'mocha';

import { AzureResourceItemType } from '../../azureResource/constants';
import { AzureResourceMessageTreeNode } from '../../azureResource/messageTreeNode';

describe('AzureResourceMessageTreeNode.info', function(): void {
	it('Should be correct when created.', async function(): Promise<void> {
		const mockMessage = 'Test messagse';
		const treeNode = new AzureResourceMessageTreeNode(mockMessage, undefined);

		assert(treeNode.nodePathValue.startsWith('message_'));

		const treeItem = await treeNode.getTreeItem();
		assert.equal(treeItem.label, mockMessage);
		assert.equal(treeItem.contextValue, AzureResourceItemType.message);
		assert.equal(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);

		const nodeInfo = treeNode.getNodeInfo();
		assert(nodeInfo.isLeaf);
		assert.equal(nodeInfo.label, mockMessage);
		assert.equal(nodeInfo.nodeType, AzureResourceItemType.message);
		assert.equal(nodeInfo.iconType, AzureResourceItemType.message);
	});
});

describe('AzureResourceMessageTreeNode.create', function(): void {
	it('Should create a message node.', async function(): Promise<void> {
		const mockMessage = 'Test messagse';
		const treeNode = AzureResourceMessageTreeNode.create(mockMessage, undefined);
		assert(treeNode instanceof AzureResourceMessageTreeNode);
	});
});
