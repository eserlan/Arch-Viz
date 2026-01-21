import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGraphRenderer } from './appGraph';
import * as history from '../core/history';
import cytoscape from 'cytoscape';

vi.mock('cytoscape', () => {
    const mockCy = {
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
        container: vi.fn(() => document.createElement('div')),
        batch: vi.fn((fn) => fn()),
        elements: vi.fn(() => ({
            remove: vi.fn(),
            addClass: vi.fn(),
            removeClass: vi.fn(),
            jsons: vi.fn(() => []),
        })),
        nodes: vi.fn(() => ({
            unselect: vi.fn(),
            length: 0,
            toArray: vi.fn(() => []),
        })),
        edges: vi.fn(() => ({
            length: 0,
            unselect: vi.fn(),
        })),
        ready: vi.fn((fn) => fn()),
        fit: vi.fn(),
        zoom: vi.fn(() => 1),
        minZoom: vi.fn(() => 0.02),
        maxZoom: vi.fn(() => 2.5),
        edgehandles: vi.fn(() => ({
            enableDrawMode: vi.fn(),
            disableDrawMode: vi.fn(),
        })),
    };
    const cyFunction = vi.fn(() => mockCy);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cyFunction as any).use = vi.fn();
    return {
        default: cyFunction,
    };
});

vi.mock('../core/history', () => ({
    initHistory: vi.fn(() => vi.fn()),
}));

vi.mock('./graphEvents', () => ({
    initGraphEvents: vi.fn(() => vi.fn()),
}));

vi.mock('./filters', () => ({
    initFilters: vi.fn(),
    populateLabelFilter: vi.fn(),
    populateTeamFilter: vi.fn(),
    populateAppCodeFilter: vi.fn(),
}));

vi.mock('./edgeEditor', () => ({
    initEdgeEditor: vi.fn(),
}));

vi.mock('./edgeEditorKeyboard', () => ({
    registerEdgeEditorKeyListener: vi.fn(),
}));

vi.mock('../ui/searchKeyboard', () => ({
    registerSearchKeyListener: vi.fn(),
}));

vi.mock('./layoutManager', () => ({
    initLayoutManager: vi.fn(),
}));

vi.mock('../ui/serviceForm', () => ({
    initServiceForm: vi.fn(),
}));

vi.mock('./grouping', () => ({
    initGrouping: vi.fn(),
}));

vi.mock('../ui/minimap', () => ({
    initMiniMap: vi.fn(),
}));

vi.mock('../ui/selectionInfo', () => ({
    initSelectionInfo: vi.fn(),
}));

describe('appGraph', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'cy';
        document.body.appendChild(container);
        vi.clearAllMocks();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should create a new renderer and call cleanup of previous one', () => {
        const mockCleanup = vi.fn();
        vi.mocked(history.initHistory).mockReturnValue(mockCleanup);

        const render = createGraphRenderer({
            container,
            onStatus: vi.fn(),
            onDirtyStateChange: vi.fn(),
        });

        // First render
        render([], 0);
        expect(cytoscape).toHaveBeenCalledTimes(1);

        // Second render
        render([], 0);
        expect(mockCleanup).toHaveBeenCalled();
        expect(cytoscape).toHaveBeenCalledTimes(2);
    });

    it('should register global wheel event listener and remove it on cleanup', () => {
        const addEventListenerSpy = vi.spyOn(container, 'addEventListener');
        const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');

        const render = createGraphRenderer({
            container,
            onStatus: vi.fn(),
            onDirtyStateChange: vi.fn(),
        });

        render([], 0);
        expect(addEventListenerSpy).toHaveBeenCalledWith(
            'wheel',
            expect.any(Function),
            expect.any(Object)
        );

        // Trigger cleanup by rendering again
        render([], 0);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });

    it('should destroy cytoscape instance on cleanup', () => {
        const mockCy = vi.mocked(cytoscape)({} as any);
        vi.mocked(cytoscape).mockClear();
        vi.mocked(cytoscape).mockReturnValue(mockCy);

        const render = createGraphRenderer({
            container,
            onStatus: vi.fn(),
            onDirtyStateChange: vi.fn(),
        });

        render([], 0);

        // Second render triggers cleanup of first
        render([], 0);
        expect(mockCy.destroy).toHaveBeenCalled();
    });
});
