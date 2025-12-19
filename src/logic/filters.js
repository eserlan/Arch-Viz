const searchInput = document.getElementById('searchInput');
const domainFilter = document.getElementById('domainFilter');

export const applyFilters = (cy) => {
    if (!cy) return;
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedDomain = domainFilter?.value || 'all';

    cy.batch(() => {
        cy.nodes().forEach(node => {
            const label = (node.data('label') || '').toLowerCase();
            const id = node.id().toLowerCase();
            const domains = node.data('domains') || [];

            const matchesSearch = label.includes(searchTerm) || id.includes(searchTerm);
            const matchesDomain = selectedDomain === 'all' || domains.includes(selectedDomain);

            if (matchesSearch && matchesDomain) {
                node.style('display', 'element');
            } else {
                node.style('display', 'none');
            }
        });

        cy.edges().forEach(edge => {
            if (edge.source().style('display') === 'element' && edge.target().style('display') === 'element') {
                edge.style('display', 'element');
            } else {
                edge.style('display', 'none');
            }
        });
    });
};

export const populateDomainFilter = (elements) => {
    const domains = new Set();
    elements.forEach(el => {
        const data = el.data || el;
        const nodeDomains = data.domains;
        if (nodeDomains) {
            nodeDomains.forEach(d => domains.add(d));
        }
    });

    if (domainFilter) {
        const currentDomain = domainFilter.value;
        domainFilter.innerHTML = '<option value="all">All Domains</option>';
        Array.from(domains).sort().forEach(domain => {
            const option = document.createElement('option');
            option.value = domain;
            option.textContent = domain;
            domainFilter.appendChild(option);
        });
        domainFilter.value = currentDomain || 'all';
    }
};

export const initFilters = (cy) => {
    searchInput?.addEventListener('input', () => applyFilters(cy));
    domainFilter?.addEventListener('change', () => applyFilters(cy));
};
