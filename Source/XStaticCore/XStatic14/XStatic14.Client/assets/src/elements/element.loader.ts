import {
	css,
	customElement,
	html,
	property,
	state,
} from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { formatDuration } from '../code/datetime';

@customElement('xstatic-loader')
export class Loader extends UmbLitElement {

	@property({ type: Number, attribute: true })
	public estimatedTime: number = 10;

	@state()
	public progress: number = 1;

	@state()
	time: number = 0;

	#intervalId?: ReturnType<typeof setInterval>;

	constructor() {
		super();

		this.progress = 1;
	}

	override connectedCallback() {
		super.connectedCallback();

		if (this.#intervalId !== undefined) {
			clearInterval(this.#intervalId);
		}

		this.#intervalId = setInterval(() => {
			this.time++;
			if (this.estimatedTime > 0) {
				const progress = Math.round((this.time / this.estimatedTime) * 100);
				this.progress = Math.min(100, progress);
			}
		}, 1000);
	}

	override disconnectedCallback() {
		super.disconnectedCallback();

		if (this.#intervalId !== undefined) {
			clearInterval(this.#intervalId);
			this.#intervalId = undefined;
		}
	}

	override render() {
		return html`
			<div>
				<h3>${this.progress}%</h3>
				<uui-loader-bar progress=${this.progress}></uui-loader-bar>
				<div>${formatDuration(this.time)} of ${formatDuration(this.estimatedTime)}</div>
			</div>
		`;
	}

	static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
			text-align: center;
        }

        h3{
			padding-bottom: 0;
			margin-bottom: 0.2rem;
		}
    `;
}

export default Loader;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-loader': Loader;
	}
}