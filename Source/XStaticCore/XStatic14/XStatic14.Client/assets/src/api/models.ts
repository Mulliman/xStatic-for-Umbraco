

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

export type Assembly = {
        readonly definedTypes: Array<TypeInfo>
readonly exportedTypes: Array<Type>
/**
 * @deprecated
 */
readonly codeBase?: string | null
readonly entryPoint?: MethodInfo | null
readonly fullName?: string | null
readonly imageRuntimeVersion: string
readonly isDynamic: boolean
readonly location: string
readonly reflectionOnly: boolean
readonly isCollectible: boolean
readonly isFullyTrusted: boolean
readonly customAttributes: Array<CustomAttributeData>
/**
 * @deprecated
 */
readonly escapedCodeBase: string
readonly manifestModule: Module
readonly modules: Array<Module>
/**
 * @deprecated
 */
readonly globalAssemblyCache: boolean
readonly hostContext: number
securityRuleSet: SecurityRuleSet
    };

export enum CallingConventions {
    STANDARD = 'Standard',
    VAR_ARGS = 'VarArgs',
    ANY = 'Any',
    HAS_THIS = 'HasThis',
    EXPLICIT_THIS = 'ExplicitThis'
}

export type ConfigurableTypeField = {
        alias?: string | null
name?: string | null
value?: string | null
editorUiAlias?: string | null
    };

export type ConfigurableTypeModel = {
        id?: string | null
name?: string | null
fields?: Array<ConfigurableTypeField> | null
    };

export type ConstructorInfo = {
        readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
attributes: MethodAttributes
methodImplementationFlags: MethodImplAttributes
callingConvention: CallingConventions
readonly isAbstract: boolean
readonly isConstructor: boolean
readonly isFinal: boolean
readonly isHideBySig: boolean
readonly isSpecialName: boolean
readonly isStatic: boolean
readonly isVirtual: boolean
readonly isAssembly: boolean
readonly isFamily: boolean
readonly isFamilyAndAssembly: boolean
readonly isFamilyOrAssembly: boolean
readonly isPrivate: boolean
readonly isPublic: boolean
readonly isConstructedGenericMethod: boolean
readonly isGenericMethod: boolean
readonly isGenericMethodDefinition: boolean
readonly containsGenericParameters: boolean
readonly methodHandle: RuntimeMethodHandle
readonly isSecurityCritical: boolean
readonly isSecuritySafeCritical: boolean
readonly isSecurityTransparent: boolean
memberType: MemberTypes
    };

export type CustomAttributeData = {
        readonly attributeType: Type
readonly constructor: ConstructorInfo
readonly constructorArguments: Array<CustomAttributeTypedArgument>
readonly namedArguments: Array<CustomAttributeNamedArgument>
    };

export type CustomAttributeNamedArgument = {
        memberInfo: MemberInfo
readonly typedValue: CustomAttributeTypedArgument
readonly memberName: string
readonly isField: boolean
    };

export type CustomAttributeTypedArgument = {
        argumentType: Type
value?: unknown
    };

export type DeployerField = {
        alias?: string | null
name?: string | null
value?: string | null
help?: string | null
editorUiAlias?: string | null
    };

export type DeployerModel = {
        id?: string | null
name?: string | null
help?: string | null
fields?: Array<DeployerField> | null
    };

export type DeploymentTargetModel = {
        id: number
name?: string | null
deployerDefinition?: string | null
help?: string | null
fields?: Array<DeployerField> | null
    };

export type DeploymentTargetUpdateModel = {
        id: number
name?: string | null
deployerDefinition?: string | null
fields?: Record<string, string | null> | null
    };

export enum EventAttributes {
    NONE = 'None',
    SPECIAL_NAME = 'SpecialName',
    RTSPECIAL_NAME = 'RTSpecialName',
    RESERVED_MASK = 'ReservedMask'
}

export type EventInfo = {
        readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
memberType: MemberTypes
attributes: EventAttributes
readonly isSpecialName: boolean
readonly addMethod?: MethodInfo | null
readonly removeMethod?: MethodInfo | null
readonly raiseMethod?: MethodInfo | null
readonly isMulticast: boolean
readonly eventHandlerType?: Type | null
    };

export enum EventMessageTypeModel {
    DEFAULT = 'Default',
    INFO = 'Info',
    ERROR = 'Error',
    SUCCESS = 'Success',
    WARNING = 'Warning'
}

export type Exception = {
        readonly targetSite?: MethodBase | null
readonly message: string
readonly data: Record<string, unknown>
readonly innerException?: Exception | null
helpLink?: string | null
source?: string | null
hResult: number
readonly stackTrace?: string | null
    };

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

export enum FieldAttributes {
    PRIVATE_SCOPE = 'PrivateScope',
    PRIVATE = 'Private',
    FAM_ANDASSEM = 'FamANDAssem',
    ASSEMBLY = 'Assembly',
    FAMILY = 'Family',
    FAM_ORASSEM = 'FamORAssem',
    PUBLIC = 'Public',
    FIELD_ACCESS_MASK = 'FieldAccessMask',
    STATIC = 'Static',
    INIT_ONLY = 'InitOnly',
    LITERAL = 'Literal',
    NOT_SERIALIZED = 'NotSerialized',
    HAS_FIELD_RVA = 'HasFieldRVA',
    SPECIAL_NAME = 'SpecialName',
    RTSPECIAL_NAME = 'RTSpecialName',
    HAS_FIELD_MARSHAL = 'HasFieldMarshal',
    PINVOKE_IMPL = 'PinvokeImpl',
    HAS_DEFAULT = 'HasDefault',
    RESERVED_MASK = 'ReservedMask'
}

export type FieldInfo = {
        readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
memberType: MemberTypes
attributes: FieldAttributes
readonly fieldType: Type
readonly isInitOnly: boolean
readonly isLiteral: boolean
/**
 * @deprecated
 */
readonly isNotSerialized: boolean
readonly isPinvokeImpl: boolean
readonly isSpecialName: boolean
readonly isStatic: boolean
readonly isAssembly: boolean
readonly isFamily: boolean
readonly isFamilyAndAssembly: boolean
readonly isFamilyOrAssembly: boolean
readonly isPrivate: boolean
readonly isPublic: boolean
readonly isSecurityCritical: boolean
readonly isSecuritySafeCritical: boolean
readonly isSecurityTransparent: boolean
readonly fieldHandle: RuntimeFieldHandle
    };

export type GenerateItemResult = {
        wasSuccessful: boolean
type?: string | null
item?: string | null
message?: string | null
    };

export enum GenericParameterAttributes {
    NONE = 'None',
    COVARIANT = 'Covariant',
    CONTRAVARIANT = 'Contravariant',
    VARIANCE_MASK = 'VarianceMask',
    REFERENCE_TYPE_CONSTRAINT = 'ReferenceTypeConstraint',
    NOT_NULLABLE_VALUE_TYPE_CONSTRAINT = 'NotNullableValueTypeConstraint',
    DEFAULT_CONSTRUCTOR_CONSTRAINT = 'DefaultConstructorConstraint',
    SPECIAL_CONSTRAINT_MASK = 'SpecialConstraintMask'
}

export type ICustomAttributeProvider = Record<string, unknown>;

export type IntPtr = Record<string, unknown>;

export enum LayoutKind {
    SEQUENTIAL = 'Sequential',
    EXPLICIT = 'Explicit',
    AUTO = 'Auto'
}

export type MemberInfo = {
        memberType: MemberTypes
readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
    };

export enum MemberTypes {
    CONSTRUCTOR = 'Constructor',
    EVENT = 'Event',
    FIELD = 'Field',
    METHOD = 'Method',
    PROPERTY = 'Property',
    TYPE_INFO = 'TypeInfo',
    CUSTOM = 'Custom',
    NESTED_TYPE = 'NestedType',
    ALL = 'All'
}

export enum MethodAttributes {
    PRIVATE_SCOPE = 'PrivateScope',
    REUSE_SLOT = 'ReuseSlot',
    PRIVATE = 'Private',
    FAM_ANDASSEM = 'FamANDAssem',
    ASSEMBLY = 'Assembly',
    FAMILY = 'Family',
    FAM_ORASSEM = 'FamORAssem',
    PUBLIC = 'Public',
    MEMBER_ACCESS_MASK = 'MemberAccessMask',
    UNMANAGED_EXPORT = 'UnmanagedExport',
    STATIC = 'Static',
    FINAL = 'Final',
    VIRTUAL = 'Virtual',
    HIDE_BY_SIG = 'HideBySig',
    NEW_SLOT = 'NewSlot',
    VTABLE_LAYOUT_MASK = 'VtableLayoutMask',
    CHECK_ACCESS_ON_OVERRIDE = 'CheckAccessOnOverride',
    ABSTRACT = 'Abstract',
    SPECIAL_NAME = 'SpecialName',
    RTSPECIAL_NAME = 'RTSpecialName',
    PINVOKE_IMPL = 'PinvokeImpl',
    HAS_SECURITY = 'HasSecurity',
    REQUIRE_SEC_OBJECT = 'RequireSecObject',
    RESERVED_MASK = 'ReservedMask'
}

export type MethodBase = {
        memberType: MemberTypes
readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
attributes: MethodAttributes
methodImplementationFlags: MethodImplAttributes
callingConvention: CallingConventions
readonly isAbstract: boolean
readonly isConstructor: boolean
readonly isFinal: boolean
readonly isHideBySig: boolean
readonly isSpecialName: boolean
readonly isStatic: boolean
readonly isVirtual: boolean
readonly isAssembly: boolean
readonly isFamily: boolean
readonly isFamilyAndAssembly: boolean
readonly isFamilyOrAssembly: boolean
readonly isPrivate: boolean
readonly isPublic: boolean
readonly isConstructedGenericMethod: boolean
readonly isGenericMethod: boolean
readonly isGenericMethodDefinition: boolean
readonly containsGenericParameters: boolean
readonly methodHandle: RuntimeMethodHandle
readonly isSecurityCritical: boolean
readonly isSecuritySafeCritical: boolean
readonly isSecurityTransparent: boolean
    };

export enum MethodImplAttributes {
    IL = 'IL',
    MANAGED = 'Managed',
    NATIVE = 'Native',
    OPTIL = 'OPTIL',
    CODE_TYPE_MASK = 'CodeTypeMask',
    RUNTIME = 'Runtime',
    MANAGED_MASK = 'ManagedMask',
    UNMANAGED = 'Unmanaged',
    NO_INLINING = 'NoInlining',
    FORWARD_REF = 'ForwardRef',
    SYNCHRONIZED = 'Synchronized',
    NO_OPTIMIZATION = 'NoOptimization',
    PRESERVE_SIG = 'PreserveSig',
    AGGRESSIVE_INLINING = 'AggressiveInlining',
    AGGRESSIVE_OPTIMIZATION = 'AggressiveOptimization',
    INTERNAL_CALL = 'InternalCall',
    MAX_METHOD_IMPL_VAL = 'MaxMethodImplVal'
}

export type MethodInfo = {
        readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
attributes: MethodAttributes
methodImplementationFlags: MethodImplAttributes
callingConvention: CallingConventions
readonly isAbstract: boolean
readonly isConstructor: boolean
readonly isFinal: boolean
readonly isHideBySig: boolean
readonly isSpecialName: boolean
readonly isStatic: boolean
readonly isVirtual: boolean
readonly isAssembly: boolean
readonly isFamily: boolean
readonly isFamilyAndAssembly: boolean
readonly isFamilyOrAssembly: boolean
readonly isPrivate: boolean
readonly isPublic: boolean
readonly isConstructedGenericMethod: boolean
readonly isGenericMethod: boolean
readonly isGenericMethodDefinition: boolean
readonly containsGenericParameters: boolean
readonly methodHandle: RuntimeMethodHandle
readonly isSecurityCritical: boolean
readonly isSecuritySafeCritical: boolean
readonly isSecurityTransparent: boolean
memberType: MemberTypes
readonly returnParameter: ParameterInfo
readonly returnType: Type
returnTypeCustomAttributes: ICustomAttributeProvider
    };

export type Module = {
        readonly assembly: Assembly
readonly fullyQualifiedName: string
readonly name: string
readonly mdStreamVersion: number
readonly moduleVersionId: string
readonly scopeName: string
readonly moduleHandle: ModuleHandle
readonly customAttributes: Array<CustomAttributeData>
readonly metadataToken: number
    };

export type ModuleHandle = {
        readonly mdStreamVersion: number
    };

export type NotificationHeaderModel = {
        message: string
category: string
type: EventMessageTypeModel
    };

export enum ParameterAttributes {
    NONE = 'None',
    IN = 'In',
    OUT = 'Out',
    LCID = 'Lcid',
    RETVAL = 'Retval',
    OPTIONAL = 'Optional',
    HAS_DEFAULT = 'HasDefault',
    HAS_FIELD_MARSHAL = 'HasFieldMarshal',
    RESERVED3 = 'Reserved3',
    RESERVED4 = 'Reserved4',
    RESERVED_MASK = 'ReservedMask'
}

export type ParameterInfo = {
        attributes: ParameterAttributes
readonly member: MemberInfo
readonly name?: string | null
readonly parameterType: Type
readonly position: number
readonly isIn: boolean
readonly isLcid: boolean
readonly isOptional: boolean
readonly isOut: boolean
readonly isRetval: boolean
readonly defaultValue?: unknown
readonly rawDefaultValue?: unknown
readonly hasDefaultValue: boolean
readonly customAttributes: Array<CustomAttributeData>
readonly metadataToken: number
    };

export enum PropertyAttributes {
    NONE = 'None',
    SPECIAL_NAME = 'SpecialName',
    RTSPECIAL_NAME = 'RTSpecialName',
    HAS_DEFAULT = 'HasDefault',
    RESERVED2 = 'Reserved2',
    RESERVED3 = 'Reserved3',
    RESERVED4 = 'Reserved4',
    RESERVED_MASK = 'ReservedMask'
}

export type PropertyInfo = {
        readonly name: string
readonly declaringType?: Type | null
readonly reflectedType?: Type | null
readonly module: Module
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
memberType: MemberTypes
readonly propertyType: Type
attributes: PropertyAttributes
readonly isSpecialName: boolean
readonly canRead: boolean
readonly canWrite: boolean
readonly getMethod?: MethodInfo | null
readonly setMethod?: MethodInfo | null
    };

export type RebuildProcessResult = {
        wasSuccessful: boolean
results?: Array<GenerateItemResult> | null
readonly warnings?: Array<GenerateItemResult> | null
siteId: number
buildTime: number
exception?: string | null
exceptionTrace?: string | null
    };

export type RuntimeFieldHandle = {
        readonly value: IntPtr
    };

export type RuntimeMethodHandle = {
        readonly value: IntPtr
    };

export type RuntimeTypeHandle = {
        readonly value: IntPtr
    };

export enum SecurityRuleSet {
    NONE = 'None',
    LEVEL1 = 'Level1',
    LEVEL2 = 'Level2'
}

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
cultures?: Array<string> | null
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
cultures?: Array<string> | null
    };

export type StructLayoutAttribute = {
        readonly typeId: unknown
value: LayoutKind
    };

export type Type = {
        readonly name: string
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
readonly isInterface: boolean
memberType: MemberTypes
readonly namespace?: string | null
readonly assemblyQualifiedName?: string | null
readonly fullName?: string | null
readonly assembly: Assembly
readonly module: Module
readonly isNested: boolean
readonly declaringType?: Type | null
readonly declaringMethod?: MethodBase | null
readonly reflectedType?: Type | null
readonly underlyingSystemType: Type
readonly isTypeDefinition: boolean
readonly isArray: boolean
readonly isByRef: boolean
readonly isPointer: boolean
readonly isConstructedGenericType: boolean
readonly isGenericParameter: boolean
readonly isGenericTypeParameter: boolean
readonly isGenericMethodParameter: boolean
readonly isGenericType: boolean
readonly isGenericTypeDefinition: boolean
readonly isSZArray: boolean
readonly isVariableBoundArray: boolean
readonly isByRefLike: boolean
readonly isFunctionPointer: boolean
readonly isUnmanagedFunctionPointer: boolean
readonly hasElementType: boolean
readonly genericTypeArguments: Array<Type>
readonly genericParameterPosition: number
genericParameterAttributes: GenericParameterAttributes
attributes: TypeAttributes
readonly isAbstract: boolean
readonly isImport: boolean
readonly isSealed: boolean
readonly isSpecialName: boolean
readonly isClass: boolean
readonly isNestedAssembly: boolean
readonly isNestedFamANDAssem: boolean
readonly isNestedFamily: boolean
readonly isNestedFamORAssem: boolean
readonly isNestedPrivate: boolean
readonly isNestedPublic: boolean
readonly isNotPublic: boolean
readonly isPublic: boolean
readonly isAutoLayout: boolean
readonly isExplicitLayout: boolean
readonly isLayoutSequential: boolean
readonly isAnsiClass: boolean
readonly isAutoClass: boolean
readonly isUnicodeClass: boolean
readonly isCOMObject: boolean
readonly isContextful: boolean
readonly isEnum: boolean
readonly isMarshalByRef: boolean
readonly isPrimitive: boolean
readonly isValueType: boolean
readonly isSignatureType: boolean
readonly isSecurityCritical: boolean
readonly isSecuritySafeCritical: boolean
readonly isSecurityTransparent: boolean
readonly structLayoutAttribute?: StructLayoutAttribute | null
readonly typeInitializer?: ConstructorInfo | null
readonly typeHandle: RuntimeTypeHandle
readonly guid: string
readonly baseType?: Type | null
/**
 * @deprecated
 */
readonly isSerializable: boolean
readonly containsGenericParameters: boolean
readonly isVisible: boolean
    };

export enum TypeAttributes {
    NOT_PUBLIC = 'NotPublic',
    AUTO_LAYOUT = 'AutoLayout',
    ANSI_CLASS = 'AnsiClass',
    CLASS = 'Class',
    PUBLIC = 'Public',
    NESTED_PUBLIC = 'NestedPublic',
    NESTED_PRIVATE = 'NestedPrivate',
    NESTED_FAMILY = 'NestedFamily',
    NESTED_ASSEMBLY = 'NestedAssembly',
    NESTED_FAM_ANDASSEM = 'NestedFamANDAssem',
    VISIBILITY_MASK = 'VisibilityMask',
    NESTED_FAM_ORASSEM = 'NestedFamORAssem',
    SEQUENTIAL_LAYOUT = 'SequentialLayout',
    EXPLICIT_LAYOUT = 'ExplicitLayout',
    LAYOUT_MASK = 'LayoutMask',
    INTERFACE = 'Interface',
    CLASS_SEMANTICS_MASK = 'ClassSemanticsMask',
    ABSTRACT = 'Abstract',
    SEALED = 'Sealed',
    SPECIAL_NAME = 'SpecialName',
    RTSPECIAL_NAME = 'RTSpecialName',
    IMPORT = 'Import',
    SERIALIZABLE = 'Serializable',
    WINDOWS_RUNTIME = 'WindowsRuntime',
    UNICODE_CLASS = 'UnicodeClass',
    AUTO_CLASS = 'AutoClass',
    STRING_FORMAT_MASK = 'StringFormatMask',
    CUSTOM_FORMAT_CLASS = 'CustomFormatClass',
    HAS_SECURITY = 'HasSecurity',
    RESERVED_MASK = 'ReservedMask',
    BEFORE_FIELD_INIT = 'BeforeFieldInit',
    CUSTOM_FORMAT_MASK = 'CustomFormatMask'
}

export type TypeInfo = {
        readonly name: string
readonly customAttributes: Array<CustomAttributeData>
readonly isCollectible: boolean
readonly metadataToken: number
readonly isInterface: boolean
memberType: MemberTypes
readonly namespace?: string | null
readonly assemblyQualifiedName?: string | null
readonly fullName?: string | null
readonly assembly: Assembly
readonly module: Module
readonly isNested: boolean
readonly declaringType?: Type | null
readonly declaringMethod?: MethodBase | null
readonly reflectedType?: Type | null
readonly underlyingSystemType: Type
readonly isTypeDefinition: boolean
readonly isArray: boolean
readonly isByRef: boolean
readonly isPointer: boolean
readonly isConstructedGenericType: boolean
readonly isGenericParameter: boolean
readonly isGenericTypeParameter: boolean
readonly isGenericMethodParameter: boolean
readonly isGenericType: boolean
readonly isGenericTypeDefinition: boolean
readonly isSZArray: boolean
readonly isVariableBoundArray: boolean
readonly isByRefLike: boolean
readonly isFunctionPointer: boolean
readonly isUnmanagedFunctionPointer: boolean
readonly hasElementType: boolean
readonly genericTypeArguments: Array<Type>
readonly genericParameterPosition: number
genericParameterAttributes: GenericParameterAttributes
attributes: TypeAttributes
readonly isAbstract: boolean
readonly isImport: boolean
readonly isSealed: boolean
readonly isSpecialName: boolean
readonly isClass: boolean
readonly isNestedAssembly: boolean
readonly isNestedFamANDAssem: boolean
readonly isNestedFamily: boolean
readonly isNestedFamORAssem: boolean
readonly isNestedPrivate: boolean
readonly isNestedPublic: boolean
readonly isNotPublic: boolean
readonly isPublic: boolean
readonly isAutoLayout: boolean
readonly isExplicitLayout: boolean
readonly isLayoutSequential: boolean
readonly isAnsiClass: boolean
readonly isAutoClass: boolean
readonly isUnicodeClass: boolean
readonly isCOMObject: boolean
readonly isContextful: boolean
readonly isEnum: boolean
readonly isMarshalByRef: boolean
readonly isPrimitive: boolean
readonly isValueType: boolean
readonly isSignatureType: boolean
readonly isSecurityCritical: boolean
readonly isSecuritySafeCritical: boolean
readonly isSecurityTransparent: boolean
readonly structLayoutAttribute?: StructLayoutAttribute | null
readonly typeInitializer?: ConstructorInfo | null
readonly typeHandle: RuntimeTypeHandle
readonly guid: string
readonly baseType?: Type | null
/**
 * @deprecated
 */
readonly isSerializable: boolean
readonly containsGenericParameters: boolean
readonly isVisible: boolean
readonly genericTypeParameters: Array<Type>
readonly declaredConstructors: Array<ConstructorInfo>
readonly declaredEvents: Array<EventInfo>
readonly declaredFields: Array<FieldInfo>
readonly declaredMembers: Array<MemberInfo>
readonly declaredMethods: Array<MethodInfo>
readonly declaredNestedTypes: Array<TypeInfo>
readonly declaredProperties: Array<PropertyInfo>
readonly implementedInterfaces: Array<Type>
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

export type XStaticResult = {
        wasSuccessful: boolean
message?: string | null
exception?: Exception | null
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
PostApiV1XstaticDeployDeploySite: {
                        staticSiteId?: number
                        
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
GetApiV1XstaticDownloadDownloadSite: {
                        staticSiteId?: number
                        
                    };
PostApiV1XstaticGenerateGenerateSite: {
                        staticSiteId?: number
                        
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
                ,PostApiV1XstaticDeployDeploySite: XStaticResult
                ,PostApiV1XstaticDeploymentTargetsCreateDeploymentTarget: DeploymentTargetModel
                ,DeleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget: string
                ,GetApiV1XstaticDeploymentTargetsGetDeploymentTargets: Array<DeploymentTargetModel>
                ,PostApiV1XstaticDeploymentTargetsUpdateDeploymentTarget: DeploymentTargetModel
                ,GetApiV1XstaticDownloadDownloadSite: Blob | File
                ,PostApiV1XstaticGenerateGenerateSite: RebuildProcessResult
                ,DeleteApiV1XstaticSitesClearStoredSite: Array<SiteApiModel>
                ,PostApiV1XstaticSitesCreate: SiteApiModel
                ,DeleteApiV1XstaticSitesDelete: string
                ,GetApiV1XstaticSitesGetAll: Array<SiteApiModel>
                ,PostApiV1XstaticSitesUpdate: SiteApiModel
                
        }
        
    }