/**
 * Document Type E2E Tests
 *
 * Demonstrates:
 * - AAA pattern (Arrange-Act-Assert)
 * - umbracoApi for fast test setup
 * - umbracoUi for UI interactions
 * - Idempotent cleanup with ensureNameNotExists
 *
 * Based on: Umbraco.Tests.AcceptanceTest/tests/DefaultConfig/Settings/DocumentType/DocumentType.spec.ts
 */

import { ConstantHelper, test } from '@umbraco/playwright-testhelpers';
import { expect } from '@playwright/test';

const documentTypeName = 'E2ETestDocumentType';

test.beforeEach(async ({ umbracoUi, umbracoApi }) => {
	// Ensure clean state before each test
	await umbracoApi.documentType.ensureNameNotExists(documentTypeName);
	await umbracoUi.goToBackOffice();
});

test.afterEach(async ({ umbracoApi }) => {
	// Cleanup after each test (idempotent)
	await umbracoApi.documentType.ensureNameNotExists(documentTypeName);
});

test('can create a document type', { tag: '@smoke' }, async ({ umbracoApi, umbracoUi }) => {
	// Arrange
	await umbracoUi.documentType.goToSection(ConstantHelper.sections.settings);

	// Act
	await umbracoUi.documentType.clickActionsMenuAtRoot();
	await umbracoUi.documentType.clickCreateActionMenuOption();
	await umbracoUi.documentType.clickCreateDocumentTypeButton();
	await umbracoUi.documentType.enterDocumentTypeName(documentTypeName);
	await umbracoUi.documentType.clickSaveButton();

	// Assert
	await umbracoUi.documentType.waitForDocumentTypeToBeCreated();
	expect(await umbracoApi.documentType.doesNameExist(documentTypeName)).toBeTruthy();
	await umbracoUi.documentType.reloadTree('Document Types');
	await umbracoUi.documentType.isDocumentTreeItemVisible(documentTypeName);
});

test('can create an element type', { tag: '@smoke' }, async ({ umbracoApi, umbracoUi }) => {
	// Arrange
	await umbracoUi.documentType.goToSection(ConstantHelper.sections.settings);

	// Act
	await umbracoUi.documentType.clickActionsMenuAtRoot();
	await umbracoUi.documentType.clickCreateActionMenuOption();
	await umbracoUi.documentType.clickCreateElementTypeButton();
	await umbracoUi.documentType.enterDocumentTypeName(documentTypeName);
	await umbracoUi.documentType.clickSaveButton();

	// Assert
	await umbracoUi.documentType.waitForDocumentTypeToBeCreated();
	expect(await umbracoApi.documentType.doesNameExist(documentTypeName)).toBeTruthy();
	// Verify isElement flag is true
	const documentTypeData = await umbracoApi.documentType.getByName(documentTypeName);
	expect(documentTypeData.isElement).toBeTruthy();
});

test('can rename a document type', { tag: '@smoke' }, async ({ umbracoApi, umbracoUi }) => {
	// Arrange
	const wrongName = 'WrongDocumentTypeName';
	await umbracoApi.documentType.ensureNameNotExists(wrongName);
	await umbracoApi.documentType.createDefaultDocumentType(wrongName);
	await umbracoUi.documentType.goToSection(ConstantHelper.sections.settings);

	// Act
	await umbracoUi.documentType.goToDocumentType(wrongName);
	await umbracoUi.documentType.enterDocumentTypeName(documentTypeName);
	await umbracoUi.documentType.clickSaveButton();

	// Assert
	await umbracoUi.documentType.isSuccessStateVisibleForSaveButton();
	expect(await umbracoApi.documentType.doesNameExist(documentTypeName)).toBeTruthy();
	await umbracoUi.documentType.isDocumentTreeItemVisible(wrongName, false);
	await umbracoUi.documentType.isDocumentTreeItemVisible(documentTypeName);
});

test('can delete a document type', { tag: '@smoke' }, async ({ umbracoApi, umbracoUi }) => {
	// Arrange
	await umbracoApi.documentType.createDefaultDocumentType(documentTypeName);
	await umbracoUi.documentType.goToSection(ConstantHelper.sections.settings);
	expect(await umbracoApi.documentType.doesNameExist(documentTypeName)).toBeTruthy();

	// Act
	await umbracoUi.documentType.clickRootFolderCaretButton();
	await umbracoUi.documentType.clickActionsMenuForDocumentType(documentTypeName);
	await umbracoUi.documentType.clickDeleteAndConfirmButton();

	// Assert
	await umbracoUi.documentType.waitForDocumentTypeToBeDeleted();
	expect(await umbracoApi.documentType.doesNameExist(documentTypeName)).toBeFalsy();
});

test('can add an icon for a document type', async ({ umbracoApi, umbracoUi }) => {
	// Arrange
	const bugIcon = 'icon-bug';
	await umbracoApi.documentType.createDefaultDocumentType(documentTypeName);
	await umbracoUi.documentType.goToSection(ConstantHelper.sections.settings);

	// Act
	await umbracoUi.documentType.goToDocumentType(documentTypeName);
	await umbracoUi.waitForTimeout(500);
	await umbracoUi.documentType.updateIcon(bugIcon);
	await umbracoUi.documentType.clickSaveButton();

	// Assert
	await umbracoUi.documentType.isSuccessStateVisibleForSaveButton();
	const documentTypeData = await umbracoApi.documentType.getByName(documentTypeName);
	expect(documentTypeData.icon).toBe(bugIcon);
});
