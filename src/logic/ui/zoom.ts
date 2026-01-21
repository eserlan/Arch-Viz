/**
 * Calculates the dynamic zoom level based on current zoom and wheel delta.
 *
 * @param currentZoom Current zoom level
 * @param deltaY Mouse wheel deltaY
 * @param minZoom Minimum allowed zoom
 * @param maxZoom Maximum allowed zoom
 * @returns New zoom level
 */
export const calculateDynamicZoom = (
    currentZoom: number,
    deltaY: number,
    minZoom: number,
    maxZoom: number
): number => {
    // Base sensitivity (lower = slower)
    const baseSensitivity = 0.0005;

    // Movement speed scales with zoom level using a square-root inverse:
    // - faster movement when zoomed out (zoom < 1)
    // - slower movement when zoomed in (zoom > 1)
    // Using sqrt(1 / zoom) instead of 1 / zoom makes the change in speed gentler.
    const fitFactor = Math.max(0.1, currentZoom);
    const dynamicFactor = Math.sqrt(1 / fitFactor);

    // Apply delta
    const delta = deltaY * baseSensitivity * dynamicFactor;

    // Calculate new zoom using exponential scaling for smooth feel
    const newZoom = currentZoom * Math.pow(10, -delta);

    // Clamp
    return Math.max(minZoom, Math.min(maxZoom, newZoom));
};
