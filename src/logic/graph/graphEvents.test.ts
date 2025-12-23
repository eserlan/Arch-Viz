import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initGraphEvents } from './graphEvents';
import * as panel from '../ui/panel/display';
import * as graphUtils from './graphUtils';
import { CyInstance } from '../../types';

vi.mock('../ui/panel/display', () => ({
    showPanel: vi.fn(),
    hidePanel: vi.fn()
}));

vi.mock('./graphUtils', () => ({
    getNodesAtDepth: vi.fn()
}));

describe('Graph Events Logic', () => {
    let mockCy: any;
    let mockElements: any;
    let eventHandlers: Record<string, Function[]> = {}; // Store multiple handlers

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="depthSelect">
                <option value="1">1</option>
            </select>
            <div id="graphTooltip" style="opacity: 0"></div>
            <div id="contextMenu" class="hidden">
                 <button id="ctxVerifiedBtn"><span id="ctxVerifiedCheck"></span></button>
            </div>
        `;

        eventHandlers = {};
        mockElements = {
            addClass: vi.fn().mockReturnThis(),
            removeClass: vi.fn().mockReturnThis()
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
            nodes: vi.fn(() => ({
                length: 0,
                unselect: vi.fn()
            })),
             pan: vi.fn(() => ({ x: 0, y: 0 })),
             zoom: vi.fn(() => 1)
        } as unknown as CyInstance;

        vi.clearAllMocks();
    });

    it('should register core graph events', () => {
        initGraphEvents(mockCy);
        // We now have multiple tap listeners
        expect(mockCy.on).toHaveBeenCalledWith('tap', 'node', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('tap', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('mouseover', 'node', expect.any(Function));
    });

    it('should show panel and highlight connections on node tap', () => {
        const mockNode = { id: () => 'n1', select: vi.fn() };
        (graphUtils.getNodesAtDepth as any).mockReturnValue(mockElements);

        initGraphEvents(mockCy);
        const tapHandlers = eventHandlers['tap:node'];
        // Execute the handler that shows the panel (should be the first one registered for tap:node)
        tapHandlers[0]({ target: mockNode });

        expect(panel.showPanel).toHaveBeenCalledWith(mockNode as any);
        expect(mockElements.addClass).toHaveBeenCalledWith('dimmed');
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed');
    });

    it('should hide panel on background tap', () => {
        initGraphEvents(mockCy);
        const tapHandlers = eventHandlers['tap'];
        // The one that hides the panel checks if target === cy
        // We need to find the correct handler or execute all
        tapHandlers.forEach(handler => handler({ target: mockCy }));

        expect(panel.hidePanel).toHaveBeenCalled();
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed');
    });

    it('should update tooltip on node mouseover', () => {
        const mockNode = {
            data: vi.fn((key: string) => {
                if (key === 'name') return 'Node A';
                if (key === 'labels') return ['Core', 'Auth'];
                return null;
            }),
            renderedPosition: vi.fn(() => ({ x: 100, y: 100 }))
        };

        initGraphEvents(mockCy);
        const mouseoverHandler = eventHandlers['mouseover:node'][0]; // Assuming only one for now
        mouseoverHandler({ target: mockNode });

        const tooltip = document.getElementById('graphTooltip')!;
        expect(tooltip.innerHTML).toContain('Node A');
        expect(tooltip.innerHTML).toContain('Core, Auth');
        expect(tooltip.style.opacity).toBe('1');
    });
});
