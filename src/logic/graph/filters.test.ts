import { describe, it, expect, beforeEach, vi } from 'vitest';
import { populateLabelFilter, populateTeamFilter, applyFilters, initFilters } from './filters';
import { CyInstance } from '../../types';

describe('Filters Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div id="labelFilterContainer"></div>
      <div id="teamFilterContainer"></div>
      <input id="searchInput" type="text">
      <button id="clearSearchBtn" class="hidden"></button>
    `;
        vi.clearAllMocks();
        initFilters(null as any); // Reset module state
    });

    const createMockNode = (id: string, labels: string[], owner: string | null) => ({
        id: () => id,
        data: vi.fn((key) => {
            const d: any = { id, name: `Service ${id}`, labels, owner };
            return key ? d[key] : d;
        }),
        hasClass: vi.fn().mockReturnValue(false),
        addClass: vi.fn(),
        removeClass: vi.fn()
    });

    const createMockCy = (elements: any[] = []) => ({
        batch: vi.fn((cb) => cb()),
        nodes: vi.fn().mockReturnValue({
            forEach: (cb: any) => elements.forEach(cb),
            length: elements.length,
            addClass: vi.fn(),
            removeClass: vi.fn()
        }),
        edges: vi.fn().mockReturnValue({
            length: 0,
            forEach: vi.fn()
        })
    } as unknown as CyInstance);

    it('should populate label filter with unique sorted values', () => {
        const elements = [
            createMockNode('s1', ['Security', 'Auth'], null),
            createMockNode('s2', ['Security', 'Database'], null),
            createMockNode('s3', ['Analytics'], null)
        ] as any;

        populateLabelFilter(elements);

        const container = document.getElementById('labelFilterContainer')!;
        const buttons = Array.from(container.querySelectorAll('button')).map(btn => (btn as HTMLButtonElement).dataset.value);

        expect(buttons).toEqual(['Analytics', 'Auth', 'Database', 'Security']);
    });

    it('should populate team filter with unique sorted values', () => {
        const elements = [
            createMockNode('s1', [], 'Platform Team'),
            createMockNode('s2', [], 'Security Team'),
            createMockNode('s3', [], 'DB Team')
        ] as any;

        populateTeamFilter(elements);

        const container = document.getElementById('teamFilterContainer')!;
        const buttons = Array.from(container.querySelectorAll('button')).map(btn => (btn as HTMLButtonElement).dataset.value);

        expect(buttons).toEqual(['DB Team', 'Platform Team', 'Security Team']);
    });

    it('should handle elements without owner', () => {
        const elements = [
            createMockNode('s1', [], null),
            createMockNode('s2', [], 'Some Team')
        ] as any;

        populateTeamFilter(elements);

        const container = document.getElementById('teamFilterContainer')!;
        expect(container.querySelectorAll('button')).toHaveLength(1);
    });

    it('should allow multi-select filtering persistence during refresh', () => {
        const elements = [
            createMockNode('s1', [], 'Team A'),
            createMockNode('s2', [], 'Team B')
        ] as any;

        populateTeamFilter(elements);

        const container = document.getElementById('teamFilterContainer')!;
        const btnA = container.querySelector('button[data-value="Team A"]') as HTMLButtonElement;
        btnA.dataset.selected = 'true';

        // Repopulate
        populateTeamFilter(elements);

        const newBtnA = container.querySelector('button[data-value="Team A"]') as HTMLButtonElement;
        expect(newBtnA.dataset.selected).toBe('true');
    });

    it('should update filters on label button click', () => {
        const elements = [createMockNode('s1', ['TestLabel'], null)] as any;
        const cy = createMockCy(elements);
        initFilters(cy);
        populateLabelFilter(elements);

        const btn = document.querySelector('button[data-value="TestLabel"]') as HTMLButtonElement;
        btn.click();

        expect(btn.dataset.selected).toBe('true');
        expect(cy.batch).toHaveBeenCalled();
    });

    it('should update filters on team button click', () => {
        const elements = [createMockNode('s1', [], 'TestTeam')] as any;
        const cy = createMockCy(elements);
        initFilters(cy);
        populateTeamFilter(elements);

        const btn = document.querySelector('button[data-value="TestTeam"]') as HTMLButtonElement;
        btn.click();

        expect(btn.dataset.selected).toBe('true');
        expect(cy.batch).toHaveBeenCalled();
    });

    it('should apply filters correctly across all criteria', () => {
        const elements = [
            createMockNode('s1', ['L1'], 'T1'),
            createMockNode('s2', ['L2'], 'T2')
        ] as any;

        const cy = createMockCy(elements);
        initFilters(cy);
        populateLabelFilter(elements);
        populateTeamFilter(elements);

        // Select L1 and T1 (should match S1, not S2)
        const btnL1 = document.querySelector('button[data-value="L1"]') as HTMLButtonElement;
        const btnT1 = document.querySelector('button[data-value="T1"]') as HTMLButtonElement;
        btnL1.click();
        btnT1.click();

        // Check if S2 was filtered
        expect(elements[1].addClass).toHaveBeenCalledWith('filtered');
        expect(elements[0].removeClass).toHaveBeenCalledWith('filtered');
    });
});
