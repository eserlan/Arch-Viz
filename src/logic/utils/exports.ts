import { CyInstance } from '../../types';
import { showToast } from '../ui/ui';

/**
 * Graph Export functionality (Clipboard and Download)
 */

export const copyImageToClipboard = async (cy: CyInstance | null): Promise<void> => {
    if (!cy) {
        showToast('No graph to copy', 'warning');
        return;
    }
    try {
        const png64 = cy.png({ scale: 2, bg: '#0f172a', full: true });
        const response = await fetch(png64);
        const blob = await response.blob();

        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

        showToast('Graph copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy image:', err);
        showToast('Failed to copy image to clipboard', 'error');
    }
};

export const saveImageAsPng = (cy: CyInstance | null): void => {
    if (!cy) {
        showToast('No graph to save', 'warning');
        return;
    }
    try {
        const png64 = cy.png({ scale: 2, bg: '#0f172a', full: true });
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const filename = `service-map-${timestamp}.png`;

        const link = document.createElement('a');
        link.href = png64;
        link.download = filename;
        link.click();

        showToast(`Saved ${filename}`, 'success');
    } catch (err) {
        console.error('Failed to save image:', err);
        showToast('Failed to save image', 'error');
    }
};
