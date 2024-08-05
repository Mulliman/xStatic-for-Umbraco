import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import ActionContext, { ACTION_CONTEXT_TOKEN } from './context.action';

import "./element.action";
import "./element.newAction";

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
            <xstatic-new-action-element></xstatic-new-action-element>
            ${this.#renderTypes()}
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

    
    static styles = css`
        :host {
            position: relative;
            display: grid;
            grid-gap: 20px;
            grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
            grid-auto-rows: 1fr
        }

        :host > div{
            display: block;
            position: relative;
        }
    `;
}

export default ActionGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-action-grid': ActionGrid
    }
}