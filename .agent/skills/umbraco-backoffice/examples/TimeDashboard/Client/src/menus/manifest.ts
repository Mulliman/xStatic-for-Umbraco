import type { ManifestElement } from "@umbraco-cms/backoffice/extension-api";
import type { ManifestMenu, ManifestMenuItem, ManifestSectionSidebarAppBaseMenu, MetaMenuItem, UmbMenuItemElement } from "@umbraco-cms/backoffice/menu";

const sidebarAppManifest: ManifestSectionSidebarAppBaseMenu = {
    type: 'sectionSidebarApp',
    kind: 'menuWithEntityActions',
    alias: 'TimeDashboard.SidebarApp',
    name: 'TimeDashboard Sidebar App',
    meta: {
        label: "Time",
        menu: "TimeDashboard.Menu.Nested"
    },
    conditions: [
        {
            alias: "Umb.Condition.SectionAlias",
            match: "TimeDashboard.Section.Main"
        }
    ]
};

const menuManifest: ManifestMenu = {
    type: 'menu',
    alias: 'TimeDashboard.Menu.Main',
    name: 'TimeDashboard Sidebar Menu',
    meta: {
        label: 'Time'
    }
};

const menuItemManifest: ManifestMenuItem = {
    type: 'menuItem',
    alias: 'TimeDashboard.MenuItem.TimeZones',
    name: 'TimeDashboard Time Zones Menu Item',
    meta: {
        label: 'Time zones',
        icon: 'icon-alarm-clock',
        entityType: 'time-workspace',
        menus: [
            'TimeDashboard.Menu.Main'
        ]
    },
    element: () => import('./nested-menu.element.js')
};

export interface ManifestTimeMenuItem extends ManifestElement<UmbMenuItemElement> {
    type: 'time-menu-item';
    meta: MetaMenuItem;
}

const nestedMenuManifest: ManifestMenu = {
    type: 'menu',
    alias: 'TimeDashboard.Menu.Nested',
    name: 'TimeDashboard Nested Menu',
    element: () => import('./nested-menu.element.js'),
    meta: {
        label: 'Time zones',
        icon: 'icon-alarm-clock',
        entityType: 'time-workspace',
    }
};

const nestedMenuItems: ManifestTimeMenuItem[] = [
    {
        type: 'time-menu-item',
        alias: 'TimeDashboard.MenuItem.Child1',
        name: 'TimeDashboard Child Item 1',
        weight: 200,
        meta: {
            menus: [nestedMenuManifest.alias],
            icon: 'icon-alarm-clock',
            label: 'Child Item 1',
            entityType: 'time-workspace',
        },
    },
    {
        type: 'time-menu-item',
        alias: 'TimeDashboard.MenuItem.Child2',
        name: 'TimeDashboard Child Item 2',
        weight: 100,
        meta: {
            menus: [nestedMenuManifest.alias],
            icon: 'icon-globe',
            label: 'Child Item 2',
            entityType: 'time-workspace2',
        },
    },
];

export const manifests: Array<UmbExtensionManifest> = [
    sidebarAppManifest,
    menuManifest,
    menuItemManifest,
    nestedMenuManifest,
    ...nestedMenuItems,
];
