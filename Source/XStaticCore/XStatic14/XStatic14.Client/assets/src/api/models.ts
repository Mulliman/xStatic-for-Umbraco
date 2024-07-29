

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

export type V1Data = {
        
        payloads: {
            DeleteApiV1XstaticClearStoredSite: {
                        staticSiteId?: number
                        
                    };
PostApiV1XstaticCreate: {
                        requestBody?: SiteUpdateModel
                        
                    };
DeleteApiV1XstaticDelete: {
                        staticSiteId?: number
                        
                    };
PostApiV1XstaticUpdate: {
                        requestBody?: SiteUpdateModel
                        
                    };
        }
        
        
        responses: {
            DeleteApiV1XstaticClearStoredSite: Array<SiteApiModel>
                ,PostApiV1XstaticCreate: SiteApiModel
                ,DeleteApiV1XstaticDelete: string
                ,GetApiV1XstaticGetAll: Array<SiteApiModel>
                ,PostApiV1XstaticUpdate: SiteApiModel
                
        }
        
    }