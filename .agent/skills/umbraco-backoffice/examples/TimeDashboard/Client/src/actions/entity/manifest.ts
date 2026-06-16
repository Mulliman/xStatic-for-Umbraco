import { UMB_DOCUMENT_ENTITY_TYPE } from "@umbraco-cms/backoffice/document";
import { TimeEntityAction } from "./time.entity.action.js";

export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'entityAction',
        kind: 'default',
        alias: 'time.entity.action',
        name: 'tell me the time action',
        weight: -100,
        forEntityTypes: [
            UMB_DOCUMENT_ENTITY_TYPE
        ],
        api: TimeEntityAction,
        meta: {
            icon: 'icon-alarm-clock',
            label: 'Time Action',
        }
    }
];
