import { parseCSV, ParseResult } from '../core/parser';
import { saveGraphData } from '../core/storage';
import { CyInstance, ToastType } from '../../types';
import { ElementsDefinition, ElementDefinition } from 'cytoscape';

type RenderCallback = (elements: ElementsDefinition | ElementDefinition[], skipped: number) => void;
type UpdateStatus = (msg: string) => void;
type ShowToast = (msg: string, type: ToastType) => void;
type GetCyInstance = () => CyInstance | undefined;

export const initUploader = (
    renderCallback: RenderCallback,
    updateStatus: UpdateStatus,
    getCyInstance: GetCyInstance,
    showToast?: ShowToast
): void => {
    const dropZone = document.getElementById('dropZone');
    const mainContainer = document.querySelector('main');

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

    mainContainer.addEventListener('drop', (e: DragEvent) => {
        const dt = e.dataTransfer;
        const files = dt?.files;

        if (files && files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.csv')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const csvText = event.target?.result as string;
                    updateStatus(`Parsing ${file.name}…`);

                    const result: ParseResult = parseCSV(csvText);

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
                    saveGraphData(elements as ElementDefinition[]);

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
