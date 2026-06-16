/**
 * @fileoverview Notification Utilities
 *
 * Provides centralized notification helpers for consistent user feedback.
 * These utilities wrap Umbraco's notification context to:
 * - Ensure consistent notification formatting
 * - Reduce boilerplate code in actions and contexts
 * - Provide type-safe notification methods
 *
 * Umbraco's notification system uses "peek" notifications which appear
 * briefly and auto-dismiss, perfect for operation feedback.
 *
 * **Usage Pattern:**
 *
 * In classes that extend Umbraco base classes (like UmbEntityActionBase),
 * first get the notification context, then use these helpers:
 *
 * @example
 * import { peekSuccess, peekError } from "../utils/notifications.js";
 *
 * // In an entity action's execute method
 * const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
 * if (notificationContext) {
 *   try {
 *     await deleteItem();
 *     peekSuccess(notificationContext, "Deleted", "Item was deleted successfully.");
 *   } catch (error) {
 *     peekError(notificationContext, "Error", "Failed to delete item.");
 *   }
 * }
 *
 * Skills demonstrated: umbraco-notifications
 */

import type { UmbNotificationContext } from "@umbraco-cms/backoffice/notification";

// Re-export for convenience
export { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";

/**
 * Notification color/type options.
 *
 * Maps to Umbraco's notification color scheme:
 * - `positive` - Green, for success messages
 * - `warning` - Yellow/orange, for warnings
 * - `danger` - Red, for errors
 * - `default` - Neutral, for informational messages
 */
export type NotificationColor = "positive" | "warning" | "danger" | "default";

/**
 * Shows a peek notification with the specified color.
 *
 * Peek notifications appear briefly in the corner and auto-dismiss.
 * They're perfect for confirming operations completed.
 *
 * @param {UmbNotificationContext} context - The notification context
 * @param {NotificationColor} color - The notification color/type
 * @param {string} headline - Brief title (2-4 words)
 * @param {string} message - Detailed message
 *
 * @example
 * const ctx = await this.getContext(UMB_NOTIFICATION_CONTEXT);
 * peek(ctx, "positive", "Saved", "Your changes have been saved.");
 */
export function peek(
  context: UmbNotificationContext | undefined,
  color: NotificationColor,
  headline: string,
  message: string
): void {
  context?.peek(color, {
    data: { headline, message },
  });
}

/**
 * Shows a success notification (green).
 *
 * Use this after successful operations like saving, creating, or deleting.
 *
 * @param {UmbNotificationContext} context - The notification context
 * @param {string} headline - Brief title (e.g., "Saved", "Created", "Deleted")
 * @param {string} message - Detailed message explaining what was successful
 *
 * @example
 * const ctx = await this.getContext(UMB_NOTIFICATION_CONTEXT);
 * peekSuccess(ctx, "Note Created", "Your new note is ready to edit.");
 */
export function peekSuccess(
  context: UmbNotificationContext | undefined,
  headline: string,
  message: string
): void {
  peek(context, "positive", headline, message);
}

/**
 * Shows an error notification (red).
 *
 * Use this when an operation fails. The notification helps users
 * understand that something went wrong.
 *
 * @param {UmbNotificationContext} context - The notification context
 * @param {string} headline - Brief title (e.g., "Error", "Failed")
 * @param {string} message - User-friendly explanation of what went wrong
 *
 * @example
 * const ctx = await this.getContext(UMB_NOTIFICATION_CONTEXT);
 * try {
 *   await saveNote();
 *   peekSuccess(ctx, "Saved", "Note saved successfully.");
 * } catch (error) {
 *   console.error("Save failed:", error);
 *   peekError(ctx, "Save Failed", "Unable to save your note. Please try again.");
 * }
 */
export function peekError(
  context: UmbNotificationContext | undefined,
  headline: string,
  message: string
): void {
  peek(context, "danger", headline, message);
}

/**
 * Shows a warning notification (yellow/orange).
 *
 * Use this for non-critical issues or to alert users about
 * something they should be aware of.
 *
 * @param {UmbNotificationContext} context - The notification context
 * @param {string} headline - Brief title
 * @param {string} message - Warning message
 *
 * @example
 * peekWarning(ctx, "Unsaved Changes", "You have unsaved changes that will be lost.");
 */
export function peekWarning(
  context: UmbNotificationContext | undefined,
  headline: string,
  message: string
): void {
  peek(context, "warning", headline, message);
}

/**
 * Shows an informational notification (neutral).
 *
 * Use this for general information that doesn't indicate
 * success, failure, or warning.
 *
 * @param {UmbNotificationContext} context - The notification context
 * @param {string} headline - Brief title
 * @param {string} message - Information message
 *
 * @example
 * peekInfo(ctx, "Tip", "Press Ctrl+S to save quickly.");
 */
export function peekInfo(
  context: UmbNotificationContext | undefined,
  headline: string,
  message: string
): void {
  peek(context, "default", headline, message);
}
