import { NodeSingular, EdgeSingular } from 'cytoscape';
import { CyInstance, ServiceData } from '../../../types';

export let currentSelectedNode: NodeSingular | null = null;
export let cyRef: CyInstance | null = null;
export let updateStatusRef: ((msg: string) => void) | null = null;
export let originalData: Record<string, string> = {};

export const setSelectedNode = (node: NodeSingular | null) => {
    currentSelectedNode = node;
};

export const setCyRef = (cy: CyInstance) => {
    cyRef = cy;
};

export const setUpdateStatusRef = (fn: (msg: string) => void) => {
    updateStatusRef = fn;
};

export const setOriginalData = (data: Record<string, string>) => {
    originalData = data;
};

export const resetOriginalData = () => {
    originalData = {};
};

export interface PanelElements {
    servicePanel: HTMLElement | null;
    panelContent: HTMLElement | null;
    editBtn: HTMLElement | null;
    editActions: HTMLElement | null;
    saveBtn: HTMLButtonElement | null;
    cancelBtn: HTMLElement | null;
    deleteNodeBtn: HTMLElement | null;
}

export const getElements = (): PanelElements => ({
    servicePanel: document.getElementById('servicePanel'),
    panelContent: document.getElementById('panelContent'),
    editBtn: document.getElementById('editBtn'),
    editActions: document.getElementById('editActions'),
    saveBtn: document.getElementById('saveBtn') as HTMLButtonElement | null,
    cancelBtn: document.getElementById('cancelBtn'),
    deleteNodeBtn: document.getElementById('deleteNodeBtn'),
});

export const TIER_LABELS: Record<number, string> = {
    1: 'Tier 1 (Critical)',
    2: 'Tier 2 (Major)',
    3: 'Tier 3 (Minor)',
    4: 'Tier 4 (Low)'
};
