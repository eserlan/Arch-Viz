import { CyInstance, ServiceData, Tier } from '../../types';
import { addNode } from '../graph/nodeOperations';
import { showToast, updateStatus } from './ui';
import { toggleEditMode } from '../graph/edgeEditor';

/**
 * Add Service Form Handling
 */
export const initServiceForm = (cy: CyInstance, onNodeAdded?: () => void): void => {
    const addServiceModal = document.getElementById('addServiceModal') as HTMLDialogElement | null;
    const addServiceBtnSidebar = document.getElementById('addServiceBtnSidebar');
    const cancelAddServiceBtn = document.getElementById('cancelAddServiceBtn');
    const addServiceForm = document.getElementById('addServiceForm') as HTMLFormElement | null;

    const editModeBtn = document.getElementById('editModeBtn');

    if (editModeBtn) {
        // Remove existing listeners to avoid multiple attachments
        const newEditBtn = editModeBtn.cloneNode(true) as HTMLElement;
        editModeBtn.parentNode?.replaceChild(newEditBtn, editModeBtn);
        const newEditLabel = newEditBtn.querySelector('#editModeLabel') || newEditBtn;

        newEditBtn.addEventListener('click', () => {
            const active = toggleEditMode(updateStatus);
            if (active) {
                newEditBtn.className =
                    'w-full bg-amber-600 border border-amber-500 text-white text-xs rounded px-3 py-2 flex items-center justify-center gap-2 transition-colors';
                newEditLabel.textContent = 'Exit Edit Mode';
                addServiceBtnSidebar?.classList.remove('hidden');
            } else {
                newEditBtn.className =
                    'w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-3 py-2 hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors flex items-center justify-center gap-2';
                newEditLabel.textContent = 'Enter Edit Mode';
                addServiceBtnSidebar?.classList.add('hidden');
            }
        });
    }

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
                tier: parseInt(formData.get('tier') as string, 10) as Tier,
            };

            try {
                if (!cy) throw new Error('Graph not initialized');
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
