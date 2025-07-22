// import { ManifestSection } from '@umbraco-cms/backoffice/extension-registry';

import { ManifestSection } from "@umbraco-cms/backoffice/section";

const sectionManifest: ManifestSection = {
    type: 'section',
    alias: 'xStatic.Section',
    name: 'xStatic',
    meta: {
        label: 'xStatic',
        pathname: 'xstatic'
    }
}

export default sectionManifest;