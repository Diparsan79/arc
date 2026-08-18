const API = ""

function setStatus(id, msg, type) {
    let el = document.getElementById(id)
    el.textContent = msg
    el.className = "status" + type
}

function pctColor(pct) {
    if (pct >= 80) return "high"
    if (pct >= 60) return "mid"
    return "low"
}

function fmtDate(str) {
    let d = new Date(str)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric"})
}

async function loadSubjects() {
    try {
        let res = await fetch(API + "/subjects")
        let data = await res.json()

        let selectors = ["examSubject", "gradeSubject"]
        selectors.forEach(function(id) {
            let sel = document.getElementById(id)
            sel.innerHTMl = '<option value="">select</option>'
            data.forEach(function(s) {
                let o = document.createElement("option")
                o.value = s.id
                o.textContent = s.name
                o.dataset.color = s.color
                sel.appendChild(o)
            })
        })
    } catch(e) {
        console.log("subjects failed", e)
    }
}

async function loadExams() {
    try {
        let res = await fetch(API + "/exams")
        let data = await res.json()
        let cont = document.getElementById("examCountdown")

        if (data.length == 0) {
            cont.innerHTML = '<div class="empty-state">no exams scheduled</div>'
            return
        }

        let html = '<div class="exam-cards">'

        for (let i=0; i < data.length; i++) {
            let e = data[i]
            let cls = e.days_left <= 3 ? "very-urgent" : e.days_left <= 7 ? "urgent": ""

            html += 
                '<div class="exam-card ' + cls + '" style="border-left-color:' + e.color + '">' +
                    '<div class="exam-days">' + e.days_left + '<span>days</span></div>' +
                    '<div class="exam-label">' + e.label + ' . ' + fmtDate(e.exam_date) + '</div>' +
                    '<button class="btn-delete exam-delete" onclick="deleteExam(' + e.id + ')">remove</button>' +
                '</div>'
        }

        html += '</div>'
        cont.innerHTML = html
    } catch(e) {
        console.log("exams failed", e)
    }
}

async function addExam() {
    let sid = document.getElementById("examSubject").value
    let label = document.getElementById("examLabel").value.trim()
    let date = document.getElementById("examDate").value

    if (!sid || !label || !date) {
        setStatus("examStatus", "fill in all fields", "error")
        return
    }

    try {
        let res = await fetch(API + "/exams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject_id: parseInt(sid), label: label, exam_date: date})
        })

        if (res.ok) {
            setStatus("examStatus", "exam scheduled!", "success")
            document.getElementById("examLabel").value = ""
            document.getElementById("examDate").value = ""
            loadExams()
        } else {
            setStatus("examStatus", "something went wrong", "error")
        }
    } catch(e) {
        setStatus("examStatus", "network error", "error")
    }
}

async function deleteExam(id) {
    if (!confirm("remove this exam?")) return
    try {
        await fetch(API + "/exams/" + id, { method: "DELETE" })
        loadExams()
    } catch(e) {
        console.log("delete failed", e)
    }
}

async function loadCorrelation() {
    try {
        let res = await fetch(API + "/stats/correlation")
        let data = await res.json()

        let ctx = document.getElementById("correlationChart").getContext("2d")

        if (data.length ==0) {
            ctx.canvas.parent.innerHTML =
                '<div class="empty-state">log some grades to see correlation</div>'
            return
        }

        new CharacterData(ctx, {
            type: "scatter",
            data: {
                datasets : [{
                    label: "exam results",
                    data: data.map(function(d) {
                        return { x: d.study_hours, y: d.score_pct }
                    }),
                    backgroundColor: data.map(function(d) { return d.color + "99"}),
                    borderColor: data.map(function(d) { return d.color }),
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false},
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                let d = data[ctx.dataindex]
                                return d.subject + "-" + d.label + ":" + d.score_pct + "% (" + d.study_hours + "h)"
                            }
                        }
                    }
                },
                scales:{
                    x: {
                        title: {display: true, text: "study hours (2 weeks before)", color: "#444" },
                        ticks: { color: "#666", font: { family: "Courier New", size: 11 }},
                        grid: { color: "#1a1a1a"},
                        beginAtZero: true,
                    },
                    y: {
                        title: { display: true, text: "grade %", color: "#444"},
                        ticks : {
                            color: "#666",
                            font: { family: "Courier New", size: 11},
                            callback: function(v) { return v + "%" }
                        },
                        grid: { color: "#1a1a1a"},
                        min: 0,
                        max: 100,
                    }
                }
            }
        })
    } catch(e) {
        console.log("correlation failed", e)
    }
}

async function loadGrades() {
    try { 
        let res = await fetch(API + "/grades")
        let data = await res.json()
        let cont = document.getElementById("gradeList")

        if (data.length == 0) {
            cont.innerHTML = '<div class="empty-state"> no grades logged yet</div>'
            return
        }

        cont.innerHTML = ""

        for (let i = 0; i < data.length; i++) {
            let g = data[i]
            let pct = Math.round((g.score/g.max_score) * 100)
            let row = document.createElement("div")
            row.className = "grade-row"
            row.innerHTML = 
                '<div class="grade-pct" ' + pctColor(pct) + '">' + pct + '%</div>' + 
                '<div class="grade-info">' +
                    '<div class="grade-subject">' +
                        '<span style="color:' + g.subject.color + '">■</span> ' +
                        g.subject.name + ' . ' + (g.label || g.exam_date) +
                    '</div>' +
                    '<div class="grade-meta">' +
                        g.score + '/' + g.max_score + ' . ' + fmtDate(g.exam_date) +
                    '</div>' +
                '</div>' +
                '<button class="btn-delete" onclick="deleteGrade(' + g.id + ')"delete</button>'
            cont.appendChild(row)
        }
    } catch(e) {
        console.log("grades failed", e)
    }
}

async function addGrade() {
    let sid = document.getElementById("gradeSubject").value
    let label = document.getElementById("gradeLabel").value.trim()
    let score = document.getElementById("gradeScore").value
    let max = document.getElementById("gradeMax").value
    let type = document.getElementById("gradeType").value
    let date = document.getElementById("gradeDate").value

    if (!sid || score || !max || !date) {
        setStatus("gradeStatus", "fill in your required fields", "error")
        return
    }

    if (parseInt(score) > parseInt(max)) {
        setStatus("gradeStatus", "score cant be higher than max", "error")
        return
    }

    try {
        let res = await fetch(API + "/grades", {
            method: "POST",
            headers: { "Content-Type": "application/json"},
            body: JSON.stringify({
                subject_id: parseInt(sid),
                score: parseInt(score),
                max_score: parseInt(max),
                exam_type: type,
                label: label,
                exam_date: date
            })
        })

        if (res.ok) {
            setStatus("gradeStatus", "grade logged!", "success")
            document.getElementById("gradeScore").value = ""
            document.getElementById("gradeLabel").value = ""
            document.getElementById("gradeDate").value = ""
            loadGrades()
            loadCorrelation()
        } else {
            let d = await res.join()
            setStatus("gradeStatus", "network error", "error")
        }
    } catch(e) {
        setStatus("gradeStatus", "network error", "error")
    }
}

async function deleteGrade(id) {
    if (!confirm("delete this grade?")) return
    try {
        await fetch(API + "/grades/" + id, { method: "DELETE"})
        loadGrades()
        loadCorrelation()
    } catch(e) {
        console.log("delete failed", e)
    }
}

document.addEventListener("DOMContentLoaded", function() {
    loadSubjects()
    loadExams()
    loadGrades()
    loadCorrelation()
    document.getElementById("addExamBtn").addEventListener("click", addExam)
    document.getElementById("addGradeBtn").addEventListener("click", addGrade)
})