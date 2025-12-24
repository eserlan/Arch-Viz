import { CyInstance } from '../../types';
import { NodeSingular, EdgeSingular } from 'cytoscape';

interface FilterElements {
    searchInput: HTMLInputElement | null;
    clearSearchBtn: HTMLElement | null;
    labelFilterContainer: HTMLElement | null;
    teamFilterContainer: HTMLElement | null;
}

const getElements = (): FilterElements => ({
    searchInput: document.getElementById('searchInput') as HTMLInputElement | null,
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    labelFilterContainer: document.getElementById('labelFilterContainer'),
    teamFilterContainer: document.getElementById('teamFilterContainer'),
});

let cyRef: CyInstance | null = null;

/**
 * Get selected values from a filter element (select or container)
 */
const getSelectedValues = (element: HTMLElement | null): string[] => {
    if (!element) return [];
    if (element.tagName === 'SELECT') {
        const select = element as HTMLSelectElement;
        return Array.from(select.selectedOptions).map(opt => opt.value);
    }
    // For cloud containers (labels and teams)
    if (element.id === 'labelFilterContainer' || element.id === 'teamFilterContainer') {
        return Array.from(element.querySelectorAll('button[data-selected="true"]')).map(btn => (btn as HTMLElement).dataset.value || '');
    }
    return [];
};

const updateButtonStyle = (btn: HTMLButtonElement, selected: boolean): void => {
    btn.dataset.selected = selected.toString();
    if (selected) {
        btn.className = 'text-[10px] px-2.5 py-1 rounded-full border border-emerald-500 bg-emerald-500 text-white font-medium shadow-sm transition-all duration-200';
    } else {
        btn.className = 'text-[10px] px-2.5 py-1 rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-all duration-200';
    }
};

export const applyFilters = (cy?: CyInstance): void => {
    const cyInstance = cy || cyRef;
    if (!cyInstance) return;

    const { searchInput, labelFilterContainer, teamFilterContainer } = getElements();

    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedLabels = getSelectedValues(labelFilterContainer);
    const selectedTeams = getSelectedValues(teamFilterContainer);

    const filterByLabels = selectedLabels.length > 0;
    const filterByTeams = selectedTeams.length > 0;

    cyInstance.batch(() => {
        cyInstance.nodes().forEach((node: NodeSingular) => {
            const name = (node.data('name') || node.data('label') || '').toLowerCase();
            const id = node.id().toLowerCase();
            const nodeLabels: string[] = node.data('labels') || [];
            const nodeOwner: string = node.data('owner') || '';

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

        cyInstance.edges().forEach((edge: EdgeSingular) => {
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

const populateContainer = (container: HTMLElement | null, items: Set<string>, currentSelections: Set<string>): void => {
    if (!container) return;

    container.innerHTML = '';

    if (items.size === 0) {
        container.innerHTML = '<span class="text-[10px] text-slate-500 italic px-1">No items found</span>';
        return;
    }

    const sortedItems = Array.from(items).sort();
    const half = Math.ceil(sortedItems.length / 2);
    const row1Items = sortedItems.slice(0, half);
    const row2Items = sortedItems.slice(half);

    const createButton = (item: string): HTMLButtonElement => {
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

        return btn;
    };

    // Create two row containers
    const row1 = document.createElement('div');
    row1.className = 'flex gap-2 justify-center';
    row1Items.forEach(item => row1.appendChild(createButton(item)));

    const row2 = document.createElement('div');
    row2.className = 'flex gap-2 justify-center';
    row2Items.forEach(item => row2.appendChild(createButton(item)));

    container.appendChild(row1);
    if (row2Items.length > 0) {
        container.appendChild(row2);
    }
};

export const populateLabelFilter = (elements: any[]): void => {
    const { labelFilterContainer } = getElements();
    if (!labelFilterContainer) return;

    const labels = new Set<string>();
    elements.forEach(el => {
        const data = (el && typeof el.data === 'function') ? el.data() : (el.data || el);
        const nodeLabels: string[] | undefined = data?.labels;
        if (nodeLabels) {
            nodeLabels.forEach(d => labels.add(d));
        }
    });

    const currentSelections = new Set(getSelectedValues(labelFilterContainer));
    populateContainer(labelFilterContainer, labels, currentSelections);
};

export const populateTeamFilter = (elements: any[]): void => {
    const { teamFilterContainer } = getElements();
    if (!teamFilterContainer) return;

    const teams = new Set<string>();
    elements.forEach(el => {
        const data = (el && typeof el.data === 'function') ? el.data() : (el.data || el);
        const owner: string | undefined = data?.owner;
        if (owner) {
            teams.add(owner);
        }
    });

    const currentSelections = new Set(getSelectedValues(teamFilterContainer));
    populateContainer(teamFilterContainer, teams, currentSelections);
};

export const initFilters = (cy: CyInstance | null): void => {
    cyRef = cy;
    const { searchInput, clearSearchBtn } = getElements();

    const handleSearchInput = () => {
        if (!searchInput) return;
        const val = searchInput.value;
        if (val.length > 0) {
            clearSearchBtn?.classList.remove('hidden');
        } else {
            clearSearchBtn?.classList.add('hidden');
        }
        if (cy) applyFilters(cy);
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
