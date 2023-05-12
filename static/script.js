function toggleDetails(elementId) {
    const detailsElement = document.getElementById(elementId);
    const displayState = window.getComputedStyle(detailsElement).display;
    detailsElement.style.display = (displayState === 'none') ? 'block' : 'none';
}