import { describe, expect, it } from 'vitest';
import type { DeploymentTargetModel, XStaticConfig } from '../../api';
import {
	buildDeploymentTargetCreatorFormProperties,
	buildDeploymentTargetFormProperties,
	getDeployerFields,
	mapDeploymentTargetToFormValues,
	mapDeploymentTargetToUpdateModel,
	mapFormValuesToCreatorPost,
	mapFormValuesToDeploymentTargetUpdate,
	validateCreatorPost,
	validateDeploymentTargetUpdate,
} from './deployment-target-form';

const ftp = {
	id: 'ftp',
	name: 'FTP',
	help: 'Deploys over FTP.',
	fields: [
		{ alias: 'host', name: 'Host', value: null },
		{ alias: 'password', name: 'Password', value: null, editorUiAlias: 'xstatic.propertyEditorUi.password' },
	],
};
const config = { deployers: [ftp], deploymentTargetCreators: [{ ...ftp, id: 'ftp-creator' }] } as XStaticConfig;

describe('deployment target form', () => {
	it('maps a saved target to form values and an update model keyed by alias', () => {
		const target: DeploymentTargetModel = {
			id: 2,
			name: 'Live',
			deployerDefinition: 'ftp',
			fields: [
				{ alias: 'host', name: 'Host', value: 'ftp.example.com' },
				{ alias: 'password', name: 'Password', value: 'secret' },
			],
		};

		expect(mapDeploymentTargetToUpdateModel(target)).toEqual({
			id: 2,
			name: 'Live',
			deployerDefinition: 'ftp',
			fields: { host: 'ftp.example.com', password: 'secret' },
		});
		expect(mapFormValuesToDeploymentTargetUpdate(mapDeploymentTargetToFormValues(target), 2)).toEqual(
			mapDeploymentTargetToUpdateModel(target),
		);
	});

	it('keeps typed fields while they match the deployer, otherwise uses the deployer fields', () => {
		const typed = [
			{ alias: 'host', name: 'Host', value: 'ftp.example.com' },
			{ alias: 'password', name: 'Password', value: 'secret' },
		];

		expect(getDeployerFields([{ alias: 'fields', value: typed }], ftp)).toBe(typed);
		expect(getDeployerFields([{ alias: 'fields', value: [{ alias: 'token' }] }], ftp)).toBe(ftp.fields);
		expect(getDeployerFields([], undefined)).toBeUndefined();
	});

	it('passes the deployer fields and help to the configuration editor', () => {
		const properties = buildDeploymentTargetFormProperties(config, [{ alias: 'deployerDefinition', value: ['ftp'] }]);
		const fieldsConfig = properties.find((p) => p.alias === 'fields')?.config;

		expect(properties.map((p) => p.alias)).toEqual(['name', 'deployerDefinition', 'fields']);
		expect(fieldsConfig).toEqual([
			{ alias: 'fields', value: ftp.fields },
			{ alias: 'help', value: 'Deploys over FTP.' },
		]);
	});

	it('requires a name and a deployer', () => {
		expect([...validateDeploymentTargetUpdate(mapFormValuesToDeploymentTargetUpdate([], undefined)).keys()]).toEqual([
			'name',
			'deployerDefinition',
		]);
	});
});

describe('deployment target creator form', () => {
	it('builds the creator properties and post model', () => {
		const values = [
			{ alias: 'name', value: 'Auto' },
			{ alias: 'creator', value: ['ftp-creator'] },
			{ alias: 'fields', value: [{ alias: 'host', name: 'Host', value: 'ftp.example.com' }] },
		];

		expect(buildDeploymentTargetCreatorFormProperties(config, values).map((p) => p.alias)).toEqual([
			'name',
			'creator',
			'fields',
		]);
		expect(mapFormValuesToCreatorPost(values)).toEqual({
			name: 'Auto',
			creator: 'ftp-creator',
			fields: { host: 'ftp.example.com' },
		});
	});

	it('requires a name and a creator', () => {
		expect([...validateCreatorPost(mapFormValuesToCreatorPost([])).keys()]).toEqual(['name', 'creator']);
	});
});
