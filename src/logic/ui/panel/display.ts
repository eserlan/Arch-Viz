import { NodeSingular, EdgeSingular, NodeDataDefinition } from 'cytoscape';
import { CyInstance } from '../../../types';
import { updateStatus } from '../ui';
import { initPanel } from './actions';
import {
    getElements,
    cyRef,
    setSelectedNode,
    setOriginalData,
    TIER_LABELS
} from './state';

// --- Template Helpers ---

const createVerifiedBadge = (verified: boolean): string => {
    return verified
        ? `<span class="inline-flex items-center gap-1 text-slate-300 font-bold"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>Verified</span>`
        : `<span class="text-slate-500 italic">Not verified</span>`;
};

const createRepoLink = (repoUrl: string): string => {
    return repoUrl
        ? `<a href="${repoUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline break-all">${repoUrl}</a>`
        : '<span class="text-slate-500 italic">Not set</span>';
};

const createConnectionsList = (connections: { id: string; target: string }[]): string => {
    return connections.length > 0
        ? connections.map(c => `<span class="connection-tag" data-id="${c.id}">${c.target}</span>`).join('')
        : '<span class="text-slate-500 italic text-xs">No dependencies</span>';
};

const createInfoItem = (label: string, value: string, key?: string): string => {
    const dataKey = key ? `data-key="${key}"` : '';
    const classes = key ? 'info-value' : 'info-value text-slate-500 font-mono';
    return `
    <div class="info-item">
      <label>${label}</label>
      <div class="${classes}" ${dataKey}>${value}</div>
    </div>`;
};

// --- Core Panel Logic ---

export const showPanel = (node: NodeSingular): void => {
    const { servicePanel, panelContent, editBtn, editActions } = getElements();
    if (!panelContent || !servicePanel) return;

    if (cyRef !== node.cy() as CyInstance) {
        initPanel(node.cy() as CyInstance, updateStatus);
    }

    setSelectedNode(node);
    const data = node.data();
    const outgoingEdges = node.outgoers('edge');
    const connections = outgoingEdges.map((edge: EdgeSingular) => ({
        id: edge.id(),
        target: edge.target().data('name') || edge.target().data('label') || edge.target().id(),
        targetId: edge.target().id()
    }));

    setOriginalData({
        name: data.name || data.label || '',
        labels: data.labelsDisplay || '',
        tier: data.tier?.toString() || '',
        owner: data.owner || '',
        repoUrl: data.repoUrl || '',
        verified: data.verified ? 'true' : 'false'
    });

    panelContent.innerHTML = [
        createInfoItem('Service ID', data.id),
        createInfoItem('Verified', createVerifiedBadge(data.verified), 'verified'),
        createInfoItem('Name', data.name || data.label || '', 'name'),
        createInfoItem('Labels', data.labelsDisplay || '', 'labels'),
        createInfoItem('Tier', TIER_LABELS[data.tier as number] || data.tier || '', 'tier'),
        createInfoItem('Owner', data.owner || '', 'owner'),
        createInfoItem('Repo URL', createRepoLink(data.repoUrl), 'repoUrl'),
        `<div class="info-item">
            <label>Depends On</label>
            <div class="info-value connections-list">${createConnectionsList(connections)}</div>
         </div>`
    ].join('');

    servicePanel.classList.add('active');
    editBtn?.classList.remove('hidden');
    editActions?.classList.add('hidden');
};

export const hidePanel = (): void => {
    const { servicePanel } = getElements();
    if (servicePanel) {
        servicePanel.classList.remove('active');
    }
    setSelectedNode(null);
    setOriginalData({});
};
