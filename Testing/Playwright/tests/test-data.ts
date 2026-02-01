export class TestData {
    private static readonly RUN_ID = process.env.TEST_RUN_ID || 'local';

    static get ExportTypeName() {
        return `Test Export Type ${this.RUN_ID}`;
    }

    static get ExportTypeNameEdited() {
        return `Edited Export Type ${this.RUN_ID}`;
    }

    static get ActionName() {
        return `Test Action ${this.RUN_ID}`;
    }

    static get ActionNameEdited() {
        return `Edited Action ${this.RUN_ID}`;
    }

    static get DeploymentTargetName() {
        return `Test Deployment Target ${this.RUN_ID}`;
    }

    static get DeploymentTargetNameEdited() {
        return `Edited Deployment Target ${this.RUN_ID}`;
    }

    static get SiteName() {
        return `Test Site ${this.RUN_ID}`;
    }

    static get SiteNameEdited() {
        return `Edited Test Site ${this.RUN_ID}`;
    }
}
