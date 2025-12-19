import { describe, it, expect, beforeEach } from 'vitest';
import { populateDomainFilter } from './filters';

describe('Filters Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <select id="domainFilter">
        <option value="all">All Domains</option>
      </select>
      <input id="searchInput" type="text">
    `;
    });

    it('should populate domain filter unique sorted values', () => {
        const elements = [
            { data: { domains: ['Security', 'Auth'] } },
            { data: { domains: ['Security', 'Database'] } },
            { data: { domains: ['Analytics'] } }
        ];

        populateDomainFilter(elements);

        const select = document.getElementById('domainFilter');
        const options = Array.from(select.options).map(opt => opt.value);

        expect(options).toEqual(['all', 'Analytics', 'Auth', 'Database', 'Security']);
    });

    it('should handle elements without domains', () => {
        const elements = [
            { data: { label: 'No Domain Node' } },
            { data: { domains: ['Existing'] } }
        ];

        populateDomainFilter(elements);

        const select = document.getElementById('domainFilter');
        expect(select.options).toHaveLength(2); // all + Existing
    });
});
