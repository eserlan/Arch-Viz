const getElements = () => ({
    searchInput: document.getElementById('searchInput'),
    labelFilter: document.getElementById('labelFilter'),
});

/**
 * Get selected values from a multi-select element
 */
const getSelectedLabels = (selectElement) => {
    if (!selectElement) return [];
    return Array.from(selectElement.selectedOptions).map(opt => opt.value);
};

export const applyFilters = (cy) => {
    if (!cy) return;
    const { searchInput, labelFilter } = getElements();

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedLabels = getSelectedLabels(labelFilter);

    // If no selection or only 'all' selected, show everything
    const filterByLabels = selectedLabels.length > 0 && !selectedLabels.includes('all');

    cy.batch(() => {
        cy.nodes().forEach(node => {
            const name = (node.data('name') || node.data('label') || '').toLowerCase();
            const id = node.id().toLowerCase();
            const nodeLabels = node.data('labels') || [];

            const matchesSearch = name.includes(searchTerm) || id.includes(searchTerm);
            // Service matches if it has ANY of the selected labels
            const matchesLabel = !filterByLabels || selectedLabels.some(selected => nodeLabels.includes(selected));

            if (matchesSearch && matchesLabel) {
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
    const currentSelections = getSelectedLabels(labelFilter);

    labelFilter.innerHTML = '';
    Array.from(labels).sort().forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        // Restore selection state
        if (currentSelections.includes(label)) {
            option.selected = true;
        }
        labelFilter.appendChild(option);
    });
};

export const initFilters = (cy) => {
    const { searchInput, labelFilter } = getElements();

    searchInput?.addEventListener('input', () => applyFilters(cy));
    labelFilter?.addEventListener('change', () => applyFilters(cy));
};
