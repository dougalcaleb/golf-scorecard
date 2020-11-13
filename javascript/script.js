const url = "https://golf-courses-api.herokuapp.com/courses";
const xhr = new XMLHttpRequest();
const cxhr = new XMLHttpRequest();

let course;
let apiurl = "";
let courseData;
let courses = {};
let activeCourse, teecount = 0;
let cellHeight = 5;
let cellHeightUnits = "vh";
let retrievalAttempts = 3;
let parGTotal;
let showingSettings = false;

let selectedCell = [];

let colpos = 0, aligned = false;

//! KNOWN ISSUES
/*
    
*/

// TODO:
/*

*/

//? CRITERIA
/*
    ✔  Main table with columns for scores
    ✔  Par row with totals
    ✔  Yardage row with totals
    ✔  Score per player rows. Dynamic totals. Numbers only, no duplicate names
    ✔  Looks good
    ✔  Hcp row
    ✔  Different tees
    ✔  4 players
    ✔  End message
    ✔  Uses API
    ✔  Responsive
    ✔  Select any course
    ✔  5+ commits
*/

let players = {
    0: {
        name: "",
        scores: [],
        inScore: 0,
        outScore: 0,
        totalScore: 0,
        hcp: null,
        net: 0
    },
    1: {
        name: "",
        scores: [],
        inScore: 0,
        outScore: 0,
        totalScore: 0,
        hcp: null,
        net: 0
    },
    2: {
        name: "",
        scores: [],
        inScore: 0,
        outScore: 0,
        totalScore: 0,
        hcp: null,
        net: 0
    },
    3: {
        name: "",
        scores: [],
        inScore: 0,
        outScore: 0,
        totalScore: 0,
        hcp: null,
        net: 0
    }
};

// Valid inputs for the scorecard. Prevents negative numbers, scientific notation, and other symbols.
let validKeys = ["0","1","2","3","4","5","6","7","8","9","Backspace","Delete","ArrowLeft","ArrowRight","Tab"];

let messageGood = ["Looking great!", "Incredible!", "On to the PGA!", "Top notch!"]; // 5+ better
let messageNormal = ["Nice work!", "You're doing well", "Good job!"]; // 4+/- 
let messageBad = ["Better luck next time", "Practice makes perfect", "Keep working at it!"]; // 5+ worse

// event listeners
document.querySelector(".btn-l").addEventListener("click", navL);
document.querySelector(".btn-r").addEventListener("click", navR);
document.querySelector(".align").addEventListener("click", alignCols);

document.querySelector(".easy-prev").addEventListener("click", function(){select(0);});
document.querySelector(".easy-next").addEventListener("click", function(){select(1);});
document.querySelector(".easy-up").addEventListener("click", function(){select(2);});
document.querySelector(".easy-down").addEventListener("click", function(){select(3);});
document.querySelector(".easy-increment").addEventListener("click", function(){changeScore(1);});
document.querySelector(".easy-decrement").addEventListener("click", function(){changeScore(-1);});

document.querySelector(".dismiss").addEventListener("click", hideMessage);

document.querySelector(".settings").addEventListener("click", function() {
    if (!showingSettings) {
        document.querySelector(".course-select").classList.add("select-moveout");
        document.querySelector(".settingsWrap").classList.add("settings-movein");
        showingSettings = true;
    } else {
        document.querySelector(".course-select").classList.remove("select-moveout");
        document.querySelector(".settingsWrap").classList.remove("settings-movein");
        showingSettings = false;
    }
});

document.querySelector(".persistentCourse").addEventListener("change", function(event) {
    let editSettings = JSON.parse(localStorage.getItem("settings"));
    editSettings.tg_select_value = event.target.value;
    localStorage.setItem("settings", JSON.stringify(editSettings));
});

document.querySelector(".player0").children[0].addEventListener("blur", function() {updateScores(0, "NAME");});
document.querySelector(".player1").children[0].addEventListener("blur", function() {updateScores(1, "NAME");});
document.querySelector(".player2").children[0].addEventListener("blur", function() {updateScores(2, "NAME");});
document.querySelector(".player3").children[0].addEventListener("blur", function() {updateScores(3, "NAME");});



// Gives header a shadow when not scrolled to the top
window.onscroll = function() {
    if (window.scrollY > 0) {
        document.querySelector("header").style.boxShadow = "0px 5px 7px #111";
    } else if (window.scrollY === 0) {
        document.querySelector("header").style.boxShadow = "0px 0px 0px #111";
    }
};

// Sends a request to the golf API to retrive initial data for course selection
function grabCourses(isSavedData = false) {
    // If the user has enabled persistent cache, look for pre-loaded data from localStorage and place it in sessionStorage for use in this session
    if (isSavedData && localStorage.getItem("courses")) {
        sessionStorage.setItem("courses", localStorage.getItem("courses"));
        let setCourseData = JSON.parse(sessionStorage.getItem("courses"));
        for (let a = 0; a < setCourseData.courses.length; a++) {
            let lookup = JSON.parse(localStorage.getItem("course-"+setCourseData.courses[a].id));
            if (lookup) {
                sessionStorage.setItem("course-"+setCourseData.courses[a].id, localStorage.getItem("course-"+setCourseData.courses[a].id));
            }
        }
    }
    // The user has not loaded this site in this session, so send a request for data
    if (!sessionStorage.getItem("courses")) {
        xhr.open("GET", url, true);
        xhr.responseType = "text";
        xhr.send();
        xhr.onload = function() {
            if (xhr.status == 200) {
                courseData = JSON.parse(xhr.responseText);
                cacheData("courses", courseData);
                setCards();
                // Add options to the select input for persistent course
                for (let a = 0; a < courseData.courses.length; a++) {
                    let newOption = document.createElement("OPTION");
                    document.querySelector(".persistentCourse").appendChild(newOption);
                    newOption.setAttribute("value", a);
                    newOption.innerText = courseData.courses[a].name;
                }
            }
        };
    // If there is data cached (user has not left the session), get that instead of sending another request. Reduces network usage
    } else {
        courseData = JSON.parse(sessionStorage.getItem("courses"));
        for (let a = 0; a < courseData.courses.length; a++) {
            let lookup = JSON.parse(sessionStorage.getItem("course-"+courseData.courses[a].id));
            if (lookup) {
                courses[courseData.courses[a].id] = lookup;
            }
        }
        setCards();
        // Add options to the select input for persistent course
        for (let a = 0; a < courseData.courses.length; a++) {
            let newOption = document.createElement("OPTION");
            document.querySelector(".persistentCourse").appendChild(newOption);
            newOption.setAttribute("value", a);
            newOption.innerText = courseData.courses[a].name;
        }
    }
}

// Generates the cards for course selection
function setCards() {
    for (let a = 0; a < courseData.courses.length; a++) {
        let newCard = document.createElement("DIV");
        newCard.classList.add(`card${a}`, "card", "no-info");
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
            this.classList.add("clocking");
            selectCourse(this.classList[1].split("-")[1]);
        });
    }
}

// When a course is selected or a button to load data is pressed, retrieve all data for that course. Shows details on selection cards or generates the scorecard.
function loadBasicInfo(id, display = true) {
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

            // will show info on the selection card. false when user selects a course without loading info first, reduces jank
            if (display) {
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
    
                document.querySelector(".select-"+id).addEventListener("click", function() {
                    selectCourse(this.classList[1].split("-")[1]);
                });
                setTimeout(function(){
                    document.querySelector(".card"+id).classList.add("has-info");
                }, 100);

            } else {
                activeCourse = "course-"+courseData.courses[id].id;
                fillCard(id);
            }
            retrievalAttempts = 3;
        } else {
            console.warn("Retrieval failed, retrying");
            if (retrievalAttempts > 0) {
                loadBasicInfo(id, display);
                retrievalAttempts--;
            } else {
                console.warn("Retried 3 times and failed. Try refreshing the page.");
            }
        }
    };
}

// Stores data in the session cache
function cacheData(name, data) {
    data = JSON.stringify(data);
    sessionStorage.setItem(name, data);
    let settings = JSON.parse(localStorage.getItem("settings"));
    if (settings.tg_preserve) {
        localStorage.setItem(name, data);
    }
}

// Fired when a card is selected. Determines what happens based on what data about the course has been retrieved
function selectCourse(id) {
    if (!sessionStorage.getItem("course-"+courseData.courses[id].id)) {
        loadBasicInfo(id, false);
    } else {
        activeCourse = "course-"+courseData.courses[id].id;
        fillCard(id);
    }
}

// Creates the structure for the scorecard. Only data entered here is column headers and tee colors
function generateScorecard() {
    let newcol, newcell;
    let databody = document.querySelector(".databody");
    let oncol = 0;
    if (activeCourse.data.holes[0].teeBoxes[activeCourse.data.holes[1].teeBoxes.length-1].teeType === "auto change location") {
        teeCount = activeCourse.data.holes[0].teeBoxes.length-1;
    } else {
        teeCount = activeCourse.data.holes[0].teeBoxes.length;
    }
    document.querySelector(".tee-head").style.height = ((cellHeight*teeCount)+cellHeightUnits);
    document.querySelector(".scorecard-nav").style.top = "calc("+cellHeight+cellHeightUnits+" * "+(teeCount+7)+" + 10px)";
    document.querySelector(".scorecard-buttons").style.top = "calc("+cellHeight+cellHeightUnits+" * "+(teeCount+7)+" + 70px)";
    setTimeout(function() {
        document.querySelector(".course-select").style.height = "calc(100vh - 60px)";
        document.querySelector(".card-wrap").style.height = "0";
    },2000);
    databody.style.height = "calc(5vh * "+(7+teeCount)+")";

    // FIRST 9
    for (let a = 0; a < 9; a++) {
        newcol = document.createElement("DIV");
        newcol.classList.add("data-col", "data-col-"+a);
        databody.appendChild(newcol);
        newcol.style.left = (oncol*25)+"vw";
        oncol++;
        if (a == 8) {
            newcol.classList.add("no-seperator-col");
        }
        
        newcell = document.createElement("DIV");
        newcell.classList.add("r0");
        newcell.innerText = (a+1);
        newcol.appendChild(newcell);

        for (let aa = 0; aa < teeCount; aa++) {
            newcell = document.createElement("DIV");
            newcell.classList.add("r"+(aa+1));
            newcol.appendChild(newcell);
            newcell.style.background = activeCourse.data.holes[1].teeBoxes[aa].teeHexColor;
            newcell.style.color =getDynamicColor(activeCourse.data.holes[1].teeBoxes[aa].teeHexColor);
        }
        for (let ab = 0; ab < 4; ab++) {
            newcell = document.createElement("DIV");
            newcell.classList.add("r"+(ab+5));
            newcol.appendChild(newcell);
            let newinput = document.createElement("INPUT");
            newcell.appendChild(newinput);
            newinput.setAttribute("type", "number");
            newinput.setAttribute("maxlength", "2");
            newinput.classList.add("input-p-"+ab+"-c-"+a);
            newinput.oninput = function() {
                if (this.value.length > 2) {
                    this.value = this.value.slice(0,2);
                }
                if (this.value < 0) {
                    this.value = null;
                }
            };
            newinput.onkeydown = function(e) {
                if (!validKeys.includes(e.key)) {
                    e.preventDefault();
                }
            };
            newinput.onblur = function() {
                let inputId = this.classList[0].split("-");
                updateScores(inputId[2], inputId[4]);
            };
        }

        newcell = document.createElement("DIV");
        newcell.classList.add("r9");
        newcol.appendChild(newcell);

        newcell = document.createElement("DIV");
        newcell.classList.add("r10");
        newcol.appendChild(newcell);
    }
    // OUT COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "special-col", "no-seperator-col", "data-col-OUT");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*25)+"vw";
    oncol++;
    for (let b = 0; b < teeCount+7; b++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+b);
        newcol.appendChild(newcell);
        if (b === 0) {
            newcell.innerText = "OUT";
        } else if (b === teeCount+6) {
            // newcell.innerText = "--";
            newcell.classList.add("disabled");
        }
        if (b > 0 && b <= teeCount) {
            newcell.style.background = getMutedColor(activeCourse.data.holes[1].teeBoxes[b-1].teeHexColor);
            newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[b-1].teeHexColor);
        }
    }
    // SECOND 9
    for (let c = 0; c < 9; c++) {
        newcol = document.createElement("DIV");
        newcol.classList.add("data-col", "data-col-"+(c+9));
        databody.appendChild(newcol);
        newcol.style.left = (oncol*25)+"vw";
        oncol++;
        if (c == 8) {
            newcol.classList.add("no-seperator-col");
        }
        
        newcell = document.createElement("DIV");
        newcell.classList.add("r0");
        newcell.innerText = (c+10);
        newcol.appendChild(newcell);

        for (let ca = 0; ca < teeCount; ca++) {
            newcell = document.createElement("DIV");
            newcell.classList.add("r"+(ca+1));
            newcol.appendChild(newcell);
            newcell.style.background = activeCourse.data.holes[1].teeBoxes[ca].teeHexColor;
            newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[ca].teeHexColor);
        }
        for (let cb = 0; cb < 4; cb++) {
            newcell = document.createElement("DIV");
            newcell.classList.add("r"+(cb+5));
            newcol.appendChild(newcell);let newinput = document.createElement("INPUT");
            newcell.appendChild(newinput);
            newinput.setAttribute("type", "number");
            newinput.setAttribute("maxlength", "2");
            newinput.classList.add("input-p-"+cb+"-c-"+(c+9));
            newinput.oninput = function() {
                if (this.value.length > 2) {
                    this.value = this.value.slice(0,2);
                }
                if (this.value < 0) {
                    this.value = null;
                }
            };
            newinput.onkeydown = function(e) {
                if (!validKeys.includes(e.key)) {
                    e.preventDefault();
                }
            };
            newinput.onblur = function() {
                let inputId = this.classList[0].split("-");
                updateScores(inputId[2], inputId[4]);
            };
        }

        newcell = document.createElement("DIV");
        newcell.classList.add("r9");
        newcol.appendChild(newcell);

        newcell = document.createElement("DIV");
        newcell.classList.add("r10");
        newcol.appendChild(newcell);
    }
    // IN COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "special-col", "no-seperator-col", "data-col-IN");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*25)+"vw";
    oncol++;
    for (let d = 0; d < teeCount+7; d++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+d);
        newcol.appendChild(newcell);
        if (d === 0) {
            newcell.innerText = "IN";
        } else {
            // newcell.innerText = "--";
        }
        if (d > 0 && d <= teeCount) {
            newcell.style.background = getMutedColor(activeCourse.data.holes[1].teeBoxes[d-1].teeHexColor);
            newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[d-1].teeHexColor);
        }
        if (d == teeCount+6) {
            newcell.classList.add("disabled");
        }
    }
    // TOTAL COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "data-col-TOT");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*25)+"vw";
    oncol++;
    for (let e = 0; e < teeCount+7; e++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+e);
        newcol.appendChild(newcell);
        if (e === 0) {
            newcell.innerText = "TOTAL";
        } else if (e === teeCount+6) { 
            // newcell.innerText = "--";
            newcell.classList.add("disabled");
        }
        if (e > 0 && e <= teeCount) {
            newcell.style.background = activeCourse.data.holes[1].teeBoxes[e-1].teeHexColor;
            newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[e-1].teeHexColor);
        }
    }
    // HCP COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "data-col-HCP");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*25)+"vw";
    oncol++;
    for (let f = 0; f < teeCount+7; f++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+f);
        newcol.appendChild(newcell);
        if (f === 0) {
            newcell.innerText = "HCP";
        } else {
            // newcell.innerText = "--";
        }
        if (f > teeCount && f < teeCount+5) {
            let newinput = document.createElement("INPUT");
            newcell.appendChild(newinput);
            newinput.setAttribute("type", "number");
            newinput.setAttribute("maxlength", "2");
            newinput.classList.add("input-p-"+(f-teeCount-1)+"-c-HCP");
            newinput.oninput = function() {
                if (this.value.length > 2) {
                    this.value = this.value.slice(0,2);
                }
                if (this.value < 0) {
                    this.value = null;
                }
            };
            newinput.onkeydown = function(e) {
                if (!validKeys.includes(e.key)) {
                    e.preventDefault();
                }
            };
            newinput.onblur = function() {
                let inputId = this.classList[0].split("-");
                updateScores(inputId[2], inputId[4]);
            };
        } else if (f > 0) {
            newcell.classList.add("disabled");
        }
    }
    // NET COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "data-col-NET");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*25)+"vw";
    oncol++;
    for (let g = 0; g < teeCount+7; g++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+g);
        newcol.appendChild(newcell);
        if (g === 0) {
            newcell.innerText = "NET";
        } else {
            // newcell.innerText = "--";
        }
        if (g > teeCount && g < teeCount+5) {} else if (g > 0) {
            newcell.classList.add("disabled");
        }
    }
}

// Fills the generated scorecard with data from the API. Tee yardages, handicaps, pars, and totals are calculated and placed here. Also initiates the transition from card selector to scorecard screen, so it doesn't show before generation is complete.
function fillCard(id) {
    activeCourse = JSON.parse(sessionStorage.getItem(activeCourse));
    generateScorecard();
    let totals = [];
    let gTotals = [];
    let parTotal = 0;
    parGTotal = 0;
    for (let pre = 0; pre < teeCount; pre++) {
        totals.push(0);
        gTotals.push(0);
    }
    for (let a = 0; a < 9; a++) {
        for (let aa = 0; aa < teeCount; aa++) {
            document.querySelector(".data-col-"+a).querySelector(".r"+(aa+1)).innerText = activeCourse.data.holes[a].teeBoxes[aa].yards;
            totals[aa] += activeCourse.data.holes[a].teeBoxes[aa].yards;
        }

        document.querySelector(".data-col-"+a).querySelector(".r9").innerText = activeCourse.data.holes[a].teeBoxes[0].par;
        document.querySelector(".data-col-"+a).querySelector(".r10").innerText = activeCourse.data.holes[a].teeBoxes[0].hcp;

        parTotal += activeCourse.data.holes[a].teeBoxes[0].par;
    }

    parGTotal += parTotal;

    for (let b = 0; b < teeCount; b++) {
        document.querySelector(".data-col-OUT").querySelector(".r"+(b+1)).innerText = totals[b];
        gTotals[b] += totals[b];
    }

    document.querySelector(".data-col-OUT").querySelector(".r"+(5+teeCount)).innerText = parTotal;

    for (let c = 0; c < totals.length; c++) {
        totals[c] = 0;
    }

    parTotal = 0;

    for (let d = 0; d < 9; d++) {
        for (let da = 0; da < teeCount; da++) {
            document.querySelector(".data-col-"+(d+9)).querySelector(".r"+(da+1)).innerText = activeCourse.data.holes[d+9].teeBoxes[da].yards;
            totals[da] += activeCourse.data.holes[d+9].teeBoxes[da].yards;
        }

        document.querySelector(".data-col-"+(d+9)).querySelector(".r9").innerText = activeCourse.data.holes[d+9].teeBoxes[0].par;
        document.querySelector(".data-col-"+(d+9)).querySelector(".r10").innerText = activeCourse.data.holes[d+9].teeBoxes[0].hcp;

        parTotal += activeCourse.data.holes[d].teeBoxes[0].par;
    }

    parGTotal += parTotal;

    for (let e = 0; e < teeCount; e++) {
        document.querySelector(".data-col-IN").querySelector(".r"+(e+1)).innerText = totals[e];
        gTotals[e] += totals[e];
        document.querySelector(".data-col-TOT").querySelector(".r"+(e+1)).innerText = gTotals[e];
    }
    document.querySelector(".data-col-IN").querySelector(".r"+(5+teeCount)).innerText = parTotal;
    document.querySelector(".data-col-TOT").querySelector(".r"+(5+teeCount)).innerText = parGTotal;

    document.querySelector(".name").innerText = activeCourse.data.name;

    setTimeout(() => {
        window.scroll({
            top: 0,
            left: 0,
            behavior: "smooth"
        });
        // document.querySelector(".card-wrap-title").style.animation = "0.6s slideout cubic-bezier(.54,-0.06,.6,-0.34) forwards";
        document.querySelector(".scorecard").style.animation = "0.6s slidein ease-out forwards";
        document.querySelector(".scorecard").style.animationDelay = "0.5s";
        document.querySelector(".select-"+id).classList.remove("clocking");
        for (let a = 0; a < document.querySelectorAll(".card").length; a++) {
            document.querySelectorAll(".card")[a].style.animation = "0.6s slideout cubic-bezier(.54,-0.06,.6,-0.34) forwards";
            document.querySelectorAll(".card")[a].style.animationDelay = 0.083+(0.08*a)+"s";
        }
    }, 420);
}

// Takes user inputs for strokes and updates totals
function updateScores(pId, col) {
    pId = parseInt(pId);
    let newScore = document.querySelector(".input-p-"+pId+"-c-"+col).value;

    // sets name, returns before setting other things
    if (col == "NAME") {
        for (let key in players) {
            if (players[key].name == newScore && key != pId && newScore != "") {
                document.querySelector(".input-p-"+pId+"-c-"+col).value = null;
                document.querySelector(".player"+pId).children[0].style.animation = "0.5s invalid";
                setTimeout(() => {
                    document.querySelector(".player"+pId).children[0].style.animation = "";
                }, 300);
                return;
            }
        }
        players[pId].name = newScore;
        return;
    }

    // sets handicap
    if (col == "HCP") {
        newScore = parseInt(newScore);
        players[pId].hcp = newScore;
    }

    // sets scores
    if (newScore == null || newScore == "-" || newScore == "") {
        return;
    } else if (players[pId].name == "") {
        document.querySelector(".player"+pId).children[0].style.animation = "0.5s invalid";
        setTimeout(() => {
            document.querySelector(".player"+pId).children[0].style.animation = "";
        }, 300);
        document.querySelector(".input-p-"+pId+"-c-"+col).value = null;
        return;
    } else if (col != "HCP") {
        newScore = parseInt(newScore);
        players[pId].scores[col] = newScore;
    }

    // updates all totals except net. fTotal = first 9 holes, sTotal = second 9, gTotal = grand total aka. all 18
    let fTotal = 0, sTotal = 0, gTotal = 0;
    for (let a = 0; a < players[pId].scores.length; a++) {
        if (players[pId].scores[a] && a < 9) {
            fTotal += players[pId].scores[a];
            gTotal += players[pId].scores[a];
        }
        if (players[pId].scores[a] && a >= 9) {
            sTotal += players[pId].scores[a];
            gTotal += players[pId].scores[a];
        }
    }

    // update scorecard
    players[pId].outScore = fTotal;
    players[pId].inScore = sTotal;
    players[pId].net = gTotal - players[pId].hcp;

    document.querySelector(".data-col-OUT").children[teeCount+1+pId].innerText = fTotal;
    document.querySelector(".data-col-IN").children[teeCount+1+pId].innerText = sTotal;
    document.querySelector(".data-col-TOT").children[teeCount+1+pId].innerText = gTotal;
    document.querySelector(".data-col-NET").children[teeCount+1+pId].innerText = players[pId].net;

    if (players[pId].scores.length == 18 && players[pId].hcp) {
        let diff = parGTotal - players[pId].net;
        if (diff > 5) {
            message(`Congrats ${players[pId].name}!`, messageGood[Math.floor(Math.random()*messageGood.length)]);
        } else if (diff < -5) {
            message(`Good work, ${players[pId].name}.`,messageBad[Math.floor(Math.random()*messageBad.length)]);
        } else {
            message(`Good game, ${players[pId].name}`,messageNormal[Math.floor(Math.random()*messageNormal.length)]);
        }
    }
}

function select(direction) {
    if (JSON.stringify(selectedCell) == "[]") {
        selectedCell = [0, 0];
    } else {
        switch (direction) {
            case 0:
                selectedCell[0]--;
                break;
            case 1:
                selectedCell[0]++;
                break;
            case 2:
                selectedCell[1]--;
                break;
            case 3:
                selectedCell[1]++;
                break;
        }
    }
    if (selectedCell[0] < 0) {
        selectedCell[0] = 0;
    }
    if (selectedCell[0] > 17) {
        selectedCell[0] = 17;
    }
    if (selectedCell[1] < 0) {
        selectedCell[1] = 0;
    }
    if (selectedCell[1] > 3) {
        selectedCell[1] = 3;
    }
    document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).focus();
}
function changeScore(amount) {
    if (document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).value == "") {
        if (amount == -1) {
            amount = 0;
        }
        document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).value = amount;
    } else {
        if (parseInt(document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).value) + amount < 0) {
            amount = 0;
        } else if (parseInt(document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).value) + amount > 99) {
            amount = 0;
        }
        document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).value = parseInt(document.querySelector(".input-p-"+selectedCell[1]+"-c-"+selectedCell[0]).value) + amount;
    }
    updateScores(selectedCell[1], selectedCell[0]);
}

// Initializes event listeners for settings buttons, and applies startup properties to various things
function startSettings() {
    if (!localStorage.getItem("settings")) {
        let newSettings = {};
        newSettings = JSON.stringify(newSettings);
        localStorage.setItem("settings", newSettings);
    }
    for (let a = 0; a < document.querySelectorAll(".settingsBtn").length; a++) {
        document.querySelectorAll(".toggle")[a].addEventListener("click", function() {
            if (this.classList.contains("toggle-enabled")) {
                this.classList.remove("toggle-enabled");
                this.classList.add("toggle-disabled");
            } else {
                this.classList.add("toggle-enabled");
                this.classList.remove("toggle-disabled");
            }
        });
    }
    document.querySelector(".tg_preserve").addEventListener("click", function() {
        let settings = JSON.parse(localStorage.getItem("settings"));
        if (settings.tg_preserve == true) {
            settings.tg_preserve = false;
            settings = JSON.stringify(settings);
            localStorage.setItem("settings", settings);
        } else {
            settings.tg_preserve = true;
            settings = JSON.stringify(settings);
            localStorage.setItem("settings", settings);
        }
    });
    document.querySelector(".tg_select").addEventListener("click", function() {
        let settings = JSON.parse(localStorage.getItem("settings"));
        if (settings.tg_select == true) {
            document.querySelector(".persistentCourse").style.display = "none";
            settings.tg_select = false;
            settings.tg_select_value = -1;
            settings = JSON.stringify(settings);
            localStorage.setItem("settings", settings);
        } else {
            document.querySelector(".persistentCourse").style.display = "inline";
            settings.tg_select = true;
            settings.tg_select_value = document.querySelector(".persistentCourse").value;
            settings = JSON.stringify(settings);
            localStorage.setItem("settings", settings);
        }
    });
    document.querySelector(".tg_clear").addEventListener("click", function() {
        let settings = JSON.parse(localStorage.getItem("settings"));
        if (settings.tg_clear == true) {
            settings.tg_clear = false;
            settings = JSON.stringify(settings);
            localStorage.setItem("settings", settings);
        } else {
            settings.tg_clear = true;
            settings = JSON.stringify(settings);
            localStorage.setItem("settings", settings);
        }
    });

    let setVis = JSON.parse(localStorage.getItem("settings"));
    let savedData = false;
    document.querySelector(".persistentCourse").style.display = "none";
    if (setVis.tg_select) {
        document.querySelector(".tg_select").classList.add(setVis.tg_select ? "toggle-enabled" : "toggle-disabled");
        document.querySelector(".tg_select").classList.remove(setVis.tg_select ? "toggle-disabled" : "toggle-enabled");
        document.querySelector(".persistentCourse").style.display = "inline";
    } else {
        let editSettings = JSON.parse(localStorage.getItem("settings"));
        editSettings.tg_select_value = -1;
        localStorage.setItem("settings", JSON.stringify(editSettings));
    }
    if (setVis.tg_clear) {
        document.querySelector(".tg_clear").classList.add(setVis.tg_clear ? "toggle-enabled" : "toggle-disabled");
        document.querySelector(".tg_clear").classList.remove(setVis.tg_clear ? "toggle-disabled" : "toggle-enabled");
    }
    if (setVis.tg_preserve) {
        document.querySelector(".tg_preserve").classList.add(setVis.tg_preserve ? "toggle-enabled" : "toggle-disabled");
        document.querySelector(".tg_preserve").classList.remove(setVis.tg_preserve ? "toggle-disabled" : "toggle-enabled");
        savedData = true;
    }
    grabCourses(savedData);
}

// Creates a message with the provided header and message
function message(header = "NO HEADER", text = "NO MESSAGE") {
    document.querySelector(".message").children[0].children[0].innerText = header;
    document.querySelector(".message").children[0].children[1].innerText = text;
    document.querySelector(".message").style.visibility = "visible";
    document.querySelector(".message").style.opacity = "1";
}

// Hides the message modal
function hideMessage() {
    document.querySelector(".message").style.visibility = "hidden";
    document.querySelector(".message").style.opacity = "0";
}

// Returns a text color (black or white) based on the background for best readability
function getDynamicColor(hexcolor) {
    if (hexcolor.substr(0,1) == "#") {
        hexcolor = hexcolor.substr(1);
    }
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
	var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
	return (yiq >= 128) ? 'black' : 'white';
}

// Returns a muted version of a color for the OUT and IN columns for distinguishability
function getMutedColor(hexcolor, muteAmount = 3) {
    if (hexcolor.substr(0,1) == "#") {
        hexcolor = hexcolor.substr(1);
    }
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    // let lowR = (r-muteAmount > 0) ? r-muteAmount : 0;
    // let lowG = (g-muteAmount > 0) ? g-muteAmount : 0;
    // let lowB = (b-muteAmount > 0) ? b-muteAmount : 0;

    let lowR = r-(r/muteAmount);
    let lowG = g-(g/muteAmount);
    let lowB = b-(b/muteAmount);

    var darkrgb = `rgb(${lowR},${lowG},${lowB})`;
	return darkrgb;
}

// Keeps track of the scroll position of the scorecard
document.querySelector(".databody").onscroll = function() {
    colpos = Math.floor(this.scrollLeft / (window.innerWidth/(100/25)));
};

function navL() {
    if (colpos > 0) {
        colpos--;
        alignCols();
    }
}

function navR() {
    if (colpos < 20) {
        colpos++;
        alignCols();
    }
}

// leverages scroll position to align columns to show 3 perfectly
function alignCols() {
    document.querySelector(".databody").scrollTo({
        top: 0,
        left: (colpos * window.innerWidth/4),
        behavior: "smooth"
    });
}

if (JSON.parse(localStorage.getItem("settings")).tg_clear) {
    let preserveSettings = JSON.parse(localStorage.getItem("settings"));
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("settings", JSON.stringify(preserveSettings));
}

// grabCourses();
startSettings();