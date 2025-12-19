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

    const createMockNode = (data = {}) => {
        const nodeData = {
            id: 'test-id',
            name: 'Test Name',
            label: 'Test Name',
            labelsDisplay: 'Test Label',
            tier: '1',
            owner: 'Test Owner',
            repoUrl: 'http://test.com',
            ...data
        };
        // Create a mock collection that simulates Cytoscape's API
        const mockEdgeCollection = {
            map: () => [],
            targets: () => ({ map: () => [] })
        };
        return {
            data: (key) => key ? nodeData[key] : nodeData,
            outgoers: () => mockEdgeCollection,
            id: () => nodeData.id,
            classes: () => 'some-class',
            cy: () => mockCy
        };
    };

    const mockCy = {
        elements: () => ({
            jsons: () => [{ data: { id: 'test' } }]
        }),
        nodes: () => ({ filter: () => ({ map: () => [] }) })
    };

    it('should update panel content with node data', () => {
        const mockNode = createMockNode();

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        const panel = document.getElementById('servicePanel');

        expect(content.innerHTML).toContain('test-id');
        expect(content.innerHTML).toContain('Test Name');
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
                data: (key) => key === 'name' ? 'Target Service' : (key === 'label' ? 'Target Service' : 'target-id'),
                id: () => 'target-id'
            })
        };
        const mockNode = {
            data: () => ({ id: 'source-id', name: 'Source', label: 'Source' }),
            outgoers: () => ({ map: (fn) => [mockEdge].map(fn) })
        };

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        expect(content.innerHTML).toContain('Target Service');
    });

    it('should initialize panel with cy reference and attach listeners', () => {
        const mockUpdateStatus = vi.fn();

        initPanel(mockCy, mockUpdateStatus);

        const editBtn = document.getElementById('editBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveBtn = document.getElementById('saveBtn');

        expect(editBtn).toBeTruthy();
        expect(cancelBtn).toBeTruthy();
        expect(saveBtn).toBeTruthy();
    });

    it('should show "No dependencies" text when node has no connections', () => {
        const mockNode = createMockNode();

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        expect(content.innerHTML).toContain('No dependencies');
    });

    it('should disable save button when entering edit mode (no changes yet)', () => {
        const mockNode = createMockNode();
        const mockUpdateStatus = vi.fn();

        initPanel(mockCy, mockUpdateStatus);
        showPanel(mockNode);

        // Click edit button
        const editBtn = document.getElementById('editBtn');
        editBtn.click();

        // Save button should be disabled
        const saveBtn = document.getElementById('saveBtn');
        expect(saveBtn.disabled).toBe(true);
        expect(saveBtn.classList.contains('opacity-50')).toBe(true);
    });

    it('should enable save button when input value changes', () => {
        const mockNode = createMockNode();
        const mockUpdateStatus = vi.fn();

        initPanel(mockCy, mockUpdateStatus);
        showPanel(mockNode);

        // Click edit button
        const editBtn = document.getElementById('editBtn');
        editBtn.click();

        // Find an input and change its value
        const nameInput = document.querySelector('input[data-key="name"]');
        expect(nameInput).toBeTruthy();

        nameInput.value = 'Changed Name';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Save button should now be enabled
        const saveBtn = document.getElementById('saveBtn');
        expect(saveBtn.disabled).toBe(false);
        expect(saveBtn.classList.contains('opacity-50')).toBe(false);
    });

    it('should store original data for dirty comparison', () => {
        const mockNode = createMockNode({ name: 'Original Name' });

        showPanel(mockNode);

        const content = document.getElementById('panelContent');
        expect(content.innerHTML).toContain('Original Name');
    });
});
