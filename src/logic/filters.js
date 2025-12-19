const getElements = () => ({
    searchInput: document.getElementById('searchInput'),
    labelFilter: document.getElementById('labelFilter'),
    teamFilter: document.getElementById('teamFilter'),
});

/**
 * Get selected values from a multi-select element
 */
const getSelectedValues = (selectElement) => {
    if (!selectElement) return [];
    return Array.from(selectElement.selectedOptions).map(opt => opt.value);
};

export const applyFilters = (cy) => {
    if (!cy) return;
    const { searchInput, labelFilter, teamFilter } = getElements();

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedLabels = getSelectedValues(labelFilter);
    const selectedTeams = getSelectedValues(teamFilter);

    const filterByLabels = selectedLabels.length > 0;
    const filterByTeams = selectedTeams.length > 0;

    cy.batch(() => {
        cy.nodes().forEach(node => {
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

        cy.edges().forEach(edge => {
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
    const { labelFilter } = getElements();
    if (!labelFilter) return;

    const labels = new Set();
    elements.forEach(el => {
        const data = el.data || el;
        const nodeLabels = data.labels;
        if (nodeLabels) {
            nodeLabels.forEach(d => labels.add(d));
        }
    });

    // Store currently selected values
    const currentSelections = getSelectedValues(labelFilter);

    labelFilter.innerHTML = '';
    Array.from(labels).sort().forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        if (currentSelections.includes(label)) {
            option.selected = true;
        }
        labelFilter.appendChild(option);
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

    // Store currently selected values
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
    const { searchInput, labelFilter, teamFilter } = getElements();

    searchInput?.addEventListener('input', () => applyFilters(cy));
    labelFilter?.addEventListener('change', () => applyFilters(cy));
    teamFilter?.addEventListener('change', () => applyFilters(cy));
};
