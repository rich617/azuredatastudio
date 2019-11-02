/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import 'mocha';
import { CmsResourceEmptyTreeNode } from '../../../cmsResource/tree/cmsResourceEmptyTreeNode';
import { CmsResourceItemType } from '../../../cmsResource/constants';
import { isUndefinedOrNull } from '../../types';


describe('CmsResourceEmptyTreeNode.info', function(): void {
	it('Should be correct.', async function(): Promise<void> {
		const label = 'Add Central Management Server...';

		const treeNode = new CmsResourceEmptyTreeNode();
		let children = await treeNode.getChildren();
		assert.equal(0, children.length);
		assert.equal(treeNode.nodePathValue, 'message_cmsTreeNode');

		const treeItem = await treeNode.getTreeItem();
		assert.equal(treeItem.label, label);
		assert.equal(treeItem.contextValue, CmsResourceItemType.cmsEmptyNodeContainer);
		assert.equal(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.None);
		assert(!isUndefinedOrNull(treeItem.command));
		assert.equal(treeItem.command.title, label);
		assert.equal(treeItem.command.command, 'cms.resource.registerCmsServer');

		const nodeInfo = treeNode.getNodeInfo();
		assert(nodeInfo.isLeaf);
		assert.equal(nodeInfo.label, label);
		assert.equal(nodeInfo.nodeType, CmsResourceItemType.cmsEmptyNodeContainer);
		assert.equal(nodeInfo.iconType, CmsResourceItemType.cmsEmptyNodeContainer);
	});
});
