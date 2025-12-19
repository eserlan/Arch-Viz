import { describe, it, expect, beforeEach } from 'vitest';
import { populateLabelFilter, applyFilters } from './filters';

describe('Filters Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <select id="labelFilter" multiple>
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

        const select = document.getElementById('labelFilter');
        const options = Array.from(select.options).map(opt => opt.value);

        expect(options).toEqual(['Analytics', 'Auth', 'Database', 'Security']);
    });

    it('should handle elements without labels', () => {
        const elements = [
            { data: { name: 'No Labels Node' } },
            { data: { labels: ['Existing'] } }
        ];

        populateLabelFilter(elements);

        const select = document.getElementById('labelFilter');
        expect(select.options).toHaveLength(1); // Only 'Existing'
    });

    it('should allow multi-select filtering', () => {
        const elements = [
            { data: { labels: ['Security', 'Identity'] } },
            { data: { labels: ['Database'] } },
            { data: { labels: ['Analytics'] } }
        ];

        populateLabelFilter(elements);

        const select = document.getElementById('labelFilter');
        // Select both Security and Identity
        Array.from(select.options).forEach(opt => {
            opt.selected = (opt.value === 'Security' || opt.value === 'Identity');
        });

        const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
        expect(selectedOptions).toEqual(['Identity', 'Security']);
    });
});
