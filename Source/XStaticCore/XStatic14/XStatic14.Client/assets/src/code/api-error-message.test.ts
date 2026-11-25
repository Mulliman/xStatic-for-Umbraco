import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './api-error-message';

describe('getApiErrorMessage', () => {
	it('uses the xStatic result message from the problem details', () => {
		const error = {
			message: 'Conflict',
			problemDetails: { wasSuccessful: false, message: "The environment variable 'XSTATIC_X' isn't set." },
		};

		expect(getApiErrorMessage(error, 'fallback')).toBe("The environment variable 'XSTATIC_X' isn't set.");
	});

	it('falls back to ProblemDetails detail, then title', () => {
		expect(getApiErrorMessage({ problemDetails: { title: 'Bad', detail: 'More detail' } }, 'fb')).toBe('More detail');
		expect(getApiErrorMessage({ problemDetails: { title: 'Bad' } }, 'fb')).toBe('Bad');
	});

	it("uses the error's own message when there are no problem details", () => {
		expect(getApiErrorMessage(new Error('Network down'), 'fb')).toBe('Network down');
	});

	it('returns the fallback for empty or missing errors', () => {
		expect(getApiErrorMessage(undefined, 'fb')).toBe('fb');
		expect(getApiErrorMessage({ problemDetails: { message: '  ' }, message: '' }, 'fb')).toBe('fb');
	});
});
