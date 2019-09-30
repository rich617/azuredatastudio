/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator, ServicesAccessor, IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { ConnectionShape, Connection } from 'sql/platform/connection/common/connection';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { assign } from 'vs/base/common/objects';
import { ConnectionStore } from 'sql/platform/connection/common/simpleConnectionStore';
import { Event } from 'vs/base/common/event';
import { Deferred } from 'sql/base/common/promise';
import { generateUuid } from 'vs/base/common/uuid';
import { ICapabilitiesService } from 'sql/platform/capabilities/common/capabilitiesService';
import { ICredentialsService } from 'sql/platform/credentials/common/credentialsService';

export interface ConnectOptions {
	/**
	 * Will attempt to find an existing connection that matches the given
	 * shape and return that if it exists.
	 */
	readonly useExisting?: boolean;
}

export interface ConnectionInfoSummary {

	/**
	 * URI identifying the owner of the connection
	 */
	ownerUri: string;

	/**
	 * connection id returned from service host.
	 */
	connectionId: string;

	/**
	 * any diagnostic messages return from the service host.
	 */
	messages: string;

	/**
	 * Error message returned from the engine, if any.
	 */
	errorMessage: string;

	/**
	 * Error number returned from the engine, if any.
	 */
	errorNumber: number;
}

const defaultConnectOptions = {
	useExisting: false
};

export interface ConnectionInfo {
	readonly options: { [name: string]: any };
}

export interface IConnectionProvider {
	connect(id: string, connectionInfo: ConnectionInfo): Promise<boolean>;
	disconnect(id: string): Promise<boolean>;
	cancelConnect(id: string): Promise<boolean>;
	onConnectionComplete: Event<string>;
}

export interface ISimpleConnectionService {
	_serviceBrand: undefined;
	/**
	 * Create a connection
	 * @param shape shape of the connection to return
	 * @param options options for creating the connection
	 */
	connect(shape: ConnectionShape, options?: ConnectOptions): Promise<Connection | undefined>;
	/**
	 * Called by the extension layer to register a connection provider extension
	 * @param id id of the provider
	 * @param provider the functionality of the provider
	 */
	registerProvider(id: string, provider: IConnectionProvider): void;

	/**
	 * DO NOT USE
	 */
	onConnectionComplete(info: ConnectionInfoSummary): void;
}

export const ISimpleConnectionService = createDecorator<ISimpleConnectionService>('simpleConnectionService');

export class SimpleConnectionService implements ISimpleConnectionService {
	_serviceBrand: undefined;

	private providers = new Map<string, IConnectionProvider>();
	private store = new ConnectionStore();

	// not ideal
	private connecting = new Map<string, Deferred<Connection | undefined>>();

	constructor(
		@IInstantiationService private readonly instantiation: IInstantiationService,
		@ICredentialsService private readonly credentials: ICredentialsService) { }

	async connect(shape: ConnectionShape, options: ConnectOptions = defaultConnectOptions): Promise<Connection | undefined> {
		options = assign(options, defaultConnectOptions);
		if (options.useExisting) {
			const connection = this.store.find(shape);
			if (connection) {
				return connection;
			}
		}
		if (!this.providers.has(shape.provider)) {
			throw new Error(`Provider ${shape.provider} not registered`);
		}
		return this.doConnect(shape);
	}

	private async doConnect(shape: ConnectionShape): Promise<Connection | undefined> {
		const id = generateUuid();
		const promise = new Deferred<Connection | undefined>();
		this.connecting.set(id, promise);
		if (!shape.password) {
			this.credentials.readCredential(shape.provider);
		}
		const info = this.instantiation.invokeFunction(shapeToInfo, shape);
		if (!info) {
			throw new Error('Failure to contact provider');
		}
		const res = await this.providers.get(shape.provider)!.connect(id, info);
		if (!res) {
			promise.resolve();
		}
		return promise.promise;
	}

	registerProvider(id: string, provider: IConnectionProvider): void {
		if (this.providers.has(id)) {
			throw new Error(`Provider ${id} already exists`); // TODO probably localize
		}
		this.providers.set(id, provider);
		provider.onConnectionComplete(this.handleConnectionComplete, this);
	}

	private handleConnectionComplete(id: string): void {
		if (this.connecting.has(id)) {
			this.connecting.get(id)!.resolve(new Connection(id));
		}
	}

	onConnectionComplete(info: ConnectionInfoSummary): void {
		if (info.errorMessage) {
			console.log('Connection error', info.errorMessage);
		}
		this.handleConnectionComplete(info.connectionId);
	}
}

registerSingleton(ISimpleConnectionService, SimpleConnectionService);

function shapeToInfo(accessor: ServicesAccessor, shape: ConnectionShape): ConnectionInfo | undefined{
	const capService = accessor.get(ICapabilitiesService);
	const features = capService.getCapabilities(shape.provider);
	if (features) {
		const info = {
			options: Object.create(null)
		};
		const options = features.connection.connectionOptions;
		let type = options.find(v => v.specialValueType === 'serverName');
		info.options[type.name] = shape.server;
		type = options.find(v => v.specialValueType === 'databaseName');
		info.options[type.name] = shape.database;
		type = options.find(v => v.specialValueType === 'userName');
		info.options[type.name] = shape.user;
		type = options.find(v => v.specialValueType === 'authType');
		info.options[type.name] = shape.auth;
		type = options.find(v => v.specialValueType === 'password');
		info.options[type.name] = shape.password;
		type = options.find(v => v.specialValueType === 'password');
		info.options[type.name] = shape.password;
		return info;
	}
	return undefined;
}
