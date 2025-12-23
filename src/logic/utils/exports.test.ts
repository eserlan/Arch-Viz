import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyImageToClipboard, saveImageAsPng } from './exports';
import { showToast } from '../ui/ui';

vi.mock('../ui/ui', () => ({
    showToast: vi.fn(),
}));

describe('exports logic', () => {
    let mockCy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockCy = {
            png: vi.fn().mockReturnValue('data:image/png;base64,test'),
        };
        // Mock global fetch and ClipboardItem
        global.fetch = vi.fn().mockResolvedValue({
            blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' }))
        });
        (global as any).ClipboardItem = vi.fn();
        (global as any).navigator.clipboard = {
            write: vi.fn().mockResolvedValue(undefined)
        };
    });

    it('copies image to clipboard', async () => {
        await copyImageToClipboard(mockCy);
        expect(mockCy.png).toHaveBeenCalled();
        expect(navigator.clipboard.write).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('copied'), 'success');
    });

    it('saves image as png', () => {
        const linkSpy = {
            click: vi.fn(),
            href: '',
            download: ''
        };
        vi.spyOn(document, 'createElement').mockReturnValue(linkSpy as any);

        saveImageAsPng(mockCy);
        expect(mockCy.png).toHaveBeenCalled();
        expect(linkSpy.click).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Saved'), 'success');
    });

    it('handles null cy', () => {
        saveImageAsPng(null);
        expect(showToast).toHaveBeenCalledWith('No graph to save', 'warning');
    });
});
