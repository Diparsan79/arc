// helpers

const API = "http://localhost:8000"

function showStatus(message, type) {
    const el = document.getElementById("status")
    el.techContent = message
    el.className = `status ${type}`
}

function hideStatus() {
    const el = document.getElementById("status")
    el.className = "status hidden"
}

// laod subjects into dropdown

async function loadSubjects() {
    try {
        const res = await fetch(`${API}/subjects`)
        const data = await res.json()

        const select = document.getElementById("subject")
        select.innerHTML = '<option value="">select a subject</option>'

        data.forEach(subject => {
            const option = document.createElement("option")
            option.value = subject.id
            option.textContent = subject.name
            select.appendChild(option)
        })
    } catch (err) {
        console.error("Failed to load subjects;", err)
    }
}

// fokus rating selector

function initFocusSelector() {
    const buttons = document.querySelectorAll(".focus-btn")

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("selected"))
            btn.classList.add("selected")

            document.getElementById("focusRating").value = btn.dataset.value
        })
    })
}

// save session

async function saveSession() {
    hideStatus()

    const subject_id = document.getElementById("subject").value
    const duration = document.getElementById("duration").value
    const focus_rating = document.getElementById("focusRating").value
    const notes = document.getElementById("notes").value
    const location = document.getElementById("location").value
    const distractions = document.getElementById("distractions").value

    if (!subject_id) {
        showStatus("please select a subject", "error")
        return
    }

    if (!duration || duration < 1 ) {
        showStatus("please enter a valid duration", "error")
        return
    }

    if (!focus_rating) {
        showStatus("please select a focus rating", "error")
        return
    }

    const saveBtn = document.getElementById("saveBtn")
    saveBtn.disabled = true
    saveBtn.textContent = "saving..."

    try {
        const res = await fetch(`${API}/sessions`, {
            method: "POST",
            body: JSON.stringify({
                subject_id: parseInt(subject_id),
                duration: parseInt(duration),
                focus_rating: parseInt(focus_rating),
                notes,
                location,
                distractions,
            })
        })

        const data = await res.json()
        console.log("Response", data)

        if (res.ok) {
            showStatus("session saved", "success")
        } else {
            showStatus(`error: ${JSON.stringify(data)}`, "error")
        }

    } catch (err) {
        showStatus(`failed: ${err.message}`, "error")
    } finally {
        saveBtn.disabled = false
        saveBtn.textContent = "save session"
    }
}


document.addEventListener("DOMContentLoaded", () => {
    loadSubjects()
    initFocusSelector()
    document.getElementById("saveBtn").addEventListener("click", saveSession)
})