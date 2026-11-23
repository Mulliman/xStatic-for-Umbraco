import { describe, expect, it } from 'vitest';
import { xStaticEvent } from './xstatic-event';

describe('xStaticEvent', () => {
	it('creates a bubbling, non-composed, non-cancelable event named xStaticEvent', () => {
		const event = new xStaticEvent();

		expect(event).toBeInstanceOf(Event);
		expect(event.type).toBe('xStaticEvent');
		expect(event.bubbles).toBe(true);
		expect(event.composed).toBe(false);
		expect(event.cancelable).toBe(false);
	});
});
