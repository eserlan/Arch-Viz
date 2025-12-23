import { describe, it, expect } from 'vitest';
import { calculateDynamicZoom } from './zoom';

describe('Dynamic Zoom Logic', () => {
    const minZoom = 0.1;
    const maxZoom = 2.5;

    it('should zoom out when delta is positive', () => {
        const startZoom = 1.0;
        const deltaY = 100; // Scrolling down usually maps to zooming out
        const newZoom = calculateDynamicZoom(startZoom, deltaY, minZoom, maxZoom);
        expect(newZoom).toBeLessThan(startZoom);
    });

    it('should zoom in when delta is negative', () => {
        const startZoom = 1.0;
        const deltaY = -100; // Scrolling up
        const newZoom = calculateDynamicZoom(startZoom, deltaY, minZoom, maxZoom);
        expect(newZoom).toBeGreaterThan(startZoom);
    });

    it('should be sensitive when zoomed out (low zoom)', () => {
        const lowZoom = 0.5;
        const delta = 100;

        const changeAtLow = Math.abs(calculateDynamicZoom(lowZoom, delta, minZoom, maxZoom) - lowZoom) / lowZoom;
        expect(changeAtLow).toBeGreaterThan(0.01);
    });

    it('should clamp values to min/max', () => {
        expect(calculateDynamicZoom(1.0, 10000, minZoom, maxZoom)).toBe(minZoom);
        expect(calculateDynamicZoom(1.0, -10000, minZoom, maxZoom)).toBe(maxZoom);
    });

    it('should handle zooming directions correctly', () => {
        const zoomInStart = 2.0;
        const zoomInEnd = calculateDynamicZoom(zoomInStart, -100, minZoom, maxZoom);
        const diffIn = zoomInEnd - zoomInStart;

        const zoomOutStart = 0.2;
        const zoomOutEnd = calculateDynamicZoom(zoomOutStart, -100, minZoom, maxZoom);
        const diffOut = zoomOutEnd - zoomOutStart;

        expect(diffIn).toBeGreaterThan(0);
        expect(diffOut).toBeGreaterThan(0);
    });
});
