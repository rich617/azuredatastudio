/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as azdata from 'azdata';
import * as TypeMoq from 'typemoq';
import * as assert from 'assert';
import { JobsRefreshAction, NewJobAction, EditJobAction, RunJobAction, StopJobAction, DeleteJobAction, NewStepAction, DeleteStepAction, NewAlertAction, EditAlertAction, DeleteAlertAction, NewOperatorAction, EditOperatorAction, DeleteOperatorAction, NewProxyAction, EditProxyAction, DeleteProxyAction } from 'sql/platform/jobManagement/browser/jobActions';
import { JobManagementService } from 'sql/platform/jobManagement/common/jobManagementService';

// Mock View Components
let mockJobsViewComponent: TypeMoq.IMock<TestJobManagementView>;
let mockAlertsViewComponent: TypeMoq.IMock<TestJobManagementView>;
let mockOperatorsViewComponent: TypeMoq.IMock<TestJobManagementView>;
let mockProxiesViewComponent: TypeMoq.IMock<TestJobManagementView>;
let mockJobManagementService: TypeMoq.IMock<JobManagementService>;

// Mock Job Actions
let mockRefreshAction: TypeMoq.IMock<JobsRefreshAction>;
let mockNewJobAction: TypeMoq.IMock<NewJobAction>;
let mockEditJobAction: TypeMoq.IMock<EditJobAction>;
let mockRunJobAction: TypeMoq.IMock<RunJobAction>;
let mockStopJobAction: TypeMoq.IMock<StopJobAction>;
let mockDeleteJobAction: TypeMoq.IMock<DeleteJobAction>;

// Mock Step Actions
let mockNewStepAction: TypeMoq.IMock<NewStepAction>;
let mockDeleteStepAction: TypeMoq.IMock<DeleteStepAction>;

// Mock Alert Actions
let mockNewAlertAction: TypeMoq.IMock<NewAlertAction>;
let mockEditAlertAction: TypeMoq.IMock<EditAlertAction>;
let mockDeleteAlertAction: TypeMoq.IMock<DeleteAlertAction>;

// Mock Operator Actions
let mockNewOperatorAction: TypeMoq.IMock<NewOperatorAction>;
let mockEditOperatorAction: TypeMoq.IMock<EditOperatorAction>;
let mockDeleteOperatorAction: TypeMoq.IMock<DeleteOperatorAction>;

// Mock Proxy Actions
let mockNewProxyAction: TypeMoq.IMock<NewProxyAction>;
let mockEditProxyAction: TypeMoq.IMock<EditProxyAction>;
let mockDeleteProxyAction: TypeMoq.IMock<DeleteProxyAction>;

/**
 * Class to test Job Management Views
 */
class TestJobManagementView {

	refreshJobs() { return undefined; }

	openCreateJobDialog() { return undefined; }

	openCreateAlertDialog() { return undefined; }

	openCreateOperatorDialog() { return undefined; }

	openCreateProxyDialog() { return undefined; }
}

// Tests
suite('Job Management Actions', () => {

	// Job Actions
	setup(() => {
		mockJobsViewComponent = TypeMoq.Mock.ofType<TestJobManagementView>(TestJobManagementView);
		mockAlertsViewComponent = TypeMoq.Mock.ofType<TestJobManagementView>(TestJobManagementView);
		mockOperatorsViewComponent = TypeMoq.Mock.ofType<TestJobManagementView>(TestJobManagementView);
		mockProxiesViewComponent = TypeMoq.Mock.ofType<TestJobManagementView>(TestJobManagementView);
		mockJobManagementService = TypeMoq.Mock.ofType<JobManagementService>(JobManagementService);
		let resultStatus: azdata.ResultStatus = {
			success: true,
			errorMessage: null
		};
		mockJobManagementService.setup(s => s.jobAction(TypeMoq.It.isAny(), TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns(() => Promise.resolve(resultStatus));
	});

	test('Jobs Refresh Action', (done) => {
		mockRefreshAction = TypeMoq.Mock.ofType(JobsRefreshAction, TypeMoq.MockBehavior.Strict, true, JobsRefreshAction.ID, JobsRefreshAction.LABEL);
		mockRefreshAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => mockJobsViewComponent.object.refreshJobs());
		mockRefreshAction.setup(s => s.id).returns(() => JobsRefreshAction.ID);
		mockRefreshAction.setup(s => s.label).returns(() => JobsRefreshAction.LABEL);
		assert.equal(mockRefreshAction.object.id, JobsRefreshAction.ID);
		assert.equal(mockRefreshAction.object.label, JobsRefreshAction.LABEL);

		// Job Refresh Action from Jobs View should refresh the component
		mockRefreshAction.object.run(null);
		mockJobsViewComponent.verify(c => c.refreshJobs(), TypeMoq.Times.once());
		done();
	});

	test('New Job Action', (done) => {
		mockNewJobAction = TypeMoq.Mock.ofType(NewJobAction, TypeMoq.MockBehavior.Strict, true, NewJobAction.ID, NewJobAction.LABEL);
		mockNewJobAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => mockJobsViewComponent.object.openCreateJobDialog());
		mockNewJobAction.setup(s => s.id).returns(() => NewJobAction.ID);
		mockNewJobAction.setup(s => s.label).returns(() => NewJobAction.LABEL);
		assert.equal(mockNewJobAction.object.id, NewJobAction.ID);
		assert.equal(mockNewJobAction.object.label, NewJobAction.LABEL);

		// New Job Action from Jobs View should open a dialog
		mockNewJobAction.object.run(null);
		mockJobsViewComponent.verify(c => c.openCreateJobDialog(), TypeMoq.Times.once());
		done();
	});

	test('Edit Job Action', (done) => {
		mockEditJobAction = TypeMoq.Mock.ofType(EditJobAction, TypeMoq.MockBehavior.Strict, true, EditJobAction.ID, EditJobAction.LABEL);
		let commandServiceCalled: boolean = false;
		mockEditJobAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => {
			commandServiceCalled = true;
			return Promise.resolve(commandServiceCalled);
		});
		mockEditJobAction.setup(s => s.id).returns(() => EditJobAction.ID);
		mockEditJobAction.setup(s => s.label).returns(() => EditJobAction.LABEL);
		assert.equal(mockEditJobAction.object.id, EditJobAction.ID);
		assert.equal(mockEditJobAction.object.label, EditJobAction.LABEL);

		// Edit Job Action from Jobs View should open a dialog
		mockEditJobAction.object.run(null);
		assert(commandServiceCalled);
		done();
	});

	test('Run Job Action', (done) => {
		mockRunJobAction = TypeMoq.Mock.ofType(RunJobAction, TypeMoq.MockBehavior.Strict, true, RunJobAction.ID, RunJobAction.LABEL, null, null, mockJobManagementService);
		mockRunJobAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			let result = await mockJobManagementService.object.jobAction(null, null, null).then((result) => result.success);
			return result;
		});

		mockRunJobAction.setup(s => s.id).returns(() => RunJobAction.ID);
		mockRunJobAction.setup(s => s.label).returns(() => RunJobAction.LABEL);
		assert.equal(mockRunJobAction.object.id, RunJobAction.ID);
		assert.equal(mockRunJobAction.object.label, RunJobAction.LABEL);

		// Run Job Action should make the Job Management service call job action
		mockRunJobAction.object.run(null);
		mockJobManagementService.verify(s => s.jobAction(null, null, null), TypeMoq.Times.once());
		done();
	});

	test('Stop Job Action', (done) => {
		mockStopJobAction = TypeMoq.Mock.ofType(StopJobAction, TypeMoq.MockBehavior.Strict, true, StopJobAction.ID, StopJobAction.LABEL, null, null, mockJobManagementService);
		mockStopJobAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			let result = await mockJobManagementService.object.jobAction(null, null, null).then((result) => result.success);
			return result;
		});

		mockStopJobAction.setup(s => s.id).returns(() => RunJobAction.ID);
		mockStopJobAction.setup(s => s.label).returns(() => RunJobAction.LABEL);
		assert.equal(mockStopJobAction.object.id, RunJobAction.ID);
		assert.equal(mockStopJobAction.object.label, RunJobAction.LABEL);

		// Run Job Action should make the Job Management service call job action
		mockStopJobAction.object.run(null);
		mockJobManagementService.verify(s => s.jobAction(null, null, null), TypeMoq.Times.once());
		done();
	});

	test('Delete Job Action', (done) => {
		mockDeleteJobAction = TypeMoq.Mock.ofType(DeleteJobAction, TypeMoq.MockBehavior.Strict, true, DeleteJobAction.ID, DeleteJobAction.LABEL, null, null, mockJobManagementService);
		mockDeleteJobAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			let result = await mockJobManagementService.object.jobAction(null, null, null).then((result) => result.success);
			return result;
		});

		mockDeleteJobAction.setup(s => s.id).returns(() => DeleteJobAction.ID);
		mockDeleteJobAction.setup(s => s.label).returns(() => DeleteJobAction.LABEL);
		assert.equal(mockDeleteJobAction.object.id, DeleteJobAction.ID);
		assert.equal(mockDeleteJobAction.object.label, DeleteJobAction.LABEL);

		// Run Job Action should make the Job Management service call job action
		mockDeleteJobAction.object.run(null);
		mockJobManagementService.verify(s => s.jobAction(null, null, null), TypeMoq.Times.once());
		done();
	});

	// Step Actions
	test('New Step Action', (done) => {
		mockNewStepAction = TypeMoq.Mock.ofType(NewStepAction, TypeMoq.MockBehavior.Strict, true, NewJobAction.ID, NewJobAction.LABEL);
		let commandServiceCalled = false;
		mockNewStepAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => {
			commandServiceCalled = true;
			return Promise.resolve(commandServiceCalled);
		});
		mockNewStepAction.setup(s => s.id).returns(() => NewJobAction.ID);
		mockNewStepAction.setup(s => s.label).returns(() => NewJobAction.LABEL);
		assert.equal(mockNewStepAction.object.id, NewJobAction.ID);
		assert.equal(mockNewStepAction.object.label, NewJobAction.LABEL);

		// New Step Action should called command service
		mockNewStepAction.object.run(null);
		assert(commandServiceCalled);
		done();
	});

	test('Delete Step Action', (done) => {
		mockDeleteStepAction = TypeMoq.Mock.ofType(DeleteStepAction, TypeMoq.MockBehavior.Strict, true, DeleteStepAction.ID, DeleteStepAction.LABEL);
		let commandServiceCalled = false;
		mockDeleteStepAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			commandServiceCalled = true;
			await mockJobManagementService.object.deleteJobStep(null, null).then((result) => result.success);
			return Promise.resolve(commandServiceCalled);
		});
		mockDeleteStepAction.setup(s => s.id).returns(() => DeleteStepAction.ID);
		mockDeleteStepAction.setup(s => s.label).returns(() => DeleteStepAction.LABEL);
		assert.equal(mockDeleteStepAction.object.id, DeleteStepAction.ID);
		assert.equal(mockDeleteStepAction.object.label, DeleteStepAction.LABEL);

		// Delete Step Action should called command service
		mockDeleteStepAction.object.run(null);
		assert(commandServiceCalled);
		mockJobManagementService.verify(s => s.deleteJobStep(null, null), TypeMoq.Times.once());
		done();
	});

	// Alert Actions
	test('New Alert Action', (done) => {
		mockNewAlertAction = TypeMoq.Mock.ofType(NewJobAction, TypeMoq.MockBehavior.Strict, true, NewJobAction.ID, NewJobAction.LABEL);
		mockNewAlertAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => mockAlertsViewComponent.object.openCreateAlertDialog());
		mockNewAlertAction.setup(s => s.id).returns(() => NewJobAction.ID);
		mockNewAlertAction.setup(s => s.label).returns(() => NewJobAction.LABEL);
		assert.equal(mockNewAlertAction.object.id, NewJobAction.ID);
		assert.equal(mockNewAlertAction.object.label, NewJobAction.LABEL);

		// New Alert Action from Alerts View should open a dialog
		mockNewAlertAction.object.run(null);
		mockAlertsViewComponent.verify(c => c.openCreateAlertDialog(), TypeMoq.Times.once());
		done();
	});

	test('Edit Alert Action', (done) => {
		mockEditAlertAction = TypeMoq.Mock.ofType(EditAlertAction, TypeMoq.MockBehavior.Strict, true, EditAlertAction.ID, EditAlertAction.LABEL);
		let commandServiceCalled: boolean = false;
		mockEditAlertAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => {
			commandServiceCalled = true;
			return Promise.resolve(commandServiceCalled);
		});
		mockEditAlertAction.setup(s => s.id).returns(() => EditAlertAction.ID);
		mockEditAlertAction.setup(s => s.label).returns(() => EditAlertAction.LABEL);
		assert.equal(mockEditAlertAction.object.id, EditAlertAction.ID);
		assert.equal(mockEditAlertAction.object.label, EditAlertAction.LABEL);

		// Edit Alert Action from Jobs View should open a dialog
		mockEditAlertAction.object.run(null);
		assert(commandServiceCalled);
		done();
	});

	test('Delete Alert Action', (done) => {
		mockDeleteAlertAction = TypeMoq.Mock.ofType(DeleteAlertAction, TypeMoq.MockBehavior.Strict, true, DeleteAlertAction.ID, DeleteAlertAction.LABEL, null, null, mockJobManagementService);
		let commandServiceCalled = false;
		mockDeleteAlertAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			commandServiceCalled = true;
			await mockJobManagementService.object.deleteAlert(null, null).then((result) => result.success);
			return commandServiceCalled;
		});
		mockDeleteAlertAction.setup(s => s.id).returns(() => DeleteAlertAction.ID);
		mockDeleteAlertAction.setup(s => s.label).returns(() => DeleteAlertAction.LABEL);
		assert.equal(mockDeleteAlertAction.object.id, DeleteAlertAction.ID);
		assert.equal(mockDeleteAlertAction.object.label, DeleteAlertAction.LABEL);

		// Delete Alert Action should call job management service
		mockDeleteAlertAction.object.run(null);
		assert(commandServiceCalled);
		mockJobManagementService.verify(s => s.deleteAlert(null, null), TypeMoq.Times.once());
		done();
	});

	// Operator Tests
	test('New Operator Action', (done) => {
		mockNewOperatorAction = TypeMoq.Mock.ofType(NewOperatorAction, TypeMoq.MockBehavior.Strict, true, NewOperatorAction.ID, NewOperatorAction.LABEL);
		mockNewOperatorAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => mockOperatorsViewComponent.object.openCreateOperatorDialog());
		mockNewOperatorAction.setup(s => s.id).returns(() => NewOperatorAction.ID);
		mockNewOperatorAction.setup(s => s.label).returns(() => NewOperatorAction.LABEL);
		assert.equal(mockNewOperatorAction.object.id, NewOperatorAction.ID);
		assert.equal(mockNewOperatorAction.object.label, NewOperatorAction.LABEL);

		// New Operator Action from Operators View should open a dialog
		mockNewOperatorAction.object.run(null);
		mockOperatorsViewComponent.verify(c => c.openCreateOperatorDialog(), TypeMoq.Times.once());
		done();
	});

	test('Edit Operator Action', (done) => {
		mockEditOperatorAction = TypeMoq.Mock.ofType(EditOperatorAction, TypeMoq.MockBehavior.Strict, true, EditOperatorAction.ID, EditOperatorAction.LABEL);
		let commandServiceCalled: boolean = false;
		mockEditOperatorAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => {
			commandServiceCalled = true;
			return Promise.resolve(commandServiceCalled);
		});
		mockEditOperatorAction.setup(s => s.id).returns(() => EditOperatorAction.ID);
		mockEditOperatorAction.setup(s => s.label).returns(() => EditOperatorAction.LABEL);
		assert.equal(mockEditOperatorAction.object.id, EditOperatorAction.ID);
		assert.equal(mockEditOperatorAction.object.label, EditOperatorAction.LABEL);

		// Edit Operator Action from Jobs View should open a dialog
		mockEditOperatorAction.object.run(null);
		assert(commandServiceCalled);
		done();
	});

	test('Delete Operator Action', (done) => {
		mockDeleteOperatorAction = TypeMoq.Mock.ofType(DeleteOperatorAction, TypeMoq.MockBehavior.Strict, true, DeleteOperatorAction.ID, DeleteOperatorAction.LABEL, null, null, mockJobManagementService);
		let commandServiceCalled = false;
		mockDeleteOperatorAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			commandServiceCalled = true;
			await mockJobManagementService.object.deleteOperator(null, null).then((result) => result.success);
			return commandServiceCalled;
		});
		mockDeleteOperatorAction.setup(s => s.id).returns(() => DeleteOperatorAction.ID);
		mockDeleteOperatorAction.setup(s => s.label).returns(() => DeleteOperatorAction.LABEL);
		assert.equal(mockDeleteOperatorAction.object.id, DeleteOperatorAction.ID);
		assert.equal(mockDeleteOperatorAction.object.label, DeleteOperatorAction.LABEL);

		// Delete Operator Action should call job management service
		mockDeleteOperatorAction.object.run(null);
		assert(commandServiceCalled);
		mockJobManagementService.verify(s => s.deleteOperator(null, null), TypeMoq.Times.once());
		done();
	});

	// Proxy Actions
	test('New Proxy Action', (done) => {
		mockNewProxyAction = TypeMoq.Mock.ofType(NewProxyAction, TypeMoq.MockBehavior.Strict, true, NewProxyAction.ID, NewProxyAction.LABEL);
		mockNewProxyAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => mockProxiesViewComponent.object.openCreateProxyDialog());
		mockNewProxyAction.setup(s => s.id).returns(() => NewProxyAction.ID);
		mockNewProxyAction.setup(s => s.label).returns(() => NewProxyAction.LABEL);
		assert.equal(mockNewProxyAction.object.id, NewProxyAction.ID);
		assert.equal(mockNewProxyAction.object.label, NewProxyAction.LABEL);

		// New Proxy Action from Alerts View should open a dialog
		mockNewProxyAction.object.run(null);
		mockProxiesViewComponent.verify(c => c.openCreateProxyDialog(), TypeMoq.Times.once());
		done();
	});

	test('Edit Proxy Action', (done) => {
		mockEditProxyAction = TypeMoq.Mock.ofType(EditProxyAction, TypeMoq.MockBehavior.Strict, true, EditProxyAction.ID, EditProxyAction.LABEL);
		let commandServiceCalled: boolean = false;
		mockEditProxyAction.setup(s => s.run(TypeMoq.It.isAny())).returns(() => {
			commandServiceCalled = true;
			return Promise.resolve(commandServiceCalled);
		});
		mockEditProxyAction.setup(s => s.id).returns(() => EditProxyAction.ID);
		mockEditProxyAction.setup(s => s.label).returns(() => EditProxyAction.LABEL);
		assert.equal(mockEditProxyAction.object.id, EditProxyAction.ID);
		assert.equal(mockEditProxyAction.object.label, EditProxyAction.LABEL);

		// Edit Proxy Action from Proxies View should open a dialog
		mockEditProxyAction.object.run(null);
		assert(commandServiceCalled);
		done();
	});

	test('Delete Proxy Action', (done) => {
		mockDeleteProxyAction = TypeMoq.Mock.ofType(DeleteProxyAction, TypeMoq.MockBehavior.Strict, true, DeleteProxyAction.ID, DeleteProxyAction.LABEL, null, null, mockJobManagementService);
		let commandServiceCalled = false;
		mockDeleteProxyAction.setup(s => s.run(TypeMoq.It.isAny())).returns(async () => {
			commandServiceCalled = true;
			await mockJobManagementService.object.deleteProxy(null, null).then((result) => result.success);
			return commandServiceCalled;
		});
		mockDeleteProxyAction.setup(s => s.id).returns(() => DeleteProxyAction.ID);
		mockDeleteProxyAction.setup(s => s.label).returns(() => DeleteProxyAction.LABEL);
		assert.equal(mockDeleteProxyAction.object.id, DeleteProxyAction.ID);
		assert.equal(mockDeleteProxyAction.object.label, DeleteProxyAction.LABEL);

		// Delete Proxy Action should call job management service
		mockDeleteProxyAction.object.run(null);
		assert(commandServiceCalled);
		mockJobManagementService.verify(s => s.deleteProxy(null, null), TypeMoq.Times.once());
		done();
	});

});
