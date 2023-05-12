window.addEventListener('DOMContentLoaded', (event) => {
    const courseDetails = document.getElementsByClassName('course-details');
    for (let i = 0; i < courseDetails.length; i++) {
        courseDetails[i].style.display = 'none';
    }
});

function toggleDetails(prefix) {
    const courseDetails = document.getElementById(prefix);
    if (courseDetails.style.display === 'none') {
        courseDetails.style.display = 'table';
    } else {
        courseDetails.style.display = 'none';
    }
}
