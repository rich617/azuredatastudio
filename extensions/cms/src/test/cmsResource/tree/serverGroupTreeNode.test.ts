/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';
import * as vscode from 'vscode';
import 'mocha';
import { AppContext } from '../../../appContext';
import { ApiWrapper } from '../../../apiWrapper';
import { CmsResourceItemType } from '../../../cmsResource/constants';
import { ServerGroupTreeNode } from '../../../cmsResource/tree/serverGroupTreeNode';
import { ICmsResourceTreeChangeHandler } from '../../../cmsResource/tree/treeChangeHandler';
import { cmsResource } from '../../../cmsResource/cms-resource';
import { CmsUtils } from '../../../cmsUtils';
import { isUndefinedOrNull } from '../../types';

// Mock services
let mockAppContext: AppContext;

let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;
let mockApiWrapper: TypeMoq.IMock<ApiWrapper>;
let mockCmsUtils: TypeMoq.IMock<CmsUtils>;
let mockTreeChangeHandler: TypeMoq.IMock<ICmsResourceTreeChangeHandler>;

let mockResourceTreeDataProvider1: TypeMoq.IMock<cmsResource.ICmsResourceTreeDataProvider>;
let mockResourceProvider1: TypeMoq.IMock<cmsResource.ICmsResourceProvider>;

describe('ServerGroupTreeNode.info', function(): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockCmsUtils = TypeMoq.Mock.ofType<CmsUtils>();
		mockAppContext = new AppContext(mockExtensionContext.object, mockApiWrapper.object, mockCmsUtils.object);
		mockTreeChangeHandler = TypeMoq.Mock.ofType<ICmsResourceTreeChangeHandler>();
		mockResourceTreeDataProvider1 = TypeMoq.Mock.ofType<cmsResource.ICmsResourceTreeDataProvider>();
		mockResourceTreeDataProvider1.setup((o) => o.getChildren()).returns(() => Promise.resolve([TypeMoq.Mock.ofType<cmsResource.ICmsResourceNode>().object]));
		mockResourceTreeDataProvider1.setup((o) => o.getTreeItem(TypeMoq.It.isAny())).returns(() => Promise.resolve(TypeMoq.It.isAny()));
		mockResourceProvider1 = TypeMoq.Mock.ofType<cmsResource.ICmsResourceProvider>();
		mockResourceProvider1.setup((o) => o.providerId).returns(() => 'mockResourceProvider1');
		mockResourceProvider1.setup((o) => o.getTreeDataProvider()).returns(() => mockResourceTreeDataProvider1.object);
	});

	it('Should be correct.', async function(): Promise<void> {
		const label = 'test';

		const treeNode = new ServerGroupTreeNode('test', 'test', 'test_path', 'test_ownerUri', mockAppContext, mockTreeChangeHandler.object, null);

		assert.equal(treeNode.relativePath, 'test_path');

		const treeItem = await treeNode.getTreeItem();
		assert.equal(treeItem.label, label);
		assert.equal(treeItem.contextValue, CmsResourceItemType.serverGroup);
		assert.equal(treeItem.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
		assert(isUndefinedOrNull(treeItem.command));

		const nodeInfo = treeNode.getNodeInfo();
		assert(!nodeInfo.isLeaf);
		assert.equal(nodeInfo.label, label);
		assert.equal(nodeInfo.nodeType, CmsResourceItemType.serverGroup);
	});
});
