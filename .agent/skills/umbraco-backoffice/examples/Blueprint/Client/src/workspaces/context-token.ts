import type { BlueprintCounterContext } from './context.js';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';

export const BLUEPRINT_COUNTER_CONTEXT = new UmbContextToken<BlueprintCounterContext>(
	'Blueprint.WorkspaceContext.Counter',
);
