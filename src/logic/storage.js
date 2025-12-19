const STORAGE_KEY = 'arch-viz-elements';
const DIRTY_KEY = 'arch-viz-dirty';

let isDirty = false;

export const saveGraphData = (elements) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
    setDirty(true);
};

export const loadGraphData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Check if we have saved data (meaning user has made changes)
    isDirty = localStorage.getItem(DIRTY_KEY) === 'true';
    return saved ? JSON.parse(saved) : null;
};

export const clearGraphData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DIRTY_KEY);
    isDirty = false;
};

export const setDirty = (value) => {
    isDirty = value;
    localStorage.setItem(DIRTY_KEY, value ? 'true' : 'false');
    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('dirty-state-change', { detail: { isDirty: value } }));
};

export const getDirtyState = () => isDirty;

export const exportToCSV = (cy) => {
    const nodes = cy.nodes();
    const edges = cy.edges();

    // Build header
    const headers = ['id', 'label', 'domain', 'tier', 'depends_on', 'owner', 'repo_url'];

    // Build rows from nodes
    const rows = nodes.map(node => {
        const data = node.data();
        // Find all edges where this node is the source
        const outgoing = edges.filter(e => e.source().id() === node.id());
        const dependsOn = outgoing.map(e => e.target().id()).join(';');

        return [
            data.id || '',
            data.label || '',
            Array.isArray(data.domains) ? data.domains.join(';') : (data.domain || ''),
            data.tier || '',
            dependsOn,
            data.owner || '',
            data.repoUrl || ''
        ].map(val => {
            // Escape commas and quotes in values
            if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = (cy) => {
    const csv = exportToCSV(cy);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Generate timestamped filename: services-YYYY-MM-DD-HHmmss.csv
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = `services-${timestamp}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
