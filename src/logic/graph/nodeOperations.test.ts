import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addNode, deleteNode } from './nodeOperations';
import { saveGraphData } from '../core/storage';
import { CyInstance } from '../../types';

// Mock storage
vi.mock('../core/storage', () => ({
    saveGraphData: vi.fn(),
}));

describe('Node Operations', () => {
    // Mock cy
    const cy = {
        add: vi.fn(),
        remove: vi.fn(),
        getElementById: vi.fn(),
        pan: () => ({ x: 0, y: 0 }),
        zoom: () => 1,
        width: () => 100,
        height: () => 100,
        elements: () => ({ jsons: () => [] }),
    } as unknown as CyInstance;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add a node if ID does not exist', () => {
        vi.mocked(cy.getElementById).mockReturnValue({
            nonempty: () => false,
        } as unknown as cytoscape.NodeSingular);

        const data = { id: 'new', name: 'New', tier: '1' };
        addNode(cy, data as any); // Cast data if necessary, or better yet, fix the input

        expect(cy.add).toHaveBeenCalled();
        expect(saveGraphData).toHaveBeenCalled();

        const callArg = vi.mocked(cy.add).mock.calls[0][0];
        expect(callArg.data.id).toBe('new');
        expect(callArg.data.tier).toBe(1);
        expect(callArg.classes).toBe('tier-1');
    });

    it('should throw error if node exists', () => {
        vi.mocked(cy.getElementById).mockReturnValue({
            nonempty: () => true,
        } as unknown as cytoscape.NodeSingular);

        expect(() => addNode(cy, { id: 'existing', name: 'Existing' })).toThrow();
    });

    it('should delete existing node', () => {
        const nodeMock = { nonempty: () => true } as unknown as cytoscape.NodeSingular;
        vi.mocked(cy.getElementById).mockReturnValue(nodeMock);

        const res = deleteNode(cy, 'exist');
        expect(cy.remove).toHaveBeenCalledWith(nodeMock);
        expect(res).toBe(true);
    });

    it('should return false if node to delete does not exist', () => {
        vi.mocked(cy.getElementById).mockReturnValue({
            nonempty: () => false,
        } as unknown as cytoscape.NodeSingular);
        const res = deleteNode(cy, 'missing');
        expect(cy.remove).not.toHaveBeenCalled();
        expect(res).toBe(false);
    });
});
