import { NodeSingular, EdgeSingular } from 'cytoscape';
import { CyInstance } from '../../../types';
import { updateStatus } from '../ui';
import { initPanel } from './actions';
import {
    getElements,
    getCyRef,
    setSelectedNode,
    setOriginalData,
    setIsEditMode,
    TIER_LABELS
} from './state';

export const showPanel = (node: NodeSingular): void => {
    const { servicePanel, panelContent, editBtn, editActions } = getElements();
    if (!panelContent || !servicePanel) return;

    // Auto-initialize listeners if cy instance changed
    const cy = node.cy() as CyInstance;
    if (getCyRef() !== cy) {
        initPanel(cy, updateStatus);
    }

    setSelectedNode(node);
    const data = node.data();
    const outgoingEdges = node.outgoers('edge');
    const incomingEdges = node.incomers('edge');
    const outboundConnections = outgoingEdges.map((edge: EdgeSingular) => ({
        id: edge.id(),
        target: edge.target().data('name') || edge.target().data('label') || edge.target().id()
    }));
    const inboundConnections = incomingEdges.map((edge: EdgeSingular) => ({
        id: edge.id(),
        source: edge.source().data('name') || edge.source().data('label') || edge.source().id()
    }));

    // Store original data for dirty checking
    setOriginalData({
        name: data.name || data.label || '',
        labels: data.labelsDisplay || '',
        tier: data.tier?.toString() || '',
        owner: data.owner || '',
        repoUrl: data.repoUrl || '',
        comment: data.comment || '',
        verified: Boolean(data.verified)
    });

    panelContent.innerHTML = `
    <div class="info-item">
      <label>Service ID</label>
      <div class="info-value text-slate-500 font-mono">${data.id}</div>
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
      <label>Comment</label>
      <div class="info-value whitespace-pre-wrap" data-key="comment">${data.comment || '<span class="text-slate-500 italic">Not set</span>'}</div>
    </div>
    <div class="info-item">
      <label>Outbound Connections</label>
      <div class="info-value connections-list">
        ${outboundConnections.length > 0
            ? outboundConnections.map(c => `<span class="connection-tag connection-tag--outbound" data-id="${c.id}">→ ${c.target}</span>`).join('')
            : '<span class="text-slate-500 italic text-xs">No outbound connections</span>'}
      </div>
    </div>
    <!-- Note: Edit mode intentionally only affects the outbound connections list.
         The inbound connections list remains visible for context. -->
    <div class="info-item">
      <label>Inbound Connections</label>
      <div class="info-value connections-list">
        ${inboundConnections.length > 0
            ? inboundConnections.map(c => `<span class="connection-tag connection-tag--inbound" data-id="${c.id}">← ${c.source}</span>`).join('')
            : '<span class="text-slate-500 italic text-xs">No inbound connections</span>'}
      </div>
    </div>
  `;

    servicePanel.classList.add('active');
    editBtn?.classList.remove('hidden');
    editActions?.classList.add('hidden');

    // Reset edit mode state
    setIsEditMode(false);
};

export const hidePanel = (): void => {
    const { servicePanel } = getElements();
    if (servicePanel) servicePanel.classList.remove('active');
    setSelectedNode(null);
    setOriginalData({});
    setIsEditMode(false);
};
