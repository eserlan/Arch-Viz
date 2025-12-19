import { parseCSV } from './parser';
import { saveGraphData } from './storage';

const dropZone = document.getElementById('dropZone');
const mainContainer = document.querySelector('main');

export const initUploader = (renderCallback, updateStatus, getCyInstance) => {
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
                    updateStatus(`Dropped file: ${file.name}. Parsing…`);
                    const { elements, skipped } = parseCSV(csvText);

                    const cy = getCyInstance();
                    if (cy) cy.destroy();

                    renderCallback(elements, skipped);
                    saveGraphData(elements);
                };
                reader.readAsText(file);
            } else {
                updateStatus('Error: Only .csv files are supported for drop upload.');
            }
        }
    }, false);
};
