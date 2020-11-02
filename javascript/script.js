const url = "https://golf-courses-api.herokuapp.com/courses";
const xhr = new XMLHttpRequest();
const cxhr = new XMLHttpRequest();

let course;
let apiurl = "";
let courseData;
let courses = {};
let activeCourse;

let headers = [
    {
        t: "HOLE",
        cspan: 1,
        rspan: 1
    },
    {
        t: "TEES",
        cspan: 1,
        rspan: 4
    },
    {
        t: "",
        cspan: 1,
        rspan: 1
    },
];

window.onscroll = function() {
    if (window.scrollY > 0) {
        document.querySelector("header").style.boxShadow = "0px 5px 7px #111";
    } else if (window.scrollY === 0) {
        document.querySelector("header").style.boxShadow = "0px 0px 0px #111";
    }
}

function grabCourses() {
    if (!sessionStorage.getItem("courses")) { // check for cached data
        console.log("No data cached. Retrieving...");
        xhr.open("GET", url, true);
        xhr.responseType = "text";
        xhr.send();
        xhr.onload = function() {
            if (xhr.status == 200) {
                courseData = JSON.parse(xhr.responseText);
                cacheData("courses", courseData);
                // cacheData("indcourses", courses);
                // console.log("Retrieved starting data");
                setCards();
            }
        };
    } else {
        // console.log("Cached data found.");
        courseData = JSON.parse(sessionStorage.getItem("courses"));
        // courses = JSON.parse(sessionStorage.getItem("indcourses"));
        for (let a = 0; a < courseData.courses.length; a++) {
            let lookup = JSON.parse(sessionStorage.getItem("course-"+courseData.courses[a].id));
            if (lookup) {
                courses[courseData.courses[a].id] = lookup;
            }
        }
        setCards();
    }
}

function setCards() {
    for (let a = 0; a < courseData.courses.length; a++) {
        let newCard = document.createElement("DIV");
        newCard.classList.add(`card${a}`, "card", "no-info");
        // newCard.innerHTML = `<div class="card-img card-img-${a}"></div><div class="card-title">${courseData.courses[a].name}</div><div class="card-info"></div><div class="card-desc"></div>`;
        let ihtml = `<div class="card-img card-img-${a}"></div> <div class="card-title">${courseData.courses[a].name}</div>`;
        
        if (!sessionStorage.getItem("course-"+courseData.courses[a].id)) {
            ihtml += `<div class="load-desc load-${a}">Load Course Info</div>`;
        } else {
            newCard.classList.add("has-info");
            ihtml += `<div class="card-info"><span class="emp">Holes:</span> ${courses[courseData.courses[a].id].data.holeCount}<br/><span class="emp">Status:</span> ${courses[courseData.courses[a].id].data.status}<br/></div><div class="card-desc"><span class="emp">Address:</span><br/>${courses[courseData.courses[a].id].data.addr1}, ${courses[courseData.courses[a].id].data.city}, ${courses[courseData.courses[a].id].data.stateOrProvince}<br/><span class="emp">Website:</span><br/>${courses[courseData.courses[a].id].data.website}</div>`;
        }
        ihtml += `<div class="select-course select-${a}">Select Course</div>`;
        newCard.innerHTML = ihtml;

        newCard.style.animationDelay = 0.07+(0.07*a)+"s";
        document.querySelector(".card-wrap").appendChild(newCard);
        document.querySelector(`.card-img-${a}`).style.background = `url(${courseData.courses[a].image})`;
        document.querySelector(`.card-img-${a}`).style.backgroundSize = "cover";
        document.querySelector(`.card-img-${a}`).style.backgroundPosition = "center center";

        if (!sessionStorage.getItem("course-"+courseData.courses[a].id)) {
            document.querySelector(".load-"+a).addEventListener("click", function() {
                this.classList.add("clocking");
                loadBasicInfo(this.classList[1].split("-")[1]);
            });
        }
        document.querySelector(".select-"+a).addEventListener("click", function() {
            selectCourse(this.classList[1].split("-")[1]);
        });
    }
}

function loadBasicInfo(id) {
    let basic;
    id = parseInt(id);
    apiurl = url+"/"+courseData.courses[id].id;
    cxhr.open("GET", apiurl, true);
    cxhr.responseType = "text";
    cxhr.send();
    cxhr.onload = function() {
        if (cxhr.status == 200) {
            basic = JSON.parse(cxhr.responseText);
            // console.log("Recieved course data... ",basic);
            cacheData("course-"+courseData.courses[id].id, basic);
            courses[courseData.courses[id].id] = basic;

            document.querySelector(".card"+id).innerHTML = `
            <div class="card-img card-img-${id}"></div> 
            <div class="card-title">${courseData.courses[id].name}</div>
            <div class="card-info">
                <span class="emp">Holes:</span> ${courses[courseData.courses[id].id].data.holeCount}<br/>
                <span class="emp">Status:</span> ${courses[courseData.courses[id].id].data.status}<br/>
            </div>
            <div class="card-desc">
                <span class="emp">Address:</span><br/>${courses[courseData.courses[id].id].data.addr1}, ${courses[courseData.courses[id].id].data.city}, ${courses[courseData.courses[id].id].data.stateOrProvince}<br/>
                <span class="emp">Website:</span><br/>${courses[courseData.courses[id].id].data.website}
            </div>
            <div class="select-course select-${id}">Select Course</div>`;

            document.querySelector(`.card-img-${id}`).style.background = `url(${courseData.courses[id].image})`;
            document.querySelector(`.card-img-${id}`).style.backgroundSize = "cover";
            document.querySelector(`.card-img-${id}`).style.backgroundPosition = "center center";

            setTimeout(function(){
                document.querySelector(".card"+id).classList.add("has-info");
            }, 100);
            

        } else {
            console.log("Retrieval failed");
        }
    };
}

function cacheData(name, data) {
    data = JSON.stringify(data);
    sessionStorage.setItem(name, data);
}

function selectCourse(id) {
    document.querySelector(".card-wrap-title").style.animation = "0.6s slideout cubic-bezier(.54,-0.06,.6,-0.34) forwards";
    document.querySelector(".scorecard").style.animation = "0.6s slidein ease-out forwards";
    document.querySelector(".scorecard").style.animationDelay = "0.5s";
    for (let a = 0; a < document.querySelectorAll(".card").length; a++) {
        document.querySelectorAll(".card")[a].style.animation = "0.6s slideout cubic-bezier(.54,-0.06,.6,-0.34) forwards";
        document.querySelectorAll(".card")[a].style.animationDelay = 0.083+(0.08*a)+"s";
    }
    // setTimeout(function() {
    //     document.querySelector(".course-select").remove();
    // }, 2000);
}

function generateScorecard() {
    let newcol, newcell;
    let databody = document.querySelector(".databody");
    let oncol = 0;
    // FIRST 9
    for (let a = 0; a < 9; a++) {
        newcol = document.createElement("DIV");
        newcol.classList.add("data-col");
        databody.appendChild(newcol);
        newcol.style.left = (oncol*26)+"vw";
        oncol++;
        for (let b = 0; b < 11; b++) {
            newcell = document.createElement("DIV");
            newcell.classList.add("r"+b);
            newcol.appendChild(newcell);
            if (b === 0) {
                newcell.innerText = (a+1);
            } else {
                newcell.innerText = "-";
            }
        }
    }
    // OUT COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let c = 0; c < 11; c++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+c);
        newcol.appendChild(newcell);
        if (c === 0) {
            newcell.innerText = "OUT";
        } else {
            newcell.innerText = "--";
        }
    }
    // SECOND 9
    for (let d = 0; d < 9; d++) {
        newcol = document.createElement("DIV");
        newcol.classList.add("data-col");
        databody.appendChild(newcol);
        newcol.style.left = (oncol*26)+"vw";
        oncol++;
        for (let e = 0; e < 11; e++) {
            newcell = document.createElement("DIV");
            newcell.classList.add("r"+e);
            newcol.appendChild(newcell);
            if (e === 0) {
                newcell.innerText = (d+10);
            } else {
                newcell.innerText = "-";
            }
        }
    }
    // IN COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let f = 0; f < 11; f++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+f);
        newcol.appendChild(newcell);
        if (f === 0) {
            newcell.innerText = "IN";
        } else {
            newcell.innerText = "--";
        }
    }
    // TOTAL COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let g = 0; g < 11; g++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+g);
        newcol.appendChild(newcell);
        if (g === 0) {
            newcell.innerText = "TOT";
        } else {
            newcell.innerText = "--";
        }
    }
    // HCP COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let h = 0; h < 11; h++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+h);
        newcol.appendChild(newcell);
        if (h === 0) {
            newcell.innerText = "HCP";
        } else {
            newcell.innerText = "--";
        }
    }
    // NET COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let i = 0; i < 11; i++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+i);
        newcol.appendChild(newcell);
        if (i === 0) {
            newcell.innerText = "NET";
        } else {
            newcell.innerText = "--";
        }
    }
}

grabCourses();
generateScorecard();

// selectCourse(0);