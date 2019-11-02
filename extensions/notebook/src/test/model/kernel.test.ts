/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as TypeMoq from 'typemoq';
import { nb } from 'azdata';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import 'mocha';

import { KernelStub, FutureStub, isUndefinedOrNull } from '../common';
import { JupyterKernel, JupyterFuture } from '../../jupyter/jupyterKernel';

describe('Jupyter Session', function (): void {
	let mockJupyterKernel: TypeMoq.IMock<KernelStub>;
	let kernel: JupyterKernel;

	beforeEach(() => {
		mockJupyterKernel = TypeMoq.Mock.ofType(KernelStub);
		kernel = new JupyterKernel(mockJupyterKernel.object);
	});

	it('should pass through most properties', function (done): void {
		// Given values for the passthrough properties
		mockJupyterKernel.setup(s => s.id).returns(() => 'id');
		mockJupyterKernel.setup(s => s.name).returns(() => 'name');
		mockJupyterKernel.setup(s => s.isReady).returns(() => true);
		let readyPromise = Promise.reject('err');
		mockJupyterKernel.setup(s => s.ready).returns(() => readyPromise);
		// Should return those values when called
		assert.equal(kernel.id, 'id');
		assert.equal(kernel.name, 'name');
		assert(kernel.isReady);

		kernel.ready.then((fulfilled) => done('Err: should not succeed'), (err) => done());
	});

	it('should passthrough spec with expected name and display name', async function (): Promise<void> {
		let spec: Kernel.ISpecModel = {
			name: 'python',
			display_name: 'Python 3',
			language: 'python',
			argv: undefined,
			resources: undefined
		};
		mockJupyterKernel.setup(k => k.getSpec()).returns(() => Promise.resolve(spec));

		let actualSpec = await kernel.getSpec();
		assert.equal(actualSpec.name, 'python');
		assert.equal(actualSpec.display_name, 'Python 3');
	});

	it('should return code completions on requestComplete', async function (): Promise<void> {
		assert(kernel.supportsIntellisense);
		let completeMsg: KernelMessage.ICompleteReplyMsg = {
			channel: 'shell',
			content: {
				cursor_start: 0,
				cursor_end: 2,
				matches: ['print'],
				metadata: {},
				status: 'ok'
			},
			header: undefined,
			metadata: undefined,
			parent_header: undefined
		};
		mockJupyterKernel.setup(k => k.requestComplete(TypeMoq.It.isAny())).returns(() => Promise.resolve(completeMsg));

		let msg = await kernel.requestComplete({
			code: 'pr',
			cursor_pos: 2
		});
		assert.equal(msg.type, 'shell');
		assert.equal(msg.content, completeMsg.content);
	});

	it('should return a simple future on requestExecute', async function (): Promise<void> {
		let futureMock = TypeMoq.Mock.ofType(FutureStub);
		const code = 'print("hello")';
		let msg: KernelMessage.IShellMessage = {
			channel: 'shell',
			content: { code: code },
			header: undefined,
			metadata: undefined,
			parent_header: undefined
		};
		futureMock.setup(f => f.msg).returns(() => msg);
		let executeRequest: KernelMessage.IExecuteRequest;
		let shouldDispose: KernelMessage.IExecuteRequest;
		mockJupyterKernel.setup(k => k.requestExecute(TypeMoq.It.isAny(), TypeMoq.It.isAny())).returns((request, disposeOnDone) => {
			executeRequest = request;
			shouldDispose = disposeOnDone;
			return futureMock.object;
		});

		// When I request execute
		let future = kernel.requestExecute({
			code: code
		}, true);

		// Then expect wrapper to be returned
		assert(future instanceof JupyterFuture);
		assert.equal(future.msg.type, 'shell');
		assert.equal(future.msg.content.code, code);
		assert.equal(executeRequest.code, code);
		assert(shouldDispose);
	});

});

describe('Jupyter Future', function (): void {
	let mockJupyterFuture: TypeMoq.IMock<FutureStub>;
	let future: JupyterFuture;

	beforeEach(() => {
		mockJupyterFuture = TypeMoq.Mock.ofType(FutureStub);
		future = new JupyterFuture(mockJupyterFuture.object);
	});

	it('should return message on done', async function (): Promise<void> {
		let msg: KernelMessage.IShellMessage = {
			channel: 'shell',
			content: { code: 'exec' },
			header: undefined,
			metadata: undefined,
			parent_header: undefined
		};

		mockJupyterFuture.setup(f => f.done).returns(() => Promise.resolve(msg));

		let actualMsg = await future.done;
		assert.equal(actualMsg.content.code, 'exec');
	});

	it('should relay reply message', async function (): Promise<void> {
		let handler: (msg: KernelMessage.IShellMessage) => void | PromiseLike<void>;
		mockJupyterFuture.setup(f => f.onReply = TypeMoq.It.isAny()).callback(h => handler = h);

		// When I set a reply handler and a message is sent
		let msg: nb.IShellMessage;
		future.setReplyHandler({
			handle: (message => {
				msg = message;
			})
		});
		assert(!isUndefinedOrNull(handler));
		verifyRelayMessage('shell', handler, () => msg);
	});

	it('should relay StdIn message', async function (): Promise<void> {
		let handler: (msg: KernelMessage.IStdinMessage) => void | PromiseLike<void>;
		mockJupyterFuture.setup(f => f.onStdin = TypeMoq.It.isAny()).callback(h => handler = h);

		// When I set a reply handler and a message is sent
		let msg: nb.IStdinMessage;
		future.setStdInHandler({
			handle: (message => {
				msg = message;
			})
		});
		assert(!isUndefinedOrNull(handler));
		verifyRelayMessage('stdin', handler, () => msg);
	});

	it('should relay IOPub message', async function (): Promise<void> {
		let handler: (msg: KernelMessage.IIOPubMessage) => void | PromiseLike<void>;
		mockJupyterFuture.setup(f => f.onIOPub = TypeMoq.It.isAny()).callback(h => handler = h);

		// When I set a reply handler and a message is sent
		let msg: nb.IIOPubMessage;
		future.setIOPubHandler({
			handle: (message => {
				msg = message;
			})
		});
		assert(!isUndefinedOrNull(handler));
		verifyRelayMessage('iopub', handler, () => msg);
	});

	function verifyRelayMessage(channel: nb.Channel | KernelMessage.Channel, handler: (msg: KernelMessage.IMessage) => void | PromiseLike<void>, getMessage: () => nb.IMessage): void {
		handler({
			channel: <any>channel,
			content: { value: 'test' },
			metadata: { value: 'test' },
			header: { username: 'test', version: '1', msg_id: undefined, msg_type: undefined, session: undefined },
			parent_header: { username: 'test', version: '1', msg_id: undefined, msg_type: undefined, session: undefined }
		});
		let msg = getMessage();
		// Then the value should be relayed
		assert.equal(msg.type, channel);
		assert.equal(msg.content.value, 'test');
		assert.equal(msg.metadata.value, 'test');
		assert.equal(msg.header.username, 'test');
		assert.equal(msg.parent_header.username, 'test');
	}
});
