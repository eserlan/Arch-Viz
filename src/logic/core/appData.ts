import { ElementsDefinition, ElementDefinition } from 'cytoscape';
import { loadGraphData } from './storage';
import { parseCSV } from './parser';

export type LoadGraphResult = {
    elements: ElementsDefinition | ElementDefinition[];
    skipped: number;
    fromStorage: boolean;
};

export const loadGraphElements = async (
    csvUrl: string,
    fetchImpl: typeof fetch = fetch
): Promise<LoadGraphResult> => {
    const savedData = loadGraphData();
    if (savedData) {
        return { elements: savedData, skipped: 0, fromStorage: true };
    }

    const response = await fetchImpl(csvUrl);
    if (!response.ok) {
        throw new Error('Unable to load services.csv');
    }

    const csvText = await response.text();
    const { elements, skipped } = parseCSV(csvText);
    return { elements, skipped, fromStorage: false };
};
