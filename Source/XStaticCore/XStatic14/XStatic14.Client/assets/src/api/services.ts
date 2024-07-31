import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { V1Data } from './models';

export class V1Service {

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