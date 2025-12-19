const STORAGE_KEY = 'arch-viz-elements';

export const saveGraphData = (elements) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
};

export const loadGraphData = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const clearGraphData = () => {
    localStorage.removeItem(STORAGE_KEY);
};
