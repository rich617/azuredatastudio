/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Command, ToolType, OsType } from '../../interfaces';
import * as nls from 'vscode-nls';
import { SemVer } from 'semver';
import { IPlatformService } from '../platformService';
import { dependencyType, ToolBase } from './toolBase';

const localize = nls.loadMessageBundle();

const defaultInstallationRoot = '/usr/local/bin';
export const KubeCtlToolName = 'kubectl';

export class KubeCtlTool extends ToolBase {
	constructor(platformService: IPlatformService) {
		super(platformService);
	}

	get name(): string {
		return KubeCtlToolName;
	}

	get description(): string {
		return localize('resourceDeployment.KubeCtlDescription', "A command-line tool allows you to run commands against Kubernetes clusters");
	}

	get type(): ToolType {
		return ToolType.KubeCtl;
	}

	get displayName(): string {
		return localize('resourceDeployment.KubeCtlDisplayName', "kubectl");
	}

	get homePage(): string {
		return 'https://kubernetes.io/docs/tasks/tools/install-kubectl';
	}

	protected getVersionFromOutput(output: string): SemVer | undefined {
		let version: SemVer | undefined = undefined;
		if (output) {
			const versionJson = JSON.parse(output);
			version = new SemVer(`${versionJson.clientVersion.major}.${versionJson.clientVersion.minor}.0`);
		}
		return version;
	}

	protected get versionCommand(): Command {
		return { command: 'kubectl version -o json --client' };
	}

	protected get discoveryCommand(): Command {
		return {
			command: this.discoveryCommandString('kubectl')
		};
	}

	get autoInstallSupported(): boolean {
		return true;
	}

	protected async getSearchPaths(): Promise<string[]> {
		switch (this.osType) {
			case OsType.win32:
				return [this.storagePath];
			default:
				return [defaultInstallationRoot];
		}
	}
	protected readonly allInstallationCommands: Map<OsType, Command[]> = new Map<OsType, Command[]>([
		[OsType.linux, linuxInstallationCommands],
		[OsType.win32, win32InstallationCommands],
		[OsType.darwin, macOsInstallationCommands],
		[OsType.others, defaultInstallationCommands]
	]);

	protected dependenciesByOsType: Map<OsType, dependencyType[]> = new Map<OsType, dependencyType[]>([
		[OsType.linux, []],
		[OsType.win32, []],
		[OsType.darwin, [dependencyType.Brew]],
		[OsType.others, [dependencyType.Curl]]
	]);
}

const macOsInstallationCommands = [
	{
		comment: localize('resourceDeployment.Kubectl.UpdatingBrewRepository', "updating your brew repository for kubectl installation …"),
		command: 'brew update'
	},
	{
		comment: localize('resourceDeployment.Kubectl.InstallingKubeCtl', "installing kubectl …"),
		command: 'brew install kubectl'
	}
];
const linuxInstallationCommands = [
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.AptGetUpdate', "updating repository information …"),
		command: 'apt-get update'
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.AptGetPackages', "getting packages needed for kubectl installation …"),
		command: 'apt-get install -y apt-transport-https'
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.DownloadAndInstallingSigningKey', "downloading and installing the signing key for kubectl …"),
		command: 'curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -'
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.AddingKubectlRepositoryInformation', "adding the kubectl repository information …"),
		command: 'echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list'
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.AptGetUpdate', "updating repository information …"),
		command: 'apt-get update'
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.InstallingKubectl', "installing kubectl …"),
		command: 'apt-get install -y kubectl'
	}
];
const win32InstallationCommands = [
	{
		comment: localize('resourceDeployment.Kubectl.DeletePreviousDownloadedKubectl.exe', "deleting previously downloaded kubectl.exe if one exists …"),
		command: 'IF EXIST .\\kubectl.exe DEL /F .\\kubectl.exe',
	},
	{
		comment: localize('resourceDeployment.Kubectl.DownloadingAndInstallingKubectl', "downloading and installing the latest kubectl.exe …"),
		command: `powershell -Command "& {$WebClient = New-Object System.Net.WebClient; $Version=$WebClient.DownloadString('https://storage.googleapis.com/kubernetes-release/release/stable.txt').Trim();Write-Output \\\"KubeCtl Version=$Version\\\";$Url=\\\"https://storage.googleapis.com/kubernetes-release/release/$Version/bin/windows/amd64/kubectl.exe\\\"; Write-Output \\\"Downloading file: $Url\\\"; $WebClient.DownloadFile($Url, 'kubectl.exe')}"`
	}
];
const defaultInstallationCommands = [
	{
		comment: localize('resourceDeployment.Kubectl.DeletePreviousDownloadedKubectl', "deleting previously downloaded kubectl if one exists …"),
		command: `[ -e ./kubectl ] && rm -f ./kubectl`,
	},
	{
		comment: localize('resourceDeployment.Kubectl.DownloadingKubectl', "downloading the latest kubectl release …"),
		command: 'curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl'
	},
	{
		comment: localize('resourceDeployment.Kubectl.MakingExecutable', "making kubectl executable …"),
		command: 'chmod +x ./kubectl',
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.CleaningUpOldBackups', "cleaning up any previously backed up version in the install location if they exist …"),
		command: '[ -e /usr/local/bin/kubectl] && [ -e /usr/local/bin/kubectl_movedByADS ] && rm -f /usr/local/bin/kubectl_movedByADS'
	},
	{
		sudo: true,
		comment: localize('resourceDeployment.Kubectl.BackupCurrentBinary', "backing up any existing kubectl in the install location …"),
		command: '[ -e /usr/local/bin/kubectl ] && mv /usr/local/bin/kubectl /usr/local/bin/kubectl_movedByADS'
	},
	{
		comment: localize('resourceDeployment.Kubectl.MoveToSystemPath', "moving kubectl into the install location in the PATH …"),
		sudo: true,
		command: 'mv ./kubectl /usr/local/bin/kubectl'
	}
];
