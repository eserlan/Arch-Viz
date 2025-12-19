import { describe, it, expect, vi } from 'vitest';
import { addNode, deleteNode } from './nodeOperations';
import { saveGraphData } from './storage';

// Mock storage
vi.mock('./storage', () => ({
    saveGraphData: vi.fn()
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
        elements: () => ({ jsons: () => [] })
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add a node if ID does not exist', () => {
        cy.getElementById.mockReturnValue({ nonempty: () => false }); // Empty collection

        const data = { id: 'new', name: 'New', tier: '1' };
        addNode(cy, data);

        expect(cy.add).toHaveBeenCalled();
        expect(saveGraphData).toHaveBeenCalled();

        const callArg = cy.add.mock.calls[0][0];
        expect(callArg.data.id).toBe('new');
        expect(callArg.data.tier).toBe(1);
        expect(callArg.classes).toBe('tier-1');
    });

    it('should throw error if node exists', () => {
        cy.getElementById.mockReturnValue({ nonempty: () => true });

        expect(() => addNode(cy, { id: 'existing' })).toThrow();
    });

    it('should delete existing node', () => {
        const nodeMock = { nonempty: () => true };
        cy.getElementById.mockReturnValue(nodeMock);

        const res = deleteNode(cy, 'exist');
        expect(cy.remove).toHaveBeenCalledWith(nodeMock);
        expect(res).toBe(true);
    });

    it('should return false if node to delete does not exist', () => {
        cy.getElementById.mockReturnValue({ nonempty: () => false });
        const res = deleteNode(cy, 'missing');
        expect(cy.remove).not.toHaveBeenCalled();
        expect(res).toBe(false);
    });
});
