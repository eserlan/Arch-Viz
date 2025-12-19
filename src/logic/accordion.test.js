import { describe, it, expect, beforeEach } from 'vitest';
import { initAccordion } from './accordion';

describe('Accordion Logic', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <button id="infoToggle">
        <span id="infoExpandLabel">(Click to expand details)</span>
        <svg id="infoChevron"></svg>
      </button>
      <div id="infoContent" class="accordion-wrapper"></div>
    `;
        initAccordion();
    });

    it('should toggle is-open class on infoContent when clicked', () => {
        const toggle = document.getElementById('infoToggle');
        const content = document.getElementById('infoContent');

        expect(content.classList.contains('is-open')).toBe(false);

        toggle.click();
        expect(content.classList.contains('is-open')).toBe(true);

        toggle.click();
        expect(content.classList.contains('is-open')).toBe(false);
    });

    it('should rotate chevron when toggled', () => {
        const toggle = document.getElementById('infoToggle');
        const chevron = document.getElementById('infoChevron');

        toggle.click();
        expect(chevron.style.transform).toBe('rotate(180deg)');

        toggle.click();
        expect(chevron.style.transform).toBe('rotate(0deg)');
    });

    it('should update label text when toggled', () => {
        const toggle = document.getElementById('infoToggle');
        const label = document.getElementById('infoExpandLabel');

        toggle.click();
        expect(label.textContent).toBe('(Click to collapse details)');

        toggle.click();
        expect(label.textContent).toBe('(Click to expand details)');
    });
});
