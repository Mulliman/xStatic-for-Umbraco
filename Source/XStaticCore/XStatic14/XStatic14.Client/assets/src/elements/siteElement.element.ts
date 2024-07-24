import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { when } from 'lit/directives/when.js';
import type {
    UmbTableColumn,
    UmbTableConfig,
    UmbTableItem,
  } from "@umbraco-cms/backoffice/components";
import { SiteApiModel } from '../api';

@customElement('xstatic-site-element')
class SiteElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    site?: SiteApiModel;

    @state()
    private _tableConfig: UmbTableConfig = {
        allowSelection: false
    };

    @state()
    private _tableColumns: Array<UmbTableColumn> = [ { alias: "value", name: "Details" } ];

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        :host .badge{
            display: block;
            position: relative;
            text-align: center;
            width: 100%;
        }

        .buttons {
            text-align: center;
            margin-top: 20px;
        }
    `;

    getSiteTable() : Array<UmbTableItem> {

        let lastGen = this.site?.lastRun 
            ?  `Last generated on ${this.site?.lastRun} at ${this.site.lastRun}`
            : "This site has never been built.";

        let lastDeployed = this.site?.lastDeployed 
            ?  `Last deployed on ${this.site?.lastDeployed} at ${this.site.lastDeployed}`
            : "This site has never been deployed.";

        let autoDeployBadge = this.site?.autoPublish
            ? html`<span style="color: green; font-weight: bold;">Auto Publish On</span>`
            : html`Manual Deploy`;

        return [
            {
                id: "rootPath",
                icon: "icon-home",
                data: [
                {
                    columnAlias: "value",
                    value: this.site?.rootPath
                }]
            },
            {
                id: "exportType",
                icon: "icon-brackets",
                data: [
                {
                    columnAlias: "value",
                    value: "Exports as " + this.site?.exportTypeName
                }]
            },
            {
                id: "autoDeploy",
                icon: "icon-settings",
                data: [
                {
                    columnAlias: "value",
                    value: autoDeployBadge,
                }]
            },
            {
                id: "lastGen",
                icon: "icon-time",
                data: [
                {
                    columnAlias: "value",
                    value: lastGen
                }]
            },
            {
                id: "lastDeployed",
                icon: "icon-umb-deploy",
                data: [
                {
                    columnAlias: "value",
                    value: lastDeployed
                }]
            },
            {
                id: "folder",
                icon: "icon-folder",
                data: [
                {
                    columnAlias: "value",
                    value: "Size: " + this.site?.folderSize
                }]
            },
        ];
    }

    render() {
        console.log('rendering site', this.site);

        if (!this.site) {
            return html``;
        }

        const site = this.site;

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${site.name}</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Edit" color="warning" look="primary"><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button pristine="" label="Delete" color="danger" look="primary"><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        
                    </div>
                    <div>
                        <umb-table .items=${this.getSiteTable()} .config=${this._tableConfig} .columns=${this._tableColumns} ></umb-table>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            ${when(this.site.exportTypeName, () => html`<uui-button label="Generate" color="positive" look="primary" icon="icon-brush"></uui-button>`)}
                            ${when(this.site.deploymentTarget, () => html`<uui-button label="Deploy" color="danger" look="primary" icon="icon-upload">Deploy</uui-button>`)}
                            ${when(this.site.lastRun && this.site.folderSize != '0B', () => html`<uui-button label="Download" color="default" look="secondary" icon="icon-settings"></uui-button>`)}
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }
}

export default SiteElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-site-element': SiteElement
    }
}