const getElements = () => ({
    searchInput: document.getElementById('searchInput'),
    labelFilter: document.getElementById('labelFilter'),
});

export const applyFilters = (cy) => {
    if (!cy) return;
    const { searchInput, labelFilter } = getElements();

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedLabel = labelFilter?.value || 'all';

    cy.batch(() => {
        cy.nodes().forEach(node => {
            const name = (node.data('name') || node.data('label') || '').toLowerCase();
            const id = node.id().toLowerCase();
            const labels = node.data('labels') || [];

            const matchesSearch = name.includes(searchTerm) || id.includes(searchTerm);
            const matchesLabel = selectedLabel === 'all' || labels.includes(selectedLabel);

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

    const currentLabel = labelFilter.value;
    labelFilter.innerHTML = '<option value="all">All Labels</option>';
    Array.from(labels).sort().forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        labelFilter.appendChild(option);
    });
    labelFilter.value = currentLabel || 'all';
};

export const initFilters = (cy) => {
    const { searchInput, labelFilter } = getElements();

    searchInput?.addEventListener('input', () => applyFilters(cy));
    labelFilter?.addEventListener('change', () => applyFilters(cy));
};
