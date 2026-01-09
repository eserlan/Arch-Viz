import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initMiniMap } from './minimap';
import { CyInstance } from '../../types';

describe('Mini map logic', () => {
    let eventHandlers: Record<string, (...args: any[]) => any> = {};
    let mockCy: CyInstance;
    let extent: { x1: number; y1: number; x2: number; y2: number };

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="minimap"></div>
            <img id="minimapImage" />
            <div id="minimapViewport"></div>
        `;

        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: any) => {
            cb(0);
            return 1;
        });

        extent = { x1: 0, y1: 0, x2: 50, y2: 50 };
        eventHandlers = {};

        mockCy = {
            elements: vi.fn(() => ({
                length: 1,
                boundingBox: vi.fn(() => ({ x1: 0, y1: 0, w: 100, h: 100 }))
            })),
            extent: vi.fn(() => extent),
            png: vi.fn(() => 'data:image/png;base64,mini-map'),
            pan: vi.fn(),
            zoom: vi.fn(() => 1),
            width: vi.fn(() => 200),
            height: vi.fn(() => 100),
            on: vi.fn((event: string, handler: (...args: any[]) => any) => {
                eventHandlers[event] = handler;
            }),
            off: vi.fn()
        } as unknown as CyInstance;

        const image = document.getElementById('minimapImage') as HTMLImageElement;
        Object.defineProperty(image, 'clientWidth', { value: 220 });
        Object.defineProperty(image, 'clientHeight', { value: 160 });
    });

    afterEach(() => {
        // Trigger destroy cleanup if it was registered
        if (eventHandlers['destroy']) {
            eventHandlers['destroy']();
        }
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('renders the minimap image and viewport on init', () => {
        initMiniMap(mockCy);

        const image = document.getElementById('minimapImage') as HTMLImageElement;
        const viewport = document.getElementById('minimapViewport') as HTMLElement;

        expect(mockCy.png).toHaveBeenCalledWith({
            full: true,
            maxWidth: 220,
            maxHeight: 160,
            bg: '#0f172a'
        });
        expect(image.src).toContain('data:image/png');
        expect(parseFloat(viewport.style.width)).toBeCloseTo(110, 5);
        expect(parseFloat(viewport.style.height)).toBeCloseTo(80, 5);
    });

    it('updates the viewport when the graph pans or zooms', () => {
        initMiniMap(mockCy);
        (mockCy.extent as unknown as { mockClear: () => void }).mockClear();
        extent = { x1: 25, y1: 25, x2: 75, y2: 75 };

        eventHandlers['render zoom pan resize']?.();
        expect(window.requestAnimationFrame).toHaveBeenCalled();

        const image = document.getElementById('minimapImage') as HTMLImageElement;
        image.dispatchEvent(new Event('load'));

        expect(mockCy.extent).toHaveBeenCalled();
    });

    it('schedules image refresh after layout changes', () => {
        vi.useFakeTimers();
        initMiniMap(mockCy);

        eventHandlers['layoutstop']?.();
        vi.advanceTimersByTime(120);

        expect(mockCy.png).toHaveBeenCalledTimes(2);
    });

    it('pans the graph when dragging inside the minimap', () => {
        initMiniMap(mockCy);

        const container = document.getElementById('minimap') as HTMLElement;
        const image = document.getElementById('minimapImage') as HTMLImageElement;
        vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 220,
            height: 160,
            right: 220,
            bottom: 160,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect);

        container.dispatchEvent(new MouseEvent('pointerdown', { clientX: 110, clientY: 80, button: 0 }));
        window.dispatchEvent(new MouseEvent('pointermove', { clientX: 110, clientY: 80 }));

        expect(mockCy.pan).toHaveBeenCalled();
        const lastCall = (mockCy.pan as any).mock.calls.at(-1)[0];
        expect(lastCall.x).toBeCloseTo(50, 5);
        expect(lastCall.y).toBeCloseTo(0, 5);
    });
});
