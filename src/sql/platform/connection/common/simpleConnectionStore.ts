/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ConnectionShape, Connection } from 'sql/platform/connection/common/connection';
import { NotImplementedError } from 'vs/base/common/errors';

export class ConnectionStore {
	find(shape: ConnectionShape): Connection | undefined {
		throw new NotImplementedError();
	}
}
