import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initGraphEvents } from './graphEvents';
import * as panel from './panel';
import * as graphUtils from './graphUtils';
import { CyInstance } from '../types';

vi.mock('./panel', () => ({
    showPanel: vi.fn(),
    hidePanel: vi.fn()
}));

vi.mock('./graphUtils', () => ({
    getNodesAtDepth: vi.fn()
}));

describe('Graph Events Logic', () => {
    let mockCy: any;
    let mockElements: any;
    let eventHandlers: Record<string, Function> = {};

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="depthSelect">
                <option value="1">1</option>
            </select>
            <div id="graphTooltip" style="opacity: 0"></div>
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
                eventHandlers[key] = handler;
            }),
            elements: vi.fn(() => mockElements),
            nodes: vi.fn(() => ({ length: 0 }))
        } as unknown as CyInstance;

        vi.clearAllMocks();
    });

    it('should register core graph events', () => {
        initGraphEvents(mockCy);
        expect(mockCy.on).toHaveBeenCalledWith('tap', 'node', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('tap', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('mouseover', 'node', expect.any(Function));
    });

    it('should show panel and highlight connections on node tap', () => {
        const mockNode = { id: () => 'n1' };
        (graphUtils.getNodesAtDepth as any).mockReturnValue(mockElements);

        initGraphEvents(mockCy);
        const tapHandler = eventHandlers['tap:node'];
        tapHandler({ target: mockNode });

        expect(panel.showPanel).toHaveBeenCalledWith(mockNode as any);
        expect(mockElements.addClass).toHaveBeenCalledWith('dimmed');
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed');
    });

    it('should hide panel on background tap', () => {
        initGraphEvents(mockCy);
        const tapHandler = eventHandlers['tap'];
        tapHandler({ target: mockCy });

        expect(panel.hidePanel).toHaveBeenCalled();
        expect(mockElements.removeClass).toHaveBeenCalledWith('dimmed');
    });

    it('should update tooltip on node mouseover', () => {
        const mockNode = {
            data: vi.fn((key: string) => key === 'name' ? 'Node A' : null),
            renderedPosition: vi.fn(() => ({ x: 100, y: 100 }))
        };

        initGraphEvents(mockCy);
        const mouseoverHandler = eventHandlers['mouseover:node'];
        mouseoverHandler({ target: mockNode });

        const tooltip = document.getElementById('graphTooltip')!;
        expect(tooltip.textContent).toBe('Node A');
        expect(tooltip.style.opacity).toBe('1');
    });
});
