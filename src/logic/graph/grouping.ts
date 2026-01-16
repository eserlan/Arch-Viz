import { CyInstance } from '../../types';
import { showToast } from '../ui/ui';
import { getNodeLabelDisplay } from './labelDisplay';

let cyRef: CyInstance | null = null;

/**
 * Create parent nodes for team grouping
 */
export const enableTeamGrouping = (cy: CyInstance): void => {
    const nodes = cy
        .nodes()
        .filter((node) => !node.data('isTeamGroup') && !node.data('isLabelGroup'));
    const teams = new Set<string>();

    // Collect all unique teams/owners
    nodes.forEach((node) => {
        const owner = node.data('owner');
        if (owner) {
            teams.add(owner);
        }
    });

    // Create parent nodes for each team
    teams.forEach((team) => {
        const teamId = `team-${team.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        // Check if parent already exists
        if (cy.getElementById(teamId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: teamId,
                    label: team,
                    labelDisplay: getNodeLabelDisplay(team),
                    isTeamGroup: true,
                },
                classes: 'team-group',
            });
        }

        // Assign children to parent
        nodes.forEach((node) => {
            if (node.data('owner') === team) {
                node.move({ parent: teamId });
            }
        });
    });

    // Handle nodes without owner - group them as "Unassigned"
    const unassignedNodes = nodes.filter((node) => !node.data('owner'));
    if (unassignedNodes.length > 0) {
        const unassignedId = 'team-unassigned';
        if (cy.getElementById(unassignedId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: unassignedId,
                    label: 'Unassigned',
                    labelDisplay: getNodeLabelDisplay('Unassigned'),
                    isTeamGroup: true,
                },
                classes: 'team-group',
            });
        }
        unassignedNodes.forEach((node) => {
            node.move({ parent: unassignedId });
        });
    }

    showToast(`Grouped services into ${teams.size + 1} team groups`, 'success');
};

/**
 * Create parent nodes for label grouping (uses first label)
 */
export const enableLabelGrouping = (cy: CyInstance): void => {
    const nodes = cy
        .nodes()
        .filter((node) => !node.data('isTeamGroup') && !node.data('isLabelGroup'));
    const labelGroups = new Set<string>();

    // Collect all unique first labels
    nodes.forEach((node) => {
        const labels = node.data('labels') || [];
        if (Array.isArray(labels) && labels.length > 0) {
            labelGroups.add(labels[0]);
        }
    });

    // Create parent nodes for each label
    labelGroups.forEach((label) => {
        const labelId = `label-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        // Check if parent already exists
        if (cy.getElementById(labelId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: labelId,
                    label: label,
                    labelDisplay: getNodeLabelDisplay(label),
                    isLabelGroup: true,
                },
                classes: 'label-group team-group',
            });
        }

        // Assign children to parent (based on first label)
        nodes.forEach((node) => {
            const nodeLabels = node.data('labels') || [];
            if (Array.isArray(nodeLabels) && nodeLabels[0] === label) {
                node.move({ parent: labelId });
            }
        });
    });

    // Handle nodes without labels - group them as "Unlabeled"
    const unlabeledNodes = nodes.filter((node) => {
        const labels = node.data('labels') || [];
        return !Array.isArray(labels) || labels.length === 0;
    });

    if (unlabeledNodes.length > 0) {
        const unlabeledId = 'label-group-unlabeled';
        if (cy.getElementById(unlabeledId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: unlabeledId,
                    label: 'Unlabeled',
                    labelDisplay: getNodeLabelDisplay('Unlabeled'),
                    isLabelGroup: true,
                },
                classes: 'label-group team-group',
            });
        }
        unlabeledNodes.forEach((node) => {
            node.move({ parent: unlabeledId });
        });
    }

    showToast(`Grouped services into ${labelGroups.size + 1} label groups`, 'success');
};

/**
 * Remove all grouping - move all nodes back to root level
 */
export const disableGrouping = (cy: CyInstance): void => {
    const nodes = cy.nodes();

    // Move all child nodes to root level
    nodes.forEach((node) => {
        if (!node.data('isTeamGroup') && !node.data('isLabelGroup') && node.parent().length > 0) {
            node.move({ parent: null });
        }
    });

    // Remove all group parent nodes
    cy.nodes('.team-group').remove();
    cy.nodes('.label-group').remove();

    showToast('Grouping disabled', 'info');
};

/**
 * Run layout after grouping change
 */
const runLayout = (cy: CyInstance): void => {
    const layoutSelect = document.getElementById('layoutSelect') as HTMLSelectElement | null;
    const layoutValue = layoutSelect?.value || 'fcose';
    const isHorizontalDagre = layoutValue === 'dagre-horizontal';
    const isVerticalDagre = layoutValue === 'dagre-vertical' || layoutValue === 'dagre';
    const layoutName = isHorizontalDagre || isVerticalDagre ? 'dagre' : layoutValue;

    const layout = cy.layout({
        name: layoutName,
        animate: true,
        animationDuration: 800,
        fit: true,
        padding: 100,
        rankDir: isHorizontalDagre ? 'LR' : 'TB',
    } as any);

    layout.run();
};

/**
 * Initialize the grouping selector
 */
export const initGrouping = (cy: CyInstance): void => {
    cyRef = cy;

    const selector = document.getElementById('groupingSelect') as HTMLSelectElement | null;
    if (!selector) return;

    selector.addEventListener('change', () => {
        if (!cyRef) return;

        const value = selector.value;

        // First, disable any existing grouping
        disableGrouping(cyRef);

        // Then apply new grouping if selected
        if (value === 'team') {
            enableTeamGrouping(cyRef);
        } else if (value === 'label') {
            enableLabelGrouping(cyRef);
        }

        // Re-run layout
        runLayout(cyRef);
    });
};
