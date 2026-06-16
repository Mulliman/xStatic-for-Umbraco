import { UmbDataSourceResponse } from "@umbraco-cms/backoffice/repository";
import { TimedashboardService } from "../../api/index.js";


export interface TimeDataSource {
    getTime(): Promise<UmbDataSourceResponse<string>>;
    getDate(): Promise<UmbDataSourceResponse<string>>;
}

export class TimeManagementDataSource implements TimeDataSource {

    async getTime(): Promise<UmbDataSourceResponse<string>> {
        const { data, error } = await TimedashboardService.getTime();
        if (error) {
            const err = new Error(String(error));
            return { error: err };
        }
        return { data: data as string };
    }

    async getDate(): Promise<UmbDataSourceResponse<string>> {
        const { data, error } = await TimedashboardService.getDate();
        if (error) {
            const err = new Error(String(error));
            return { error: err };
        }
        return { data: data as string };
    }
}
