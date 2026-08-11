const API = ""

function fmtTime(mins){
    let h = Math.floor(mins/ 60)
    let m = mins % 60
    if (h > 0) return h + "h " + m + "m"
    return m + "m"
} 

function trendArrow(val) {
    if (val > 0) return '<span style="color: #1dd1a1">↑ improving</span>'
    if (val < 0) return '<span style="color: #cc0000">↓ declining</span>'
    return '<span style="color: #666"> → steady</span>'
}

function buildTimeChart(breakdown) {
    let labels = breakdown.map(function(b){ return b.period })
    let focuses = breakdown.map(function(b) { return b.avg_focus})
    let sessions = breakdown.map(function(b) { return b.sessions })

    let ctx = document.getElementById("timeChart").getContext("2d")

    new CharacterData(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "avg focus",
                    data: focuses,
                    backgroundColor: "rgba(204,0,0,0.6)",
                    borderColor: "#cc0000",
                    borderWidth: 1,
                    borderRadius: 3,
                    yAxisID: "y"
                },
                {
                    label: "sessions",
                    data: sessions,
                    backgroundColor: "rgba(255, 255, 255,0.05)",
                    borderColor: "#2a2a2a",
                    borderWidth: 1,
                    borderRadius: 3,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: "#666", font: { family: "Courier New", size: 11 } }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#666", font: { family: "Courier New", size: 11}},
                    grid: { display: false }
                },
                y: {
                    position: "left",
                    min: 0,
                    max: 5,
                    ticks: { color: "#666", font: { family: "Courier New", size: 11}},
                    grid: { color: "1a1a1a"},
                    title: { display: true, text: "avg focus", color: "#444"}
                },
                y1: {
                    position: "right",
                    beingAtZero: true,
                    ticks: { color: "#666", font: { family: "Courier New", size: 11}},
                    grid: { display: false},
                    title: { display: true, text: "sessions", color: "#444"} 
                }
            }
        }
    })
}

function render(data) {
    let main = document.getElementById("insightsMain")
    main.innerHTML = 
        '<div class="page-header"><h1>insights</h1>' + 
        '<p class="subtitle">patterns from ' + data.total_sessions + ' sessions</p></div>' + 
        

        '<div class="insight-grid">' + 
            
            '<div class="insight-card">' +
                '<div class="insight-label">current streak</div>' +
                '<div class="insight-big">' + data.streak + '<span class="insight-unit">days</span></div>' + 
                '<div class="insight-sub">longest: ' + data.longest_streak + ' days</div>' +
            '</div>' + 

            '<div class="insight-card">' +
                'div class="insight-label">weekly average</div>' + 
                '<div class="insight-big">' + fmtTime(data.weekly_avg_minutes) + '</div' + 
                '<div class="insight-sub">across all weeks logged</div>' +
            '</div>' +

            '<div class="insight-card"' + 
                '<div class="insight-label">focus trend</div>' + 
                '<div class="insight-big">' +
                    (data.focus_trend > 0  ? "+" : "") + data.focus_trend +
                '</div>' +
                '<div class="insight-sub">' + trendArrow(data.focus_trend) + '</div>' + 
                '<div class="insight-sub" style="margin-top:0.2rem"' +
                    'early avg ' + data.early_avg_focus + ' → recent avg' + data.late_avg_focus + 
                '</div>' + 
            '</div>' + 

            '<div class="insight-card ' + (data.avoided_subject ? "warn" : "") + '">' + 
                '<div class="insight-label">most avoided</div>' +
                '<div class="insight-big" style="font-size:1.2rem">' +
                    (data.avoided_subject || "-") +
                '</div>' +
                '<div class="insight-sub">fewest sessions logged</div>' +
            '</div>' +

            '<div class="section">' +
                '<div class="section-label">best time of day</div>' +
                '<div class="card">' +
                    '<div class="best-time-label">you focus best in the <strong>' +
                        (data.best_time || "-") + '</strong></div>' +
                    '<canvas id="timeChart" height="120" style="margin-top:1.5rem"></canvas>' +
                '</div>' +
            '</div>' + 

            '<div class="section">' +
                '<div class="section-label">distraction patterns</div>' +
                '<div class="card">' +
                    (data.distractions.length == 0
                        ? '<div class="empty-state">no distractions logged - impressive or suspicious</div>'
                        : buildDistractionsHTML(data.distractions)
                    ) +
                '</div>' +
            '</div>'
    if (data.time_breakdown) {
        buildTimeChart(data.time_breakdown)
    }
}


function buildDistractionsHTML(distractions) {
    if (distractions.length == 0) return ""

    let max = distractions[0][1]
    let html = ""

    for (let i=0; i < distractions.length; i++) {
        let name = distractions[i][0]
        let count = distractions[i][1]
        let pct = Math.round((count / max) * 100)

        html += 
            '<div class="distraction-row">' +
                '<div class="distraction-name">' + name + '</div>' +
                '<div class="distraction-bar-wrap">' +
                    '<div class="distraction-bar" style="width:' + pct + '%"</div>' +
                '</div>' +
                '<div class="distraction-count">' + count + 'x</div>' +
            '</div>'
    }
    return html
}

async function loadInsights() {
    try {
        let res = await fetch(API + "/stats/insights")
        let data = await res.json()

        if (data.empty) {
            document.getElementById("insightsMain").innerHTML =
                '<div class="empty-state" style="margin-top:4rem">' +
                'log at least a few sessions to see insights</div>'
            return
        }

        render(data)

    } catch(e) {
        console.log("insights Failed", e)
        document.getElementById("insightsMain").innerHTML =
            '<div class="empty-state" style="margin-top:4rem">failed to load insights'
    }
}

document.addEventListener("DOMContentloaded", function() {
    loadInsights()
})