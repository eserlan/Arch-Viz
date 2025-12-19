const getElements = () => ({
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    labelFilterContainer: document.getElementById('labelFilterContainer'),
    teamFilterContainer: document.getElementById('teamFilterContainer'),
});

let cyRef = null;

/**
 * Get selected values from a filter element (select or container)
 */
const getSelectedValues = (element) => {
    if (!element) return [];
    if (element.tagName === 'SELECT') {
        return Array.from(element.selectedOptions).map(opt => opt.value);
    }
    // For cloud containers (labels and teams)
    if (element.id === 'labelFilterContainer' || element.id === 'teamFilterContainer') {
        return Array.from(element.querySelectorAll('button[data-selected="true"]')).map(btn => btn.dataset.value);
    }
    return [];
};

const updateButtonStyle = (btn, selected) => {
    btn.dataset.selected = selected;
    if (selected) {
        btn.className = 'text-[10px] px-2.5 py-1 rounded-full border border-emerald-500 bg-emerald-500 text-white font-medium shadow-sm transition-all duration-200';
    } else {
        btn.className = 'text-[10px] px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-all duration-200';
    }
};

export const applyFilters = (cy) => {
    const cyInstance = cy || cyRef;
    if (!cyInstance) return;

    const { searchInput, labelFilterContainer, teamFilterContainer } = getElements();

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedLabels = getSelectedValues(labelFilterContainer);
    const selectedTeams = getSelectedValues(teamFilterContainer);

    const filterByLabels = selectedLabels.length > 0;
    const filterByTeams = selectedTeams.length > 0;

    cyInstance.batch(() => {
        cyInstance.nodes().forEach(node => {
            const name = (node.data('name') || node.data('label') || '').toLowerCase();
            const id = node.id().toLowerCase();
            const nodeLabels = node.data('labels') || [];
            const nodeOwner = node.data('owner') || '';

            const matchesSearch = name.includes(searchTerm) || id.includes(searchTerm);
            // Service matches if it has ANY of the selected labels
            const matchesLabel = !filterByLabels || selectedLabels.some(selected => nodeLabels.includes(selected));
            // Service matches if its owner is in the selected teams
            const matchesTeam = !filterByTeams || selectedTeams.includes(nodeOwner);

            if (matchesSearch && matchesLabel && matchesTeam) {
                node.removeClass('filtered');
            } else {
                node.addClass('filtered');
            }
        });

        cyInstance.edges().forEach(edge => {
            const sourceFiltered = edge.source().hasClass('filtered');
            const targetFiltered = edge.target().hasClass('filtered');

            if (!sourceFiltered && !targetFiltered) {
                edge.removeClass('filtered');
            } else {
                edge.addClass('filtered');
            }
        });
    });
};

const populateContainer = (container, items, currentSelections) => {
    if (!container) return;

    container.innerHTML = '';

    if (items.size === 0) {
        container.innerHTML = '<span class="text-[10px] text-slate-500 italic px-1">No items found</span>';
        return;
    }

    Array.from(items).sort().forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item;
        btn.dataset.value = item;

        const isSelected = currentSelections.has(item);
        updateButtonStyle(btn, isSelected);

        btn.onclick = (e) => {
            e.stopPropagation();
            const selected = btn.dataset.selected === 'true';
            updateButtonStyle(btn, !selected);
            if (cyRef) applyFilters(cyRef);
        };

        container.appendChild(btn);
    });
};

export const populateLabelFilter = (elements) => {
    const { labelFilterContainer } = getElements();
    if (!labelFilterContainer) return;

    const labels = new Set();
    elements.forEach(el => {
        const data = typeof el.data === 'function' ? el.data() : (el.data || el);
        const nodeLabels = data.labels;
        if (nodeLabels) {
            nodeLabels.forEach(d => labels.add(d));
        }
    });

    const currentSelections = new Set(getSelectedValues(labelFilterContainer));
    populateContainer(labelFilterContainer, labels, currentSelections);
};

export const populateTeamFilter = (elements) => {
    const { teamFilterContainer } = getElements();
    if (!teamFilterContainer) return;

    const teams = new Set();
    elements.forEach(el => {
        const data = typeof el.data === 'function' ? el.data() : (el.data || el);
        const owner = data.owner;
        if (owner) {
            teams.add(owner);
        }
    });

    const currentSelections = new Set(getSelectedValues(teamFilterContainer));
    populateContainer(teamFilterContainer, teams, currentSelections);
};

export const initFilters = (cy) => {
    cyRef = cy;
    const { searchInput, clearSearchBtn } = getElements();

    const handleSearchInput = () => {
        const val = searchInput.value;
        if (val.length > 0) {
            clearSearchBtn?.classList.remove('hidden');
        } else {
            clearSearchBtn?.classList.add('hidden');
        }
        applyFilters(cy);
    };

    searchInput?.addEventListener('input', handleSearchInput);

    clearSearchBtn?.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            handleSearchInput();
        }
    });

    // NOTE: Label and Team filter container listeners are handled by direct button listeners in populateContainer
};
