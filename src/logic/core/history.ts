import { ElementDefinition } from 'cytoscape';
import { CyInstance } from '../../types';
import { populateLabelFilter, populateTeamFilter } from '../graph/filters';
import { hidePanel } from '../ui/panel';

type StatusHandler = (message: string) => void;
type PersistHandler = (elements: ElementDefinition[]) => void;

const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || target.isContentEditable;
};

const MAX_HISTORY = 50;

const cloneElements = (elements: ElementDefinition[]): ElementDefinition[] =>
    structuredClone(elements);

const hashElements = (elements: ElementDefinition[]): string => {
    const json = JSON.stringify(elements);
    let hash = 0;
    for (let i = 0; i < json.length; i += 1) {
        hash = (hash * 31 + json.charCodeAt(i)) | 0;
    }
    return hash.toString();
};

let historyPast: ElementDefinition[][] = [];
let historyPastHashes: string[] = [];
let historyFuture: ElementDefinition[][] = [];
let historyEnabled = false;
let isRestoring = false;
let cyRef: CyInstance | null = null;
let statusHandler: StatusHandler | null = null;
let persistHandler: PersistHandler | null = null;
let keyListenerRegistered = false;
let keyListener: ((event: KeyboardEvent) => void) | null = null;

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
    persistHandler?.(snapshot);
    statusHandler?.(message);
    isRestoring = false;
};

const performUndo = (): void => {
    if (!cyRef || historyPast.length <= 1) return;
    const current = historyPast.pop();
    historyPastHashes.pop();
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
    historyPastHashes.push(hashElements(next));
    applySnapshot(next, 'Redo applied');
};

const registerKeyListener = (): void => {
    if (keyListenerRegistered) return;
    keyListener = (event: KeyboardEvent) => {
        if (isEditableTarget(event.target)) return;
        const isPrimary = event.ctrlKey || event.metaKey;
        if (!isPrimary) return;

        if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
            event.preventDefault();
            performUndo();
            return;
        }

        if (
            event.key.toLowerCase() === 'y' ||
            (event.key.toLowerCase() === 'z' && event.shiftKey)
        ) {
            event.preventDefault();
            performRedo();
        }
    };
    window.addEventListener('keydown', keyListener);
    keyListenerRegistered = true;
};

export const initHistory = (
    cy: CyInstance,
    initialElements: ElementDefinition[],
    options?: { onStatus?: StatusHandler; onPersist?: PersistHandler }
): (() => void) => {
    cyRef = cy;
    statusHandler = options?.onStatus ?? null;
    persistHandler = options?.onPersist ?? null;
    const initialSnapshot = cloneElements(initialElements);
    historyPast = [initialSnapshot];
    historyPastHashes = [hashElements(initialSnapshot)];
    historyFuture = [];
    historyEnabled = true;
    registerKeyListener();
    return cleanupHistory;
};

/**
 * Record a snapshot of the current elements.
 * No-op when history is disabled, a restore is in progress, or the snapshot matches the last entry.
 */
export const recordSnapshot = (elements: ElementDefinition[]): void => {
    if (!historyEnabled || isRestoring) return;
    const snapshot = cloneElements(elements);
    const snapshotHash = hashElements(snapshot);
    const lastHash = historyPastHashes[historyPastHashes.length - 1];
    if (lastHash && lastHash === snapshotHash) return;
    historyPast.push(snapshot);
    historyPastHashes.push(snapshotHash);
    if (historyPast.length > MAX_HISTORY) {
        historyPast.shift();
        historyPastHashes.shift();
    }
    historyFuture = [];
};

export const cleanupHistory = (): void => {
    if (keyListenerRegistered && keyListener) {
        window.removeEventListener('keydown', keyListener);
    }
    keyListenerRegistered = false;
    keyListener = null;
    historyEnabled = false;
    isRestoring = false;
    cyRef = null;
    statusHandler = null;
    persistHandler = null;
    historyPast = [];
    historyPastHashes = [];
    historyFuture = [];
};
