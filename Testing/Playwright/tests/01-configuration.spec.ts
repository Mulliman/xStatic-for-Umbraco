import { test } from '@playwright/test';
import { ExportTypePage } from '../pages/ExportTypePage';
import { ActionPage } from '../pages/ActionPage';
import { DeploymentTargetPage } from '../pages/DeploymentTargetPage';
import { TestData } from './test-data';

test.describe('Initial Configuration', () => {
    
    test('Create and Edit Export Type', async ({ page }) => {
        const exportTypePage = new ExportTypePage(page);
        
        // Arrange
        await exportTypePage.goto();

        // Act
        // Make sure we select the options by text so it works regardless of IDs
        await exportTypePage.create(
            TestData.ExportTypeName,
            'DefaultHtmlTransformerListFactory',
            'StaticHtmlSiteGenerator',
            'EverythingIsIndexHtmlFileNameGenerator'
        );

        // Assert
        await exportTypePage.verifyExists(
            TestData.ExportTypeName,
            'DefaultHtmlTransformerListFactory',
            'StaticHtmlSiteGenerator',
            'EverythingIsIndexHtmlFileNameGenerator'
        );

        // Edit
        await exportTypePage.edit(TestData.ExportTypeName, TestData.ExportTypeNameEdited);

        // Assert
        await exportTypePage.verifyExists(TestData.ExportTypeNameEdited, '', '', '');
    });

    test('Create and Edit Action', async ({ page }) => {
        const actionPage = new ActionPage(page);

        // Arrange
        await actionPage.goto();

        // Act
        // config keys mirror the "Field for X" logic if possible or update POM to handle mapping
        // In POM I did: getByRole('textbox', { name: `Field for ${key}` })
        await actionPage.create(TestData.ActionName, 'FileCopyAction', {
            'FilePath': 'index.html',
            'NewFilePath': 'index2.html'
        });

        // Assert
        await actionPage.verifyExists(TestData.ActionName, 'FileCopyAction');

        // Edit
        await actionPage.edit(TestData.ActionName, TestData.ActionNameEdited);

        // Assert
        await actionPage.verifyExists(TestData.ActionNameEdited, 'FileCopyAction');
    });

    test('Create and Edit Deployment Target', async ({ page }) => {
        const deploymentTargetPage = new DeploymentTargetPage(page);

        // Arrange
        await deploymentTargetPage.goto();

        // Act
        await deploymentTargetPage.create(TestData.DeploymentTargetName, 'filesystem', {
            'Folder Path': 'C:\\Public\\XStaticTestDeploy'
        });

        // Assert
        await deploymentTargetPage.verifyExists(TestData.DeploymentTargetName, 'filesystem');

        // Edit
        await deploymentTargetPage.edit(TestData.DeploymentTargetName, TestData.DeploymentTargetNameEdited);

        // Assert
        await deploymentTargetPage.verifyExists(TestData.DeploymentTargetNameEdited, 'filesystem');
    });

});
