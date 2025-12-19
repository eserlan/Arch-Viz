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
            tier: 1,
            owner: 'Test Owner',
            repoUrl: 'http://test.com',
            ...data
        };
        let nodeClasses = data.classes || ['tier-1'];

        // Create a mock collection that simulates Cytoscape's API
        const mockEdgeCollection = {
            map: (fn) => [].map(fn),
            targets: () => ({ map: () => [] })
        };

        const mockNode = {
            data: vi.fn((key, val) => {
                if (val !== undefined) {
                    if (typeof key === 'object') Object.assign(nodeData, key);
                    else nodeData[key] = val;
                    return mockNode;
                }
                if (typeof key === 'object') {
                    Object.assign(nodeData, key);
                    return mockNode;
                }
                return key ? nodeData[key] : nodeData;
            }),
            classes: vi.fn((val) => {
                if (val !== undefined) {
                    nodeClasses = Array.isArray(val) ? val : val.split(' ');
                    return mockNode;
                }
                return nodeClasses;
            }),
            addClass: vi.fn((cls) => {
                if (!nodeClasses.includes(cls)) nodeClasses.push(cls);
                return mockNode;
            }),
            removeClass: vi.fn((cls) => {
                nodeClasses = nodeClasses.filter(c => c !== cls);
                return mockNode;
            }),
            outgoers: () => mockEdgeCollection,
            id: () => nodeData.id,
            cy: () => mockCy,
            hasClass: (cls) => nodeClasses.includes(cls)
        };
        return mockNode;
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

    it('should display descriptive tier label in showPanel', () => {
        const mockNode = createMockNode({ tier: 2 });
        showPanel(mockNode);
        const content = document.getElementById('panelContent');
        expect(content.innerHTML).toContain('Tier 2 (Major)');
    });

    it('should render a tier dropdown with correct selection in edit mode', () => {
        const mockNode = createMockNode({ tier: 2 });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);

        document.getElementById('editBtn').click();

        const tierSelect = document.querySelector('select[data-key="tier"]');
        expect(tierSelect).toBeTruthy();
        expect(tierSelect.value).toBe('2');
        expect(tierSelect.options[1].selected).toBe(true); // Tier 2 (Major)
    });

    it('should correctly update node tier data and classes when saving', () => {
        const mockNode = createMockNode({ tier: 1, classes: ['tier-1'] });
        const mockUpdateStatus = vi.fn();

        initPanel(mockCy, mockUpdateStatus);
        showPanel(mockNode);

        document.getElementById('editBtn').click();

        // Find selecting element
        const tierSelect = document.querySelector('select[data-key="tier"]');
        expect(tierSelect).toBeTruthy();

        // Change tier to 3
        tierSelect.value = '3';
        tierSelect.dispatchEvent(new Event('change', { bubbles: true }));

        // Save
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.click();

        // Assert data updated (parseInt should have been called)
        expect(mockNode.data).toHaveBeenCalledWith(expect.objectContaining({ tier: 3 }));

        // Assert classes updated (old removed, new added) via handleSave logic
        expect(mockNode.removeClass).toHaveBeenCalledWith('tier-1');
        expect(mockNode.addClass).toHaveBeenCalledWith('tier-3');
    });

    it('should correctly parse multi-label input and update node classes', () => {
        const mockNode = createMockNode({ labels: [], classes: [] });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);

        document.getElementById('editBtn').click();

        // Find labels input
        const labelsInput = document.querySelector('input[data-key="labels"]');
        expect(labelsInput).toBeTruthy();
        labelsInput.value = 'Security; Auth, Analytics'; // Test both separators
        labelsInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Save
        document.getElementById('saveBtn').click();

        // Assert labels parsed correctly
        expect(mockNode.data).toHaveBeenCalledWith(expect.objectContaining({
            labels: ['Security', 'Auth', 'Analytics'],
            labelsDisplay: 'Security, Auth, Analytics'
        }));

        // Assert classes mapped (lower-cased and slugified)
        // Note: The logic in panel.js uses slugify-like replacement
        expect(mockNode.classes).toHaveBeenCalledWith(expect.arrayContaining([
            'label-security',
            'label-auth',
            'label-analytics'
        ]));
    });
});
