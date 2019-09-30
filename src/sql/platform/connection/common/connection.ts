/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IConnectionProfile } from 'sql/platform/connection/common/interfaces';
import { sqlLogin } from 'sql/platform/connection/common/constants';

export enum AuthType {
	Login,
	Integrated
}

export interface ConnectionShape {
	database?: string;
	server: string;
	user: string;
	auth: AuthType;
	password?: string;
	provider: string;
}

export class Connection {
	constructor(public readonly id: string) { }

	disconnect(): Promise<boolean> {
		return Promise.resolve(true);
	}
}

export function profileToConnectionShape(profile: IConnectionProfile): ConnectionShape {
	const server = profile.serverName;
	const database = profile.databaseName;
	const user = profile.userName;
	const password = profile.password;
	const provider = profile.providerName;
	const auth = profile.authenticationType === sqlLogin ? AuthType.Login : AuthType.Integrated;

	return { server, database, user, password, provider, auth };
}
