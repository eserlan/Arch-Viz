import { parseCSV } from './parser';
import { saveGraphData } from './storage';

const dropZone = document.getElementById('dropZone');
const mainContainer = document.querySelector('main');

export const initUploader = (renderCallback, updateStatus, getCyInstance, showToast) => {
    if (!mainContainer || !dropZone) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        mainContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        mainContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('active');
        }, false);
    });

    mainContainer.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.csv')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const csvText = event.target.result;
                    updateStatus(`Parsing ${file.name}…`);

                    const result = parseCSV(csvText);

                    // Check for errors
                    if (result.error) {
                        // Show error toast
                        if (showToast) {
                            showToast(`Error: ${result.error}`, 'error');
                            // Show hints as separate toasts
                            if (result.hints) {
                                result.hints.forEach((hint, i) => {
                                    setTimeout(() => showToast(hint, 'warning'), (i + 1) * 500);
                                });
                            }
                        } else {
                            updateStatus(`Error: ${result.error}`);
                        }
                        return;
                    }

                    const { elements, skipped, hints } = result;

                    const cy = getCyInstance();
                    if (cy) cy.destroy();

                    renderCallback(elements, skipped);
                    saveGraphData(elements);

                    // Show any warnings/hints
                    if (hints && hints.length > 0 && showToast) {
                        hints.forEach((hint, i) => {
                            setTimeout(() => showToast(hint, 'warning'), (i + 1) * 300);
                        });
                    }
                };
                reader.readAsText(file);
            } else {
                if (showToast) {
                    showToast('Error: Only .csv files are supported', 'error');
                    showToast('Drag and drop a CSV file to load services', 'info');
                } else {
                    updateStatus('Error: Only .csv files are supported for drop upload.');
                }
            }
        }
    }, false);
};
