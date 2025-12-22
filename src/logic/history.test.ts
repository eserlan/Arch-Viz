import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initHistory, recordSnapshot } from './history';
import { populateLabelFilter, populateTeamFilter } from './filters';
import { hidePanel } from './panel';
vi.mock('./filters', () => ({
    populateLabelFilter: vi.fn(),
    populateTeamFilter: vi.fn()
}));
vi.mock('./panel', () => ({ hidePanel: vi.fn() }));

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
