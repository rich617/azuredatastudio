/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as mssql from '../../../mssql';
import * as TypeMoq from 'typemoq';
import 'mocha';
import { SchemaCompareDialog } from './../dialogs/schemaCompareDialog';
import { SchemaCompareMainWindow } from '../schemaCompareMainWindow';
import { SchemaCompareTestService } from './testSchemaCompareService';

const mocksource: string = 'source.dacpac';
const mocktarget: string = 'target.dacpac';

const mockSourceEndpoint: mssql.SchemaCompareEndpointInfo = {
	endpointType: mssql.SchemaCompareEndpointType.Dacpac,
	serverDisplayName: '',
	serverName: '',
	databaseName: '',
	ownerUri: '',
	packageFilePath: mocksource,
	connectionDetails: undefined
};

const mockTargetEndpoint: mssql.SchemaCompareEndpointInfo = {
	endpointType: mssql.SchemaCompareEndpointType.Dacpac,
	serverDisplayName: '',
	serverName: '',
	databaseName: '',
	ownerUri: '',
	packageFilePath: mocktarget,
	connectionDetails: undefined
};

let mockExtensionContext: TypeMoq.IMock<vscode.ExtensionContext>;

describe('SchemaCompareDialog.openDialog', function (): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockExtensionContext.setup(x => x.extensionPath).returns(() => '');
	});

	it('Should be correct when created.', async function (): Promise<void> {
		let schemaCompareResult = new SchemaCompareMainWindow(undefined, mockExtensionContext.object);
		let dialog = new SchemaCompareDialog(schemaCompareResult);
		await dialog.openDialog();

		assert.equal(dialog.dialog.title, 'Schema Compare');
		assert.equal(dialog.dialog.okButton.label, 'OK');
		assert.equal(dialog.dialog.okButton.enabled, false); // Should be false when open
	});
});

describe('SchemaCompareResult.start', function (): void {
	beforeEach(() => {
		mockExtensionContext = TypeMoq.Mock.ofType<vscode.ExtensionContext>();
		mockExtensionContext.setup(x => x.extensionPath).returns(() => '');
	});
	it('Should be correct when created.', async function (): Promise<void> {
		let sc = new SchemaCompareTestService();

		let result = new SchemaCompareMainWindow(sc, mockExtensionContext.object);
		await result.start(null);
		let promise = new Promise(resolve => setTimeout(resolve, 5000)); // to ensure comparison result view is initialized
		await promise;

		assert(result.getComparisonResult() === undefined);
		result.sourceEndpointInfo = mockSourceEndpoint;
		result.targetEndpointInfo = mockTargetEndpoint;
		await result.execute();

		assert(result.getComparisonResult() !== undefined);
		assert(result.getComparisonResult().operationId === 'Test Operation Id');
	});
});
