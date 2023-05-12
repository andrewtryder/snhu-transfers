/* 
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
*/

function toggleDetails(id) {
    var element = document.getElementById(id);
    if (element.style.display === "none") {
        element.style.display = "table-row-group";
    } else {
        element.style.display = "none";
    }
}

var elements = document.getElementsByClassName("course-details");
for (var i = 0; i < elements.length; i++) {
    elements[i].style.display = "none";
}