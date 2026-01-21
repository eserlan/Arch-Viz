import { Core } from 'cytoscape';

export type Tier = 1 | 2 | 3 | 4;

export interface ServiceData {
    id: string;
    name: string;
    owner?: string | null;
    tier?: Tier;
    labels?: string[];
    appCode?: string;
    repoUrl?: string;
    comment?: string;
    depends_on?: string[];
    verified?: boolean;
    labelDisplay?: string;
}

/**
 * Raw CSV structure based on expected headers:
 * id,name,labels,tier,depends_on,owner,repo_url,app_code,comment,verified
 */
export interface CsvServiceRow {
    id: string;
    name?: string;
    label?: string; // legacy support for name
    labels?: string;
    domain?: string; // legacy support for labels
    tier?: string;
    owner?: string;
    depends_on?: string;
    app_code?: string;
    repo_url?: string;
    comment?: string;
    verified?: string;
}

export interface GraphNode {
    data: ServiceData;
}

export interface GraphEdge {
    data: {
        id: string;
        source: string;
        target: string;
    };
}

export type GraphElement = GraphNode | GraphEdge;

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface PanelConfig {
    panelId: string;
    title: string;
    iconKey: 'LABEL' | 'TEAM';
    menuBtnId: string;
    menuId: string;
    moveBtnId: string;
    containerId: string;
    storageKey: string;
    minimizeBtnId: string;
    minimizedStorageKey: string;
    defaultClasses?: string[];
}

export type CyInstance = Core;
