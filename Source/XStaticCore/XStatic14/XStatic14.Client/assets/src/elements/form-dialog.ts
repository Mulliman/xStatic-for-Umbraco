import { html, ifDefined, repeat } from '@umbraco-cms/backoffice/external/lit';
import type { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import type { XStaticFormErrors, XStaticFormProperty } from '../code/form';

import './element.validation-error';

export interface FormDialogOptions {
	headline: string;
	properties: ReadonlyArray<XStaticFormProperty>;
	values: Array<UmbPropertyValueData>;
	/** Errors to show next to each property, or `undefined` to show none (before the first submit). */
	errors?: XStaticFormErrors;
	submitLabel: string;
	onChange: (e: Event) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

/**
 * The layout shared by the xStatic create/edit sidebars: a box of `<umb-property>` elements inside an
 * `<umb-property-dataset>`, with Cancel and Submit buttons in the actions slot.
 */
export function renderFormDialog(options: FormDialogOptions) {
	return html`
		<umb-body-layout .headline=${options.headline}>
			<uui-box>
				<umb-property-dataset .value=${options.values} @change=${options.onChange}>
					${repeat(
						options.properties,
						(prop) => prop.alias,
						(prop) => html`
							<xstatic-validation-error-wrapper errorMessage=${ifDefined(options.errors?.get(prop.alias))}>
								<umb-property
									alias=${prop.alias}
									data-test-alias=${prop.alias}
									label=${prop.label}
									.description=${prop.description}
									property-editor-ui-alias=${prop.propertyEditorUiAlias}
									.config=${prop.config}
								></umb-property>
							</xstatic-validation-error-wrapper>
						`,
					)}
				</umb-property-dataset>
			</uui-box>

			<div slot="actions">
				<uui-button id="cancel" label="Cancel" data-test-id="dialog-cancel" @click=${options.onCancel}>Cancel</uui-button>
				<uui-button
					id="submit"
					color="positive"
					look="primary"
					label=${options.submitLabel}
					data-test-id="dialog-submit"
					@click=${options.onSubmit}
				></uui-button>
			</div>
		</umb-body-layout>
	`;
}
