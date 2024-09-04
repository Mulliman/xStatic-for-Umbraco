import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { V1Data } from './models';

export class V1Service {

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticActionsCreatePostAction(data: V1Data['payloads']['PostApiV1XstaticActionsCreatePostAction'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticActionsCreatePostAction']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/actions/create-post-action',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns string OK
	 * @throws ApiError
	 */
	public static deleteApiV1XstaticActionsDeletePostAction(data: V1Data['payloads']['DeleteApiV1XstaticActionsDeletePostAction'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticActionsDeletePostAction']> {
		const {
                    
                    id
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/actions/delete-post-action',
			query: {
				id
			},
			responseHeader: 'Umb-Notifications',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticActionsGetPostActions(): CancelablePromise<V1Data['responses']['GetApiV1XstaticActionsGetPostActions']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/actions/get-post-actions',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticActionsUpdatePostAction(data: V1Data['payloads']['PostApiV1XstaticActionsUpdatePostAction'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticActionsUpdatePostAction']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/actions/update-post-action',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticConfigCreateExportType(data: V1Data['payloads']['PostApiV1XstaticConfigCreateExportType'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticConfigCreateExportType']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/config/create-export-type',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns string OK
	 * @throws ApiError
	 */
	public static deleteApiV1XstaticConfigDeleteExportType(data: V1Data['payloads']['DeleteApiV1XstaticConfigDeleteExportType'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticConfigDeleteExportType']> {
		const {
                    
                    id
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/config/delete-export-type',
			query: {
				id
			},
			responseHeader: 'Umb-Notifications',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticConfigGetConfig(): CancelablePromise<V1Data['responses']['GetApiV1XstaticConfigGetConfig']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/config/get-config',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticConfigGetSettings(): CancelablePromise<V1Data['responses']['GetApiV1XstaticConfigGetSettings']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/config/get-settings',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticConfigUpdateExportType(data: V1Data['payloads']['PostApiV1XstaticConfigUpdateExportType'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticConfigUpdateExportType']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/config/update-export-type',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticDeployDeploySite(data: V1Data['payloads']['PostApiV1XstaticDeployDeploySite'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticDeployDeploySite']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/deploy/deploy-site',
			query: {
				staticSiteId
			},
			errors: {
				401: `The resource is protected and requires an authentication token`,
				403: `The authenticated user do not have access to this resource`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticDeploymentTargetsAutoCreateDeploymentTarget(data: V1Data['payloads']['PostApiV1XstaticDeploymentTargetsAutoCreateDeploymentTarget'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticDeploymentTargetsAutoCreateDeploymentTarget']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/deployment-targets/auto-create-deployment-target',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticDeploymentTargetsCreateDeploymentTarget(data: V1Data['payloads']['PostApiV1XstaticDeploymentTargetsCreateDeploymentTarget'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticDeploymentTargetsCreateDeploymentTarget']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/deployment-targets/create-deployment-target',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns string OK
	 * @throws ApiError
	 */
	public static deleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget(data: V1Data['payloads']['DeleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget']> {
		const {
                    
                    id
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/deployment-targets/delete-deployment-target',
			query: {
				id
			},
			responseHeader: 'Umb-Notifications',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticDeploymentTargetsGetDeploymentTargets(): CancelablePromise<V1Data['responses']['GetApiV1XstaticDeploymentTargetsGetDeploymentTargets']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/deployment-targets/get-deployment-targets',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticDeploymentTargetsUpdateDeploymentTarget(data: V1Data['payloads']['PostApiV1XstaticDeploymentTargetsUpdateDeploymentTarget'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticDeploymentTargetsUpdateDeploymentTarget']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/deployment-targets/update-deployment-target',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticDownloadDownloadSite(data: V1Data['payloads']['GetApiV1XstaticDownloadDownloadSite'] = {}): CancelablePromise<V1Data['responses']['GetApiV1XstaticDownloadDownloadSite']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/download/download-site',
			query: {
				staticSiteId
			},
			errors: {
				401: `The resource is protected and requires an authentication token`,
				403: `The authenticated user do not have access to this resource`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticGenerateGenerateSite(data: V1Data['payloads']['PostApiV1XstaticGenerateGenerateSite'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticGenerateGenerateSite']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/generate/generate-site',
			query: {
				staticSiteId
			},
			errors: {
				401: `The resource is protected and requires an authentication token`,
				403: `The authenticated user do not have access to this resource`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static deleteApiV1XstaticSitesClearStoredSite(data: V1Data['payloads']['DeleteApiV1XstaticSitesClearStoredSite'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticSitesClearStoredSite']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/sites/clear-stored-site',
			query: {
				staticSiteId
			},
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticSitesCreate(data: V1Data['payloads']['PostApiV1XstaticSitesCreate'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticSitesCreate']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/sites/create',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns string OK
	 * @throws ApiError
	 */
	public static deleteApiV1XstaticSitesDelete(data: V1Data['payloads']['DeleteApiV1XstaticSitesDelete'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticSitesDelete']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/sites/delete',
			query: {
				staticSiteId
			},
			responseHeader: 'Umb-Notifications',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticSitesGetAll(): CancelablePromise<V1Data['responses']['GetApiV1XstaticSitesGetAll']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/sites/get-all',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static getApiV1XstaticSitesGetSiteDependencies(): CancelablePromise<V1Data['responses']['GetApiV1XstaticSitesGetSiteDependencies']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/sites/get-site-dependencies',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticSitesUpdate(data: V1Data['payloads']['PostApiV1XstaticSitesUpdate'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticSitesUpdate']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/sites/update',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

}