import { ElementDefinition } from 'cytoscape';
import { CyInstance } from '../types';
import { saveGraphData } from './storage';
import { populateLabelFilter, populateTeamFilter } from './filters';
import { hidePanel } from './panel';

type StatusHandler = (message: string) => void;

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
};

const cloneElements = (elements: ElementDefinition[]): ElementDefinition[] =>
    JSON.parse(JSON.stringify(elements));

const snapshotsMatch = (a: ElementDefinition[], b: ElementDefinition[]): boolean =>
    JSON.stringify(a) === JSON.stringify(b);

let historyPast: ElementDefinition[][] = [];
let historyFuture: ElementDefinition[][] = [];
let historyEnabled = false;
let isRestoring = false;
let cyRef: CyInstance | null = null;
let statusHandler: StatusHandler | null = null;
let keyListenerRegistered = false;

const applySnapshot = (snapshot: ElementDefinition[], message: string): void => {
    if (!cyRef) return;
    isRestoring = true;
    cyRef.elements().remove();
    cyRef.add(snapshot as any);
    cyRef.nodes().unselect();
    cyRef.elements().removeClass('dimmed');
    hidePanel();
    populateLabelFilter(cyRef.nodes().toArray());
    populateTeamFilter(cyRef.nodes().toArray());
    saveGraphData(snapshot, { skipHistory: true });
    statusHandler?.(message);
    isRestoring = false;
};

const performUndo = (): void => {
    if (!cyRef || historyPast.length <= 1) return;
    const current = historyPast.pop();
    if (current) {
        historyFuture.push(current);
    }
    const previous = historyPast[historyPast.length - 1];
    applySnapshot(previous, 'Undo applied');
};

const performRedo = (): void => {
    if (!cyRef || historyFuture.length === 0) return;
    const next = historyFuture.pop();
    if (!next) return;
    historyPast.push(next);
    applySnapshot(next, 'Redo applied');
};

const registerKeyListener = (): void => {
    if (keyListenerRegistered) return;
    window.addEventListener('keydown', (event: KeyboardEvent) => {
        if (isEditableTarget(event.target)) return;
        const isPrimary = event.ctrlKey || event.metaKey;
        if (!isPrimary) return;

        if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
            event.preventDefault();
            performUndo();
            return;
        }

        if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
            event.preventDefault();
            performRedo();
        }
    });
    keyListenerRegistered = true;
};

export const initHistory = (
    cy: CyInstance,
    initialElements: ElementDefinition[],
    options?: { onStatus?: StatusHandler }
): void => {
    cyRef = cy;
    statusHandler = options?.onStatus ?? null;
    historyPast = [cloneElements(initialElements)];
    historyFuture = [];
    historyEnabled = true;
    registerKeyListener();
};

export const recordSnapshot = (elements: ElementDefinition[]): void => {
    if (!historyEnabled || isRestoring) return;
    const snapshot = cloneElements(elements);
    const last = historyPast[historyPast.length - 1];
    if (last && snapshotsMatch(last, snapshot)) return;
    historyPast.push(snapshot);
    historyFuture = [];
};
