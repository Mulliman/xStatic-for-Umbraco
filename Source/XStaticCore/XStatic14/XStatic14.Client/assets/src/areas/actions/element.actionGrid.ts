import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import ActionContext, { ACTION_CONTEXT_TOKEN } from './context.action';

import "./element.action";
import "./element.newAction";
import "../../elements/element.dashboardGrid";

import { ExportTypeModel } from '../../api';

@customElement('xstatic-action-grid')
class ActionGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    actions?: Array<ExportTypeModel>;

    #actionContext?: ActionContext;

    constructor() {
        super();

        this.consumeContext(
            ACTION_CONTEXT_TOKEN,
            (context) => {
                this.#actionContext = context;

                this.observe(this.#actionContext?.actions, (x) => {
                    this.actions = x;

                    this.isLoaded = true;
                });
            }
        );
    }

    render() {
        if (!this.actions) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-action-element slot="info"></xstatic-new-action-element>
                <div slot="grid">${this.#renderTypes()}</div>
            </xstatic-dashboard-grid>
        `;
    }

    #renderTypes() {
        if (!this.actions) {
            return null;
        }

        return this.actions.map(x => {
            return html`
                <xstatic-action-element .action=${x}></xstatic-action-element>
            `
        });
    }
}

export default ActionGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-action-grid': ActionGrid
    }
}