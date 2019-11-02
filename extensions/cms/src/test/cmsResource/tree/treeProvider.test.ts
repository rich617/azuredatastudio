/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';
import 'mocha';
import * as vscode from 'vscode';
import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import { AppContext } from '../../../appContext';
import { ApiWrapper } from '../../../apiWrapper';
import { CmsResourceTreeProvider } from '../../../cmsResource/tree/treeProvider';
import { CmsResourceMessageTreeNode } from '../../../cmsResource/messageTreeNode';
import { CmsResourceEmptyTreeNode } from '../../../cmsResource/tree/cmsResourceEmptyTreeNode';
import { CmsUtils } from '../../../cmsUtils';

// Mock services
let mockAppContext: AppContext;
let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;
let mockCmsUtils: TypeMoq.IMock<CmsUtils>;
let mockApiWrapper: TypeMoq.IMock<ApiWrapper>;


describe('CmsResourceTreeProvider.getChildren', function (): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockApiWrapper = TypeMoq.Mock.ofType<ApiWrapper>();
		mockCmsUtils = TypeMoq.Mock.ofType<CmsUtils>();
		mockAppContext = new AppContext(mockExtensionContext.object, mockApiWrapper.object, mockCmsUtils.object);
	});

	it('Should not be initialized.', async function (): Promise<void> {
		const treeProvider = new CmsResourceTreeProvider(mockAppContext);
		assert.notEqual(treeProvider.isSystemInitialized, true);
		const children = await treeProvider.getChildren(undefined);
		assert.equal(children.length, 1);
		assert.equal(children[0].parent, undefined);
		assert.equal(children[0] instanceof CmsResourceMessageTreeNode, true);
	});

	it('Should not be loading after initialized.', async function (): Promise<void> {
		const treeProvider = new CmsResourceTreeProvider(mockAppContext);
		treeProvider.isSystemInitialized = true;
		assert.equal(true, treeProvider.isSystemInitialized);
		mockCmsUtils.setup(x => x.registeredCmsServers).returns(() => []);
		const children = await treeProvider.getChildren(undefined);
		assert.equal(children[0] instanceof CmsResourceEmptyTreeNode, true);
	});

	it('Should show CMS nodes if there are cached servers', async function (): Promise<void> {
		const treeProvider = new CmsResourceTreeProvider(mockAppContext);
		treeProvider.isSystemInitialized = true;
		mockCmsUtils.setup(x => x.registeredCmsServers).returns(() => {
			return [{
				name: 'name',
				description: 'description',
				ownerUri: 'ownerUri',
				connection: null
			}];
		});
		const children = await treeProvider.getChildren(undefined);
		assert.equal(children[0] !== null, true);
	});
});
