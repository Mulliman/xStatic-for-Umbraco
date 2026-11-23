import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatTime } from './datetime';

describe('datetime helpers', () => {
	describe('formatDuration', () => {
		it('returns 0:00 for falsy durations', () => {
			expect(formatDuration(0)).toBe('0:00');
			expect(formatDuration(null)).toBe('0:00');
			expect(formatDuration(undefined)).toBe('0:00');
		});

		it('formats seconds with zero-padded seconds', () => {
			expect(formatDuration(5)).toBe('0:05');
			expect(formatDuration(45)).toBe('0:45');
		});

		it('formats minutes and seconds', () => {
			expect(formatDuration(60)).toBe('1:00');
			expect(formatDuration(61)).toBe('1:01');
			expect(formatDuration(125)).toBe('2:05');
		});

		it('formats hours, minutes, and seconds', () => {
			expect(formatDuration(3600)).toBe('1:00:00');
			expect(formatDuration(4 * 3600 + 3 * 60 + 59)).toBe('4:03:59');
			expect(formatDuration(123 * 3600 + 3 * 60 + 59)).toBe('123:03:59');
		});
	});

	describe('formatDate and formatTime', () => {
		it('formats an ISO timestamp using locale date and time strings', () => {
			const input = '2026-06-15T14:30:00Z';
			const expected = new Date(input);

			expect(formatDate(input)).toBe(expected.toLocaleDateString());
			expect(formatTime(input)).toBe(expected.toLocaleTimeString());
		});
	});
});
