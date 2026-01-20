import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initGraphEvents } from './graphEvents';
import * as panel from '../ui/panel';
import * as graphUtils from './graphUtils';
import { CyInstance } from '../../types';
import { saveGraphData } from '../core/storage';
import { showToast } from '../ui/ui';
import { populateLabelFilter } from './filters';

vi.mock('../ui/panel/index', () => ({
    showPanel: vi.fn(),
    hidePanel: vi.fn(),
}));

vi.mock('./graphUtils', () => ({
    getNodesAtDepth: vi.fn(),
}));

vi.mock('../core/storage', () => ({
    saveGraphData: vi.fn(),
}));

vi.mock('../ui/ui', () => ({
    showToast: vi.fn(),
}));

vi.mock('./filters', () => ({
    populateLabelFilter: vi.fn(),
}));

describe('Graph Events Logic', () => {
    let mockCy: any;
    let mockElements: any;
    let eventHandlers: Record<string, ((...args: any[]) => any)[]> = {}; // Store multiple handlers
    let selectedCollection: any;

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="depthSelect">
                <option value="1">1</option>
            </select>
            <div id="graphTooltip" style="opacity: 0"></div>
            <div id="cy"></div>
        `;

        eventHandlers = {};
        mockElements = {
            addClass: vi.fn().mockReturnThis(),
            removeClass: vi.fn().mockReturnThis(),
        };

        selectedCollection = {
            length: 0,
            0: undefined,
            toArray: function () {
                const arr = [];
                for (let i = 0; i < this.length; i++) {
                    arr.push(this[i]);
                }
                return arr;
            },
        };

        mockCy = {
            on: vi.fn((event, ...args) => {
                const selector = typeof args[0] === 'string' ? args[0] : null;
                const handler = selector ? args[1] : args[0];
                const key = selector ? `${event}:${selector}` : event;
                if (!eventHandlers[key]) {
                    eventHandlers[key] = [];
                }
                eventHandlers[key].push(handler);
            }),
            elements: vi.fn(() => mockElements),
            nodes: vi.fn((selector?: string) => {
                if (selector === ':selected') {
                    return selectedCollection;
                }
                return {
                    length: 0,
                    unselect: vi.fn(),
                    toArray: vi.fn(() => []),
                };
            }),
            container: vi.fn(() => document.getElementById('cy')),
            pan: vi.fn(() => ({ x: 0, y: 0 })),
            zoom: vi.fn(() => 1),
        } as unknown as CyInstance;

        vi.clearAllMocks();
    });

    it('should register core graph events', () => {
        initGraphEvents(mockCy);
        // We now have multiple tap listeners
        expect(mockCy.on).toHaveBeenCalledWith('tap', 'node', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('tap', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('mouseover', 'node', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('cxttap', 'node', expect.any(Function));
    });

    it('should show panel and highlight connections on node tap', () => {
        vi.useFakeTimers();
        const outboundEdges = { addClass: vi.fn() };
        const inboundEdges = { addClass: vi.fn() };
        const mockNode = {
            id: () => 'n1',
            select: vi.fn(),
            selected: vi.fn().mockReturnValue(true),
            outgoers: vi.fn(() => outboundEdges),
            incomers: vi.fn(() => inboundEdges),
        };
        (graphUtils.getNodesAtDepth as any).mockReturnValue(mockElements);
        selectedCollection.length = 1;
        selectedCollection[0] = mockNode;

        initGraphEvents(mockCy);
        const tapHandlers = eventHandlers['tap:node'];
        // Execute the handler that shows the panel (should be the first one registered for tap:node)
        tapHandlers[0]({ target: mockNode });
        vi.advanceTimersByTime(0);

        expect(panel.showPanel).toHaveBeenCalledWith(mockNode as any);
        expect(mockElements.addClass).toHaveBeenCalledWith('dimmed');
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed');
        expect(mockElements.removeClass).toHaveBeenCalledWith('edge-inbound edge-outbound');
        expect(outboundEdges.addClass).toHaveBeenCalledWith('edge-outbound');
        expect(inboundEdges.addClass).toHaveBeenCalledWith('edge-inbound');
        vi.useRealTimers();
    });

    it('should hide panel on background tap', () => {
        initGraphEvents(mockCy);
        const tapHandlers = eventHandlers['tap'];
        // The one that hides the panel checks if target === cy
        // We need to find the correct handler or execute all
        tapHandlers.forEach((handler) => handler({ target: mockCy }));

        expect(panel.hidePanel).toHaveBeenCalled();
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed edge-inbound edge-outbound');
    });

    it('should update tooltip on node mouseover', () => {
        const mockNode = {
            data: vi.fn((key: string) => {
                if (key === 'name') return 'Node A';
                if (key === 'labels') return ['Core', 'Auth'];
                return null;
            }),
            renderedPosition: vi.fn(() => ({ x: 100, y: 100 })),
        };

        initGraphEvents(mockCy);
        const mouseoverHandler = eventHandlers['mouseover:node'][0]; // Assuming only one for now
        mouseoverHandler({ target: mockNode });

        const tooltip = document.getElementById('graphTooltip')!;
        expect(tooltip.innerHTML).toContain('Node A');
        expect(tooltip.innerHTML).toContain('Core, Auth');
        expect(tooltip.style.opacity).toBe('1');
    });

    it('should refresh highlighted connections when depth changes', () => {
        vi.useFakeTimers();
        const mockNode = {
            id: () => 'n1',
            select: vi.fn(),
            selected: vi.fn().mockReturnValue(true),
            outgoers: vi.fn(() => ({ addClass: vi.fn() })),
            incomers: vi.fn(() => ({ addClass: vi.fn() })),
        };
        const highlightCollection = {
            removeClass: vi.fn(),
        };
        (graphUtils.getNodesAtDepth as any).mockReturnValue(highlightCollection);
        selectedCollection.length = 1;
        selectedCollection[0] = mockNode;

        initGraphEvents(mockCy);
        const tapHandlers = eventHandlers['tap:node'];
        tapHandlers[0]({ target: mockNode });
        vi.advanceTimersByTime(0);

        selectedCollection.length = 0;
        selectedCollection[0] = undefined;

        // Clear mock to specifically test the depth change event
        vi.clearAllMocks();

        const depthSelect = document.getElementById('depthSelect') as HTMLSelectElement;
        depthSelect.value = '1';
        depthSelect.dispatchEvent(new Event('change'));

        expect(graphUtils.getNodesAtDepth).toHaveBeenCalledWith(mockNode, '1', mockCy);
        vi.useRealTimers();
    });

    it('should toggle verified state from context menu', () => {
        const nodeData: Record<string, any> = {
            id: 'n1',
            name: 'Node A',
            verified: false,
            labels: [],
        };
        let nodeClasses: string[] = ['node', 'some-class'];
        const mockNode = {
            data: vi.fn((key?: string, val?: any) => {
                if (key && val !== undefined) {
                    nodeData[key] = val;
                    return mockNode;
                }
                if (typeof key === 'string') {
                    return nodeData[key];
                }
                return nodeData;
            }),
            toggleClass: vi.fn(),
            classes: vi.fn((classesArg?: string | string[]) => {
                if (classesArg === undefined) {
                    // getter: return current classes as space-separated string
                    return nodeClasses.join(' ');
                }
                // setter: update classes
                if (Array.isArray(classesArg)) {
                    nodeClasses = classesArg;
                } else if (typeof classesArg === 'string') {
                    nodeClasses = classesArg.split(/\s+/).filter(Boolean);
                }
                return mockNode;
            }),
            id: () => nodeData.id,
            renderedPosition: vi.fn(() => ({ x: 100, y: 120 })),
        };

        mockElements.jsons = vi.fn(() => [{ data: { id: 'n1' } }]);

        initGraphEvents(mockCy);
        const cxttapHandler = eventHandlers['cxttap:node'][0];
        cxttapHandler({
            target: mockNode,
            originalEvent: {
                clientX: 100,
                clientY: 120,
                preventDefault: vi.fn(),
            },
        });

        const toggleBtn = document.getElementById('toggleVerifiedBtn') as HTMLButtonElement;
        expect(toggleBtn).toBeTruthy();

        // --- Test: Mark as verified ---
        toggleBtn.click();

        expect(mockNode.data).toHaveBeenCalledWith('verified', true);
        expect(mockNode.toggleClass).toHaveBeenCalledWith('is-verified', true);
        // CHECK 1: Expect 'Verified' label to be added
        expect(mockNode.data).toHaveBeenCalledWith('labels', expect.arrayContaining(['Verified']));
        expect(mockNode.data).toHaveBeenCalledWith('labelsDisplay', 'Verified');

        expect(saveGraphData).toHaveBeenCalled();
        expect(populateLabelFilter).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalled();

        // Update mock state to reflect change (simulating cytoscape behavior)
        nodeData.verified = true;
        nodeData.labels = ['Verified'];

        // Re-open context menu to reset contextMenuNode (which is nulled on close)
        cxttapHandler({
            target: mockNode,
            originalEvent: {
                clientX: 100,
                clientY: 120,
                preventDefault: vi.fn(),
            },
        });

        // --- Test: Unmark as verified ---
        toggleBtn.click();

        expect(mockNode.data).toHaveBeenCalledWith('verified', false);
        expect(mockNode.toggleClass).toHaveBeenCalledWith('is-verified', false);
        // CHECK 2: Expect 'Verified' label to be removed
        expect(mockNode.data).toHaveBeenCalledWith(
            'labels',
            expect.not.arrayContaining(['Verified'])
        );
        expect(mockNode.data).toHaveBeenCalledWith('labelsDisplay', '');
    });

    it('should support multi-select toggle with Ctrl/Cmd', () => {
        vi.useFakeTimers();
        const mockNode = {
            id: () => 'n1',
            select: vi.fn(),
            unselect: vi.fn(),
            selected: vi.fn().mockReturnValue(false),
            outgoers: vi.fn(() => ({ addClass: vi.fn() })),
            incomers: vi.fn(() => ({ addClass: vi.fn() })),
        };
        const mockNode2 = {
            id: () => 'n2',
            select: vi.fn(),
            unselect: vi.fn(),
            selected: vi.fn().mockReturnValue(false),
            outgoers: vi.fn(() => ({ addClass: vi.fn() })),
            incomers: vi.fn(() => ({ addClass: vi.fn() })),
        };

        const allNodes = {
            unselect: vi.fn(),
        };
        mockCy.nodes = vi.fn((selector) => {
            if (selector === ':selected') return selectedCollection;
            return allNodes;
        });

        initGraphEvents(mockCy);
        const tapstartHandler = eventHandlers['tapstart:node'][0];
        const tapHandler = eventHandlers['tap:node'][0];

        // 1. Single select (no Ctrl)
        tapstartHandler({ target: mockNode });
        tapHandler({
            target: mockNode,
            originalEvent: { ctrlKey: false },
        });
        vi.advanceTimersByTime(0);
        expect(allNodes.unselect).toHaveBeenCalled();
        expect(mockNode.select).toHaveBeenCalled();

        // 2. Toggle ON with Ctrl
        vi.clearAllMocks();
        mockNode.selected.mockReturnValue(false);
        tapstartHandler({ target: mockNode2 });
        tapHandler({
            target: mockNode2,
            originalEvent: { ctrlKey: true },
        });
        vi.advanceTimersByTime(0);
        expect(allNodes.unselect).not.toHaveBeenCalled();
        expect(mockNode2.select).toHaveBeenCalled();

        // 3. Toggle OFF with Ctrl
        vi.clearAllMocks();
        mockNode2.selected.mockReturnValue(true);
        selectedCollection.length = 1;
        selectedCollection[0] = mockNode; // Simulate another node selected

        tapstartHandler({ target: mockNode2 });
        tapHandler({
            target: mockNode2,
            originalEvent: { ctrlKey: true },
        });
        vi.advanceTimersByTime(0);
        expect(mockNode2.unselect).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('should hide panel when selection becomes empty after toggle off', () => {
        vi.useFakeTimers();
        const mockNode = {
            id: () => 'n1',
            select: vi.fn(),
            unselect: vi.fn(),
            selected: vi.fn().mockReturnValue(true),
            outgoers: vi.fn(() => ({ addClass: vi.fn() })),
            incomers: vi.fn(() => ({ addClass: vi.fn() })),
        };

        selectedCollection.length = 0; // Empty results after toggle off
        mockCy.elements = vi.fn().mockReturnValue(mockElements);

        initGraphEvents(mockCy);
        const tapstartHandler = eventHandlers['tapstart:node'][0];
        const tapHandler = eventHandlers['tap:node'][0];

        tapstartHandler({ target: mockNode });
        tapHandler({
            target: mockNode,
            originalEvent: { ctrlKey: true },
        });
        vi.advanceTimersByTime(0);

        expect(mockNode.unselect).toHaveBeenCalled();
        expect(panel.hidePanel).toHaveBeenCalled();
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed edge-inbound edge-outbound');
        vi.useRealTimers();
    });
});
