import { describe, it, expect, beforeEach, vi } from 'vitest';
import { copyImageToClipboard, saveImageAsPng } from './exports';
import * as ui from './ui';

vi.mock('./ui', () => ({
    showToast: vi.fn()
}));

describe('Export Logic', () => {
    let mockCy;

    beforeEach(() => {
        mockCy = {
            png: vi.fn(() => 'data:image/png;base64,test')
        };

        // Mock fetch for base64
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
            blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' }))
        })));

        // Mock Clipboard
        vi.stubGlobal('navigator', {
            clipboard: {
                write: vi.fn(() => Promise.resolve())
            }
        });

        // Mock ClipboardItem
        vi.stubGlobal('ClipboardItem', vi.fn());

        vi.clearAllMocks();
    });

    it('should copy image to clipboard', async () => {
        await copyImageToClipboard(mockCy);
        expect(mockCy.png).toHaveBeenCalled();
        expect(navigator.clipboard.write).toHaveBeenCalled();
        expect(ui.showToast).toHaveBeenCalledWith(expect.stringContaining('copied'), 'success');
    });

    it('should show warning if cy is missing in copy', async () => {
        await copyImageToClipboard(null);
        expect(ui.showToast).toHaveBeenCalledWith(expect.stringContaining('No graph'), 'warning');
    });

    it('should save image as png', () => {
        // Mock click on anchor
        const mockLink = {
            click: vi.fn(),
            href: '',
            download: ''
        };
        vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

        saveImageAsPng(mockCy);
        expect(mockCy.png).toHaveBeenCalled();
        expect(mockLink.click).toHaveBeenCalled();
        expect(mockLink.download).toContain('service-map-');
        expect(ui.showToast).toHaveBeenCalledWith(expect.stringContaining('Saved'), 'success');
    });
});
