document.body.onload = function() {
    setTimeout(function() {
        document.querySelector(".load-overlay").style.opacity = "0";
        document.querySelector(".load-overlay").style.transition = "0.2s";
        document.querySelector(".load-overlay").style.visibility = "hidden";
        if (JSON.parse(localStorage.getItem("settings")).tg_select) {
            selectCourse(JSON.parse(localStorage.getItem("settings")).tg_select_value);
        }
    }, 500);
};