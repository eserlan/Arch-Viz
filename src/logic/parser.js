import Papa from 'papaparse';

const slugify = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';

/**
 * Transforms CSV content into Cytoscape-friendly elements.
 *
 * Expected columns (header row, comma-delimited):
 * id,name,labels,tier,depends_on,owner,repo_url
 *
 * @param {string} csvString
 * @returns {{ elements: import('cytoscape').ElementsDefinition, skipped: number }}
 */
export const parseCSV = (csvString) => {
  const { data, errors } = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors?.length) {
    // PapaParse surfaces malformed rows here; keep going but log for visibility
    console.warn('CSV parse warnings', errors);
  }

  const elements = [];
  let skipped = 0;

  data.forEach((row) => {
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
    const repoUrl = row.repo_url?.trim();

    // Parse semicolon-separated labels
    const labels = labelsRaw ? labelsRaw.split(';').map((d) => d.trim()).filter(Boolean) : [];
    const labelClasses = labels.map((d) => `label-${slugify(d)}`).join(' ');
    const tierClass = slugify(`tier-${tier}`);
    const isDatabase = /\b(db|database)\b/i.test(id) || /\b(db|database)\b/i.test(name);
    const databaseClass = isDatabase ? 'is-database' : '';

    elements.push({
      group: 'nodes',
      data: {
        id,
        name,
        label: name, // Keep 'label' for Cytoscape's label display
        labelsDisplay: labels.join(', '), // For display in panel
        labels, // For filtering logic (array)
        tier,
        owner,
        repoUrl,
      },
      classes: `${tierClass} ${labelClasses} ${databaseClass}`.trim(),
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

  return { elements, skipped };
};
