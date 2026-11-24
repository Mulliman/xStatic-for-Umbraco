import { css } from '@umbraco-cms/backoffice/external/lit';

/**
 * Styles shared by the cards on the xStatic dashboards (sites, export types, deployment targets, actions and config).
 * Use UUI design tokens rather than fixed colours or pixel sizes so the cards follow the light, dark and
 * high-contrast backoffice themes.
 */
export const xStaticCardStyles = css`
	:host {
		display: block;
		position: relative;
		width: 100%;
	}

	.headline {
		font-size: 1.2rem;
		padding-top: var(--uui-size-space-2);
	}

	.card-body {
		position: relative;
		display: block;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--uui-size-space-2);
		margin-top: var(--uui-size-space-5);
	}

	.buttons uui-icon {
		margin-right: var(--uui-size-space-1);
	}
`;
