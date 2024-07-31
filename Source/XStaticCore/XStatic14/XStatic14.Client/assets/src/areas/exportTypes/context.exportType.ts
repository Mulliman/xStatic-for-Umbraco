import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { Observable, UmbArrayState, UmbObjectState } from "@umbraco-cms/backoffice/observable-api";
import { tryExecuteAndNotify } from '@umbraco-cms/backoffice/resources'
import { ExportTypeModel, ExportTypeUpdateModel, V1Service, XStaticConfig } from "../../api";
import { umbConfirmModal } from "@umbraco-cms/backoffice/modal";

export class ExportTypeContext extends UmbControllerBase {
    constructor(host: UmbControllerHost) {
        super(host);

        this.provideContext(EXPORT_TYPE_CONTEXT_TOKEN, this);
    }

    #config = new UmbObjectState<XStaticConfig>({} as XStaticConfig);
    public readonly config : Observable<XStaticConfig> = this.#config.asObservable();

    #exportTypes = new UmbArrayState<ExportTypeModel>([], (x) => x.id);
    public readonly exportTypes : Observable<ExportTypeModel[]> = this.#exportTypes.asObservable();

    public async getConfig() {
        console.log('fetching sites proper');

        const { data } = await tryExecuteAndNotify(this, V1Service.getApiV1XstaticConfigGetConfig());

        if(data){
            this.#config.setValue(data);
        }

        if(data?.exportTypes){
            this.#exportTypes.setValue(data.exportTypes);
        }
    }

    public async createExportType(exportType: ExportTypeUpdateModel) : Promise<ExportTypeModel | null> {
        console.log('creating exportType', exportType);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticConfigCreateExportType({ requestBody: exportType }));

        if(data){
            await this.getConfig();

            return data;
        }

        return null;
    }

    public async updateExportType(exportType: ExportTypeUpdateModel) : Promise<ExportTypeModel | null> {
        console.log('updating exportType', exportType);

        const { data } = await tryExecuteAndNotify(this, V1Service.postApiV1XstaticConfigUpdateExportType({ requestBody: exportType }));

        if(data){
            await this.getConfig();

            return data;
        }

        return null;
    }

    public async deleteExportType(id: number) : Promise<void> {
        console.log('deleting exportType', id);

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

export const EXPORT_TYPE_CONTEXT_TOKEN = new UmbContextToken<ExportTypeContext>(ExportTypeContext.name);