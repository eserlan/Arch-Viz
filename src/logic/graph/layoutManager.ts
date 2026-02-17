import { CyInstance } from '../../types';
import { layoutConfig } from './graphConfig';
import { updateStatus, showToast } from '../ui/ui';
import { LayoutOptions, NodeSingular } from 'cytoscape';
import { disableGrouping } from './grouping';

// Layouts that properly support compound/grouped nodes
const COMPOUND_COMPATIBLE_LAYOUTS = ['fcose', 'dagre', 'dagre-horizontal', 'dagre-vertical'];

// Concentric layout constants for proximity-based rings
// These ensure each "hop" from the selected node maps to its own distinct ring.
const CONCENTRIC_PROXIMITY = {
    ROOT_VALUE: 200, // Highest value = absolute center
    NEIGHBOR_BASE: 190, // Starting value for neighbors (dist=1 is 188)
    DISTANCE_STEP: 2, // Decrease per jump level
    LEVEL_WIDTH: 1, // Combined with STEP=2, ensures 1 ring per jump level
};

/**
 * Layout Transition Management
 */
export const runLayout = (cy: CyInstance, layoutValue: string): void => {
    if (!cy) return;
    const isHorizontalDagre = layoutValue === 'dagre-horizontal';
    const isVerticalDagre = layoutValue === 'dagre-vertical' || layoutValue === 'dagre';
    const layoutName = isHorizontalDagre || isVerticalDagre ? 'dagre' : layoutValue;

    // Check if grouping is active and layout doesn't support it
    const groupingSelect = document.getElementById('groupingSelect') as HTMLSelectElement | null;
    const hasGrouping = groupingSelect && groupingSelect.value !== 'none';
    const hasParentNodes = cy.nodes(':parent').length > 0;

    if ((hasGrouping || hasParentNodes) && !COMPOUND_COMPATIBLE_LAYOUTS.includes(layoutValue)) {
        showToast(`${layoutName} layout doesn't support grouping - disabling groups`, 'warning');
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
                ? Math.max(
                      0.8,
                      Math.min(layoutName === 'concentric' ? 1.2 : 2.5, cy.nodes().length / 60)
                  )
                : 1,
        rankDir: isHorizontalDagre ? 'LR' : 'TB',
    };

    // Set defaults for concentric layout
    if (layoutName === 'concentric') {
        let distanceCalculator: any = null;
        if (selectedNode) {
            // Pre-calculate distances for the whole graph from the selected node.
            // Using dijkstra on unweighted edges effectively gives BFS distances.
            distanceCalculator = cy.elements().dijkstra({
                root: selectedNode,
                directed: false,
            });

            // Tighten spacing specifically for the proximity-based layout
            animationOptions.spacingFactor = 0.9;
        }

        (animationOptions as any).concentric = (node: NodeSingular) => {
            if (selectedNodeId && node.id() === selectedNodeId) {
                return CONCENTRIC_PROXIMITY.ROOT_VALUE;
            }

            if (distanceCalculator) {
                const dist = distanceCalculator.distanceTo(node);
                if (dist !== undefined && Number.isFinite(dist)) {
                    // Use a base value so that neighbors are placed just inside the root.
                    // Each integer jump level gets its own ring by decreasing the value by STEP.
                    return (
                        CONCENTRIC_PROXIMITY.NEIGHBOR_BASE -
                        dist * CONCENTRIC_PROXIMITY.DISTANCE_STEP
                    );
                }
                return 0;
            }

            const rawTier = node.data('tier');
            const numericTier = Number(rawTier);
            // Use tier 4 as default if missing or invalid (1-4 range)
            const safeTier =
                Number.isFinite(numericTier) && numericTier >= 1 && numericTier <= 4
                    ? numericTier
                    : 4;
            // Lower tier = closer to center (higher concentric value)
            // Use degree as a subtle tie-breaker within tiers
            return (5 - safeTier) * 10 + node.degree() / 20;
        };
        (animationOptions as any).levelWidth = () =>
            distanceCalculator ? CONCENTRIC_PROXIMITY.LEVEL_WIDTH : 3;
    }

    // Add layout-specific centering options
    if (selectedNodeId) {
        if (layoutName === 'breadthfirst') {
            // Use selected node as root for tree layouts
            animationOptions.roots = `#${selectedNodeId}`;
            animationOptions.directed = true;
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
            (finalConfig as AnimationOptions & { fixedNodeConstraint: any[] }).fixedNodeConstraint =
                [
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
};

export const initLayoutManager = (cy: CyInstance): void => {
    const layoutSelect = document.getElementById('layoutSelect') as HTMLSelectElement | null;
    if (!layoutSelect) return;

    layoutSelect.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement;
        runLayout(cy, target.value);
    });
};
