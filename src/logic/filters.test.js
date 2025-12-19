import { describe, it, expect, beforeEach, vi } from 'vitest';
import { populateLabelFilter, populateTeamFilter, applyFilters, initFilters } from './filters';

describe('Filters Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="labelFilterContainer"></div>
      <select id="teamFilter" multiple>
      </select>
      <input id="searchInput" type="text">
    `;
    });

    it('should populate label filter with unique sorted values', () => {
        const elements = [
            { data: { labels: ['Security', 'Auth'] } },
            { data: { labels: ['Security', 'Database'] } },
            { data: { labels: ['Analytics'] } }
        ];

        populateLabelFilter(elements);

        const container = document.getElementById('labelFilterContainer');
        const buttons = Array.from(container.querySelectorAll('button')).map(btn => btn.dataset.value);

        expect(buttons).toEqual(['Analytics', 'Auth', 'Database', 'Security']);
    });

    it('should handle elements without labels', () => {
        const elements = [
            { data: { name: 'No Labels Node' } },
            { data: { labels: ['Existing'] } }
        ];

        populateLabelFilter(elements);

        const container = document.getElementById('labelFilterContainer');
        expect(container.querySelectorAll('button')).toHaveLength(1); // Only 'Existing'
    });

    it('should allow multi-select filtering persistence', () => {
        const elements = [
            { data: { labels: ['Security', 'Identity'] } },
            { data: { labels: ['Database'] } },
            { data: { labels: ['Analytics'] } }
        ];

        populateLabelFilter(elements);

        const container = document.getElementById('labelFilterContainer');
        const buttons = container.querySelectorAll('button');

        // Simulate selection
        buttons.forEach(btn => {
            if (btn.dataset.value === 'Security' || btn.dataset.value === 'Identity') {
                btn.dataset.selected = 'true';
            }
        });

        // Repopulate (simulating a refresh/update) should maintain selection
        populateLabelFilter(elements);

        const newButtons = document.getElementById('labelFilterContainer').querySelectorAll('button');
        const selectedValues = Array.from(newButtons)
            .filter(btn => btn.dataset.selected === 'true')
            .map(btn => btn.dataset.value)
            .sort();

        expect(selectedValues).toEqual(['Identity', 'Security']);
    });

    it('should populate team filter with unique sorted values', () => {
        const elements = [
            { data: { owner: 'Platform Team' } },
            { data: { owner: 'Security Team' } },
            { data: { owner: 'Platform Team' } },
            { data: { owner: 'DB Team' } }
        ];

        populateTeamFilter(elements);

        const select = document.getElementById('teamFilter');
        const options = Array.from(select.options).map(opt => opt.value);

        expect(options).toEqual(['DB Team', 'Platform Team', 'Security Team']);
    });

    it('should handle elements without owner', () => {
        const elements = [
            { data: { name: 'No Owner Node' } },
            { data: { owner: 'Some Team' } }
        ];

        populateTeamFilter(elements);

        const select = document.getElementById('teamFilter');
        expect(select.options).toHaveLength(1); // Only 'Some Team'
    });

    it('should update filters on button click', () => {
        const elements = [{ data: { labels: ['Test'] } }];

        // Mock cy
        const cy = {
            batch: vi.fn((cb) => cb()),
            nodes: vi.fn().mockReturnValue([]),
            edges: vi.fn().mockReturnValue([])
        };

        initFilters(cy); // Sets cyRef
        populateLabelFilter(elements);

        const btn = document.querySelector('button[data-value="Test"]');
        expect(btn).toBeTruthy();

        // Simulate click
        btn.click();

        expect(btn.dataset.selected).toBe('true');
        expect(cy.batch).toHaveBeenCalled();
    });
});
