const API = ""

let subjectData = []

function setStatus(id, msg, type) {
    let el = document.getElementById(id)
    el.textContent = msg
    el.className = "status" + type
}

function fmtTime(mins) {
    let h = Math.floor(mins/60)
    let m = mins % 60
    if (h > 0) return h + "h " + m + "m"
    return m + "m"
}

async function loadSubjects() {
    try {
        let res = await fetch(API + "/stats/subjects")
        let data = await res.json()
        subjectData = data
        renderCards(data)
        renderChart(data)
    } catch(e) {
        console.log("failed loading subjects", e)
    }
}

function renderCards(data) {
    let container = document.getElementById("subjectList")

    if (data.length == 0) {
        container.innerHTML = '<div class="empty-state">no subjects yet</div>'
        return
    }

    container.innerHTML = ""

    for (let i = 0; i < data.length; i++) {
        let s = data[i]
        let div = document.createElement("div")
        div.className = "subject-card"
        div.innerHTML =
            '<div class="subject-color" style="background:' + s.color + '"></div>' + 
            '<div class="subject-name">' + s.subject +  '</div>' +
            '<div class="subject-stats">' + 
                fmtTime(s.total_minutes) + '<br>' + 
                s.sessions + ' session' + (s.sessions != 1 ? 's' : '') + ' . avg focus ' + s.avg_focus +
            '</div>' +
            '<button class="btn-delete" onclick="deleteSubject(' + s.id  + ')">delete</button>' 
        container.appendChild(div)
    }
}
