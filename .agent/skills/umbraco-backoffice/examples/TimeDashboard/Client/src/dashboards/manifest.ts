export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'dashboard',
        name: 'TimeDashboard Dashboard',
        alias: 'TimeDashboard.Dashboard.Main',
        elementName: 'time-dashboard-element',
        element: () => import("./dashboard.element.js"),
        weight: -10,
        meta: {
            label: 'Time Dashboard',
            pathname: 'time-dashboard'
        },
        conditions: [
            {
                alias: 'Umb.Condition.SectionAlias',
                match: 'TimeDashboard.Section.Main'
            }
        ]
    }
];
