import Papa from 'papaparse';
import { ElementsDefinition, ElementDefinition } from 'cytoscape';
import { getShapeClass } from '../graph/shapeUtils';
import { getNodeLabelDisplay } from '../graph/labelDisplay';

const slugify = (value: string | number | null | undefined): string =>
    (value || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'unknown';

export interface ParseResult {
    elements: ElementsDefinition | ElementDefinition[];
    skipped: number;
    error?: string;
    hints?: string[];
}

/**
 * Transforms CSV content into Cytoscape-friendly elements.
 *
 * Expected columns (header row, comma-delimited):
 * id,name,labels,tier,depends_on,owner,repo_url,app_code
 */
export const parseCSV = (csvString: string): ParseResult => {
    const hints: string[] = [];

    // Basic validation
    if (!csvString || typeof csvString !== 'string' || csvString.trim().length === 0) {
        return {
            elements: [],
            skipped: 0,
            error: 'Empty or invalid file',
            hints: ['The file appears to be empty.'],
        };
    }

    const { data, errors, meta } = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
    });

    if (errors?.length) {
        console.warn('CSV parse warnings', errors);
        hints.push(`CSV parsing had ${errors.length} warning(s).`);
    }

    // Check if we have any data rows
    const typedData = data as Record<string, string>[];
    if (!typedData || typedData.length === 0) {
        return {
            elements: [],
            skipped: 0,
            error: 'No data rows found',
            hints: ['The CSV file has no data rows, only headers or is empty.'],
        };
    }

    // Check for required columns
    const headers = meta.fields || [];
    const hasId = headers.includes('id');
    const hasName = headers.includes('name') || headers.includes('label');

    if (!hasId) {
        hints.push("Missing 'id' column - each service needs a unique identifier.");
    }
    if (!hasName) {
        hints.push("Missing 'name' (or 'label') column - each service needs a display name.");
    }

    if (!hasId || !hasName) {
        const foundHeaders =
            headers.length > 0 ? `Found columns: ${headers.join(', ')}` : 'No headers found';
        return {
            elements: [],
            skipped: typedData.length,
            error: 'Missing required columns',
            hints: [...hints, foundHeaders, 'Required: id, name (or label)'],
        };
    }

    const elements: ElementDefinition[] = [];
    let skipped = 0;

    typedData.forEach((row) => {
        const id = row.id?.trim();
        // Support both 'name' and legacy 'label' column
        const name = (row.name || row.label)?.trim();
        // Support both 'labels' and legacy 'domain' column
        const labelsRaw = (row.labels || row.domain)?.trim();

        if (!id || !name) {
            skipped += 1;
            return;
        }

        const tier = row.tier?.toString().trim() || '3';
        const owner = row.owner?.trim();
        const appCode = row.app_code?.trim() || row.status?.trim(); // Support both for safety during transition
        const repoUrl = row.repo_url?.trim();
        const comment = row.comment ? row.comment.replace(/^[ \t]+|[ \t]+$/g, '') : undefined;
        const verified =
            row.verified?.trim().toLowerCase() === 'true' || row.verified?.trim() === '1';

        // Parse semicolon-separated labels
        const labels = labelsRaw
            ? labelsRaw
                  .split(';')
                  .map((d) => d.trim())
                  .filter(Boolean)
            : [];
        const labelClasses = labels.map((d) => `label-${slugify(d)}`).join(' ');
        const tierClass = slugify(`tier-${tier}`);

        // Apply shape classes (queue takes precedence if both match)
        const shapeClass = getShapeClass(id, name);

        elements.push({
            group: 'nodes',
            data: {
                id,
                name,
                label: name, // Keep 'label' for Cytoscape's label display
                labelDisplay: getNodeLabelDisplay(name),
                labelsDisplay: labels.join(', '), // For display in panel
                labels, // For filtering logic (array)
                tier,
                owner,
                appCode,
                repoUrl,
                comment,
                verified,
            },
            classes:
                `${tierClass} ${labelClasses} ${shapeClass} ${verified ? 'is-verified' : ''}`.trim(),
        });

        if (row.depends_on) {
            const targets = row.depends_on
                .split(';')
                .map((target) => target.trim())
                .filter(Boolean);

            targets.forEach((targetId) => {
                elements.push({
                    group: 'edges',
                    data: {
                        source: id,
                        target: targetId,
                        id: `${id}->${targetId}`,
                    },
                });
            });
        }
    });

    // Check if we got any valid nodes
    const nodes = elements.filter((e) => e.group === 'nodes');
    if (nodes.length === 0) {
        return {
            elements: [],
            skipped,
            error: 'No valid services found',
            hints: [
                `All ${typedData.length} row(s) were skipped.`,
                "Each row needs at least 'id' and 'name' values.",
                'Check that your data rows have values in these columns.',
            ],
        };
    }

    return { elements, skipped, hints: hints.length > 0 ? hints : undefined };
};
