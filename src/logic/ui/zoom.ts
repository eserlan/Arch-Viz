/**
 * Calculates the dynamic zoom level based on current zoom and wheel delta.
 * 
 * @param currentZoom Current zoom level
 * @param deltaY Mouse wheel deltaY
 * @param minZoom Minimum allowed zoom
 * @param maxZoom Maximum allowed zoom
 * @returns New zoom level
 */
export const calculateDynamicZoom = (currentZoom: number, deltaY: number, minZoom: number, maxZoom: number): number => {
    // Base sensitivity 
    const baseSensitivity = 0.001;

    // faster movement when zoomed out (zoom < 1)
    // slower movement when zoomed in (zoom > 1)
    const fitFactor = Math.max(0.1, currentZoom);
    const dynamicFactor = Math.max(0.1, 1 / fitFactor);

    // Apply delta
    const delta = deltaY * baseSensitivity * dynamicFactor;

    // Calculate new zoom using exponential scaling for smooth feel
    const newZoom = currentZoom * Math.pow(10, -delta);

    // Clamp
    return Math.max(minZoom, Math.min(maxZoom, newZoom));
};
