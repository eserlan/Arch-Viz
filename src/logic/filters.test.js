import { describe, it, expect, beforeEach } from 'vitest';
import { populateLabelFilter } from './filters';

describe('Filters Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <select id="labelFilter">
        <option value="all">All Labels</option>
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

        expect(options).toEqual(['all', 'Analytics', 'Auth', 'Database', 'Security']);
    });

    it('should handle elements without labels', () => {
        const elements = [
            { data: { name: 'No Labels Node' } },
            { data: { labels: ['Existing'] } }
        ];

        populateLabelFilter(elements);

        const select = document.getElementById('labelFilter');
        expect(select.options).toHaveLength(2); // all + Existing
    });
});
