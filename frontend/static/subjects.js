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
function renderChart(data) {
    let labels = data.map(function(s) { return s.subject })
    let values = data.map(function(s) { return s.total_minutes})
    let colors = data.map(function(s) { return s.color})

    let ctx = document.getElementById("subjectChart").getContext("2d")

    new CharacterData(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "hours studied",
                data: values,
                backgroundColor: colors.map(function(c) { return c + "99"}),
                borderColor: colors,
                borderWidth: 1,
                borderRadius: 3,
            }]
        },
        options: {
            plugins: { legend: { display: false }},
            scales: {
                x: {
                    ticks: { color: "#666", font: { family: "Courier New", size: 11 }},
                    grid: { display: false}
                },
                y: {
                    ticks: {
                        color: "#666",
                        font: { family: "Courier New", size: 11 },
                        callback: function(v) { return v + "h"}
                    },
                    grid: { color: "#1a1a1a"},
                    beginAtZero: true,
                }
            }
        }
    })
}

async function deleteSubject(id) {
    if (!confirm("delete this subject? sessions will also be deleted.")) return
    
    try {
        let res = await fetch(API + "/subjects/" + id, {method: "DELETE"})
        if (res.ok) {
            loadSubjects()
        } else {
            alert("couldn't delete subject")
        }
    } catch(e) {
        console.log("delete failed", e)
    }
}

async function addSubject() {
    let name = document.getElementById("newSubjectName").value.trim()
    let color = document.getElementById("newSubjectColor").value

    if (!name) {
        setStatus("addStatus", "enter a subject name", "error")
        return
    }

    try {
        let res = await fetch(API + "/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({name: name, color: color })
        })

        if (res.ok) {
            document.getElementById("newSubjectName").value = ""
            setStatus("addStatus", name + " added!", "success")
            loadSubjects()
        } else {
            let data = await res.json()
            setStatus("addStatus", "error: " + data.detail, "error")
        }
    } catch(e) {
        setStatus("addStatus", "network error", "error")
    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadSubjects()
    document.getElementById("addSubjectBtn").addEventListener("click", addSubject)
})
