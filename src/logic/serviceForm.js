/**
 * Add Service Form Handling
 */
import { addNode } from './nodeOperations';
import { showToast, updateStatus } from './ui';

export const initServiceForm = (cy, onNodeAdded) => {
    const addServiceModal = document.getElementById('addServiceModal');
    const addServiceBtnSidebar = document.getElementById('addServiceBtnSidebar');
    const cancelAddServiceBtn = document.getElementById('cancelAddServiceBtn');
    const addServiceForm = document.getElementById('addServiceForm');

    if (addServiceBtnSidebar) {
        addServiceBtnSidebar.addEventListener('click', () => {
            addServiceForm?.reset();
            addServiceModal?.showModal();
        });
    }

    if (cancelAddServiceBtn) {
        cancelAddServiceBtn.addEventListener('click', () => {
            addServiceModal?.close();
        });
    }

    if (addServiceForm) {
        addServiceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(addServiceForm);
            const data = {
                id: formData.get('id'),
                name: formData.get('name'),
                owner: formData.get('owner'),
                tier: parseInt(formData.get('tier'), 10)
            };

            try {
                if (!cy) throw new Error("Graph not initialized");
                addNode(cy, data);
                updateStatus(`Created service: ${data.name}`);
                addServiceModal?.close();
                showToast(`Service "${data.name}" created`, 'success');
                if (onNodeAdded) onNodeAdded();
            } catch (err) {
                alert(err.message);
            }
        });
    }
};
