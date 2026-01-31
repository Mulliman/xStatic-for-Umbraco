import { test } from '@playwright/test';
import { SitePage } from '../pages/SitePage';
import { TestData } from './test-data';

test('Create and edit a site definition', async ({ page }) => {
    const sitePage = new SitePage(page);

    // Arrange
    await sitePage.goto();

    // Act
    await sitePage.create(
        TestData.SiteName,
        'Home', // Assuming 'Home' node exists in the test content
        TestData.ExportTypeNameEdited
    );

    // Assert
    await sitePage.verifyExists(TestData.SiteName, TestData.ExportTypeNameEdited);

    // Edit Act
    await sitePage.edit(TestData.SiteName, TestData.SiteNameEdited);

    // Assert
    await sitePage.verifyExists(TestData.SiteNameEdited);
});
