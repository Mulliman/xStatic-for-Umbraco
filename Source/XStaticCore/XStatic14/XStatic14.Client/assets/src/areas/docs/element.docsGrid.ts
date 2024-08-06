import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import DocsContext, { DOCS_CONTEXT_TOKEN } from './context.docs';

import { DocModel } from './element.doc';
import './element.doc';

@customElement('xstatic-docs-grid')
class DocsGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    plugins: Array<DocModel> | undefined;

    @state()
    docs: Array<DocModel> | undefined;

    #docsContext?: DocsContext;

    constructor() {
        super();

        this.consumeContext(
            DOCS_CONTEXT_TOKEN,
            (context) => {
                this.#docsContext = context;

                this.observe(this.#docsContext?.docs, (d) => {
                    this.docs = d;
                });

                this.observe(this.#docsContext?.plugins, (p) => {
                    this.plugins = p;
                    this.isLoaded = true;
                });
            }
        );
    }

    //#region Render

    render() {
        if (!this.plugins) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <h2>Documentation - <span>xStatic was built by Sam Mullins and you can read the xStatic documentation on his website.</span></h2>
            <div class="grid"> 
                ${this.#renderDocs()}
            </div>
            
            <h2 class="space">Plugins - <span>xStatic is extensible and plugins can be custom built or installed from NuGet. Below are all the plugins currently publicly registered.</span></h2>
            <div class="grid"> 
                ${this.#renderPlugins()}
            </div>
        `;
    }

    #renderDocs() {
        if (!this.docs) {
            return null;
        }

        var markup = html`${this.docs.map(x => html`<xstatic-doc-element .doc=${x}></xstatic-doc-element>`)}`;

        return html`
            ${markup}
        `;
    }

    #renderPlugins() {
        if (!this.plugins) {
            return null;
        }

        var pluginsMarkup = html`${this.plugins.map(x => html`<xstatic-doc-element .doc=${x}></xstatic-doc-element>`)}`;

        return html`
            ${pluginsMarkup}
        `;
    }

    // #endregion Render

    // #region Styles

    static styles = css`
        :host {
            
        }

        .grid{
            position: relative;
            display: grid;
            grid-gap: 20px;
            grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
            grid-auto-rows: 1fr
        }

        .grid > div{
            display: block;
            position: relative;
        }

        h2{
            margin-bottom: 2rem;
        }

        h2.space{
            margin-top: 4rem;
        }

        h2 > span {
            font-size: 0.8em;
            color: #666;
        }
    `;

    // #endregion Styles
}

export default DocsGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-docs-grid': DocsGrid
    }
}