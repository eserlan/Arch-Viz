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
 * id,label,domain,tier,depends_on,owner,repo_url
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
    const label = row.label?.trim();
    const domain = row.domain?.trim();

    if (!id || !label || !domain) {
      skipped += 1;
      return;
    }

    const tier = row.tier?.toString().trim() || '3';
    const owner = row.owner?.trim();
    const repoUrl = row.repo_url?.trim();

    const domainClass = slugify(domain);
    const tierClass = slugify(`tier-${tier}`);
    const isDatabase = /\b(db|database)\b/i.test(id) || /\b(db|database)\b/i.test(label);
    const databaseClass = isDatabase ? 'is-database' : '';

    elements.push({
      group: 'nodes',
      data: {
        id,
        label,
        domain,
        tier,
        owner,
        repoUrl,
      },
      classes: `${tierClass} domain-${domainClass} ${databaseClass}`.trim(),
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
