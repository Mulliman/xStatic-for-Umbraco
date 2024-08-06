import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';

import type {
    xStaticTableColumn,
    xStaticTableConfig,
    xStaticTableItem,
  } from "../../elements/element.siteTable";

import "../../elements/element.siteTable";

@customElement('xstatic-config-section-element')
class ConfigSectionElement extends UmbElementMixin(LitElement) {

    @property({ type: String, attribute: true })
    heading?: string;

    @property({ type: String, attribute: true })
    description?: string;

    @property({ type: Array, attribute: false })
    values?: string[];

    @property({ type: String, attribute: true })
    icon?: string;

    @state()
    private _tableConfig: xStaticTableConfig = {
    };

    @state()
    private _tableColumns: Array<xStaticTableColumn> = [ { alias: "value", name: "Details" } ];

    constructor() {
        super();
    }

    render() {
        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${this.heading}</div>
                
                <div style="position:relative; display: block">
                    <div class="desc">
                        ${this.description}
                    </div>
                    <div>
                        <h4>Installed Components:</h4>
                        <xstatic-site-table .items=${this.#getTable()} .config=${this._tableConfig} .columns=${this._tableColumns} ></xstatic-site-table>
                    </div>
                </div>
            </uui-box>
        `;
    }

    #addTableItem(array: Array<xStaticTableItem>, id: string, icon: string, alias: string, value: any) {
        if(!id || !alias || !value) {
            return;
        }

        const item = {
            id: id,
            icon: icon,
            data: [
            {
                columnAlias: alias,
                value: value
            }]
        };

        array.push(item);
    }

    #getTable() : Array<xStaticTableItem> {
        let array : Array<xStaticTableItem> = [];

        this.values?.forEach((value, i) => {
            this.#addTableItem(array, `${value}-${i}`, this.icon || "icon-untitled", "value", value);
        });

        return array;
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        .desc{
            margin-bottom: 1rem;
            font-size: 1rem;;
        }

        .components{
            margin-bottom: 1rem;
            font-size: 1rem;;
        }
    `;
}

export default ConfigSectionElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-config-section-element': ConfigSectionElement
    }
}