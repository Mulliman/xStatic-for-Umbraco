import { css, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import { DeployerField } from '../api';
import XStaticPropertyEditorDynamicFormBase from './editor.dynamic-form';

@customElement('xstatic-property-editor-deployment-target')
export class XStaticPropertyEditorDeploymentTypeElement
    extends XStaticPropertyEditorDynamicFormBase<DeployerField> {

    mapToPropertyValueData(value: DeployerField[]): UmbPropertyValueData[] {
        return value.filter((f) => f.name).map((field) => {
            return {
                alias: field.alias,
                value: field.value
            } as UmbPropertyValueData;
        });
    }

    mapFromPropertyValueData(value: UmbPropertyValueData[]): DeployerField[] {
        return this.fields?.map((f) => ({
            alias: f.alias,
            name: f.name,
            value: value.find((x) => x.alias === f.alias)?.value,
            editorUiAlias: f.editorUiAlias
        } as DeployerField)) ?? [];
    }

	static override styles = [
		css`
            umb-property{
                --uui-size-layout-1: 10px;
            }

        .help{
            background: #eee;
            padding: 10px;
            margin-bottom: 10px;
            display: flex;
            flex-direction: row;
        }

        .help uui-icon{
            width:50px;
            margin-right: 10px;
        }
		`,
	];
}

export default XStaticPropertyEditorDeploymentTypeElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-deployment-target': XStaticPropertyEditorDeploymentTypeElement;
	}
}
