import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initServiceForm } from './serviceForm';
import { addNode } from './nodeOperations';

vi.mock('./nodeOperations', () => ({
    addNode: vi.fn(),
}));

vi.mock('./ui', () => ({
    showToast: vi.fn(),
    updateStatus: vi.fn(),
}));

describe('serviceForm logic', () => {
    let mockCy: any;
    let onNodeAdded: any;

    beforeEach(() => {
        // Mock dialog methods as jsdom doesn't implement them
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();

        document.body.innerHTML = `
            <dialog id="addServiceModal">
                <form id="addServiceForm">
                    <input name="id" value="new-id" />
                    <input name="name" value="New Service" />
                    <input name="owner" value="Team C" />
                    <input name="tier" value="2" />
                    <button type="submit">Create</button>
                    <button id="cancelAddServiceBtn">Cancel</button>
                </form>
            </dialog>
            <button id="addServiceBtnSidebar">Add</button>
        `;
        mockCy = {
            getElementById: vi.fn().mockReturnValue({ nonempty: () => false }),
            pan: vi.fn().mockReturnValue({ x: 0, y: 0 }),
            zoom: vi.fn().mockReturnValue(1),
            width: vi.fn().mockReturnValue(100),
            height: vi.fn().mockReturnValue(100),
            add: vi.fn(),
            elements: vi.fn().mockReturnValue({ jsons: () => [] })
        };
        onNodeAdded = vi.fn();
        vi.spyOn(window, 'alert').mockImplementation(() => { });
        initServiceForm(mockCy, onNodeAdded);
    });

    it('submits form and calls addNode', () => {
        const form = document.getElementById('addServiceForm') as HTMLFormElement;
        form.dispatchEvent(new Event('submit'));

        expect(addNode).toHaveBeenCalledWith(mockCy, expect.objectContaining({
            id: 'new-id',
            name: 'New Service',
            tier: 2
        }));
        expect(onNodeAdded).toHaveBeenCalled();
    });
});
