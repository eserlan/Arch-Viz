export const getNodeLabelDisplay = (label: string, verified = false): string => {
    const baseLabel = label?.trim() ?? '';
    if (!baseLabel) {
        return verified ? '✓ Verified' : '';
    }

    return verified ? `${baseLabel}\n✓ Verified` : baseLabel;
};
