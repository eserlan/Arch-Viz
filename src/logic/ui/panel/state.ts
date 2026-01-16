import { NodeSingular } from 'cytoscape';
import { CyInstance } from '../../../types';

// Keep state variables private to the module
let currentSelectedNode: NodeSingular | null = null;
let cyRef: CyInstance | null = null;
let updateStatusRef: ((msg: string) => void) | null = null;
let originalData: Record<string, string | boolean> = {};
let isEditMode = false;
let isMinimized = false;

// Export getters to access the state
export const getCurrentSelectedNode = () => currentSelectedNode;
export const getCyRef = () => cyRef;
export const getUpdateStatusRef = () => updateStatusRef;
export const getOriginalData = () => originalData;
export const getIsEditMode = () => isEditMode;
export const getIsMinimized = () => isMinimized;

export const setSelectedNode = (node: NodeSingular | null) => {
    currentSelectedNode = node;
};

export const setCyRef = (cy: CyInstance) => {
    cyRef = cy;
};

export const setUpdateStatusRef = (fn: (msg: string) => void) => {
    updateStatusRef = fn;
};

export const setOriginalData = (data: Record<string, string | boolean>) => {
    originalData = data;
};

export const resetOriginalData = () => {
    originalData = {};
};

export const setIsEditMode = (editing: boolean) => {
    isEditMode = editing;
};

export const setIsMinimized = (minimized: boolean) => {
    isMinimized = minimized;
};

export interface PanelElements {
    servicePanel: HTMLElement | null;
    panelContent: HTMLElement | null;
    editBtn: HTMLElement | null;
    minimizeBtn: HTMLElement | null;
    editActions: HTMLElement | null;
    saveBtn: HTMLButtonElement | null;
    cancelBtn: HTMLElement | null;
    deleteNodeBtn: HTMLElement | null;
}

export const getElements = (): PanelElements => ({
    servicePanel: document.getElementById('servicePanel'),
    panelContent: document.getElementById('panelContent'),
    editBtn: document.getElementById('editBtn'),
    minimizeBtn: document.getElementById('minimizeBtn'),
    editActions: document.getElementById('editActions'),
    saveBtn: document.getElementById('saveBtn') as HTMLButtonElement | null,
    cancelBtn: document.getElementById('cancelBtn'),
    deleteNodeBtn: document.getElementById('deleteNodeBtn'),
});

export const TIER_LABELS: Record<number, string> = {
    1: 'Tier 1 (Critical)',
    2: 'Tier 2 (Major)',
    3: 'Tier 3 (Minor)',
    4: 'Tier 4 (Low)',
};
