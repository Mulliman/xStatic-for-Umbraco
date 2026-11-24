import { css, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import { DeployerField } from '../api';
import { toApiFieldValue, toEditorValue } from '../code/field-value-converter';
import XStaticPropertyEditorDynamicFormBase from './editor.dynamic-form';

@customElement('xstatic-property-editor-deployment-target')
export class XStaticPropertyEditorDeploymentTypeElement
    extends XStaticPropertyEditorDynamicFormBase<DeployerField> {

    mapToPropertyValueData(value: DeployerField[]): UmbPropertyValueData[] {
        return value.filter((f) => f.name).map((field) => {
            return {
                alias: field.alias,
                value: toEditorValue(field.value, field.editorUiAlias)
            } as UmbPropertyValueData;
        });
    }

    mapFromPropertyValueData(value: UmbPropertyValueData[]): DeployerField[] {
        return this.fields?.map((f) => ({
            alias: f.alias,
            name: f.name,
            help: f.help,
            value: toApiFieldValue(value.find((x) => x.alias === f.alias)?.value),
            editorUiAlias: f.editorUiAlias
        } as DeployerField)) ?? [];
    }

	static override styles = [
		css`
			.help {
				display: flex;
				flex-direction: row;
				gap: var(--uui-size-space-4);
				padding: var(--uui-size-space-4);
				margin-bottom: var(--uui-size-space-4);
				background: var(--uui-color-surface-alt);
				border-radius: var(--uui-border-radius);
			}

			.help uui-icon {
				flex: 0 0 auto;
				font-size: var(--uui-size-8);
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
