/**
 * Umbraco Configuration for E2E Tests
 *
 * Configure the URL and credentials for the Umbraco instance to test against.
 * Uses environment variables with fallback defaults.
 */
const umbracoConfig = {
	environment: {
		// Local Umbraco instance URL
		baseUrl: process.env.URL || 'https://localhost:44325',
	},
	user: {
		// Admin credentials - update these to match your instance
		login: process.env.UMBRACO_USER_LOGIN || 'admin@example.com',
		password: process.env.UMBRACO_USER_PASSWORD || '1234567890',
	},
};

export { umbracoConfig };
