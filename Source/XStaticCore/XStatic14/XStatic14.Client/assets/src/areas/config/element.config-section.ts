import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import type { xStaticTableItem } from "../../elements/element.site-table";
import { DETAILS_COLUMNS, toDetailItems } from '../../code/table-items';
import { xStaticCardStyles } from '../../code/styles';

import "../../elements/element.site-table";

@customElement('xstatic-config-section-element')
class ConfigSectionElement extends UmbLitElement {

    @property({ type: String, attribute: true })
    heading?: string;

    @property({ type: String, attribute: true })
    description?: string;

    @property({ type: Array, attribute: false })
    values?: string[];

    @property({ type: String, attribute: true })
    icon?: string;

    render() {
        return html`
            <uui-box data-test-id="config-section">
                <div slot="headline" class="headline">${this.heading}</div>

                <div class="card-body">
                    <div class="desc">${this.description}</div>
                    <h4>Installed Components:</h4>
                    <xstatic-site-table .items=${this.#getTable()} .columns=${DETAILS_COLUMNS}></xstatic-site-table>
                </div>
            </uui-box>
        `;
    }

    #getTable() : Array<xStaticTableItem> {
        return toDetailItems((this.values ?? []).map((value, i) => ({
            id: `${value}-${i}`,
            icon: this.icon || "icon-untitled",
            value,
        })));
    }

    static styles = [
        xStaticCardStyles,
        css`
            .desc {
                margin-bottom: var(--uui-size-space-4);
            }
        `,
    ];
}

export default ConfigSectionElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-config-section-element': ConfigSectionElement
    }
}
