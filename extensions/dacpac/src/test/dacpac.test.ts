/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import 'mocha';
import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import { isValidFilenameCharacter, sanitizeStringForFilename, isValidBasename } from '../wizard/api/utils';

const isWindows = os.platform() === 'win32';

describe('Sanitize database name for filename tests', function (): void {
	it('Should only validate if one character is passed', async () => {
		assert(!isValidFilenameCharacter(null));
		assert(!isValidFilenameCharacter(''));
		assert(!isValidFilenameCharacter('abc'));
		assert(isValidFilenameCharacter('c'));
	});

	it('Should determine invalid file name characters', async () => {
		// invalid for both Windows and non-Windows
		assert(!isValidFilenameCharacter('\\'));
		assert(!isValidFilenameCharacter('/'));
	});

	it('Should determine invalid Windows file name characters', async () => {
		// invalid only for Windows
		assert.equal(isValidFilenameCharacter('?'), isWindows ? false : true);
		assert.equal(isValidFilenameCharacter(':'), isWindows ? false : true);
		assert.equal(isValidFilenameCharacter('*'), isWindows ? false : true);
		assert.equal(isValidFilenameCharacter('<'), isWindows ? false : true);
		assert.equal(isValidFilenameCharacter('>'), isWindows ? false : true);
		assert.equal(isValidFilenameCharacter('|'), isWindows ? false : true);
		assert.equal(isValidFilenameCharacter('"'), isWindows ? false : true);
	});

	it('Should sanitize database name for filename', async () => {
		let invalidDbName = '"in|valid*<>db/?name';
		let expectedWindows = '_in_valid___db__name';
		let expectedNonWindows = '"in|valid*<>db_?name';
		let isWindows = os.platform() === 'win32';
		assert.equal(sanitizeStringForFilename(invalidDbName), isWindows ? expectedWindows : expectedNonWindows);
	});
});

describe('Check for invalid filename tests', function (): void {
	it('Should determine invalid filenames', async () => {
		// valid filename
		assert(isValidBasename(formatFileName('ValidName.dacpac')));

		// invalid for both Windows and non-Windows
		assert(!isValidBasename(formatFileName('	.dacpac')));
		assert(!isValidBasename(formatFileName(' .dacpac')));
		assert(!isValidBasename(formatFileName('  	.dacpac')));
		assert(!isValidBasename(formatFileName('..dacpac')));
		assert(!isValidBasename(formatFileName('...dacpac')));
		assert(!isValidBasename(null));
		assert(!isValidBasename(undefined));
		assert(!isValidBasename('\\'));
		assert(!isValidBasename('/'));

		// most file systems do not allow files > 255 length
		assert(!isValidBasename(formatFileName('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.dacpac')));
	});

	it('Should determine invalid Windows filenames', async () => {
		// invalid characters only for Windows
		assert.equal(isValidBasename(formatFileName('?.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName(':.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('*.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('<.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('>.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('|.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('".dacpac')), isWindows ? false : true);

		// Windows filenames cannot end with a whitespace
		assert.equal(isValidBasename(formatFileName('test   .dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('test	.dacpac')), isWindows ? false : true);
	});

	it('Should determine Windows forbidden filenames', async () => {
		// invalid only for Windows
		assert.equal(isValidBasename(formatFileName('CON.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('PRN.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('AUX.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('NUL.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM1.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM2.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM3.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM4.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM5.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM6.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM7.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM8.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('COM9.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT1.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT2.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT3.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT4.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT5.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT6.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT7.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT8.dacpac')), isWindows ? false : true);
		assert.equal(isValidBasename(formatFileName('LPT9.dacpac')), isWindows ? false : true);
	});
});

function formatFileName(filename: string): string {
	return path.join(os.tmpdir(), filename);
}
