export class TestData {
    private static readonly RUN_ID = process.env.TEST_RUN_ID || 'local';

    static get ExportTypeName() {
        return `Test Export Type ${this.RUN_ID}`;
    }

    static get ExportTypeNameEdited() {
        return `Test Export Type Edited ${this.RUN_ID}`;
    }

    static get ActionName() {
        return `Test Action ${this.RUN_ID}`;
    }

    static get ActionNameEdited() {
        return `Test Action Edited ${this.RUN_ID}`;
    }

    static get DeploymentTargetName() {
        return `Test Deployment Target ${this.RUN_ID}`;
    }

    static get DeploymentTargetNameEdited() {
        return `Test Deployment Target Edited ${this.RUN_ID}`;
    }

    static get SiteName() {
        return `Test Site ${this.RUN_ID}`;
    }

    static get SiteNameEdited() {
        return `Test Site Edited ${this.RUN_ID}`;
    }
}
