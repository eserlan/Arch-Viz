import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initGraphEvents, toggleVerifiedState } from './graphEvents';
import * as panel from './panel';
import * as graphUtils from './graphUtils';
import { CyInstance } from '../types';
import { showToast } from './ui';
import { saveGraphData } from './storage';
import * as filters from './filters';

// Mock dependencies
vi.mock('./panel', () => ({ showPanel: vi.fn(), hidePanel: vi.fn() }));
vi.mock('./graphUtils', () => ({ getNodesAtDepth: vi.fn() }));
vi.mock('./storage', () => ({ saveGraphData: vi.fn() }));
vi.mock('./ui', () => ({ showToast: vi.fn() }));
vi.mock('./filters', () => ({ populateLabelFilter: vi.fn(), populateTeamFilter: vi.fn() }));

describe('Graph Events Logic', () => {
    let mockCy: any;
    let mockElements: any;
    let eventHandlers: Record<string, Function> = {};
    let contextMenu: HTMLElement;
    let verifiedToggleBtn: HTMLElement;
    let tooltip: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="contextMenu" class="hidden"><button id="context-menu-verified-toggle"></button></div>
            <select id="depthSelect"><option value="1">1</option></select>
            <div id="graphTooltip" style="opacity: 0"></div>
        `;
        contextMenu = document.getElementById('contextMenu')!;
        verifiedToggleBtn = document.getElementById('context-menu-verified-toggle')!;
        tooltip = document.getElementById('graphTooltip')!;

        eventHandlers = {};
        mockElements = {
            addClass: vi.fn().mockReturnThis(),
            removeClass: vi.fn().mockReturnThis(),
            jsons: vi.fn(() => ({}))
        };
        mockCy = {
            on: vi.fn((event, ...args) => {
                const selector = typeof args[0] === 'string' ? args[0] : null;
                const handler = selector ? args[1] : args[0];
                eventHandlers[selector ? `${event}:${selector}` : event] = handler;
            }),
            elements: vi.fn(() => mockElements),
            nodes: vi.fn(() => ({ length: 0, unselect: vi.fn(), toArray: () => [] })),
        };
        vi.clearAllMocks();
    });

    it('should show panel and highlight connections on node tap', () => {
        const mockNode = { id: () => 'n1', select: vi.fn() };
        (graphUtils.getNodesAtDepth as any).mockReturnValue(mockElements);
        initGraphEvents(mockCy);
        eventHandlers['tap:node']({ target: mockNode });
        expect(panel.showPanel).toHaveBeenCalledWith(mockNode as any);
        expect(mockElements.addClass).toHaveBeenCalledWith('dimmed');
    });

    it('should show context menu on right-click', () => {
        const mockNode = { id: () => 'n1' };
        const mockEvent = { preventDefault: vi.fn(), target: mockNode, renderedPosition: { x: 100, y: 150 } };

        initGraphEvents(mockCy);
        eventHandlers['cxttap:node'](mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(contextMenu.classList.contains('hidden')).toBe(false);
        expect(contextMenu.style.left).toBe('100px');
        expect(contextMenu.style.top).toBe('150px');
    });

    it('should hide context menu on background tap', () => {
        initGraphEvents(mockCy);
        contextMenu.classList.remove('hidden');
        eventHandlers['tap']({ target: mockCy });
        expect(contextMenu.classList.contains('hidden')).toBe(true);
    });

    it('should toggle verified state and hide menu on button click', () => {
        const mockNode = { id: () => 'n1', hasClass: () => false, addClass: vi.fn(), data: vi.fn() };
        initGraphEvents(mockCy);

        eventHandlers['cxttap:node']({ preventDefault: vi.fn(), target: mockNode, renderedPosition: { x: 0, y: 0 } });
        contextMenu.classList.remove('hidden');

        verifiedToggleBtn.dispatchEvent(new MouseEvent('click'));

        expect(mockNode.addClass).toHaveBeenCalledWith('verified');
        expect(contextMenu.classList.contains('hidden')).toBe(true);
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
        eventHandlers['mouseover:node']({ target: mockNode });
        expect(tooltip.innerHTML).toContain('Node A');
        expect(tooltip.innerHTML).toContain('Core, Auth');
        expect(tooltip.style.opacity).toBe('1');
    });
});
