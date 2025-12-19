import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showPanel, hidePanel, initPanel } from './panel';
import * as storage from './storage';

// Mock storage module
vi.mock('./storage', () => ({
    saveGraphData: vi.fn()
}));

describe('Panel Module', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `
      <div id="servicePanel" class="">
        <div id="panelContent"></div>
        <button id="editBtn" class=""></button>
        <div id="editActions" class="hidden">
          <button id="saveBtn"></button>
          <button id="cancelBtn"></button>
        </div>
      </div>
    `;
    });

    const createMockNode = (data = {}) => ({
        data: () => ({
            id: 'test-id',
            label: 'Test Label',
            domain: 'Test Domain',
            tier: '1',
            owner: 'Test Owner',
            repoUrl: 'http://test.com',
            ...data
        }),
        outgoers: () => [],
        id: () => data.id || 'test-id',
        classes: () => 'some-class',
        cy: () => mockCy
    });

    const mockCy = {
        elements: () => ({
            jsons: () => [{ data: { id: 'test' } }]
        })
    };

    it('should update panel content with node data', () => {
        const mockNode = createMockNode();

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        const panel = document.getElementById('servicePanel');

        expect(content.innerHTML).toContain('test-id');
        expect(content.innerHTML).toContain('Test Label');
        expect(panel.classList.contains('active')).toBe(true);
    });

    it('should hide panel and clear state', () => {
        const panel = document.getElementById('servicePanel');
        panel.classList.add('active');

        hidePanel();

        expect(panel.classList.contains('active')).toBe(false);
    });

    it('should display outgoing connections in panel', () => {
        const mockEdge = {
            id: () => 'edge-1',
            target: () => ({
                data: (key) => key === 'label' ? 'Target Service' : 'target-id',
                id: () => 'target-id'
            })
        };
        const mockNode = {
            data: () => ({ id: 'source-id', label: 'Source' }),
            outgoers: () => [mockEdge]
        };
        // Add map method to simulate Cytoscape collection
        mockNode.outgoers = () => ({
            map: (fn) => [mockEdge].map(fn)
        });

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        expect(content.innerHTML).toContain('Target Service');
    });

    it('should initialize panel with cy reference and attach listeners once', () => {
        const mockUpdateStatus = vi.fn();

        // First call should attach listeners
        initPanel(mockCy, mockUpdateStatus);

        // Get buttons
        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        expect(editBtn).toBeTruthy();
        expect(cancelBtn).toBeTruthy();
    });

    it('should show "No dependencies" text when node has no connections', () => {
        const mockNode = createMockNode();

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        expect(content.innerHTML).toContain('No dependencies');
    });
});
