import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UMB_PROPERTY_DATASET_CONTEXT } from "@umbraco-cms/backoffice/property";

@customElement('time-workspace-settings-view')
export class TimeSettingsWorkspaceElement extends UmbElementMixin(LitElement) {

    constructor() {
        super();

        this.consumeContext(UMB_PROPERTY_DATASET_CONTEXT, async (context) => {
            if (!context) return;
            this.observe(
                await context.propertyValueByAlias('textProperty'),
                (value) => {
                    console.log(value);
                },
                'observetextProperty',
            );
        });

    }


    @state()
    setting = 'Hello';

    render() {
        return html`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="settings view">

                    Something...

                    <umb-property
                        label="Icon picker"
                        description="pick an icon"
                        alias="setting"
                        property-editor-ui-alias="Umb.PropertyEditorUi.TextBox"></umb-property>

                        <pre>${this.setting}</pre>
                </uui-box>
            </umb-body-layout>
        `
    }

}

export default TimeSettingsWorkspaceElement;

declare global {
    interface HTMLElementTagNameMap {
        'time-workspace-settings-view': TimeSettingsWorkspaceElement
    }
}
