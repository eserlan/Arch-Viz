import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupHistory, initHistory, recordSnapshot } from './history';
import { populateLabelFilter, populateTeamFilter } from '../graph/filters';
import { hidePanel } from '../ui/panel/display';
vi.mock('../graph/filters', () => ({
    populateLabelFilter: vi.fn(),
    populateTeamFilter: vi.fn()
}));
vi.mock('../ui/panel/display', () => ({ hidePanel: vi.fn() }));

const createCy = () => {
    const add = vi.fn();
    const elementsRemove = vi.fn();
    const elementsRemoveClass = vi.fn();
    const nodesUnselect = vi.fn();
    const nodesToArray = vi.fn(() => []);

    const cy = {
        add,
        elements: () => ({
            remove: elementsRemove,
            removeClass: elementsRemoveClass
        }),
        nodes: () => ({
            unselect: nodesUnselect,
            toArray: nodesToArray
        })
    };

    return { cy, add, elementsRemove, elementsRemoveClass, nodesUnselect };
};

describe('history', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        cleanupHistory();
    });

    it('undo restores the previous snapshot and updates UI', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: 'a' } }];
        const updated = [{ data: { id: 'b' } }];
        const status = vi.fn();

        const onPersist = vi.fn();

        initHistory(cy as any, initial, { onStatus: status, onPersist });
        recordSnapshot(updated);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

        expect(add).toHaveBeenCalledWith(initial);
        expect(onPersist).toHaveBeenCalledWith(initial);
        expect(populateLabelFilter).toHaveBeenCalled();
        expect(populateTeamFilter).toHaveBeenCalled();
        expect(hidePanel).toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith('Undo applied');
    });

    it('redo reapplies the next snapshot when available', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: 'a' } }];
        const updated = [{ data: { id: 'b' } }];
        const status = vi.fn();

        const onPersist = vi.fn();

        initHistory(cy as any, initial, { onStatus: status, onPersist });
        recordSnapshot(updated);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));

        expect(add).toHaveBeenLastCalledWith(updated);
        expect(status).toHaveBeenCalledWith('Redo applied');
    });

    it('records snapshots and allows undo via keyboard shortcut', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: 'start' } }];
        const updated = [{ data: { id: 'next' } }];

        initHistory(cy as any, initial);
        recordSnapshot(updated);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

        expect(add).toHaveBeenCalledWith(initial);
    });

    it('prevents duplicate snapshots from being recorded', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: 'same' } }];

        initHistory(cy as any, initial);
        recordSnapshot(initial);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));

        expect(add).not.toHaveBeenCalled();
    });

    it('limits history to the most recent 50 snapshots', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: '0' } }];
        initHistory(cy as any, initial);

        for (let i = 1; i <= 50; i += 1) {
            recordSnapshot([{ data: { id: `${i}` } }]);
        }

        for (let i = 0; i < 49; i += 1) {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        }

        expect(add).toHaveBeenLastCalledWith([{ data: { id: '1' } }]);
    });

    it('supports redo via Ctrl+Y', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: 'alpha' } }];
        const updated = [{ data: { id: 'beta' } }];

        initHistory(cy as any, initial);
        recordSnapshot(updated);

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));

        expect(add).toHaveBeenLastCalledWith(updated);
    });

    it('ignores undo shortcuts while editing input fields', () => {
        const { cy, add } = createCy();
        const initial = [{ data: { id: 'a' } }];
        const updated = [{ data: { id: 'b' } }];

        initHistory(cy as any, initial);
        recordSnapshot(updated);

        const input = document.createElement('input');
        document.body.appendChild(input);
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));

        expect(add).not.toHaveBeenCalled();
    });
});
