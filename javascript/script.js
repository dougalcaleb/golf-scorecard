const url = "https://golf-courses-api.herokuapp.com/courses";
const xhr = new XMLHttpRequest();
const cxhr = new XMLHttpRequest();

let course;
let apiurl = "";
let courseData;
let courses = {};
let activeCourse, teecount = 0;

let colpos = 0, aligned = false;

let players = {
    0: {

    },
    1: {

    },
    2: {

    },
    3: {

    }
};

document.querySelector(".btn-l").addEventListener("click", navL);
document.querySelector(".btn-r").addEventListener("click", navR);
document.querySelector(".align").addEventListener("click", alignCols);

window.onscroll = function() {
    if (window.scrollY > 0) {
        document.querySelector("header").style.boxShadow = "0px 5px 7px #111";
    } else if (window.scrollY === 0) {
        document.querySelector("header").style.boxShadow = "0px 0px 0px #111";
    }
};

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
            this.classList.add("clocking")
            selectCourse(this.classList[1].split("-")[1]);
        });
    }
}

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
                fillCard();
            }
        } else {
            console.warn("Retrieval failed");
        }
    };
}

function cacheData(name, data) {
    data = JSON.stringify(data);
    sessionStorage.setItem(name, data);
}

function selectCourse(id) {
    if (!sessionStorage.getItem("course-"+courseData.courses[id].id)) {
        loadBasicInfo(id, false);
    } else {
        activeCourse = "course-"+courseData.courses[id].id;
        fillCard(id);
    }
}

function generateScorecard() {
    let newcol, newcell;
    let databody = document.querySelector(".databody");
    let oncol = 0;
    // let teeCount = activeCourse.data.holes[0].teeBoxes.length-1;
    if (activeCourse.data.holes[0].teeBoxes[activeCourse.data.holes[1].teeBoxes.length-1].teeType === "auto change location") {
        teeCount = activeCourse.data.holes[0].teeBoxes.length-1;
    } else {
        teeCount = activeCourse.data.holes[0].teeBoxes.length;
    }
    // teeCount = (activeCourse.data.holes[0].teeBoxes[activeCourse.data.holes[1].teeBoxes.length-1].teeHexColor = null) ? activeCourse.data.holes[0].teeBoxes.length-2 : activeCourse.data.holes[0].teeBoxes.length-1;
    console.log(teeCount+" tees");
    let playerCount = 4;
    let totalRowCount = 3 + playerCount+teeCount;
    // FIRST 9
    for (let a = 0; a < 9; a++) {
        newcol = document.createElement("DIV");
        newcol.classList.add("data-col", "data-col-"+a);
        databody.appendChild(newcol);
        newcol.style.left = (oncol*26)+"vw";
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
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let b = 0; b < 11; b++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+b);
        newcol.appendChild(newcell);
        if (b === 0) {
            newcell.innerText = "OUT";
        } else {
            newcell.innerText = "--";
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
        newcol.style.left = (oncol*26)+"vw";
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
            newcol.appendChild(newcell);
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
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let d = 0; d < 11; d++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+d);
        newcol.appendChild(newcell);
        if (d === 0) {
            newcell.innerText = "IN";
        } else {
            newcell.innerText = "--";
        }
        if (d > 0 && d <= teeCount) {
            newcell.style.background = getMutedColor(activeCourse.data.holes[1].teeBoxes[d-1].teeHexColor);
            newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[d-1].teeHexColor);
        }
    }
    // TOTAL COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "data-col-TOT");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let e = 0; e < 11; e++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+e);
        newcol.appendChild(newcell);
        if (e === 0) {
            newcell.innerText = "TOTAL";
        } else {
            newcell.innerText = "--";
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
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let f = 0; f < 11; f++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+f);
        newcol.appendChild(newcell);
        if (f === 0) {
            newcell.innerText = "HCP";
        } else {
            newcell.innerText = "--";
        }
        // if (f > 0 && f <= teecount) {
        //     newcell.style.background = activeCourse.data.holes[1].teeBoxes[f-1].teeHexColor;
        //     newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[f-1].teeHexColor);
        // }
    }
    // NET COL
    newcol = document.createElement("DIV");
    newcol.classList.add("data-col", "data-col-NET");
    databody.appendChild(newcol);
    newcol.style.left = (oncol*26)+"vw";
    oncol++;
    for (let g = 0; g < 11; g++) {
        newcell = document.createElement("DIV");
        newcell.classList.add("r"+g);
        newcol.appendChild(newcell);
        if (g === 0) {
            newcell.innerText = "NET";
        } else {
            newcell.innerText = "--";
        }
        // if (g > 0 && g <= teecount) {
        //     newcell.style.background = activeCourse.data.holes[1].teeBoxes[g-1].teeHexColor;
        //     newcell.style.color = getDynamicColor(activeCourse.data.holes[1].teeBoxes[g-1].teeHexColor);
        // }
    }
}

function fillCard(id) {
    activeCourse = JSON.parse(sessionStorage.getItem(activeCourse));
    generateScorecard();
    // let total0 = 0, total1 = 0, total2 = 0, total3 = 0;
    // let gtotal0 = 0, gtotal1 = 0, gtotal2 = 0, gtotal3 = 0;
    let totals = [];
    let gtotals = [];
    let hcptotal = 0, partotal = 0;
    let hcpgtotal = 0, pargtotal = 0;
    for (let pre = 0; pre < teeCount; pre++) {
        totals.push(0);
        gtotals.push(0);
    }
    for (let a = 0; a < 9; a++) {
        // if (activeCourse.data.holes[a].teeBoxes[1].yards) {
        //     document.querySelector(".data-col-"+a).querySelector(".r1").innerText = activeCourse.data.holes[a].teeBoxes[1].yards;
        //     total0 += activeCourse.data.holes[a].teeBoxes[1].yards;
        // }
        // if (activeCourse.data.holes[a].teeBoxes[3].yards) {
        //     document.querySelector(".data-col-"+a).querySelector(".r2").innerText = activeCourse.data.holes[a].teeBoxes[3].yards;
        //     total1 += activeCourse.data.holes[a].teeBoxes[3].yards;
        // }
        // if (activeCourse.data.holes[a].teeBoxes[0].yards) {
        //     document.querySelector(".data-col-"+a).querySelector(".r3").innerText = activeCourse.data.holes[a].teeBoxes[0].yards;
        //     total2 += activeCourse.data.holes[a].teeBoxes[0].yards;
        // }
        // if (activeCourse.data.holes[a].teeBoxes[2].yards) {
        //     document.querySelector(".data-col-"+a).querySelector(".r4").innerText = activeCourse.data.holes[a].teeBoxes[2].yards;
        //     total3 += activeCourse.data.holes[a].teeBoxes[2].yards;
        // }

        for (let aa = 0; aa < teeCount; aa++) {
            document.querySelector(".data-col-"+a).querySelector(".r"+(aa+1)).innerText = activeCourse.data.holes[a].teeBoxes[aa].yards;
            totals[aa] += activeCourse.data.holes[a].teeBoxes[aa].yards;
        }

        document.querySelector(".data-col-"+a).querySelector(".r9").innerText = activeCourse.data.holes[a].teeBoxes[0].par;
        document.querySelector(".data-col-"+a).querySelector(".r10").innerText = activeCourse.data.holes[a].teeBoxes[0].hcp;

        // hcptotal += activeCourse.data.holes[a].teeBoxes[0].hcp;     hcpgtotal += hcptotal;
        partotal += activeCourse.data.holes[a].teeBoxes[0].par;
    }

    console.log("totals for section 1 are "+totals);

    // gtotal0 += total0;
    // gtotal1 += total1;
    // gtotal2 += total2;
    // gtotal3 += total3;
    pargtotal += partotal;

    for (let b = 0; b < teeCount; b++) {
        document.querySelector(".data-col-OUT").querySelector(".r"+(b+1)).innerText = totals[b];
        gtotals[b] += totals[b];
    }

    document.querySelector(".data-col-OUT").querySelector(".r"+(5+teeCount)).innerText = partotal;

    // total0 = 0; total1 = 0; total2 = 0; total3 = 0; 

    for (let c = 0; c < totals.length; c++) {
        totals[c] = 0;
    }

    partotal = 0;

    for (let d = 0; d < 9; d++) {
        // document.querySelector(".data-col-"+(b+9)).querySelector(".r1").innerText = activeCourse.data.holes[b+9].teeBoxes[1].yards;
        // document.querySelector(".data-col-"+(b+9)).querySelector(".r2").innerText = activeCourse.data.holes[b+9].teeBoxes[3].yards;
        // document.querySelector(".data-col-"+(b+9)).querySelector(".r3").innerText = activeCourse.data.holes[b+9].teeBoxes[0].yards;
        // document.querySelector(".data-col-"+(b+9)).querySelector(".r4").innerText = activeCourse.data.holes[b+9].teeBoxes[2].yards;

        // total0 += activeCourse.data.holes[b+9].teeBoxes[1].yards;
        // total1 += activeCourse.data.holes[b+9].teeBoxes[3].yards;
        // total2 += activeCourse.data.holes[b+9].teeBoxes[0].yards;
        // total3 += activeCourse.data.holes[b+9].teeBoxes[2].yards;


        for (let da = 0; da < teeCount; da++) {
            document.querySelector(".data-col-"+(d+9)).querySelector(".r"+(da+1)).innerText = activeCourse.data.holes[d+9].teeBoxes[da].yards;
            totals[da] += activeCourse.data.holes[d+9].teeBoxes[da].yards;
        }

        document.querySelector(".data-col-"+(d+9)).querySelector(".r9").innerText = activeCourse.data.holes[d+9].teeBoxes[0].par;
        document.querySelector(".data-col-"+(d+9)).querySelector(".r10").innerText = activeCourse.data.holes[d+9].teeBoxes[0].hcp;

        partotal += activeCourse.data.holes[d].teeBoxes[0].par;
    }

    console.log("totals for section 2 are "+totals);


    // gtotal0 += total0;
    // gtotal1 += total1;
    // gtotal2 += total2;
    // gtotal3 += total3;
    pargtotal += partotal;

    for (let e = 0; e < teeCount; e++) {
        document.querySelector(".data-col-IN").querySelector(".r"+(e+1)).innerText = totals[e];
        gtotals[e] += totals[e];
        document.querySelector(".data-col-TOT").querySelector(".r"+(e+1)).innerText = gtotals[e];
    }

    // document.querySelector(".data-col-IN").querySelector(".r1").innerText = total0;
    // document.querySelector(".data-col-IN").querySelector(".r2").innerText = total1;
    // document.querySelector(".data-col-IN").querySelector(".r3").innerText = total2;
    // document.querySelector(".data-col-IN").querySelector(".r4").innerText = total3;

    document.querySelector(".data-col-IN").querySelector(".r"+(5+teeCount)).innerText = partotal;

    // for (let e = 0; e < teecount; e++) {
    //     document.querySelector(".data-col-TOT").querySelector(".r1").innerText = gtotal0;
    // }

    // document.querySelector(".data-col-TOT").querySelector(".r1").innerText = gtotal0;
    // document.querySelector(".data-col-TOT").querySelector(".r2").innerText = gtotal1;
    // document.querySelector(".data-col-TOT").querySelector(".r3").innerText = gtotal2;
    // document.querySelector(".data-col-TOT").querySelector(".r4").innerText = gtotal3;

    document.querySelector(".data-col-TOT").querySelector(".r"+(5+teeCount)).innerText = pargtotal;

    setTimeout(() => {
        window.scroll({
            top: 0,
            left: 0,
            behavior: "smooth"
        });
        // console.log("Selected course",id);
        document.querySelector(".card-wrap-title").style.animation = "0.6s slideout cubic-bezier(.54,-0.06,.6,-0.34) forwards";
        document.querySelector(".scorecard").style.animation = "0.6s slidein ease-out forwards";
        document.querySelector(".scorecard").style.animationDelay = "0.5s";
        document.querySelector(".select-"+id).classList.remove("clocking");
        for (let a = 0; a < document.querySelectorAll(".card").length; a++) {
            document.querySelectorAll(".card")[a].style.animation = "0.6s slideout cubic-bezier(.54,-0.06,.6,-0.34) forwards";
            document.querySelectorAll(".card")[a].style.animationDelay = 0.083+(0.08*a)+"s";
        }
    }, 420);
}

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

function getMutedColor(hexcolor) {
    let muteAmount = 45;
    if (hexcolor.substr(0,1) == "#") {
        hexcolor = hexcolor.substr(1);
    }
	var r = parseInt(hexcolor.substr(0,2),16);
	var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    let lowR = (r-muteAmount > 0) ? r-muteAmount : 0;
    let lowG = (g-muteAmount > 0) ? g-muteAmount : 0;
    let lowB = (b-muteAmount > 0) ? b-muteAmount : 0;
    var darkrgb = `rgb(${lowR},${lowG},${lowB})`;
	return darkrgb;
}


document.querySelector(".databody").onscroll = function() {
    colpos = Math.floor(this.scrollLeft / (window.innerWidth/(100/26)));
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

function alignCols() {
    document.querySelector(".databody").scrollTo({
        top: 0,
        left: (colpos * window.innerWidth/(100/26)),
        behavior: "smooth"
    });
}

grabCourses();
// generateScorecard();

// setTimeout(function() {
//     selectCourse(1);
// }, 500);