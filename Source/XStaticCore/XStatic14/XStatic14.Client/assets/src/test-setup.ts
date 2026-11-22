// happy-dom does not implement ElementInternals (HTMLElement.prototype.attachInternals),
// which Umbraco Backoffice (UmbFormControlMixin) and UUI form controls call in their constructors.
if (typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.attachInternals !== 'function') {
	HTMLElement.prototype.attachInternals = function attachInternals() {
		return {
			form: null,
			shadowRoot: this.shadowRoot,
			states: new Set(),
			validity: {
				badInput: false,
				customError: false,
				patternMismatch: false,
				rangeOverflow: false,
				rangeUnderflow: false,
				stepMismatch: false,
				tooLong: false,
				tooShort: false,
				typeMismatch: false,
				valid: true,
				valueMissing: false,
			},
			validationMessage: '',
			willValidate: false,
			checkValidity: () => true,
			reportValidity: () => true,
			setFormValue: () => {},
			setValidity: () => {},
		} as unknown as ElementInternals;
	};
}

// happy-dom does not define SVGAElement, which @umbraco-cms/backoffice router's
// global click handler checks via `instanceof SVGAElement`.
if (typeof globalThis.SVGAElement === 'undefined') {
	(globalThis as Record<string, unknown>).SVGAElement = class SVGAElement {};
}
