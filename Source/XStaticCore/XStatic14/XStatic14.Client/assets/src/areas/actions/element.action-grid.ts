import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { ACTION_CONTEXT_TOKEN } from './context.action';

import "./element.action";
import "./element.new-action";
import "../../elements/element.dashboard-grid";

import { ActionModel } from '../../api';

@customElement('xstatic-action-grid')
class ActionGrid extends UmbLitElement {

    @state()
    isLoaded = false;

    @state()
    actions?: Array<ActionModel>;

    constructor() {
        super();

        this.consumeContext(ACTION_CONTEXT_TOKEN, (context) => {
            this.observe(context?.actions, (x) => {
                this.actions = x;
                this.isLoaded = true;
            }, '_observeActions');
        });
    }

    render() {
        if (!this.actions) {
            return this.isLoaded ? html`` : html`<uui-loader-bar></uui-loader-bar>`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-action-element slot="info"></xstatic-new-action-element>
                <div slot="grid">${this.actions.map((x) => html`<xstatic-action-element .action=${x}></xstatic-action-element>`)}</div>
            </xstatic-dashboard-grid>
        `;
    }
}

export default ActionGrid;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-action-grid': ActionGrid
    }
}
