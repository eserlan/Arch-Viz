import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    initEdgeEditor,
    enableEditMode,
    disableEditMode,
    toggleEditMode,
    isInEditMode,
} from './edgeEditor';
import { saveGraphData } from '../core/storage';

vi.mock('../core/storage', () => ({
    saveGraphData: vi.fn(),
}));

describe('edgeEditor', () => {
    let mockCy: any;
    let mockEh: any;
    let updateStatus: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockEh = {
            enableDrawMode: vi.fn(),
            disableDrawMode: vi.fn(),
        };

        mockCy = {
            edgehandles: vi.fn().mockReturnValue(mockEh),
            on: vi.fn(),
            elements: vi.fn().mockReturnValue({
                jsons: vi.fn().mockReturnValue([]),
            }),
        };

        updateStatus = vi.fn();

        // Reset the internal state of edgeEditor
        if (isInEditMode()) {
            disableEditMode(vi.fn());
        }
    });

    it('should initialize edgehandles', () => {
        initEdgeEditor(mockCy, updateStatus);
        expect(mockCy.edgehandles).toHaveBeenCalled();
        expect(mockCy.on).toHaveBeenCalledWith('ehcomplete', expect.any(Function));
        expect(mockCy.on).toHaveBeenCalledWith('tap', 'edge', expect.any(Function));
    });

    it('should enable edit mode', () => {
        initEdgeEditor(mockCy, updateStatus);
        enableEditMode(updateStatus);

        expect(mockEh.enableDrawMode).toHaveBeenCalled();
        expect(isInEditMode()).toBe(true);
        expect(updateStatus).toHaveBeenCalledWith(
            expect.stringContaining('Edit Mode: Drag to connect')
        );
    });

    it('should disable edit mode', () => {
        initEdgeEditor(mockCy, updateStatus);
        enableEditMode(updateStatus);
        disableEditMode(updateStatus);

        expect(mockEh.disableDrawMode).toHaveBeenCalled();
        expect(isInEditMode()).toBe(false);
        expect(updateStatus).toHaveBeenCalledWith('Edit Mode disabled');
    });

    it('should toggle edit mode', () => {
        initEdgeEditor(mockCy, updateStatus);

        const state1 = toggleEditMode(updateStatus);
        expect(state1).toBe(true);
        expect(mockEh.enableDrawMode).toHaveBeenCalled();

        const state2 = toggleEditMode(updateStatus);
        expect(state2).toBe(false);
        expect(mockEh.disableDrawMode).toHaveBeenCalled();
    });

    it('should handle ehcomplete event', () => {
        initEdgeEditor(mockCy, updateStatus);

        // Find the ehcomplete listener
        const ehcompleteListener = mockCy.on.mock.calls.find(
            (call: any) => call[0] === 'ehcomplete'
        )[1];

        const mockSource = { id: () => 'node1', data: () => 'Node 1' };
        const mockTarget = { id: () => 'node2', data: () => 'Node 2' };

        ehcompleteListener({}, mockSource, mockTarget, {});

        expect(saveGraphData).toHaveBeenCalled();
        expect(updateStatus).toHaveBeenCalledWith(
            expect.stringContaining('Connected Node 1 → Node 2')
        );
    });

    it('should handle edge click for deletion in edit mode', () => {
        // Mock confirm to always return true
        vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));

        initEdgeEditor(mockCy, updateStatus);
        enableEditMode(updateStatus);

        // Find the tap listener
        const tapListener = mockCy.on.mock.calls.find(
            (call) => call[0] === 'tap' && call[1] === 'edge'
        )[2];

        const mockEdge = {
            remove: vi.fn(),
            source: () => ({ id: () => 'n1', data: () => 'Source' }),
            target: () => ({ id: () => 'n2', data: () => 'Target' }),
        };

        tapListener({ target: mockEdge });

        expect(mockEdge.remove).toHaveBeenCalled();
        expect(saveGraphData).toHaveBeenCalled();
        expect(updateStatus).toHaveBeenCalledWith(expect.stringContaining('Removed connection'));

        vi.unstubAllGlobals();
    });

    it('should NOT delete edge if NOT in edit mode', () => {
        initEdgeEditor(mockCy, updateStatus);
        // edit mode is FALSE initially

        const tapListener = mockCy.on.mock.calls.find(
            (call) => call[0] === 'tap' && call[1] === 'edge'
        )[2];
        const mockEdge = { remove: vi.fn() };

        tapListener({ target: mockEdge });

        expect(mockEdge.remove).not.toHaveBeenCalled();
    });
});
