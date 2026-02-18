import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { UmbBooleanState, UmbStringState } from "@umbraco-cms/backoffice/observable-api";

import { TimeManagementRepository } from "../repository/time.repository.js";

/**
 * Context for managing time-related data and polling state.
 */
export class TimeManagementContext extends UmbControllerBase {

    #repository: TimeManagementRepository;

    #time = new UmbStringState("unknown");
    public readonly time = this.#time.asObservable();

    #date = new UmbStringState("unknown");
    public readonly date = this.#date.asObservable();

    #intervalId: ReturnType<typeof setInterval> | null = null;

    #polling = new UmbBooleanState(false);
    public readonly polling = this.#polling.asObservable();

    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(TIME_MANAGEMENT_CONTEXT_TOKEN, this);
        this.#repository = new TimeManagementRepository(this);
    }

    async getTime() {
        const { data } = await this.#repository.getTime();

        if (data) {
            this.#time.setValue(data);
        }
    }

    async getDate() {
        const { data } = await this.#repository.getDate();

        if (data) {
            this.#date.setValue(data);
        }
    }

    async getDateAndTime() {
        await Promise.all([this.getTime(), this.getDate()]);
    }

    togglePolling() {
        const isEnabled = !this.#polling.getValue();
        this.#polling.setValue(isEnabled);

        if (isEnabled) {
            this.#intervalId = setInterval(() => {
                this.getDateAndTime();
            }, 750);
            return;
        }

        if (this.#intervalId !== null) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }
    }

    override destroy() {
        // Clean up polling interval
        if (this.#intervalId !== null) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }

        // Clean up states
        this.#time.destroy();
        this.#date.destroy();
        this.#polling.destroy();

        super.destroy();
    }
}

export default TimeManagementContext;

export const TIME_MANAGEMENT_CONTEXT_TOKEN =
    new UmbContextToken<TimeManagementContext>('TimeDashboard.Context.TimeManagement');

export const api = TimeManagementContext;
