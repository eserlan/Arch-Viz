import { CyInstance } from '../types';
import { showToast } from './ui';

let cyRef: CyInstance | null = null;

/**
 * Create parent nodes for team grouping
 */
export const enableTeamGrouping = (cy: CyInstance): void => {
    const nodes = cy.nodes();
    const teams = new Set<string>();

    // Collect all unique teams/owners
    nodes.forEach(node => {
        const owner = node.data('owner');
        if (owner && !node.isParent()) {
            teams.add(owner);
        }
    });

    // Create parent nodes for each team
    teams.forEach(team => {
        const teamId = `team-${team.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        // Check if parent already exists
        if (cy.getElementById(teamId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: teamId,
                    label: team,
                    isTeamGroup: true,
                },
                classes: 'team-group',
            });
        }

        // Assign children to parent
        nodes.forEach(node => {
            if (node.data('owner') === team && !node.isParent()) {
                node.move({ parent: teamId });
            }
        });
    });

    // Handle nodes without owner - group them as "Unassigned"
    const unassignedNodes = nodes.filter(node => !node.data('owner') && !node.isParent());
    if (unassignedNodes.length > 0) {
        const unassignedId = 'team-unassigned';
        if (cy.getElementById(unassignedId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: unassignedId,
                    label: 'Unassigned',
                    isTeamGroup: true,
                },
                classes: 'team-group',
            });
        }
        unassignedNodes.forEach(node => {
            node.move({ parent: unassignedId });
        });
    }

    showToast(`Grouped services by ${teams.size} teams`, 'success');
};

/**
 * Remove team grouping - move all nodes back to root level
 */
export const disableTeamGrouping = (cy: CyInstance): void => {
    const nodes = cy.nodes();

    // Move all child nodes to root level
    nodes.forEach(node => {
        if (!node.isParent() && node.parent().length > 0) {
            node.move({ parent: null });
        }
    });

    // Remove all team group parent nodes
    cy.nodes('.team-group').remove();

    showToast('Team grouping disabled', 'info');
};

/**
 * Initialize the grouping toggle
 */
export const initGrouping = (cy: CyInstance): void => {
    cyRef = cy;

    const toggle = document.getElementById('groupByTeamToggle') as HTMLInputElement | null;
    if (!toggle) return;

    toggle.addEventListener('change', () => {
        if (!cyRef) return;

        if (toggle.checked) {
            enableTeamGrouping(cyRef);
        } else {
            disableTeamGrouping(cyRef);
        }

        // Re-run layout to accommodate new structure
        const layoutSelect = document.getElementById('layoutSelect') as HTMLSelectElement | null;
        const layoutName = layoutSelect?.value.includes('dagre') ? 'dagre' : (layoutSelect?.value || 'fcose');

        const layout = cyRef.layout({
            name: layoutName === 'fcose' ? 'fcose' : layoutName,
            animate: true,
            animationDuration: 800,
            fit: true,
            padding: 100,
        } as any);

        layout.run();
    });
};
