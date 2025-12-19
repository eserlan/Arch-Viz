/**
 * Layout Transition Management
 */
import { layoutConfig } from './graphConfig';
import { updateStatus } from './ui';

export const initLayoutManager = (cy) => {
    const layoutSelect = document.getElementById('layoutSelect');
    if (!layoutSelect) return;

    layoutSelect.addEventListener('change', (e) => {
        if (!cy) return;
        const layoutValue = e.target.value;
        const isHorizontalDagre = layoutValue === 'dagre-horizontal';
        const isVerticalDagre = layoutValue === 'dagre-vertical' || layoutValue === 'dagre';
        const layoutName = (isHorizontalDagre || isVerticalDagre) ? 'dagre' : layoutValue;

        updateStatus(`Switching to ${layoutName} layout…`);

        const animationOptions = {
            name: layoutName,
            animate: true,
            animationDuration: 1000,
            fit: false,
            padding: 160,
            randomize: false,
            nodeDimensionsIncludeLabels: true,
            spacingFactor: (layoutName === 'circle' || layoutName === 'concentric') ? 0.7 : 1,
            rankDir: isHorizontalDagre ? 'LR' : 'TB',
        };

        const finalConfig = layoutName === 'fcose' ?
            { ...layoutConfig, animate: true, animationDuration: 1000, fit: false, padding: 160 } :
            animationOptions;

        const layout = cy.layout(finalConfig);

        let layoutFinished = false;
        const onStop = () => {
            if (layoutFinished) return;
            layoutFinished = true;
            cy.animate({
                fit: { padding: 160 },
                duration: 800,
                easing: 'ease-in-out-cubic'
            });
            updateStatus(`Layout: ${layoutName} applied`);
        };

        layout.one('layoutstop', onStop);
        layout.run();

        // Fallback
        setTimeout(() => {
            if (!layoutFinished) {
                onStop();
            }
        }, 2500);
    });
};
