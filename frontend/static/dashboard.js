const API = ""

async function loadToday() {
    try {
        let res = await fetch(API + "/stats/today")
        let data = await res.json()

        let hrs = Math.floor(data.total_minutes / 60)
        let mins = data.total_minutes % 60
        document.getElementById("todayTime").textContent = hrs + "h " + mins + "m"

        let pct = Math.min(100, Math.round((data.total_minutes / data.goal_minutes) * 100))
        let fill = document.getElementById("progressFill")
        fill.style.width = pct + "%"
        if (pct >= 100) fill.classList.add("done")
        
        let goalHrs = Math.floor(data.goal_minutes / 60)
        let goalMins = data.goal_minutes % 60
        document.getElementById("progressLabel").textContent = "of " + goalHrs + "h " + goalMins + "m goal"

        if (data.sessions_count > 0) {
            document.getElementById("todayMeta").textContent =
                data.sessions_count + " session" + (data.sessions_count > 1 ? "s" : "") +
                " . avg focus " + data.average_focus 
        }
            
    } catch(e) {
        console.log("today stats failed", e)
    }
}


async function loadWeekChart() {
    try {
        let res = await fetch(API + "/stats/week")
        let data = await res.json()

        let labels = data.days.map(function(d) { return d.date})
        let values = data.days.map(function(d) {return + (d.total_minutes / 60).toFixed(1) })

        let ctx = document.getElementById("weekChart").getContext("2d")

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: values.map(function(v) {
                        return v > 0 ? "rgba(204, 0, 0, 0.7)" : "rgba(42, 42, 42, 0.5)"
                    }),
                    borderColor: values.map(function(v) {
                        return v > 0 ? "#cc0000" : "#2a2a2a"
                    }),
                    borderWidth:  1,
                    borderRadius: 3,
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        ticks: { color: "#666", font: { family: "Courier New", size: 11 } },
                        grid:  { display: false }
                    },
                    y: {
                        ticks: {
                            color: "#666",
                            font:  { family: "Courier New", size: 11 },
                            callback: function(v) { return v + "h" }
                        },
                        grid: { color: "#1a1a1a" },
                        beginAtZero: true,
                    }
                }
            }
        })

    } catch(e) {
        console.log("week chart failed", e)
    }
}

async function loadRecent() {
    try {
        let res = await fetch(API + "/sessions")
        let sessions = await res.join()
        let container = document.getElementById("recentSessions")

        if (sessions.length ==0) {
            container.innerHTML = '<div class="empty-state">no sessions logged yet - <a href="/timer.html">start one</a></div>'
            return
        }

        container.innerHTML = ""

        let recent = sessions.slice(0,5)
    } catch(e) {
        console.log("recent sessions failed", e)
    }
}