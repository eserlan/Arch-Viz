import { CyInstance } from '../types';
import { ElementDefinition, NodeSingular, EdgeSingular } from 'cytoscape';
import { recordSnapshot } from './history';

const STORAGE_KEY = 'arch-viz-elements';
const DIRTY_KEY = 'arch-viz-dirty';

let isDirty = false;

export const saveGraphData = (
    elements: ElementDefinition[],
    options?: { skipHistory?: boolean }
): void => {
    if (!options?.skipHistory) {
        recordSnapshot(elements);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    setDirty(true);
};

export const loadGraphData = (): ElementDefinition[] | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Check if we have saved data (meaning user has made changes)
    isDirty = localStorage.getItem(DIRTY_KEY) === 'true';
    if (!saved) return null;

    // Parse and strip selection state to ensure no node is pre-selected on reload
    const elements = JSON.parse(saved) as ElementDefinition[];
    return elements.map(el => {
        if (el.selected !== undefined) {
            const { selected, ...rest } = el;
            return rest as ElementDefinition;
        }
        return el;
    });
};

export const clearGraphData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DIRTY_KEY);
    isDirty = false;
};

export const setDirty = (value: boolean): void => {
    isDirty = value;
    localStorage.setItem(DIRTY_KEY, value ? 'true' : 'false');
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('dirty-state-change', { detail: { isDirty: value } }));
};

export const getDirtyState = (): boolean => isDirty;

export const exportToCSV = (cy: CyInstance): string => {
    const nodes = cy.nodes();
    const edges = cy.edges();

    // Build header
    const headers = ['id', 'name', 'labels', 'tier', 'depends_on', 'owner', 'repo_url', 'verified'];

    // Build rows from nodes
    const rows = nodes.map((node: NodeSingular) => {
        const data = node.data();
        // Find all edges where this node is the source
        const outgoing = edges.filter((e: EdgeSingular) => e.source().id() === node.id());
        const dependsOn = outgoing.map((e: EdgeSingular) => e.target().id()).join(';');

        return [
            data.id || '',
            data.name || data.label || '',
            Array.isArray(data.labels) ? data.labels.join(';') : (data.labelsDisplay || ''),
            data.tier || '',
            dependsOn,
            data.owner || '',
            data.repoUrl || '',
            data.verified ? 'true' : 'false'
        ].map(val => {
            // Escape commas and quotes in values
            const valStr = val.toString();
            if (valStr.includes(',') || valStr.includes('"')) {
                return `"${valStr.replace(/"/g, '""')}"`;
            }
            return valStr;
        }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = (cy: CyInstance): void => {
    const csv = exportToCSV(cy);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Generate timestamped filename: services-YYYY-MM-DD-HHmmss.csv
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `services-${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    // After successful download, reset the dirty state
    setDirty(false);
};
