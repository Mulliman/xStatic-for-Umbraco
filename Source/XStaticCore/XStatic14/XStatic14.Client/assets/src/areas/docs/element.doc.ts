import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { when } from 'lit/directives/when.js';

export type DocModel = {
    heading: string;
    description: string;
    author: string;
    links: Array<{ href: string, text: string }>;
};

@customElement('xstatic-doc-element')
class DocElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    doc?: DocModel;

    constructor() {
        super();
    }

    render() {
        if (!this.doc) {
            return html``;
        }

        const doc = this.doc;

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${doc.heading}</div>
                
                <div style="position:relative; display: block">
                    <div>
                        <h3>${doc.description}</h3>
                        ${when(doc.author, () => (html`<h4>Author: <strong>${doc.author}</strong></h4>`))}

                        <div class="buttons">
                                ${doc.links?.map(link => html`<uui-button label=${link.text} href=${link.href} target="_blank" color=${link.text?.indexOf("Git") ? "positive" : "default"} look="primary"></uui-button>&nbsp;`)}
                        </div>
                        
                    </div>
                </div>
            </uui-box>
        `;
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        h3{
            margin: 0;
            font-weight: normal;
        }

        h4{
            margin: 0;
        }

        .buttons{
            text-align: center;
            margin-top: 1rem;
        }
    `;
}

export default DocElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-doc-element': DocElement
    }
}