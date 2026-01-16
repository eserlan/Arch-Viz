import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initUploader } from './uploader';
import { parseCSV } from '../core/parser';
import { saveGraphData } from '../core/storage';

vi.mock('../core/parser', () => ({
    parseCSV: vi.fn(),
}));

vi.mock('../core/storage', () => ({
    saveGraphData: vi.fn(),
}));

describe('uploader', () => {
    let mockRender: any;
    let mockUpdateStatus: any;
    let mockGetCy: any;
    let mockShowToast: any;
    let mainElem: HTMLElement;
    let dropZoneElem: HTMLElement;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup DOM
        document.body.innerHTML = `
            <main></main>
            <div id="dropZone"></div>
        `;
        mainElem = document.querySelector('main')!;
        dropZoneElem = document.getElementById('dropZone')!;

        mockRender = vi.fn();
        mockUpdateStatus = vi.fn();
        mockGetCy = vi.fn();
        mockShowToast = vi.fn();
    });

    it('should initialize and handle drag events', () => {
        initUploader(mockRender, mockUpdateStatus, mockGetCy, mockShowToast);

        const dragOverEvent = new Event('dragover');
        Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() });
        Object.defineProperty(dragOverEvent, 'stopPropagation', { value: vi.fn() });

        mainElem.dispatchEvent(dragOverEvent);

        expect(dragOverEvent.preventDefault).toHaveBeenCalled();
        expect(dropZoneElem.classList.contains('active')).toBe(true);

        const dragLeaveEvent = new Event('dragleave');
        mainElem.dispatchEvent(dragLeaveEvent);
        expect(dropZoneElem.classList.contains('active')).toBe(false);
    });

    it('should handle file drop and successful parse', async () => {
        const mockFiles = [
            {
                name: 'test.csv',
                size: 100,
            },
        ];

        const dropEvent = new Event('drop');
        Object.defineProperty(dropEvent, 'dataTransfer', {
            value: { files: mockFiles },
        });
        Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });
        Object.defineProperty(dropEvent, 'stopPropagation', { value: vi.fn() });

        // Mock FileReader
        const mockFileReader = {
            readAsText: vi.fn(function (this: any) {
                if (this.onload) {
                    this.onload({ target: { result: 'id,name\n1,Test' } });
                }
            }),
        };
        // Use a constructor function
        vi.stubGlobal(
            'FileReader',
            vi.fn().mockImplementation(function () {
                return mockFileReader;
            })
        );

        (parseCSV as any).mockReturnValue({
            elements: [{ data: { id: '1' } }],
            skipped: 0,
        });

        initUploader(mockRender, mockUpdateStatus, mockGetCy, mockShowToast);
        mainElem.dispatchEvent(dropEvent);

        expect(mockUpdateStatus).toHaveBeenCalledWith(expect.stringContaining('Parsing test.csv'));
        expect(parseCSV).toHaveBeenCalledWith('id,name\n1,Test');
        expect(mockRender).toHaveBeenCalled();
        expect(saveGraphData).toHaveBeenCalled();

        vi.unstubAllGlobals();
    });

    it('should handle parse errors', () => {
        const mockFiles = [{ name: 'error.csv' }];
        const dropEvent = new Event('drop');
        Object.defineProperty(dropEvent, 'dataTransfer', { value: { files: mockFiles } });

        const mockFileReader = {
            readAsText: vi.fn(function (this: any) {
                if (this.onload) {
                    this.onload({ target: { result: 'bad stuff' } });
                }
            }),
        };
        vi.stubGlobal(
            'FileReader',
            vi.fn().mockImplementation(function () {
                return mockFileReader;
            })
        );

        (parseCSV as any).mockReturnValue({
            error: 'Invalid CSV',
            hints: ['Check headers'],
        });

        vi.useFakeTimers();
        initUploader(mockRender, mockUpdateStatus, mockGetCy, mockShowToast);
        mainElem.dispatchEvent(dropEvent);
        vi.runAllTimers();

        expect(mockShowToast).toHaveBeenCalledWith('Error: Invalid CSV', 'error');
        expect(mockShowToast).toHaveBeenCalledWith('Check headers', 'warning');

        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should reject non-csv files', () => {
        const mockFiles = [{ name: 'image.png' }];
        const dropEvent = new Event('drop');
        Object.defineProperty(dropEvent, 'dataTransfer', { value: { files: mockFiles } });

        initUploader(mockRender, mockUpdateStatus, mockGetCy, mockShowToast);
        mainElem.dispatchEvent(dropEvent);

        expect(mockShowToast).toHaveBeenCalledWith(
            expect.stringContaining('Only .csv files'),
            'error'
        );
    });
});
