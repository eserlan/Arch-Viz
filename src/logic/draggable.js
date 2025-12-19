export const makeDraggable = (element, handle) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
        e = e || window.event;
        e.preventDefault();

        // Remove flex/transform centering if present to switch to absolute coordinate positioning
        // This is specifically for the default 'left-1/2 -translate-x-1/2' class usage
        if (element.classList.contains('-translate-x-1/2')) {
            const rect = element.getBoundingClientRect();
            // Important: We need to set explicit pixel values BEFORE removing the classes
            // to prevent it jumping to left:0
            element.style.left = rect.left + 'px';
            element.style.top = rect.top + 'px';

            element.classList.remove('-translate-x-1/2');
            element.classList.remove('left-1/2');
            element.style.transform = 'none';
        }

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
        e = e || window.event;
        e.preventDefault();
        // Calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        // Set the element's new position:
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    };

    const closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
    };

    if (handle) {
        handle.onmousedown = dragMouseDown;
    } else {
        element.onmousedown = dragMouseDown;
    }
};
