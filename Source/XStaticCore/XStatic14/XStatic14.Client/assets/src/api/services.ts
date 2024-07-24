import type { CancelablePromise } from './core/CancelablePromise';
import { OpenAPI } from './core/OpenAPI';
import { request as __request } from './core/request';
import type { V1Data } from './models';

export class V1Service {

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static deleteApiV1XstaticClearStoredSite(data: V1Data['payloads']['DeleteApiV1XstaticClearStoredSite'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticClearStoredSite']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/clear-stored-site',
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
	public static postApiV1XstaticCreate(data: V1Data['payloads']['PostApiV1XstaticCreate'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticCreate']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/create',
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
	public static deleteApiV1XstaticDelete(data: V1Data['payloads']['DeleteApiV1XstaticDelete'] = {}): CancelablePromise<V1Data['responses']['DeleteApiV1XstaticDelete']> {
		const {
                    
                    staticSiteId
                } = data;
		return __request(OpenAPI, {
			method: 'DELETE',
			url: '/api/v1/xstatic/delete',
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
	public static getApiV1XstaticGetAll(): CancelablePromise<V1Data['responses']['GetApiV1XstaticGetAll']> {
		
		return __request(OpenAPI, {
			method: 'GET',
			url: '/api/v1/xstatic/get-all',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

	/**
	 * @returns unknown OK
	 * @throws ApiError
	 */
	public static postApiV1XstaticUpdate(data: V1Data['payloads']['PostApiV1XstaticUpdate'] = {}): CancelablePromise<V1Data['responses']['PostApiV1XstaticUpdate']> {
		const {
                    
                    requestBody
                } = data;
		return __request(OpenAPI, {
			method: 'POST',
			url: '/api/v1/xstatic/update',
			body: requestBody,
			mediaType: 'application/json',
			errors: {
				401: `The resource is protected and requires an authentication token`,
			},
		});
	}

}