import { CyInstance } from '../../types';
import { layoutConfig } from './graphConfig';
import { updateStatus, showToast } from '../ui/ui';
import { LayoutOptions, NodeSingular } from 'cytoscape';
import { disableGrouping } from './grouping';

// Layouts that properly support compound/grouped nodes
const COMPOUND_COMPATIBLE_LAYOUTS = ['fcose', 'dagre', 'dagre-horizontal', 'dagre-vertical'];

/**
 * Layout Transition Management
 */
export const initLayoutManager = (cy: CyInstance): void => {
    const layoutSelect = document.getElementById('layoutSelect') as HTMLSelectElement | null;
    if (!layoutSelect) return;

    layoutSelect.addEventListener('change', (e: Event) => {
        if (!cy) return;
        const target = e.target as HTMLSelectElement;
        const layoutValue = target.value;
        const isHorizontalDagre = layoutValue === 'dagre-horizontal';
        const isVerticalDagre = layoutValue === 'dagre-vertical' || layoutValue === 'dagre';
        const layoutName = isHorizontalDagre || isVerticalDagre ? 'dagre' : layoutValue;

        // Check if grouping is active and layout doesn't support it
        const groupingSelect = document.getElementById(
            'groupingSelect'
        ) as HTMLSelectElement | null;
        const hasGrouping = groupingSelect && groupingSelect.value !== 'none';
        const hasParentNodes = cy.nodes(':parent').length > 0;

        if ((hasGrouping || hasParentNodes) && !COMPOUND_COMPATIBLE_LAYOUTS.includes(layoutValue)) {
            showToast(
                `${layoutName} layout doesn't support grouping - disabling groups`,
                'warning'
            );
            disableGrouping(cy);
            if (groupingSelect) {
                groupingSelect.value = 'none';
            }
        }

        // Check for selected node to use as center/root
        const selectedNodes = cy.nodes(':selected');
        const hasSelectedNode = selectedNodes.length > 0;
        const selectedNode: NodeSingular | null = hasSelectedNode ? selectedNodes[0] : null;
        const selectedNodeId = selectedNode?.id();

        if (hasSelectedNode && selectedNode) {
            showToast(`Layout centered on: ${selectedNode.data('name') || selectedNodeId}`, 'info');
        }

        updateStatus(`Switching to ${layoutName} layout…`);

        const animationOptions: AnimationOptions & { name: string; randomize: boolean } = {
            name: layoutName,
            animate: true,
            animationDuration: 1000,
            fit: false,
            padding: 160,
            randomize: false,
            nodeDimensionsIncludeLabels: true,
            // Dynamic spacing: increase for large graphs so nodes don't overlap
            spacingFactor:
                layoutName === 'circle' || layoutName === 'concentric'
                    ? Math.max(0.7, Math.min(2.5, cy.nodes().length / 50))
                    : 1,
            rankDir: isHorizontalDagre ? 'LR' : 'TB',
        };

        // Add layout-specific centering options
        if (selectedNodeId) {
            if (layoutName === 'breadthfirst') {
                // Use selected node as root for tree layouts
                animationOptions.roots = `#${selectedNodeId}`;
                animationOptions.directed = true;
            } else if (layoutName === 'concentric') {
                // Place selected node at center for concentric layout
                animationOptions.concentric = (node: NodeSingular) => {
                    return node.id() === selectedNodeId ? 1000 : node.degree();
                };
                animationOptions.levelWidth = () => 2;
            } else if (layoutName === 'dagre') {
                // Use selected node as root for hierarchical layout
                animationOptions.roots = `#${selectedNodeId}`;
            } else if (layoutName === 'circle') {
                // Start circle from selected node
                animationOptions.startAngle = 0;
                // Sort to put selected node first
                animationOptions.sort = (a: NodeSingular, b: NodeSingular) => {
                    if (a.id() === selectedNodeId) return -1;
                    if (b.id() === selectedNodeId) return 1;
                    return 0;
                };
            }
        }

        let finalConfig: LayoutOptions;

        if (layoutName === 'fcose') {
            finalConfig = {
                ...layoutConfig,
                animate: true,
                animationDuration: 1000,
                fit: false,
                padding: 160,
            };

            // For force-directed layouts, fix the selected node position
            if (selectedNode) {
                const pos = selectedNode.position();
                (
                    finalConfig as AnimationOptions & { fixedNodeConstraint: any[] }
                ).fixedNodeConstraint = [
                    {
                        nodeId: selectedNodeId,
                        position: { x: pos.x, y: pos.y },
                    },
                ];
            }
        } else {
            finalConfig = animationOptions;
        }

        const layout = cy.layout(finalConfig);

        let layoutFinished = false;
        const onStop = () => {
            if (layoutFinished) return;
            layoutFinished = true;
            cy.animate({
                fit: { padding: 160 },
                duration: 800,
                easing: 'ease-in-out-cubic',
            } as any);
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
