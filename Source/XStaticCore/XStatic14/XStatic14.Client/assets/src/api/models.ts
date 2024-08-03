

export type ActionModel = {
        id: number
name?: string | null
type?: ConfigurableTypeModel | null
    };

export type ActionUpdateModel = {
        id: number
name?: string | null
type?: string | null
config?: Record<string, string | null> | null
    };

export type ConfigurableTypeModel = {
        id?: string | null
name?: string | null
fields?: Record<string, string | null> | null
    };

export type DeployerField = {
        name?: string | null
value?: string | null
help?: string | null
editorUiAlias?: string | null
    };

export type DeployerModel = {
        readonly id?: string | null
readonly name?: string | null
readonly help?: string | null
readonly fields?: Array<DeployerField> | null
    };

export type DeploymentTargetModel = {
        readonly id: number
readonly name?: string | null
readonly deployerDefinition?: string | null
readonly help?: string | null
readonly fields?: Array<DeployerField> | null
    };

export type DeploymentTargetUpdateModel = {
        readonly id: number
name?: string | null
readonly deployerDefinition?: string | null
readonly fields?: Record<string, string | null> | null
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
deploymentTarget?: number | null
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
deploymentTarget?: number | null
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
            PostApiV1XstaticActionsCreatePostAction: {
                        requestBody?: ActionUpdateModel
                        
                    };
DeleteApiV1XstaticActionsDeletePostAction: {
                        id?: number
                        
                    };
PostApiV1XstaticActionsUpdatePostAction: {
                        requestBody?: ActionUpdateModel
                        
                    };
PostApiV1XstaticConfigCreateExportType: {
                        requestBody?: ExportTypeUpdateModel
                        
                    };
DeleteApiV1XstaticConfigDeleteExportType: {
                        id?: number
                        
                    };
PostApiV1XstaticConfigUpdateExportType: {
                        requestBody?: ExportTypeUpdateModel
                        
                    };
PostApiV1XstaticDeploymentTargetsCreateDeploymentTarget: {
                        requestBody?: DeploymentTargetUpdateModel
                        
                    };
DeleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget: {
                        id?: number
                        
                    };
PostApiV1XstaticDeploymentTargetsUpdateDeploymentTarget: {
                        requestBody?: DeploymentTargetUpdateModel
                        
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
            PostApiV1XstaticActionsCreatePostAction: ActionModel
                ,DeleteApiV1XstaticActionsDeletePostAction: string
                ,GetApiV1XstaticActionsGetPostActions: Array<ActionModel>
                ,PostApiV1XstaticActionsUpdatePostAction: ActionModel
                ,PostApiV1XstaticConfigCreateExportType: ExportTypeModel
                ,DeleteApiV1XstaticConfigDeleteExportType: string
                ,GetApiV1XstaticConfigGetConfig: XStaticConfig
                ,PostApiV1XstaticConfigUpdateExportType: ExportTypeModel
                ,PostApiV1XstaticDeploymentTargetsCreateDeploymentTarget: DeploymentTargetModel
                ,DeleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget: string
                ,GetApiV1XstaticDeploymentTargetsGetDeploymentTargets: Array<DeploymentTargetModel>
                ,PostApiV1XstaticDeploymentTargetsUpdateDeploymentTarget: DeploymentTargetModel
                ,DeleteApiV1XstaticSitesClearStoredSite: Array<SiteApiModel>
                ,PostApiV1XstaticSitesCreate: SiteApiModel
                ,DeleteApiV1XstaticSitesDelete: string
                ,GetApiV1XstaticSitesGetAll: Array<SiteApiModel>
                ,PostApiV1XstaticSitesUpdate: SiteApiModel
                
        }
        
    }