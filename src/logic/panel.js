import { saveGraphData } from './storage';

let currentSelectedNode = null;
const servicePanel = document.getElementById('servicePanel');
const panelContent = document.getElementById('panelContent');
const editBtn = document.getElementById('editBtn');
const editActions = document.getElementById('editActions');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

export const showPanel = (node) => {
    currentSelectedNode = node;
    const data = node.data();

    panelContent.innerHTML = `
    <div class="info-item">
      <label>Service ID</label>
      <div class="info-value text-slate-500 font-mono">${data.id}</div>
    </div>
    <div class="info-item">
      <label>Label</label>
      <div class="info-value" data-key="label">${data.label || ''}</div>
    </div>
    <div class="info-item">
      <label>Domain</label>
      <div class="info-value" data-key="domain">${data.domain || ''}</div>
    </div>
    <div class="info-item">
      <label>Tier</label>
      <div class="info-value" data-key="tier">${data.tier || ''}</div>
    </div>
    <div class="info-item">
      <label>Owner</label>
      <div class="info-value" data-key="owner">${data.owner || ''}</div>
    </div>
    <div class="info-item">
      <label>Repo URL</label>
      <div class="info-value" data-key="repoUrl">${data.repoUrl || ''}</div>
    </div>
  `;

    servicePanel.classList.add('active');
    editBtn.classList.remove('hidden');
    editActions.classList.add('hidden');
};

export const hidePanel = () => {
    if (servicePanel) servicePanel.classList.remove('active');
    currentSelectedNode = null;
};

const toggleEdit = (editing) => {
    const values = panelContent.querySelectorAll('.info-value[data-key]');
    values.forEach(el => {
        if (editing) {
            const currentVal = el.textContent;
            const key = el.dataset.key;
            el.innerHTML = `<input type="text" data-key="${key}" value="${currentVal}">`;
        } else {
            const input = el.querySelector('input');
            const val = input ? input.value : el.textContent;
            el.textContent = val;
        }
    });

    if (editing) {
        editBtn.classList.add('hidden');
        editActions.classList.remove('hidden');
    } else {
        editBtn.classList.remove('hidden');
        editActions.classList.add('hidden');
    }
};

export const initPanel = (cy, updateStatus) => {
    editBtn?.addEventListener('click', () => toggleEdit(true));
    cancelBtn?.addEventListener('click', () => toggleEdit(false));

    saveBtn?.addEventListener('click', () => {
        if (!currentSelectedNode) return;

        const inputs = panelContent.querySelectorAll('input');
        const newData = {};
        inputs.forEach(input => {
            const key = input.dataset.key;
            newData[key] = input.value;
        });

        if (newData.domain) {
            const domains = newData.domain.split(',').map(d => d.trim()).filter(Boolean);
            newData.domains = domains;
            const newDomainClasses = domains.map(d => `domain-${d.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).join(' ');
            currentSelectedNode.classes(currentSelectedNode.classes().replace(/domain-\S+/g, '').trim() + ' ' + newDomainClasses);
        }

        currentSelectedNode.data(newData);

        // Save state
        const allElements = cy.elements().jsons();
        saveGraphData(allElements);

        updateStatus(`Updated ${newData.label || currentSelectedNode.id()}`);
        toggleEdit(false);
    });
};
