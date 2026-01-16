import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showPanel, hidePanel, initPanel } from './index';
import { CyInstance } from '../../../types';

// Mock storage module
vi.mock('../../core/storage', () => ({
    saveGraphData: vi.fn(),
    getDirtyState: vi.fn().mockReturnValue(false),
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

    const createMockNode = (data: any = {}) => {
        const nodeData = {
            id: 'test-id',
            name: 'Test Name',
            label: 'Test Name',
            labelsDisplay: 'Test Label',
            tier: 1,
            owner: 'Test Owner',
            repoUrl: 'http://test.com',
            verified: false,
            ...data,
        };
        let nodeClasses = data.classes || ['tier-1'];

        const mockEdgeCollection = {
            map: (fn: any) => [].map(fn),
            targets: () => ({ map: () => [] }),
        };

        const mockNode: any = {
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
                nodeClasses = nodeClasses.filter((c: string) => c !== cls);
                return mockNode;
            }),
            toggleClass: vi.fn((cls, state) => {
                if (state) {
                    if (!nodeClasses.includes(cls)) nodeClasses.push(cls);
                } else {
                    nodeClasses = nodeClasses.filter((c: string) => c !== cls);
                }
                return mockNode;
            }),
            outgoers: () => mockEdgeCollection,
            incomers: () => mockEdgeCollection,
            id: () => nodeData.id,
            cy: () => mockCy,
            hasClass: (cls: string) => nodeClasses.includes(cls),
        };
        return mockNode;
    };

    const mockCy = {
        elements: () => ({
            jsons: () => [{ data: { id: 'test' } }],
        }),
        nodes: () => ({
            filter: () => ({ map: () => [] }),
            toArray: () => [],
        }),
    } as unknown as CyInstance;

    it('should update panel content with node data', () => {
        const mockNode = createMockNode();
        showPanel(mockNode);
        const content = document.getElementById('panelContent')!;
        const panel = document.getElementById('servicePanel')!;
        expect(content.innerHTML).toContain('test-id');
        expect(content.innerHTML).toContain('Test Name');
        expect(panel.classList.contains('active')).toBe(true);
    });

    it('should hide panel and clear state', () => {
        const panel = document.getElementById('servicePanel')!;
        panel.classList.add('active');
        hidePanel();
        expect(panel.classList.contains('active')).toBe(false);
    });

    it('should display outgoing connections in panel', () => {
        const mockEdge = {
            id: () => 'edge-1',
            target: () => ({
                data: (key: string) =>
                    key === 'name'
                        ? 'Target Service'
                        : key === 'label'
                          ? 'Target Service'
                          : 'target-id',
                id: () => 'target-id',
            }),
        };
        const mockNode = {
            data: () => ({ id: 'source-id', name: 'Source', label: 'Source' }),
            outgoers: () => ({ map: (fn: any) => [mockEdge].map(fn) }),
            incomers: () => ({ map: (fn: any) => [].map(fn) }),
            cy: () => mockCy,
        } as any;

        showPanel(mockNode);
        const content = document.getElementById('panelContent')!;
        expect(content.innerHTML).toContain('Target Service');
        expect(content.innerHTML).toContain('connection-tag--outbound');
    });

    it('should display inbound connections in panel', () => {
        const mockEdge = {
            id: () => 'edge-2',
            source: () => ({
                data: (key: string) =>
                    key === 'name'
                        ? 'Source Service'
                        : key === 'label'
                          ? 'Source Service'
                          : 'source-id',
                id: () => 'source-id',
            }),
        };
        const mockNode = {
            data: () => ({ id: 'target-id', name: 'Target', label: 'Target' }),
            outgoers: () => ({ map: (fn: any) => [].map(fn) }),
            incomers: () => ({ map: (fn: any) => [mockEdge].map(fn) }),
            cy: () => mockCy,
        } as any;

        showPanel(mockNode);
        const content = document.getElementById('panelContent')!;
        expect(content.innerHTML).toContain('Source Service');
        expect(content.innerHTML).toContain('connection-tag--inbound');
    });

    it('should initialize panel and attach listeners', () => {
        initPanel(mockCy, vi.fn());
        expect(document.getElementById('editBtn')).toBeTruthy();
        expect(document.getElementById('saveBtn')).toBeTruthy();
    });

    it('should disable save button when entering edit mode', () => {
        const mockNode = createMockNode();
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
        expect(saveBtn.disabled).toBe(true);
    });

    it('should enable save button when input changes', () => {
        const mockNode = createMockNode();
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const nameInput = document.querySelector('input[data-key="name"]') as HTMLInputElement;
        nameInput.value = 'Changed';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
        expect(saveBtn.disabled).toBe(false);
    });

    it('should render verified toggle only in edit mode', () => {
        const mockNode = createMockNode({ verified: true });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        expect(document.querySelector('input[data-key="verified"]')).toBeNull();
        document.getElementById('editBtn')!.click();
        const verifiedToggle = document.querySelector(
            'input[data-key="verified"]'
        ) as HTMLInputElement;
        expect(verifiedToggle).toBeTruthy();
        expect(verifiedToggle.checked).toBe(true);
    });

    it('should mark verified as dirty when toggled', () => {
        const mockNode = createMockNode({ verified: false });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const verifiedToggle = document.querySelector(
            'input[data-key="verified"]'
        ) as HTMLInputElement;
        verifiedToggle.checked = true;
        verifiedToggle.dispatchEvent(new Event('change', { bubbles: true }));
        const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
        expect(saveBtn.disabled).toBe(false);
    });

    it('should correctly update node tier and classes when saving', () => {
        const mockNode = createMockNode({ tier: 1, classes: ['tier-1'] });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const tierSelect = document.querySelector('select[data-key="tier"]') as HTMLSelectElement;
        tierSelect.value = '3';
        tierSelect.dispatchEvent(new Event('change', { bubbles: true }));
        document.getElementById('saveBtn')!.click();
        expect(mockNode.data).toHaveBeenCalledWith(expect.objectContaining({ tier: 3 }));
        expect(mockNode.removeClass).toHaveBeenCalledWith('tier-1');
        expect(mockNode.addClass).toHaveBeenCalledWith('tier-3');
    });

    it('should update verified state and classes when saving', () => {
        const mockNode = createMockNode({ verified: false });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const verifiedToggle = document.querySelector(
            'input[data-key="verified"]'
        ) as HTMLInputElement;
        verifiedToggle.checked = true;
        verifiedToggle.dispatchEvent(new Event('change', { bubbles: true }));
        document.getElementById('saveBtn')!.click();
        expect(mockNode.toggleClass).toHaveBeenCalledWith('is-verified', true);
        expect(mockNode.data).toHaveBeenCalledWith(
            expect.objectContaining({
                verified: true,
                labels: expect.arrayContaining(['Verified']),
                labelsDisplay: expect.stringContaining('Verified'),
            })
        );
    });

    it('should parse multi-label input correctly', () => {
        const mockNode = createMockNode({ labels: [] });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const labelsInput = document.querySelector('input[data-key="labels"]') as HTMLInputElement;
        labelsInput.value = 'A; B, C';
        labelsInput.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('saveBtn')!.click();
        expect(mockNode.data).toHaveBeenCalledWith(
            expect.objectContaining({
                labels: ['A', 'B', 'C'],
            })
        );
    });

    it('should store original data for dirty comparison', () => {
        const mockNode = createMockNode({ name: 'Original Name' });
        showPanel(mockNode);
        const content = document.getElementById('panelContent')!;
        expect(content.innerHTML).toContain('Original Name');
    });

    it('should display descriptive tier label in showPanel', () => {
        const mockNode = createMockNode({ tier: 2 });
        showPanel(mockNode);
        const content = document.getElementById('panelContent')!;
        expect(content.innerHTML).toContain('Tier 2 (Major)');
    });

    it('should render a tier dropdown with correct selection in edit mode', () => {
        const mockNode = createMockNode({ tier: 2 });
        initPanel(mockCy, vi.fn());
        showPanel(mockNode);
        document.getElementById('editBtn')!.click();
        const tierSelect = document.querySelector('select[data-key="tier"]') as HTMLSelectElement;
        expect(tierSelect.value).toBe('2');
    });

    it('should show "No dependencies" text when node has no connections', () => {
        const mockNode = createMockNode();
        showPanel(mockNode);
        const content = document.getElementById('panelContent')!;
        expect(content.innerHTML).toContain('No outbound connections');
        expect(content.innerHTML).toContain('No inbound connections');
    });
});
