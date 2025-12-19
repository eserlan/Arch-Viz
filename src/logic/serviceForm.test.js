import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initServiceForm } from './serviceForm';
import * as nodeOps from './nodeOperations';
import * as ui from './ui';

vi.mock('./nodeOperations', () => ({
    addNode: vi.fn()
}));

vi.mock('./ui', () => ({
    showToast: vi.fn(),
    updateStatus: vi.fn()
}));

describe('Service Form Logic', () => {
    let mockCy;

    beforeEach(() => {
        document.body.innerHTML = `
            <dialog id="addServiceModal">
                <form id="addServiceForm">
                    <input name="id" value="test-id" />
                    <input name="name" value="Test Name" />
                    <input name="owner" value="Test Owner" />
                    <select name="tier"><option value="1">1</option></select>
                    <button type="submit">Submit</button>
                </form>
                <button id="cancelAddServiceBtn"></button>
            </dialog>
            <button id="addServiceBtnSidebar"></button>
        `;

        mockCy = {};
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();

        vi.clearAllMocks();
    });

    it('should open modal when sidebar button is clicked', () => {
        initServiceForm(mockCy);
        const btn = document.getElementById('addServiceBtnSidebar');
        const modal = document.getElementById('addServiceModal');

        btn.click();
        expect(modal.showModal).toHaveBeenCalled();
    });

    it('should call addNode and show success on form submission', () => {
        const onAdded = vi.fn();
        initServiceForm(mockCy, onAdded);

        const form = document.getElementById('addServiceForm');
        form.dispatchEvent(new Event('submit'));

        expect(nodeOps.addNode).toHaveBeenCalledWith(mockCy, {
            id: 'test-id',
            name: 'Test Name',
            owner: 'Test Owner',
            tier: 1
        });
        expect(ui.showToast).toHaveBeenCalledWith(expect.stringContaining('Test Name'), 'success');
        expect(onAdded).toHaveBeenCalled();
    });

    it('should handle errors during node creation', () => {
        nodeOps.addNode.mockImplementation(() => {
            throw new Error('Test Error');
        });
        vi.stubGlobal('alert', vi.fn());

        initServiceForm(mockCy);
        const form = document.getElementById('addServiceForm');
        form.dispatchEvent(new Event('submit'));

        expect(window.alert).toHaveBeenCalledWith('Test Error');
    });
});
