import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initGraphEvents } from './graphEvents';

describe('graphEvents logic', () => {
    let mockCy: any;
    let eventHandlers: Record<string, Function> = {};

    beforeEach(() => {
        document.body.innerHTML = `
            <select id="depthSelect">
                <option value="1">1</option>
            </select>
            <div id="graphTooltip" style="opacity: 0"></div>
        `;
        eventHandlers = {};
        mockCy = {
            on: vi.fn((event, selector, handler) => {
                if (typeof selector === 'function') {
                    eventHandlers[event] = selector;
                } else {
                    eventHandlers[`${event}:${selector}`] = handler;
                }
            }),
            elements: vi.fn().mockReturnValue({
                addClass: vi.fn(),
                removeClass: vi.fn()
            }),
            nodes: vi.fn().mockReturnValue([])
        };
    });

    it('sets up basic layout listeners', () => {
        initGraphEvents(mockCy);
        expect(mockCy.on).toHaveBeenCalledWith('tap', 'node', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('tap', expect.any(Function));
    });

    it('shows tooltip on node mouseover', () => {
        initGraphEvents(mockCy);
        const tooltip = document.getElementById('graphTooltip')!;
        const mockNode = {
            data: vi.fn().mockReturnValue('Test Node'),
            renderedPosition: vi.fn().mockReturnValue({ x: 100, y: 100 }),
            id: vi.fn().mockReturnValue('n1')
        };

        const mouseoverHandler = eventHandlers['mouseover:node'];
        mouseoverHandler({ target: mockNode });

        expect(tooltip.textContent).toBe('Test Node');
        expect(tooltip.style.opacity).toBe('1');
    });

    it('hides tooltip on viewport change', () => {
        initGraphEvents(mockCy);
        const tooltip = document.getElementById('graphTooltip')!;
        tooltip.style.opacity = '1';

        const viewportHandler = eventHandlers['viewport'];
        viewportHandler();

        expect(tooltip.style.opacity).toBe('0');
    });
});
