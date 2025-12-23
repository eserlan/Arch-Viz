export const initAccordion = (): void => {
    const infoToggle = document.getElementById('infoToggle');
    const infoContent = document.getElementById('infoContent');
    const infoChevron = document.getElementById('infoChevron');
    const infoExpandLabel = document.getElementById('infoExpandLabel');

    if (infoToggle && infoContent) {
        infoToggle.addEventListener('click', () => {
            const isOpen = infoContent.classList.toggle('is-open');
            if (infoChevron) infoChevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            if (infoExpandLabel) infoExpandLabel.textContent = isOpen ? '(Click to collapse details)' : '(Click to expand details)';
        });
    }
};
