import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { ExportTypeModel, ExportTypeUpdateModel, V1Service } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";
import ConfigContextBase from "../../ConfigContextBase";

export class ExportTypeContext extends ConfigContextBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(EXPORT_TYPE_CONTEXT_TOKEN, this);
    }

    public async createExportType(exportType: ExportTypeUpdateModel) : Promise<ExportTypeModel | null> {
        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticConfigCreateExportType({ requestBody: exportType }));

        if(data){
            await this.getConfig();

            return data;
        }

        return null;
    }

    public async updateExportType(exportType: ExportTypeUpdateModel) : Promise<ExportTypeModel | null> {
        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticConfigUpdateExportType({ requestBody: exportType }));

        if(data){
            await this.getConfig();

            return data;
        }

        return null;
    }

    public async deleteExportType(id: number) : Promise<void> {
        await umbConfirmModal(this, {
            color: 'danger',
            headline: 'Delete Export Type',
            content: 'Are you sure you want to delete this Export Type?',
            confirmLabel: 'Delete',
        });

        await tryExecuteAndNotify(this, V1Service.deleteApiV1XstaticConfigDeleteExportType({ id : id } ));
        await this.getConfig();
    }
}

export default ExportTypeContext;

export const EXPORT_TYPE_CONTEXT_TOKEN = new UmbContextToken<ExportTypeContext>("xStatic.ExportTypeContext");