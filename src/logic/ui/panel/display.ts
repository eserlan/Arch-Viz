import { NodeSingular, EdgeSingular } from 'cytoscape';
import { CyInstance } from '../../../types';
import { updateStatus } from '../ui';
import { initPanel } from './actions';
import {
    getElements,
    currentSelectedNode,
    cyRef,
    setSelectedNode,
    setOriginalData,
    TIER_LABELS
} from './state';

export const showPanel = (node: NodeSingular): void => {
    const { servicePanel, panelContent, editBtn, editActions } = getElements();
    if (!panelContent || !servicePanel) return;

    // Auto-initialize listeners if cy instance changed
    const cy = node.cy() as CyInstance;
    if (cyRef !== cy) {
        initPanel(cy, updateStatus);
    }

    setSelectedNode(node);
    const data = node.data();
    const outgoingEdges = node.outgoers('edge');
    const connections = outgoingEdges.map((edge: EdgeSingular) => ({
        id: edge.id(),
        target: edge.target().data('name') || edge.target().data('label') || edge.target().id(),
        targetId: edge.target().id()
    }));

    // Store original data for dirty checking
    setOriginalData({
        name: data.name || data.label || '',
        labels: data.labelsDisplay || '',
        tier: data.tier?.toString() || '',
        owner: data.owner || '',
        repoUrl: data.repoUrl || '',
        verified: data.verified ? 'true' : 'false'
    });

    const verifiedBadge = data.verified
        ? `<span class="inline-flex items-center gap-1 text-slate-300 font-bold"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>Verified</span>`
        : `<span class="text-slate-500 italic">Not verified</span>`;

    panelContent.innerHTML = `
    <div class="info-item">
      <label>Service ID</label>
      <div class="info-value text-slate-500 font-mono">${data.id}</div>
    </div>
    <div class="info-item">
      <label>Verified</label>
      <div class="info-value" data-key="verified">${verifiedBadge}</div>
    </div>
    <div class="info-item">
      <label>Name</label>
      <div class="info-value" data-key="name">${data.name || data.label || ''}</div>
    </div>
    <div class="info-item">
      <label>Labels</label>
      <div class="info-value" data-key="labels">${data.labelsDisplay || ''}</div>
    </div>
    <div class="info-item">
      <label>Tier</label>
      <div class="info-value" data-key="tier">${TIER_LABELS[data.tier] || data.tier || ''}</div>
    </div>
    <div class="info-item">
      <label>Owner</label>
      <div class="info-value" data-key="owner">${data.owner || ''}</div>
    </div>
    <div class="info-item">
      <label>Repo URL</label>
      <div class="info-value" data-key="repoUrl">${data.repoUrl
            ? `<a href="${data.repoUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:text-emerald-300 underline break-all">${data.repoUrl}</a>`
            : '<span class="text-slate-500 italic">Not set</span>'}</div>
    </div>
    <div class="info-item">
      <label>Depends On</label>
      <div class="info-value connections-list">
        ${connections.length > 0
            ? connections.map(c => `<span class="connection-tag" data-id="${c.id}">${c.target}</span>`).join('')
            : '<span class="text-slate-500 italic text-xs">No dependencies</span>'}
      </div>
    </div>
  `;

    servicePanel.classList.add('active');
    editBtn?.classList.remove('hidden');
    editActions?.classList.add('hidden');
};

export const hidePanel = (): void => {
    const { servicePanel } = getElements();
    if (servicePanel) servicePanel.classList.remove('active');
    setSelectedNode(null);
    setOriginalData({});
};
