

export type ConfigurableTypeModel = {
        id?: string | null
name?: string | null
fields?: Record<string, string | null> | null
    };

export type DeployerModel = {
        readonly id?: string | null
readonly name?: string | null
readonly help?: string | null
readonly fields?: Record<string, string | null> | null
    };

export type DeploymentTargetModel = {
        id?: string | null
name?: string | null
fields?: Record<string, string | null> | null
    };

export enum EventMessageTypeModel {
    DEFAULT = 'Default',
    INFO = 'Info',
    ERROR = 'Error',
    SUCCESS = 'Success',
    WARNING = 'Warning'
}

export type ExportTypeModel = {
        id: number
name?: string | null
generator?: TypeModel | null
transformerFactory?: TypeModel | null
fileNameGenerator?: TypeModel | null
    };

export type ExportTypeUpdateModel = {
        id: number
name?: string | null
transformerFactory?: string | null
generator?: string | null
fileNameGenerator?: string | null
    };

export type NotificationHeaderModel = {
        message: string
category: string
type: EventMessageTypeModel
    };

export type SiteApiModel = {
        id: number
name?: string | null
autoPublish: boolean
rootNode: string
mediaRootNodes?: Array<string> | null
exportFormat: number
lastRun?: string | null
lastBuildDurationInSeconds?: number | null
lastDeployed?: string | null
lastDeployDurationInSeconds?: number | null
assetPaths?: string | null
targetHostname?: string | null
imageCrops?: string | null
deploymentTarget?: DeploymentTargetModel | null
postGenerationActionIds?: Array<number> | null
rootPath?: string | null
exportTypeName?: string | null
folderSize?: string | null
    };

export type SiteUpdateModel = {
        id: number
name?: string | null
autoPublish: boolean
rootNode: string
mediaRootNodes?: Array<string> | null
exportFormat: number
assetPaths?: string | null
targetHostname?: string | null
imageCrops?: string | null
deploymentTarget?: DeploymentTargetModel | null
postGenerationActionIds?: Array<number> | null
    };

export type TypeModel = {
        id?: string | null
name?: string | null
    };

export type XStaticConfig = {
        deployers?: Array<DeployerModel> | null
exportTypes?: Array<ExportTypeModel> | null
generators?: Array<TypeModel> | null
transformerFactories?: Array<TypeModel> | null
fileNameGenerators?: Array<TypeModel> | null
postGenerationActions?: Array<ConfigurableTypeModel> | null
    };

export type V1Data = {
        
        payloads: {
            PostApiV1XstaticConfigCreateExportType: {
                        requestBody?: ExportTypeUpdateModel
                        
                    };
DeleteApiV1XstaticConfigDeleteExportType: {
                        id?: number
                        
                    };
PostApiV1XstaticConfigUpdateExportType: {
                        requestBody?: ExportTypeUpdateModel
                        
                    };
DeleteApiV1XstaticSitesClearStoredSite: {
                        staticSiteId?: number
                        
                    };
PostApiV1XstaticSitesCreate: {
                        requestBody?: SiteUpdateModel
                        
                    };
DeleteApiV1XstaticSitesDelete: {
                        staticSiteId?: number
                        
                    };
PostApiV1XstaticSitesUpdate: {
                        requestBody?: SiteUpdateModel
                        
                    };
        }
        
        
        responses: {
            PostApiV1XstaticConfigCreateExportType: ExportTypeModel
                ,DeleteApiV1XstaticConfigDeleteExportType: string
                ,GetApiV1XstaticConfigGetConfig: XStaticConfig
                ,PostApiV1XstaticConfigUpdateExportType: ExportTypeModel
                ,DeleteApiV1XstaticSitesClearStoredSite: Array<SiteApiModel>
                ,PostApiV1XstaticSitesCreate: SiteApiModel
                ,DeleteApiV1XstaticSitesDelete: string
                ,GetApiV1XstaticSitesGetAll: Array<SiteApiModel>
                ,PostApiV1XstaticSitesUpdate: SiteApiModel
                
        }
        
    }