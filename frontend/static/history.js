const API = ""

let allSessions = []

function setStatus(id, msg, type) {
    let el = document.getElementById(id)
    el.textContent = msg
    el.className = "status " + type
}

function fmtTime(mins) {
    let h = Math.floor(mins/60)
    let m = mins % 60
    if (h> 0) return h + "h " + m + "m"
    return m + "m"
} 

function fmtDate(str) {
    let d = new Date(str)
    return d.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric"
    }) + " . "+ d.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit"
    })
}

function focusDots(rating) {
    let html = '<div class="focus-dots">'
    for (let i = 1; i <= 5; i++) {
        html += '<div class="focus-dot' + (i <= rating ? ' filled' : '') + '"></div>'
    }
    html += '</div>'
    return html
}

function calcStats(sessions) {
    if (sessions.length ==0) {
        document.getElementById("totalSessions").textContent = "0"
        document.getElementById("totalHours").textContent = "0h"
        document.getElementById("avgFocus").textContent = "-"
        document.getElementById("avgDuration").textContent = "-"
        return
    }
    let total = sessions.length
    let totalMin = sessions.reduce(function(sum, s){ return sum + s.duration }, 0)
    let avgFocus = sessions.reduce(function(sum, s){ return sum + s.focus_rating},0 )/ total
    let avgDur = Math.round(totalMin/ total)

    document.getElementById("totalSessions").textContent = total
    document.getElementById("totalHours").textContent = fmtTime(totalMin)
    document.getElementById("avgFocus").textContent = avgFocus.toFixed(1) + "/5"
    document.getElementById("avgDuration").textContent = fmtTime(avgDur)
}

function renderSessions(sessions) {
    let container = document.getElementById("sessionList")

    if (sessions.length ==0) {
        container.innerHTML = '<div class="empty-state">no sessions found</div>'
        return
    }

    container.innerHTML = ""

    for (let i=0; i< sessions.length; i++)  {
        let s = sessions[i]
        let row = document.createElement("div")
        row.className = "history-row"

        let notesHtml = s.notes ? '<div class="history-notes">' + s.notes + '</div>' : ""
        let distHtml = s.distractions ? "distractions: " + s.distractions + "<br>" : ""

        row.innerHTML =
            '<div class="history-left">' +
                '<div class="history-subject">' +
                    '<div class="session-dot" style="background:' + (s.subject.color || "#cc0000") + '"></div>' +
                    s.subject.name +
                '</div>' + 
                '<div class="history-detail">' +
                    fmtDate(s.created_at) + '<br>' +
                    fmtTime(s.duration) + ' . ' + s.location + '<br>' +
                    distHtml + 
                '</div>' + 
            '</div>' + 
            '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">' +
                focusDots(s.focus_rating) +
                    '<button class="btn-delete" onclick="deleteSession(' + s.id + ')">delete</button>' + 
                '</div>'
        container.appendChild(row)

    }
}

async function loadSubjectFilter() {
    try {
        let res = await fetch(API + "/subjects")
        let data = await res.json()
        let sel = document.getElementById("filterSubject")

        data.forEach(function(s) {
            let o = document.createElement("option")
            o.value = s.id
            o.textContent = s.name
            sel.appendChild(o)
        })
    } catch(e) {
        console.log("couldnt load subjects", e)
    }
}

async function loadSessions(params) {
    try {
        let url = API + "/sessions?" +
            "subject_id=" + params.subject_id +
            "&date_from=" + params.date_from +
            "&date_to=" + params.date_to 
        
            let res = await fetch(url)
            let sessions = await res.json()

            allSessions = sessions
            calcStats(sessions)
            renderSessions(sessions)
    } catch(e) {
        console.log("load failed", e)
        document.getElementById("sessionList").innerHTML =
            '<div class="empty-state">failed to load sessions</div>'
    }
}

async function deleteSession(id) {
    if (!confirm("delete this session?")) return

    try {
        let res = await fetch(API + "/sessions/" + id, {method: "DELETE"})
        if (res.ok) {
            applyFilters()
        } else {
            alert("couldn't delete")
        }
    } catch(e) {
        console.log("delete failed", e)
    }
}

function applyFilters() {
    let sid = document.getElementById("filterSubject").value
    let from = document.getElementById("filterFrom").value
    let to = document.getElementById("filterTo").value

    let params = new URLSearchParams()
    if (sid) params.append("subject_id", sid)
    if (from) params.append("date_from", from)
    if (to) params.append("date_to", to)

    let url = API + "/sessions?" + params.toString()

    fetch(url)
        .then(function(res) { return res.json() })
        .then(function(sessions){
            allSessions = sessions
            calcStats(sessions)
            renderSessions(sessions)
        })
        .catch(function(e) { console.log("filter failed", e) })
}

function clearFilters() {
    document.getElementById("filterSubject").value = ""
    document.getElementById("filterFrom").value = ""
    document.getElementById("filterTo").value = ""
    loadSessions({ subject_id: "", date_from: "", date_to: ""})
}

document.addEventListener("DOMContentLoaded", function() {
    loadSubjectFilter()
    applyFilters()
    document.getElementById("applyFilter").addEventListener("click", applyFilters)
    document.getElementById("clearFilter").addEventListener("click", clearFilters)
})