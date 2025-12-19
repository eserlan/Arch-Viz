import { CyInstance, ServiceData, Tier } from '../types';
import { addNode } from './nodeOperations';
import { showToast, updateStatus } from './ui';

/**
 * Add Service Form Handling
 */
export const initServiceForm = (cy: CyInstance, onNodeAdded?: () => void): void => {
    const addServiceModal = document.getElementById('addServiceModal') as HTMLDialogElement | null;
    const addServiceBtnSidebar = document.getElementById('addServiceBtnSidebar');
    const cancelAddServiceBtn = document.getElementById('cancelAddServiceBtn');
    const addServiceForm = document.getElementById('addServiceForm') as HTMLFormElement | null;

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
        addServiceForm.addEventListener('submit', (e: SubmitEvent) => {
            e.preventDefault();
            const formData = new FormData(addServiceForm);

            const data: ServiceData = {
                id: formData.get('id') as string,
                name: formData.get('name') as string,
                owner: formData.get('owner') as string,
                tier: parseInt(formData.get('tier') as string, 10) as Tier
            };

            try {
                if (!cy) throw new Error("Graph not initialized");
                addNode(cy, data);
                updateStatus(`Created service: ${data.name}`);
                addServiceModal?.close();
                showToast(`Service "${data.name}" created`, 'success');
                if (onNodeAdded) onNodeAdded();
            } catch (err: any) {
                alert(err.message);
            }
        });
    }
};
