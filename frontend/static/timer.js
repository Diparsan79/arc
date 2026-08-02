const API = ""

let sid = null
let sname = null
let stime = null
let elapsed = 0
let iid = null
let paused = false
let pausedAt = null

function fmt(ms) {
    let s = Math.floor(ms/1000)
    let h = Math.floor(s/3600)
    let m = Math.floor((s%3600) / 60)
    s = s %60
    return (h<10?"0"+h:h) + ":" + (m<10?"0"+m:m) + ":" + (s<10?"0"+s:s)
}

function toMins(ms) {
    let m = Math.round(ms / 60000)
    if (m < 1) m = 1
    return m
}

function showPhase(p) {
    document.getElementById("setupPhase").classList.add("hidden")
    document.getElementById("timerPhase").classList.add("hidden")
    document.getElementById("logPhase").classList.add("hidden")
    document.getElementById(p).classList.remove("hidden")
}

function setStatus(id, msg, type) {
    let el = document.getElementById(id)
    el.textContent = msg
    el.className = "status" + type
}

async function loadSubjects() {
    try {
        let res = await fetch("/subjects")
        let data = await res.json()
        let sel = document.getElementById("timerSubject")
        sel.innerHTML = `<option value="">select a subject</option>`
        for (let i = 0; i <data.length; i++) {
            let o = document.createElement("option")
            o.value = data[i].id
            o.textContent = data[i].name
            o.dataset.name = data[i].name
            sel.appendChild(o)
        }
    } catch(e) {
        console.log("couldn't load subjects", e)
    }
}

function startTimer() {
    let sel = document.getElementById("timerSubject")
    if (!sel.value) {
        alert("pick a subject")
        return
    }

    sid = parseInt(sel.value)
    sname = sel.options[sel.selectedIndex].dataset.name
    stime = Date.now() 
    elapsed: 0
    paused = false

    localStorage.setItem("arc_timer", JSON.stringify({
        sid: sid, name: sname, stime: stime
    }))

    document.getElementById("timerSubjectName").textContent = sname
    showPhase("timerPhase")

    iid = setInterval(function() {
        if (paused) return
        elapsed = Date.now() - stime
        document.getElementById("timerDisplay").textContent = fmt(elapsed)
    }, 1000)
}

function pauseTimer() {
    if (paused) {
        stime += Date.now() - pausedAt
        paused = false
        pausedAt = null
        document.getElementById("pauseBtn").textContent = "pause"
        document.getElementById("timerDisplay").classList.remove("paused")
        document.getElementById("timerStatus").textContent = "studying..."
    } else {
        paused = true
        pausedAt = Date.now()
        document.getElementById("pauseBtn").textContent = "resume"
        document.getElementById("timerDisplay").classList.add("paused")
        document.getElementById("timerStatus").textContent = "paused"
    }
}

function stopTimer() {
    clearInterval(iid)
    if (!paused) elapsed = Date.now() - stime
    localStorage.removeItem("sage_timer")

    let mins = toMins(elapsed)
    document.getElementById("logDuration").value = mins
    document.getElementById("sessionSummary").textContent = sname + " . " + fmt(elapsed)

    showPhase("logPhase")
    initFocusBtns()
}

function checkCrash() {
    let saved = localStorage.getItem("arc_timer")
    if (!saved) return

    let d = JSON.parse(saved)
    let lost = Date.now() - d.stime
    let mins = toMins(lost)

    let ok =  confirm("unfinished session found!\n" + d.sname + " . ~" + mins + "mins\nlog it?")

    if (ok) {
        sid = d.sid
        sname= d.sname
        elapsed = lost
        localStorage.removeItem("arc_timer")
        document.getElementById("logDuration").value = mins
        document.getElementById("sessionSummary").textContent = d.sname + " . recovered"
        showPhase("logPhase")
        initFocusBtns()
    } else {
         localStorage.removeItem("arc_timer")
    }
}

function initFocusBtns() {
    let btns = document.querySelectorAll("#logFocusSelector .focus-btn")
    btns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            btns.forEach(function(b) { b.classList.remove("selected") })
            btns.classList.add("selected")
            document.getElementById("logFocusRating").value = btn.dataset.value
        })
    })
}

async function saveSession() {
    let dur = document.getElementById("logDuration").value
    let fr = document.getElementById("logFocusRating").value
    let loc = document.getElementById("logNotes").value
    let dist = document.getElementById("logDistractions").value

    if (!fr) {
        setStatus("logStatus", "rate your focus first", "error")
        return
    }

    let btn = document.getElementById("saveSessionBtn")
    btn.disabled = true
    btn.textContent = "saving"

    try {
        let res = await fetch("/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                subject_id: sid,
                duration: parseInt(dur),
                focus_rating: parseInt(fr),
                notes: note,
                location: Loc,
                distractions: dist
            })
        })

        if (res.ok) {
            window.location.href = "/index.html"
        } else {
            let data = await res.json()
            setStatus("logStatus", "error: " + data.detail, "error")
            btn.disabled = false
            btn.textContent = "save session"
        }
    } catch(e) {
        setStatus("logStatus", "network error, try again", "error")
        btn.disabled = false
        btn.textContent = "save session"
    }
}

function discard() {
    if (confirm("discard session?")) window.location.href = "/timer.html"
}

document.addEventListener("DOMContentLoaded", function(){
    checkCrash()
    loadSubjects()
    document.getElementById("startBtn").addEventListener("click", startTimer)
    document.getElementById("pauseBtn").addEventListener("click", pauseTimer)
    document.getElementById("stopBtn").addEventListener("click", stopTimer)
    document.getElementById("saveSessionbtn").addEventListener("click", saveSession)
    document.getElementById("discardBtn").addEventListener("click", discard)
})