/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import 'mocha';
import * as azdata from 'azdata';
import { JobData } from '../../data/jobData';
import { isUndefinedOrNull } from '../types';

const testOwnerUri = 'agent://testuri';
let mockJobData: TypeMoq.IMock<JobData>;
let mockAgentService: TypeMoq.IMock<azdata.AgentServicesProvider>;

describe('Agent extension create job objects', function (): void {
	beforeEach(() => {
		mockAgentService = TypeMoq.Mock.ofType<azdata.AgentServicesProvider>();
		mockAgentService.setup(s => s.createJob(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => TypeMoq.It.isAny());
		mockAgentService.setup(s => s.createJob(undefined, TypeMoq.It.isAny())).returns(() => undefined);
		mockAgentService.setup(s => s.createAlert(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => TypeMoq.It.isAny());
		mockAgentService.setup(s => s.createAlert(undefined, TypeMoq.It.isAny())).returns(() => undefined);
		mockAgentService.setup(s => s.createJobSchedule(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => TypeMoq.It.isAny());
		mockAgentService.setup(s => s.createJobSchedule(undefined, TypeMoq.It.isAny())).returns(() => undefined);
		mockAgentService.setup(s => s.createJobStep(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => TypeMoq.It.isAny());
		mockAgentService.setup(s => s.createJobStep(undefined, TypeMoq.It.isAny())).returns(() => undefined);
		mockAgentService.setup(s => s.createOperator(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => TypeMoq.It.isAny());
		mockAgentService.setup(s => s.createOperator(undefined, TypeMoq.It.isAny())).returns(() => undefined);
		mockAgentService.setup(s => s.createProxy(TypeMoq.It.isAnyString(), TypeMoq.It.isAny())).returns(() => TypeMoq.It.isAny());
		mockAgentService.setup(s => s.createProxy(undefined, TypeMoq.It.isAny())).returns(() => undefined);
	});

	it('Create Job Data', async () => {
		// should fail when ownerUri is null
		let createJobResult = mockAgentService.object.createJob(null, TypeMoq.It.isAny());
		assert(isUndefinedOrNull(createJobResult));
		createJobResult = mockAgentService.object.createJob(testOwnerUri, TypeMoq.It.isAny());
		assert(!isUndefinedOrNull(createJobResult));
		mockJobData = TypeMoq.Mock.ofType<JobData>(JobData, TypeMoq.MockBehavior.Loose, false, [TypeMoq.It.isAnyString(), undefined, mockAgentService]);
	});

	it('Create Alert Data', async () => {
		// should fail when ownerUri is null
		let createAlertResult = mockAgentService.object.createAlert(null, TypeMoq.It.isAny());
		assert(isUndefinedOrNull(createAlertResult));
		createAlertResult = mockAgentService.object.createAlert(testOwnerUri, TypeMoq.It.isAny());
		assert(!isUndefinedOrNull(createAlertResult));
	});

	it('Create Job Schedule Data', async () => {
		// should fail when ownerUri is null
		let createJobScheduleResult = mockAgentService.object.createJobSchedule(null, TypeMoq.It.isAny());
		assert(isUndefinedOrNull(createJobScheduleResult));
		createJobScheduleResult = mockAgentService.object.createJobSchedule(testOwnerUri, TypeMoq.It.isAny());
		assert(!isUndefinedOrNull(createJobScheduleResult));
	});

	it('Create Job Step Data', async () => {
		// should fail when ownerUri is null
		let createJobStepResult = mockAgentService.object.createJobStep(null, TypeMoq.It.isAny());
		assert(isUndefinedOrNull(createJobStepResult));
		createJobStepResult = mockAgentService.object.createJobStep(testOwnerUri, TypeMoq.It.isAny());
		assert(!isUndefinedOrNull(createJobStepResult));
	});

	it('Create Operator Data', async () => {
		// should fail when ownerUri is null
		let createOperatorResult = mockAgentService.object.createOperator(null, TypeMoq.It.isAny());
		assert(isUndefinedOrNull(createOperatorResult));
		createOperatorResult = mockAgentService.object.createOperator(testOwnerUri, TypeMoq.It.isAny());
		assert(!isUndefinedOrNull(createOperatorResult));
	});

	it('Create Proxy Data', async () => {
		// should fail when ownerUri is null
		let createProxyResult = mockAgentService.object.createProxy(null, TypeMoq.It.isAny());
		assert(isUndefinedOrNull(createProxyResult));
		createProxyResult = mockAgentService.object.createProxy(testOwnerUri, TypeMoq.It.isAny());
		assert(!isUndefinedOrNull(createProxyResult));
	});
});
