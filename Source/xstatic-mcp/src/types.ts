export interface SiteApiModel {
  id: number;
  name: string;
  autoPublish: boolean;
  rootNode: string;
  mediaRootNodes?: string[] | null;
  exportFormat: number;
  lastRun?: string | null;
  lastBuildDurationInSeconds?: number | null;
  lastDeployed?: string | null;
  lastDeployDurationInSeconds?: number | null;
  assetPaths?: string | null;
  targetHostname?: string | null;
  imageCrops?: string | null;
  deploymentTarget?: number | null;
  postGenerationActionIds?: number[] | null;
  cultures?: string[] | null;
  rootPath?: string | null;
  exportTypeName?: string | null;
  folderSize?: string | null;
}

export interface GenerateItemResult {
  wasSuccessful: boolean;
  type: string;
  item: string;
  message?: string | null;
}

export interface RebuildProcessResult {
  wasSuccessful: boolean;
  results?: GenerateItemResult[] | null;
  warnings?: GenerateItemResult[] | null;
  siteId: number;
  buildTime: number;
  exception?: string | null;
  exceptionTrace?: string | null;
}

export interface XStaticWebResult {
  wasSuccessful: boolean;
  message?: string | null;
}

export interface TypeFieldModel {
  alias: string;
  name?: string | null;
  editorUiAlias?: string | null;
  value?: string | null;
}

export interface TypeModel {
  id: string;
  name: string;
  assemblyQualifiedName?: string | null;
}

export interface ConfigurableTypeModel extends TypeModel {
  fields?: TypeFieldModel[] | null;
}

export interface ActionModel {
  id: number;
  name: string;
  type?: ConfigurableTypeModel | null;
}

export interface DeployerField {
  alias: string;
  name?: string | null;
  editorUiAlias?: string | null;
  value?: string | null;
  help?: string | null;
}

export interface DeploymentTargetModel {
  id: number;
  name: string;
  deployerDefinition: string;
  help?: string | null;
  fields?: DeployerField[] | null;
}

export interface ExportTypeModel {
  id: number;
  name: string;
  generator?: string | null;
  transformerFactory?: string | null;
  fileNameGenerator?: string | null;
}

export interface DeployerModel {
  id: string;
  name: string;
  help?: string | null;
  fields?: DeployerField[] | null;
}

export interface XStaticConfig {
  deployers?: DeployerModel[] | null;
  deploymentTargetCreators?: DeployerModel[] | null;
  exportTypes?: ExportTypeModel[] | null;
  generators?: TypeModel[] | null;
  transformerFactories?: TypeModel[] | null;
  fileNameGenerators?: TypeModel[] | null;
  postGenerationActions?: ConfigurableTypeModel[] | null;
}

export interface XStaticSettings {
  isUsingXStaticRoles: boolean;
}
