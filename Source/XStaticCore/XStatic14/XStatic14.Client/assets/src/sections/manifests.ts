import { ManifestSection } from '@umbraco-cms/backoffice/extension-registry';

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