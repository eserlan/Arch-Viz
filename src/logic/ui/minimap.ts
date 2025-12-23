import { CyInstance } from '../../types';

const MINI_MAP_IMAGE_WIDTH = 220;
const MINI_MAP_IMAGE_HEIGHT = 160;
const MINI_MAP_BG = '#0f172a';

const getMiniMapElements = () => {
    const container = document.getElementById('minimap');
    const image = document.getElementById('minimapImage') as HTMLImageElement | null;
    const viewport = document.getElementById('minimapViewport') as HTMLElement | null;

    return { container, image, viewport };
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const initMiniMap = (cy: CyInstance): void => {
    const { container, image, viewport } = getMiniMapElements();
    if (!container || !image || !viewport) return;

    let viewportFrame = 0;
    let imageTimer = 0;

    const updateImage = (): void => {
        if (!cy || cy.elements().length === 0) return;
        image.src = cy.png({
            full: true,
            maxWidth: MINI_MAP_IMAGE_WIDTH,
            maxHeight: MINI_MAP_IMAGE_HEIGHT,
            bg: MINI_MAP_BG,
        });
    };

    const updateViewport = (): void => {
        if (!cy || cy.elements().length === 0) return;

        const bounds = cy.elements().boundingBox();
        if (bounds.w === 0 || bounds.h === 0) return;

        const extent = cy.extent();
        const width = image.clientWidth || MINI_MAP_IMAGE_WIDTH;
        const height = image.clientHeight || MINI_MAP_IMAGE_HEIGHT;

        const scaleX = width / bounds.w;
        const scaleY = height / bounds.h;

        const left = (extent.x1 - bounds.x1) * scaleX;
        const top = (extent.y1 - bounds.y1) * scaleY;
        const viewWidth = (extent.x2 - extent.x1) * scaleX;
        const viewHeight = (extent.y2 - extent.y1) * scaleY;

        const maxLeft = width - viewWidth;
        const maxTop = height - viewHeight;

        viewport.style.width = `${clamp(viewWidth, 0, width)}px`;
        viewport.style.height = `${clamp(viewHeight, 0, height)}px`;
        viewport.style.transform = `translate(${clamp(left, 0, maxLeft)}px, ${clamp(top, 0, maxTop)}px)`;
    };

    const scheduleViewportUpdate = (): void => {
        if (viewportFrame) return;
        viewportFrame = window.requestAnimationFrame(() => {
            viewportFrame = 0;
            updateViewport();
        });
    };

    const scheduleImageUpdate = (): void => {
        window.clearTimeout(imageTimer);
        imageTimer = window.setTimeout(updateImage, 120);
    };

    image.addEventListener('load', updateViewport);

    cy.on('render zoom pan resize', scheduleViewportUpdate);
    cy.on('layoutstop', scheduleImageUpdate);
    cy.on('add remove data position', scheduleImageUpdate);

    updateImage();
    updateViewport();
};
