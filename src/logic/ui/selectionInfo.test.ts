import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateSelectionInfo, initSelectionInfo } from './selectionInfo';
import { CyInstance } from '../../types';

describe('selectionInfo', () => {
    let mockCy: any;
    let mockNodes: any;
    let eventHandlers: Record<string, ((...args: any[]) => any)[]> = {};

    beforeEach(() => {
        // Create selection info panel element
        document.body.innerHTML = `
            <div id="selectionInfoPanel">
                <span id="selectedServicesCount">0</span>
            </div>
        `;

        eventHandlers = {};

        mockNodes = {
            length: 0,
            nodes: [] as any[]
        };

        mockCy = {
            on: vi.fn((event, ...args) => {
                const selector = typeof args[0] === 'string' ? args[0] : null;
                const handler = selector ? args[1] : args[0];
                const key = selector ? `${event}:${selector}` : event;
                
                if (!eventHandlers[key]) {
                    eventHandlers[key] = [];
                }
                eventHandlers[key].push(handler);
            }),
            nodes: vi.fn((selector?: string) => {
                if (selector === ':selected') {
                    return {
                        length: mockNodes.length,
                        nodes: mockNodes.nodes
                    };
                }
                return mockNodes;
            })
        };
    });

    describe('updateSelectionInfo', () => {
        it('should display 0 when no nodes are selected', () => {
            mockNodes.length = 0;
            updateSelectionInfo(mockCy as CyInstance);
            const countElement = document.getElementById('selectedServicesCount');
            expect(countElement?.textContent).toBe('0');
        });

        it('should display 1 when one node is selected', () => {
            mockNodes.length = 1;
            updateSelectionInfo(mockCy as CyInstance);
            const countElement = document.getElementById('selectedServicesCount');
            expect(countElement?.textContent).toBe('1');
        });

        it('should display 2 when two nodes are selected', () => {
            mockNodes.length = 2;
            updateSelectionInfo(mockCy as CyInstance);
            const countElement = document.getElementById('selectedServicesCount');
            expect(countElement?.textContent).toBe('2');
        });

        it('should display 3 when all three nodes are selected', () => {
            mockNodes.length = 3;
            updateSelectionInfo(mockCy as CyInstance);
            const countElement = document.getElementById('selectedServicesCount');
            expect(countElement?.textContent).toBe('3');
        });

        it('should handle missing count element gracefully', () => {
            const countElement = document.getElementById('selectedServicesCount');
            countElement?.remove();
            expect(() => updateSelectionInfo(mockCy as CyInstance)).not.toThrow();
        });
    });

    describe('initSelectionInfo', () => {
        it('should initialize with current selection count', () => {
            mockNodes.length = 1;
            initSelectionInfo(mockCy as CyInstance);
            const countElement = document.getElementById('selectedServicesCount');
            expect(countElement?.textContent).toBe('1');
        });

        it('should register event handlers for select and unselect', () => {
            initSelectionInfo(mockCy as CyInstance);
            expect(mockCy.on).toHaveBeenCalled();
            expect(eventHandlers['select unselect:node']).toBeDefined();
        });

        it('should update count when selection changes via event', () => {
            mockNodes.length = 0;
            initSelectionInfo(mockCy as CyInstance);
            const countElement = document.getElementById('selectedServicesCount');
            expect(countElement?.textContent).toBe('0');

            // Simulate selection event
            mockNodes.length = 2;
            const handler = eventHandlers['select unselect:node']?.[0];
            if (handler) {
                handler();
            }
            expect(countElement?.textContent).toBe('2');
        });

        it('should handle missing cy instance gracefully', () => {
            expect(() => initSelectionInfo(undefined as unknown as CyInstance)).not.toThrow();
        });
    });
});
