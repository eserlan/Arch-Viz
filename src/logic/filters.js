const getElements = () => ({
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    labelFilterContainer: document.getElementById('labelFilterContainer'),
    teamFilter: document.getElementById('teamFilter'),
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
    // For label cloud container
    if (element.id === 'labelFilterContainer') {
        return Array.from(element.querySelectorAll('button[data-selected="true"]')).map(btn => btn.dataset.value);
    }
    return [];
};

const updateLabelButtonStyle = (btn, selected) => {
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

    const { searchInput, labelFilterContainer, teamFilter } = getElements();

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedLabels = getSelectedValues(labelFilterContainer);
    const selectedTeams = getSelectedValues(teamFilter);

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

export const populateLabelFilter = (elements) => {
    const { labelFilterContainer } = getElements();
    if (!labelFilterContainer) return;

    const labels = new Set();
    elements.forEach(el => {
        const data = el.data || el;
        const nodeLabels = data.labels;
        if (nodeLabels) {
            nodeLabels.forEach(d => labels.add(d));
        }
    });

    // Store currently selected values to allow persisting state during refreshes
    const currentSelections = new Set(getSelectedValues(labelFilterContainer));

    labelFilterContainer.innerHTML = '';

    if (labels.size === 0) {
        labelFilterContainer.innerHTML = '<span class="text-[10px] text-slate-500 italic px-1">No labels found</span>';
        return;
    }

    Array.from(labels).sort().forEach(label => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.value = label;

        // Restore previous selection if applicable
        const isSelected = currentSelections.has(label);
        updateLabelButtonStyle(btn, isSelected);

        // Attach direct listener to ensure reliability
        btn.onclick = (e) => {
            e.stopPropagation(); // Prevent propagation to drag handlers etc
            const selected = btn.dataset.selected === 'true';
            updateLabelButtonStyle(btn, !selected);
            if (cyRef) applyFilters(cyRef);
        };

        labelFilterContainer.appendChild(btn);
    });
};

export const populateTeamFilter = (elements) => {
    const { teamFilter } = getElements();
    if (!teamFilter) return;

    const teams = new Set();
    elements.forEach(el => {
        const data = el.data || el;
        const owner = data.owner;
        if (owner) {
            teams.add(owner);
        }
    });

    const currentSelections = getSelectedValues(teamFilter);

    teamFilter.innerHTML = '';
    Array.from(teams).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        if (currentSelections.includes(team)) {
            option.selected = true;
        }
        teamFilter.appendChild(option);
    });
};

export const initFilters = (cy) => {
    cyRef = cy;
    const { searchInput, teamFilter, clearSearchBtn } = getElements();

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

    // NOTE: Label filter container listener removed in favor of direct button listeners in populateLabelFilter

    teamFilter?.addEventListener('change', () => applyFilters(cy));
};
