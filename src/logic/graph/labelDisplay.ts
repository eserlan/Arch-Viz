export const getNodeLabelDisplay = (label: string, verified = false): string => {
    // Explicitly handle null/undefined inputs by converting to empty string
    const baseLabel = typeof label === 'string' ? label.trim() : '';
    if (!baseLabel) {
        return verified ? '✓ Verified' : '';
    }

    return verified ? `${baseLabel}\n✓ Verified` : baseLabel;
};
