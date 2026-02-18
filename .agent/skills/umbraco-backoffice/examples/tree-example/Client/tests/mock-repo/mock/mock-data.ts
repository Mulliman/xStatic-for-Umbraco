// Mock tree data - NOT exported from index.ts to avoid being registered as extensions

export interface MockTreeItem {
  id: string;
  name: string;
  icon: string;
  hasChildren: boolean;
}

export const rootItems: MockTreeItem[] = [
  { id: 'mock-repo-a', name: '[Mock Repo] Group A', icon: 'icon-folder', hasChildren: true },
  { id: 'mock-repo-b', name: '[Mock Repo] Group B', icon: 'icon-folder', hasChildren: true },
  { id: 'mock-repo-config', name: '[Mock Repo] Config', icon: 'icon-settings', hasChildren: false },
];

export const childrenByParent: Record<string, MockTreeItem[]> = {
  'mock-repo-a': [
    { id: 'mock-repo-a-1', name: '[Mock Repo] Item A1', icon: 'icon-document', hasChildren: false },
    { id: 'mock-repo-a-2', name: '[Mock Repo] Item A2', icon: 'icon-document', hasChildren: false },
  ],
  'mock-repo-b': [
    { id: 'mock-repo-b-1', name: '[Mock Repo] Item B1', icon: 'icon-document', hasChildren: false },
  ],
};
