import { describe, it, expect, beforeEach, vi } from 'vitest';
import { populateLabelFilter, populateTeamFilter, applyFilters, initFilters } from './filters';

describe('Filters Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="labelFilterContainer"></div>
      <div id="teamFilterContainer"></div>
      <input id="searchInput" type="text">
      <button id="clearSearchBtn" class="hidden"></button>
    `;
        vi.clearAllMocks();
        initFilters(null); // Reset module state
    });

    const createMockNode = (id, labels, owner) => ({
        id: () => id,
        data: vi.fn((key) => {
            const d = { id, name: `Service ${id}`, labels, owner };
            return key ? d[key] : d;
        }),
        hasClass: vi.fn().mockReturnValue(false),
        addClass: vi.fn(),
        removeClass: vi.fn()
    });

    const createMockCy = (elements = []) => ({
        batch: vi.fn((cb) => cb()),
        nodes: vi.fn().mockReturnValue({
            forEach: (cb) => elements.forEach(cb),
            length: elements.length
        }),
        edges: vi.fn().mockReturnValue({
            forEach: vi.fn(),
            length: 0
        })
    });

    it('should populate label filter with unique sorted values', () => {
        const elements = [
            createMockNode('s1', ['Security', 'Auth']),
            createMockNode('s2', ['Security', 'Database']),
            createMockNode('s3', ['Analytics'])
        ];

        populateLabelFilter(elements);

        const container = document.getElementById('labelFilterContainer');
        const buttons = Array.from(container.querySelectorAll('button')).map(btn => btn.dataset.value);

        expect(buttons).toEqual(['Analytics', 'Auth', 'Database', 'Security']);
    });

    it('should populate team filter with unique sorted values', () => {
        const elements = [
            createMockNode('s1', [], 'Platform Team'),
            createMockNode('s2', [], 'Security Team'),
            createMockNode('s3', [], 'DB Team')
        ];

        populateTeamFilter(elements);

        const container = document.getElementById('teamFilterContainer');
        const buttons = Array.from(container.querySelectorAll('button')).map(btn => btn.dataset.value);

        expect(buttons).toEqual(['DB Team', 'Platform Team', 'Security Team']);
    });

    it('should handle elements without owner', () => {
        const elements = [
            createMockNode('s1', [], null),
            createMockNode('s2', [], 'Some Team')
        ];

        populateTeamFilter(elements);

        const container = document.getElementById('teamFilterContainer');
        expect(container.querySelectorAll('button')).toHaveLength(1);
    });

    it('should allow multi-select filtering persistence during refresh', () => {
        const elements = [
            createMockNode('s1', [], 'Team A'),
            createMockNode('s2', [], 'Team B')
        ];

        populateTeamFilter(elements);

        const container = document.getElementById('teamFilterContainer');
        const btnA = container.querySelector('button[data-value="Team A"]');
        btnA.dataset.selected = 'true';

        // Repopulate
        populateTeamFilter(elements);

        const newBtnA = container.querySelector('button[data-value="Team A"]');
        expect(newBtnA.dataset.selected).toBe('true');
    });

    it('should update filters on label button click', () => {
        const elements = [createMockNode('s1', ['TestLabel'])];
        const cy = createMockCy(elements);
        initFilters(cy);
        populateLabelFilter(elements);

        const btn = document.querySelector('button[data-value="TestLabel"]');
        btn.click();

        expect(btn.dataset.selected).toBe('true');
        expect(cy.batch).toHaveBeenCalled();
    });

    it('should update filters on team button click', () => {
        const elements = [createMockNode('s1', [], 'TestTeam')];
        const cy = createMockCy(elements);
        initFilters(cy);
        populateTeamFilter(elements);

        const btn = document.querySelector('button[data-value="TestTeam"]');
        btn.click();

        expect(btn.dataset.selected).toBe('true');
        expect(cy.batch).toHaveBeenCalled();
    });

    it('should apply filters correctly across all criteria', () => {
        const elements = [
            createMockNode('s1', ['L1'], 'T1'),
            createMockNode('s2', ['L2'], 'T2')
        ];

        const cy = createMockCy(elements);
        initFilters(cy);
        populateLabelFilter(elements);
        populateTeamFilter(elements);

        // Select L1 and T1 (should match S1, not S2)
        const btnL1 = document.querySelector('button[data-value="L1"]');
        const btnT1 = document.querySelector('button[data-value="T1"]');
        btnL1.click();
        btnT1.click();

        // Check if S2 was filtered
        expect(elements[1].addClass).toHaveBeenCalledWith('filtered');
        expect(elements[0].removeClass).toHaveBeenCalledWith('filtered');
    });
});
