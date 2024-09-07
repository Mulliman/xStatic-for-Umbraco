export class xStaticEvent extends Event {
	public static readonly TYPE = 'change';

	public constructor() {
		// mimics the native change event
		super("xStaticEvent", { bubbles: true, composed: false, cancelable: false });
	}
}
