import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbArrayState } from '@umbraco-cms/backoffice/observable-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';

export interface Feature {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
}

const DEFAULT_FEATURES: Feature[] = [
	{
		id: 'dark-mode',
		name: 'Dark Mode',
		description: 'Enable dark theme for this document',
		enabled: false,
	},
	{
		id: 'auto-save',
		name: 'Auto Save',
		description: 'Automatically save changes every 30 seconds',
		enabled: true,
	},
	{
		id: 'preview-mode',
		name: 'Preview Mode',
		description: 'Show live preview panel',
		enabled: false,
	},
];

export class ExampleFeatureToggleContext extends UmbContextBase {
	#features = new UmbArrayState<Feature>(DEFAULT_FEATURES, (x) => x.id);

	readonly features = this.#features.asObservable();

	readonly activeCount = this.#features.asObservablePart((features) =>
		features.filter((f) => f.enabled).length
	);

	readonly allEnabled = this.#features.asObservablePart((features) =>
		features.length > 0 && features.every((f) => f.enabled)
	);

	readonly allDisabled = this.#features.asObservablePart((features) =>
		features.every((f) => !f.enabled)
	);

	constructor(host: UmbControllerHost) {
		super(host, EXAMPLE_FEATURE_TOGGLE_CONTEXT);
	}

	toggle(featureId: string): void {
		const features = this.#features.getValue();
		const feature = features.find((f) => f.id === featureId);

		if (feature) {
			this.#features.updateOne(featureId, {
				...feature,
				enabled: !feature.enabled,
			});
		}
	}

	enable(featureId: string): void {
		const features = this.#features.getValue();
		const feature = features.find((f) => f.id === featureId);

		if (feature && !feature.enabled) {
			this.#features.updateOne(featureId, {
				...feature,
				enabled: true,
			});
		}
	}

	disable(featureId: string): void {
		const features = this.#features.getValue();
		const feature = features.find((f) => f.id === featureId);

		if (feature && feature.enabled) {
			this.#features.updateOne(featureId, {
				...feature,
				enabled: false,
			});
		}
	}

	enableAll(): void {
		const features = this.#features.getValue();
		const updated = features.map((f) => ({ ...f, enabled: true }));
		this.#features.setValue(updated);
	}

	disableAll(): void {
		const features = this.#features.getValue();
		const updated = features.map((f) => ({ ...f, enabled: false }));
		this.#features.setValue(updated);
	}

	toggleAll(): void {
		const features = this.#features.getValue();
		const allEnabled = features.every((f) => f.enabled);

		if (allEnabled) {
			this.disableAll();
		} else {
			this.enableAll();
		}
	}

	isEnabled(featureId: string): boolean {
		const features = this.#features.getValue();
		const feature = features.find((f) => f.id === featureId);
		return feature?.enabled ?? false;
	}

	getActiveCount(): number {
		return this.#features.getValue().filter((f) => f.enabled).length;
	}

	reset(): void {
		this.#features.setValue([...DEFAULT_FEATURES]);
	}
}

export const api = ExampleFeatureToggleContext;

export const EXAMPLE_FEATURE_TOGGLE_CONTEXT = new UmbContextToken<ExampleFeatureToggleContext>(
	'UmbWorkspaceContext',
	'example.workspaceContext.featureToggle',
);
