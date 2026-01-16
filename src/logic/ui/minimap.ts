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

const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

export const initMiniMap = (cy: CyInstance): void => {
    const { container, image, viewport } = getMiniMapElements();
    if (!container || !image || !viewport) return;

    let viewportFrame = 0;
    let imageTimer = 0;
    let isDragging = false;

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

    const panToMiniMapPosition = (clientX: number, clientY: number): void => {
        if (!cy || cy.elements().length === 0) return;

        const rect = image.getBoundingClientRect();
        const bounds = cy.elements().boundingBox();
        if (bounds.w === 0 || bounds.h === 0) return;

        const width = rect.width || MINI_MAP_IMAGE_WIDTH;
        const height = rect.height || MINI_MAP_IMAGE_HEIGHT;
        const scaleX = width / bounds.w;
        const scaleY = height / bounds.h;

        const x = clamp(clientX - rect.left, 0, width);
        const y = clamp(clientY - rect.top, 0, height);

        const targetX = bounds.x1 + x / scaleX;
        const targetY = bounds.y1 + y / scaleY;

        const zoom = cy.zoom();
        const pan = {
            x: cy.width() / 2 - targetX * zoom,
            y: cy.height() / 2 - targetY * zoom,
        };

        cy.pan(pan);
        scheduleViewportUpdate();
    };

    const scheduleImageUpdate = (): void => {
        window.clearTimeout(imageTimer);
        imageTimer = window.setTimeout(updateImage, 120);
    };

    image.addEventListener('load', updateViewport);

    cy.on('render zoom pan resize', scheduleViewportUpdate);
    cy.on('layoutstop', scheduleImageUpdate);
    cy.on('add remove data position', scheduleImageUpdate);

    const handlePointerMove = (event: PointerEvent | MouseEvent): void => {
        if (!isDragging) return;
        event.preventDefault();
        panToMiniMapPosition(event.clientX, event.clientY);
    };

    const handlePointerUp = (): void => {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove('dragging');
    };

    const handlePointerDown = (event: PointerEvent): void => {
        if (event.button !== 0) return;
        event.preventDefault();
        isDragging = true;
        container.classList.add('dragging');
        panToMiniMapPosition(event.clientX, event.clientY);
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    cy.on('destroy', () => {
        image.removeEventListener('load', updateViewport);
        cy.off('render zoom pan resize', scheduleViewportUpdate);
        cy.off('layoutstop', scheduleImageUpdate);
        cy.off('add remove data position', scheduleImageUpdate);

        container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
    });

    updateImage();
    updateViewport();
};
