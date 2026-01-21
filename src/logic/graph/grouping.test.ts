import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enableTeamGrouping, enableLabelGrouping, disableGrouping, initGrouping } from './grouping';

// Mock the ui module
vi.mock('../ui/ui', () => ({
    showToast: vi.fn(),
}));

describe('Grouping Module', () => {
    let mockCy: Record<string, any>;
    let mockNodes: Record<string, any>[];

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="groupingSelect">
                <option value="none">No Grouping</option>
                <option value="team">By Team</option>
                <option value="label">By First Label</option>
            </select>
            <select id="layoutSelect">
                <option value="fcose">fCoSE</option>
            </select>
        `;

        mockNodes = [
            {
                data: vi.fn((key?: string) => {
                    const d: any = { id: 'svc-a', owner: 'Team A', labels: ['Core', 'Auth'] };
                    return key ? d[key] : d;
                }),
                move: vi.fn(),
                parent: vi.fn(() => ({ length: 0 })),
            },
            {
                data: vi.fn((key?: string) => {
                    const d: any = { id: 'svc-b', owner: 'Team A', labels: ['Core'] };
                    return key ? d[key] : d;
                }),
                move: vi.fn(),
                parent: vi.fn(() => ({ length: 0 })),
            },
            {
                data: vi.fn((key?: string) => {
                    const d: any = { id: 'svc-c', owner: 'Team B', labels: ['API'] };
                    return key ? d[key] : d;
                }),
                move: vi.fn(),
                parent: vi.fn(() => ({ length: 0 })),
            },
            {
                data: vi.fn((key?: string) => {
                    const d: any = { id: 'svc-d', labels: [] };
                    return key ? d[key] : d;
                }),
                move: vi.fn(),
                parent: vi.fn(() => ({ length: 0 })),
            },
        ];

        const mockCollection = {
            forEach: (fn: (node: any) => void) => mockNodes.forEach(fn),
            filter: (fn: (node: any) => boolean) => {
                const filtered = mockNodes.filter(fn);
                return {
                    forEach: (f: (node: any) => void) => filtered.forEach(f),
                    filter: (f: (node: any) => boolean) => ({
                        forEach: (ff: (node: any) => void) => filtered.filter(f).forEach(ff),
                        length: filtered.filter(f).length,
                    }),
                    length: filtered.length,
                };
            },
            length: mockNodes.length,
        };

        mockCy = {
            nodes: vi.fn((selector?: string) => {
                if (selector === '.team-group' || selector === '.label-group') {
                    return { remove: vi.fn() };
                }
                return mockCollection;
            }),
            getElementById: vi.fn(() => ({ length: 0 })),
            add: vi.fn(),
            layout: vi.fn(() => ({ run: vi.fn() })),
        };

        vi.clearAllMocks();
    });

    describe('enableTeamGrouping', () => {
        it('should create team group nodes', () => {
            enableTeamGrouping(mockCy);

            // Should create parent nodes for Team A, Team B, and Unassigned
            expect(mockCy.add).toHaveBeenCalled();
            const addCalls = mockCy.add.mock.calls;

            // Check that team-group class is applied
            const teamACall = addCalls.find((call: any[]) => call[0].data.label === 'Team A');
            expect(teamACall).toBeDefined();
            expect(teamACall[0].classes).toContain('team-group');
        });

        it('should move nodes to their team parent', () => {
            enableTeamGrouping(mockCy);

            // At least some nodes should have move called
            const movedNodes = mockNodes.filter((n) => n.move.mock.calls.length > 0);
            expect(movedNodes.length).toBeGreaterThan(0);
        });
    });

    describe('enableLabelGrouping', () => {
        it('should create label group nodes', () => {
            enableLabelGrouping(mockCy);

            expect(mockCy.add).toHaveBeenCalled();
            const addCalls = mockCy.add.mock.calls;

            // Check for Core, API, and Unlabeled groups
            const coreCall = addCalls.find((call: any[]) => call[0].data.label === 'Core');
            expect(coreCall).toBeDefined();
        });

        it('should group nodes without labels under Unlabeled', () => {
            enableLabelGrouping(mockCy);

            const addCalls = mockCy.add.mock.calls;
            const unlabeledCall = addCalls.find((call: any) => call[0].data.label === 'Unlabeled');
            expect(unlabeledCall).toBeDefined();
        });
    });

    describe('disableGrouping', () => {
        it('should remove group nodes', () => {
            disableGrouping(mockCy);

            // Should call nodes with selectors to remove groups
            expect(mockCy.nodes).toHaveBeenCalledWith('.team-group');
            expect(mockCy.nodes).toHaveBeenCalledWith('.label-group');
        });
    });

    describe('initGrouping', () => {
        it('should attach listener to grouping selector', () => {
            const addEventListenerSpy = vi.spyOn(
                document.getElementById('groupingSelect')!,
                'addEventListener'
            );

            initGrouping(mockCy);

            expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
        });

        it('should handle selector change to team grouping', () => {
            initGrouping(mockCy);

            const selector = document.getElementById('groupingSelect') as HTMLSelectElement;
            selector.value = 'team';
            selector.dispatchEvent(new Event('change'));

            // Should have called add for team groups
            expect(mockCy.add).toHaveBeenCalled();
        });

        it('should handle selector change to label grouping', () => {
            initGrouping(mockCy);

            const selector = document.getElementById('groupingSelect') as HTMLSelectElement;
            selector.value = 'label';
            selector.dispatchEvent(new Event('change'));

            expect(mockCy.add).toHaveBeenCalled();
        });
    });
});
