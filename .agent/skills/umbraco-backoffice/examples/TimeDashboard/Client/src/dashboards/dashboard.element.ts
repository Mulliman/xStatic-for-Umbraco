import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type { TimeManagementContext } from "../contexts/time.context.js";
import { TIME_MANAGEMENT_CONTEXT_TOKEN } from "../contexts/time.context.js";

@customElement('time-dashboard-element')
export class TimeDashboardElement extends UmbLitElement {

    #timeContext?: TimeManagementContext;

    @state()
    private _time?: string;

    @state()
    private _date?: string;

    @state()
    private _isPolling = false;

    constructor() {
        super();

        this.consumeContext(TIME_MANAGEMENT_CONTEXT_TOKEN, (instance) => {
            if (!instance) return;
            this.#timeContext = instance;

            // Initial data fetch
            instance.getDateAndTime();

            this.observe(instance.time, (time) => {
                this._time = time;
            });

            this.observe(instance.date, (date) => {
                this._date = date;
            });

            this.observe(instance.polling, (polling) => {
                this._isPolling = polling;
            });
        });
    }

    #handleGetTime = async () => {
        await this.#timeContext?.getTime();
    };

    #handleGetDate = async () => {
        await this.#timeContext?.getDate();
    };

    #handleToggle = () => {
        this.#timeContext?.togglePolling();
    };

    override render() {
        return html`
            <uui-box headline="${this.localize.term('time_name')}">
                <div slot="header">
                    <umb-localize key="time_description"></umb-localize>
                </div>
                <div class="time-box">
                  <h2>${this._time}</h2>
                  <uui-button
                    .disabled=${this._isPolling}
                    @click=${this.#handleGetTime} look="primary" color="positive" label="get time"></uui-button>
                </div>

                <div class="time-box">
                  <h2>${this._date}</h2>
                  <uui-button
                    .disabled=${this._isPolling}
                    @click=${this.#handleGetDate} look="primary" color="default" label="get date"></uui-button>
                </div>

                <div>
                    <uui-toggle label="update"
                        .checked="${this._isPolling}"
                        @change=${this.#handleToggle}>automatically update</uui-toggle>
                </div>
            </uui-box>
        `;
    }

    static override styles = css`
        :host {
            display: block;
            padding: 20px;
        }

        .time-box {
            display: flex;
            margin-bottom: 10px;
            justify-content: space-between;
        }
    `;
}

export default TimeDashboardElement;

declare global {
    interface HTMLElementTagNameMap {
        'time-dashboard-element': TimeDashboardElement;
    }
}
