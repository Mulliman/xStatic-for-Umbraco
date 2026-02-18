/**
 * Folder Workspace Context Token
 *
 * Token for consuming the folder workspace context in child elements.
 * Note: Usually you would use UMB_WORKSPACE_CONTEXT directly since the
 * workspace context is already provided by the base class.
 *
 * Skills used: umbraco-context-api
 */

import { UMB_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/workspace";

// Re-export UMB_WORKSPACE_CONTEXT as the folder workspace context token
// The FolderWorkspaceContext extends UmbSubmittableWorkspaceContextBase
// which provides itself under UMB_WORKSPACE_CONTEXT
export const FOLDER_WORKSPACE_CONTEXT = UMB_WORKSPACE_CONTEXT;
