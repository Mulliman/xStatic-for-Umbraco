import type { ManifestDashboard } from "@umbraco-cms/backoffice/extension-registry";

const dashboards: Array<ManifestDashboard> = [
    {
        type: 'dashboard',
        name: 'XStatic',
        alias: 'XStatic.mainDashboard',
        elementName: 'xstatic-main-dashboard',
        js: ()=> import('./main-dashboard.element.js'),
        weight: 100,
        meta: {
            label: 'xStatic Sites',
            pathname: 'xstatic'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'xStatic.Section'
            },
            {
                alias: 'xStatic.xStaticNormalUserCondition'
            }
        ]
    },
    {
        type: 'dashboard',
        name: 'XStatic Export Types',
        alias: 'XStatic.exportTypesDashboard',
        elementName: 'xstatic-export-types-dashboard',
        js: ()=> import('./export-types-dashboard.element.js'),
        weight: 50,
        meta: {
            label: 'Export Types',
            pathname: 'xstatic-export-types'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'xStatic.Section'
            },
            {
                alias: 'xStatic.xStaticNormalUserCondition'
            }
        ]
    },
    {
        type: 'dashboard',
        name: 'XStatic Deployment Targets',
        alias: 'XStatic.deploymentTargetDashboard',
        elementName: 'xstatic-deployment-target-dashboard',
        js: ()=> import('./deployment-target-dashboard.element.js'),
        weight: 40,
        meta: {
            label: 'Deployment Targets',
            pathname: 'xstatic-deployment-targets'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'xStatic.Section'
            },
            {
                alias: 'xStatic.xStaticAdminUserCondition'
            }
        ]
    },
    {
        type: 'dashboard',
        name: 'XStatic Actions',
        alias: 'XStatic.actionsDashboard',
        elementName: 'xstatic-actions-dashboard',
        js: ()=> import('./actions-dashboard.element.js'),
        weight: 30,
        meta: {
            label: 'Actions',
            pathname: 'xstatic-actions'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'xStatic.Section'
            },
            {
                alias: 'xStatic.xStaticAdminUserCondition'
            }
        ]
    },
    {
        type: 'dashboard',
        name: 'XStatic Config',
        alias: 'XStatic.configDashboard',
        elementName: 'xstatic-config-dashboard',
        js: ()=> import('./config-dashboard.element.js'),
        weight: 10,
        meta: {
            label: 'Config',
            pathname: 'xstatic-config'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'xStatic.Section'
            },
            {
                alias: 'xStatic.xStaticNormalUserCondition'
            }
        ]
    },
    {
        type: 'dashboard',
        name: 'XStatic Documentation',
        alias: 'XStatic.infoDashboard',
        elementName: 'xstatic-info-dashboard',
        js: ()=> import('./info-dashboard.element.js'),
        weight: 1,
        meta: {
            label: 'Documentation',
            pathname: 'xstatic-info'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'xStatic.Section'
            },
            {
                alias: 'xStatic.xStaticNormalUserCondition'
            }
        ]
    }
]

export const manifests = [...dashboards];