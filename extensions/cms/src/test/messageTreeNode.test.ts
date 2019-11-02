/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import 'mocha';

import { CmsResourceItemType } from '../cmsResource/constants';
import { CmsResourceMessageTreeNode } from '../cmsResource/messageTreeNode';

describe('CmsResourceMessageTreeNode.info', function (): void {
	it('Should be correct when created.', async function (): Promise<void> {
		const mockMessage = 'Test message';
		const treeNode = new CmsResourceMessageTreeNode(mockMessage, undefined);

		assert(treeNode.nodePathValue.startsWith('message_'));

		const treeItem = await treeNode.getTreeItem();
		assert.equal(treeItem.label, mockMessage);
		assert.equal(treeItem.contextValue, CmsResourceItemType.cmsMessageNodeContainer);
		assert.equal(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);

		const nodeInfo = treeNode.getNodeInfo();
		assert(nodeInfo.isLeaf);
		assert.equal(nodeInfo.label, mockMessage);
		assert.equal(nodeInfo.nodeType, CmsResourceItemType.cmsMessageNodeContainer);
		assert.equal(nodeInfo.iconType, CmsResourceItemType.cmsMessageNodeContainer);
	});
});

describe('CmsResourceMessageTreeNode.create', function (): void {
	it('Should create a message node.', async function (): Promise<void> {
		const mockMessage = 'Test messagse';
		const treeNode = CmsResourceMessageTreeNode.create(mockMessage, undefined);
		assert(treeNode instanceof CmsResourceMessageTreeNode);
	});
});
