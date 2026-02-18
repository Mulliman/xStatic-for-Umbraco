import { EXAMPLE_FEATURE_TOGGLE_CONTEXT } from './feature-toggle-context.js';
import { UmbWorkspaceActionBase, type UmbWorkspaceAction } from '@umbraco-cms/backoffice/workspace';

export class ExampleFeatureToggleAction extends UmbWorkspaceActionBase implements UmbWorkspaceAction {
	override async execute() {
		const context = await this.getContext(EXAMPLE_FEATURE_TOGGLE_CONTEXT);
		if (!context) {
			throw new Error('Could not get the feature toggle context');
		}
		context.toggleAll();
	}
}

export const api = ExampleFeatureToggleAction;
