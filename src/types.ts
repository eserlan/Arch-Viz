import { Core } from 'cytoscape';

export type Tier = 1 | 2 | 3 | 4;

export interface ServiceData {
    id: string;
    name: string;
    owner?: string | null;
    tier?: Tier;
    labels?: string[];
    repoUrl?: string;
    depends_on?: string[];
    verified?: boolean;
    labelDisplay?: string;
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
    defaultClasses?: string[];
}

export type CyInstance = Core;
