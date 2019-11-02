/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as TypeMoq from 'typemoq';
import { nb } from 'azdata';
import * as assert from 'assert';

import { INotificationService } from 'vs/platform/notification/common/notification';
import { TestNotificationService } from 'vs/platform/notification/test/common/testNotificationService';
import { URI } from 'vs/base/common/uri';

import { LocalContentManager } from 'sql/workbench/services/notebook/common/localContentManager';
import { NotebookManagerStub } from './common';
import { NotebookModel } from 'sql/workbench/parts/notebook/browser/models/notebookModel';
import { ModelFactory } from 'sql/workbench/parts/notebook/browser/models/modelFactory';
import { IClientSession, ICellModel, INotebookModelOptions, NotebookContentChange } from 'sql/workbench/parts/notebook/browser/models/modelInterfaces';
import { ClientSession } from 'sql/workbench/parts/notebook/browser/models/clientSession';
import { CellTypes, NotebookChangeType } from 'sql/workbench/parts/notebook/common/models/contracts';
import { Deferred } from 'sql/base/common/promise';
import { Memento } from 'vs/workbench/common/memento';
import { Emitter } from 'vs/base/common/event';
import { TestCapabilitiesService } from 'sql/platform/capabilities/test/common/testCapabilitiesService';
import { ICapabilitiesService } from 'sql/platform/capabilities/common/capabilitiesService';
import { TestStorageService } from 'vs/workbench/test/workbenchTestServices';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { InstantiationService } from 'vs/platform/instantiation/common/instantiationService';
import { ServiceCollection } from 'vs/platform/instantiation/common/serviceCollection';
import { NullLogService } from 'vs/platform/log/common/log';
import { TestConnectionManagementService } from 'sql/platform/connection/test/common/testConnectionManagementService';
import { isUndefinedOrNull } from 'vs/base/common/types';

let expectedNotebookContent: nb.INotebookContents = {
	cells: [{
		cell_type: CellTypes.Code,
		source: 'insert into t1 values (c1, c2)',
		metadata: { language: 'python' },
		execution_count: 1
	}, {
		cell_type: CellTypes.Markdown,
		source: 'I am *markdown*',
		metadata: { language: 'python' },
		execution_count: 1
	}],
	metadata: {
		kernelspec: {
			name: 'mssql',
			language: 'sql'
		}
	},
	nbformat: 4,
	nbformat_minor: 5
};

let expectedNotebookContentOneCell: nb.INotebookContents = {
	cells: [{
		cell_type: CellTypes.Code,
		source: 'insert into t1 values (c1, c2)',
		metadata: { language: 'python' },
		execution_count: 1
	}],
	metadata: {
		kernelspec: {
			name: 'mssql',
			language: 'sql'
		}
	},
	nbformat: 4,
	nbformat_minor: 5
};

let defaultUri = URI.file('/some/path.ipynb');

let mockClientSession: TypeMoq.IMock<IClientSession>;
let sessionReady: Deferred<void>;
let mockModelFactory: TypeMoq.IMock<ModelFactory>;
let notificationService: TypeMoq.IMock<INotificationService>;
let capabilitiesService: TypeMoq.IMock<ICapabilitiesService>;
let instantiationService: IInstantiationService;

suite('notebook model', function (): void {
	let notebookManagers = [new NotebookManagerStub()];
	let memento: TypeMoq.IMock<Memento>;
	let queryConnectionService: TypeMoq.IMock<TestConnectionManagementService>;
	let defaultModelOptions: INotebookModelOptions;
	const logService = new NullLogService();
	setup(() => {
		sessionReady = new Deferred<void>();
		notificationService = TypeMoq.Mock.ofType(TestNotificationService, TypeMoq.MockBehavior.Loose);
		capabilitiesService = TypeMoq.Mock.ofType(TestCapabilitiesService);
		memento = TypeMoq.Mock.ofType(Memento, TypeMoq.MockBehavior.Loose, true, '');
		memento.setup(x => x.getMemento(TypeMoq.It.isAny())).returns(() => void 0);
		queryConnectionService = TypeMoq.Mock.ofType(TestConnectionManagementService, TypeMoq.MockBehavior.Loose, true, memento.object, undefined, new TestStorageService());
		queryConnectionService.callBase = true;
		let serviceCollection = new ServiceCollection();
		instantiationService = new InstantiationService(serviceCollection, true);
		defaultModelOptions = {
			notebookUri: defaultUri,
			factory: new ModelFactory(instantiationService),
			notebookManagers,
			contentManager: undefined,
			notificationService: notificationService.object,
			connectionService: queryConnectionService.object,
			providerId: 'SQL',
			cellMagicMapper: undefined,
			defaultKernel: undefined,
			layoutChanged: undefined,
			capabilitiesService: capabilitiesService.object
		};
		mockClientSession = TypeMoq.Mock.ofType(ClientSession, TypeMoq.MockBehavior.Loose, true, defaultModelOptions);
		mockClientSession.setup(c => c.initialize()).returns(() => {
			return Promise.resolve();
		});
		mockClientSession.setup(c => c.ready).returns(() => sessionReady.promise);
		mockModelFactory = TypeMoq.Mock.ofType(ModelFactory);
		mockModelFactory.callBase = true;
		mockModelFactory.setup(f => f.createClientSession(TypeMoq.It.isAny())).returns(() => {
			return mockClientSession.object;
		});
	});

	test('Should create no cells if model has no contents', async function (): Promise<void> {
		// Given an empty notebook
		let emptyNotebook: nb.INotebookContents = {
			cells: [],
			metadata: {
				kernelspec: {
					name: 'mssql',
					language: 'sql'
				}
			},
			nbformat: 4,
			nbformat_minor: 5
		};

		let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
		mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).returns(() => Promise.resolve(emptyNotebook));
		notebookManagers[0].contentManager = mockContentManager.object;
		// When I initialize the model
		let model = new NotebookModel(defaultModelOptions, undefined, logService, undefined, undefined);
		await model.loadContents();

		// Then I expect to have 0 code cell as the contents
		assert.equal(model.cells.length, 0);
		// And Trust should be false by default
		assert(!model.trustedMode);
	});

	test('Should use trusted state set in model load', async function (): Promise<void> {
		// Given a notebook
		let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
		mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).returns(() => Promise.resolve(expectedNotebookContent));
		notebookManagers[0].contentManager = mockContentManager.object;
		// When I initialize the model
		let model = new NotebookModel(defaultModelOptions, undefined, logService, undefined, undefined);
		await model.loadContents(true);
		await model.requestModelLoad();

		// Then Trust should be true
		assert(model.trustedMode);
	});

	// test('Should throw if model load fails', async function(): Promise<void> {
	// 	// Given a call to get Contents fails
	// 	let error = new Error('File not found');
	// 	let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
	// 	mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).throws(error);
	// 	notebookManagers[0].contentManager = mockContentManager.object;

	// 	// When I initalize the model
	// 	// Then it should throw
	// 	let model = new NotebookModel(defaultModelOptions);
	// 	should(model.inErrorState).be.false();
	// 	await testUtils.assertThrowsAsync(() => model.requestModelLoad(), error.message);
	// 	should(model.inErrorState).be.true();
	// });

	// test('Should convert cell info to CellModels', async function(): Promise<void> {
	// 	// Given a notebook with 2 cells
	// 	let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
	// 	mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).returns(() => Promise.resolve(expectedNotebookContent));
	// 	notebookManagers[0].contentManager = mockContentManager.object;

	// 	// When I initalize the model
	// 	let model = new NotebookModel(defaultModelOptions);
	// 	await model.requestModelLoad();

	// 	// Then I expect all cells to be in the model
	// 	should(model.cells).have.length(2);
	// 	should(model.cells[0].source).be.equal(expectedNotebookContent.cells[0].source);
	// 	should(model.cells[1].source).be.equal(expectedNotebookContent.cells[1].source);
	// });

	// test('Should load contents but then go to error state if client session startup fails', async function(): Promise<void> {
	// 	let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
	// 	mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).returns(() => Promise.resolve(expectedNotebookContentOneCell));
	// 	notebookManagers[0].contentManager = mockContentManager.object;

	// 	// Given I have a session that fails to start
	// 	mockClientSession.setup(c => c.isInErrorState).returns(() => true);
	// 	mockClientSession.setup(c => c.errorMessage).returns(() => 'Error');
	// 	sessionReady.resolve();
	// 	let sessionFired = false;

	// 	let options: INotebookModelOptions = Object.assign({}, defaultModelOptions, <Partial<INotebookModelOptions>> {
	// 		factory: mockModelFactory.object
	// 	});
	// 	let model = new NotebookModel(options);
	// 	model.onClientSessionReady((session) => sessionFired = true);
	// 	await model.requestModelLoad();
	// 	model.startSession(notebookManagers[0]);

	// 	// Then I expect load to succeed
	// 	shouldHaveOneCell(model);
	// 	should(model.clientSession).not.be.undefined();
	// 	// but on server load completion I expect error state to be set
	// 	// Note: do not expect serverLoad event to throw even if failed
	// 	await model.sessionLoadFinished;
	// 	should(model.inErrorState).be.true();
	// 	should(sessionFired).be.false();
	// });

	test('Should not be in error state if client session initialization succeeds', async function (): Promise<void> {
		let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
		mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).returns(() => Promise.resolve(expectedNotebookContentOneCell));
		notebookManagers[0].contentManager = mockContentManager.object;
		let kernelChangedEmitter: Emitter<nb.IKernelChangedArgs> = new Emitter<nb.IKernelChangedArgs>();
		let statusChangedEmitter: Emitter<nb.ISession> = new Emitter<nb.ISession>();

		mockClientSession.setup(c => c.isInErrorState).returns(() => false);
		mockClientSession.setup(c => c.isReady).returns(() => true);
		mockClientSession.setup(c => c.kernelChanged).returns(() => kernelChangedEmitter.event);
		mockClientSession.setup(c => c.statusChanged).returns(() => statusChangedEmitter.event);

		queryConnectionService.setup(c => c.getActiveConnections(TypeMoq.It.isAny())).returns(() => null);

		sessionReady.resolve();
		let actualSession: IClientSession = undefined;

		let options: INotebookModelOptions = Object.assign({}, defaultModelOptions, <Partial<INotebookModelOptions>>{
			factory: mockModelFactory.object
		});
		let model = new NotebookModel(options, undefined, logService, undefined, undefined);
		model.onClientSessionReady((session) => actualSession = session);
		await model.requestModelLoad();
		await model.startSession(notebookManagers[0]);

		// Then I expect load to succeed
		assert(!isUndefinedOrNull(model.clientSession));
		// but on server load completion I expect error state to be set
		// Note: do not expect serverLoad event to throw even if failed
		await model.sessionLoadFinished;
		assert(!model.inErrorState);
		assert.equal(actualSession, mockClientSession.object);
		assert.equal(model.clientSession, mockClientSession.object);
	});

	test('Should sanitize kernel display name when IP is included', async function (): Promise<void> {
		let model = new NotebookModel(defaultModelOptions, undefined, logService, undefined, undefined);
		let displayName = 'PySpark (1.1.1.1)';
		let sanitizedDisplayName = model.sanitizeDisplayName(displayName);
		assert.equal(sanitizedDisplayName, 'PySpark');
	});

	test('Should sanitize kernel display name properly when IP is not included', async function (): Promise<void> {
		let model = new NotebookModel(defaultModelOptions, undefined, logService, undefined, undefined);
		let displayName = 'PySpark';
		let sanitizedDisplayName = model.sanitizeDisplayName(displayName);
		assert.equal(sanitizedDisplayName, 'PySpark');
	});

	test('Should notify on trust set', async function () {
		// Given a notebook that's been loaded
		let mockContentManager = TypeMoq.Mock.ofType(LocalContentManager);
		mockContentManager.setup(c => c.getNotebookContents(TypeMoq.It.isAny())).returns(() => Promise.resolve(expectedNotebookContent));
		notebookManagers[0].contentManager = mockContentManager.object;
		let model = new NotebookModel(defaultModelOptions, undefined, logService, undefined, undefined);
		await model.requestModelLoad();

		let actualChanged: NotebookContentChange;
		model.contentChanged((changed) => actualChanged = changed);
		// When I change trusted state
		model.trustedMode = true;

		// Then content changed notification should be sent
		assert(model.trustedMode);
		assert(!isUndefinedOrNull(actualChanged));
		assert.equal(actualChanged.changeType, NotebookChangeType.TrustChanged);
	});
});
