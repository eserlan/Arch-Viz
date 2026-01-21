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
        .filter(
            (node) =>
                !node.data('isTeamGroup') &&
                !node.data('isLabelGroup') &&
                !node.data('isAppCodeGroup')
        );

    // Group nodes by owner
    const nodesByTeam = new Map<string, any[]>();
    nodes.forEach((node) => {
        const team = node.data('owner') || 'Unassigned';
        if (!nodesByTeam.has(team)) {
            nodesByTeam.set(team, []);
        }
        nodesByTeam.get(team)!.push(node);
    });

    // Create parent nodes and move children
    nodesByTeam.forEach((groupedNodes, team) => {
        const teamId =
            team === 'Unassigned'
                ? 'team-unassigned'
                : `team-${team.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

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

        groupedNodes.forEach((node) => node.move({ parent: teamId }));
    });

    showToast(`Grouped services into ${nodesByTeam.size} team groups`, 'success');
};

/**
 * Create parent nodes for label grouping (uses first label)
 */
export const enableLabelGrouping = (cy: CyInstance): void => {
    const nodes = cy
        .nodes()
        .filter(
            (node) =>
                !node.data('isTeamGroup') &&
                !node.data('isLabelGroup') &&
                !node.data('isAppCodeGroup')
        );

    // Group nodes by first label
    const nodesByLabel = new Map<string, any[]>();
    nodes.forEach((node) => {
        const labels = node.data('labels') || [];
        const label = Array.isArray(labels) && labels.length > 0 ? labels[0] : 'Unlabeled';
        if (!nodesByLabel.has(label)) {
            nodesByLabel.set(label, []);
        }
        nodesByLabel.get(label)!.push(node);
    });

    // Create parent nodes and move children
    nodesByLabel.forEach((groupedNodes, label) => {
        const labelId =
            label === 'Unlabeled'
                ? 'label-group-unlabeled'
                : `label-group-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

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

        groupedNodes.forEach((node) => node.move({ parent: labelId }));
    });

    showToast(`Grouped services into ${nodesByLabel.size} label groups`, 'success');
};

/**
 * Create parent nodes for AppCode grouping
 */
export const enableAppCodeGrouping = (cy: CyInstance): void => {
    const nodes = cy
        .nodes()
        .filter(
            (node) =>
                !node.data('isTeamGroup') &&
                !node.data('isLabelGroup') &&
                !node.data('isAppCodeGroup')
        );

    // Group nodes by AppCode
    const nodesByAppCode = new Map<string, any[]>();
    nodes.forEach((node) => {
        const appCode = node.data('appCode') || 'No App Code';
        if (!nodesByAppCode.has(appCode)) {
            nodesByAppCode.set(appCode, []);
        }
        nodesByAppCode.get(appCode)!.push(node);
    });

    // Create parent nodes and move children
    nodesByAppCode.forEach((groupedNodes, appCode) => {
        const appCodeId =
            appCode === 'No App Code'
                ? 'app-code-none'
                : `app-code-${appCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

        if (cy.getElementById(appCodeId).length === 0) {
            cy.add({
                group: 'nodes',
                data: {
                    id: appCodeId,
                    label: appCode,
                    labelDisplay: getNodeLabelDisplay(appCode),
                    isAppCodeGroup: true,
                },
                classes: 'app-code-group team-group',
            });
        }

        groupedNodes.forEach((node) => node.move({ parent: appCodeId }));
    });

    showToast(`Grouped services into ${nodesByAppCode.size} App Code groups`, 'success');
};

/**
 * Remove all grouping - move all nodes back to root level
 */
export const disableGrouping = (cy: CyInstance): void => {
    const nodes = cy.nodes();

    // Move all child nodes to root level
    nodes.forEach((node) => {
        if (
            !node.data('isTeamGroup') &&
            !node.data('isLabelGroup') &&
            !node.data('isAppCodeGroup') &&
            node.parent().length > 0
        ) {
            node.move({ parent: null });
        }
    });

    // Remove all group parent nodes
    cy.nodes('.team-group').remove();
    cy.nodes('.label-group').remove();
    cy.nodes('.app-code-group').remove();

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
        } else if (value === 'app-code') {
            enableAppCodeGrouping(cyRef);
        }

        // Re-run layout
        runLayout(cyRef);
    });
};
