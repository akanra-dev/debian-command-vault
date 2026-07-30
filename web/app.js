let commands = [];

function renderCommands(list) {
    const container = document.getElementById("commands");
    const counter = document.getElementById("counter");

    counter.textContent = `Showing ${list.length} of ${commands.length} commands`;

    container.innerHTML = "";

    list.forEach(cmd => {
        const div = document.createElement("div");
        div.className = "command-card";

        const badge = document.createElement("span");
        badge.className = "category-badge " + cmd.category;
        badge.textContent = cmd.category;

        div.innerHTML = `
            <h3>${cmd.name}</h3>
            <code>${cmd.command}</code>
            <button class="copy-btn">Copy</button>
            <button class="delete-btn" data-id="${cmd.id}">Delete</button>
            <p>${cmd.description}</p>
        `;

        div.querySelector("h3").prepend(badge);

        container.appendChild(div);

        const copyBtn = div.querySelector(".copy-btn");
        copyBtn.addEventListener("click", async () => {
            await navigator.clipboard.writeText(cmd.command);
            copyBtn.textContent = "Copied!";
            setTimeout(() => {
                copyBtn.textContent = "Copy";
            }, 1000);
        });

        const deleteBtn = div.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
            if (!confirm(`Delete "${cmd.name}"?`)) return;

            const res = await fetch(`/api/commands?id=${cmd.id}`, { method: "DELETE" });

            if (res.ok) {
                commands = commands.filter(c => c.id !== cmd.id);
                applyFilters();
            } else {
                alert("Failed to delete command");
            }
        });
    });
}

function applyFilters() {
    const keyword = document.getElementById("search").value.toLowerCase();
    const category = document.getElementById("category-filter").value;

    let filtered = commands;

    if (category !== "all") {
        filtered = filtered.filter(cmd => cmd.category === category);
    }

    if (keyword) {
        filtered = filtered.filter(cmd =>
            cmd.name.toLowerCase().includes(keyword) ||
            cmd.command.toLowerCase().includes(keyword) ||
            cmd.description.toLowerCase().includes(keyword)
        );
    }

    renderCommands(filtered);
}

async function loadCommands() {
    try {
        const response = await fetch("/api/commands");
        commands = await response.json();
        applyFilters();
    } catch (error) {
        console.error(error);
    }
}

document.getElementById("search").addEventListener("input", applyFilters);

document.getElementById("category-filter").addEventListener("change", applyFilters);

// Theme toggle
const themeButton = document.getElementById("theme-toggle");

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeButton.textContent = isDark ? "\u2600\uFE0F Light Mode" : "\uD83C\uDF19 Dark Mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    setTheme(true);
}

themeButton.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark-mode"));
});

// Add command form
const addForm = document.getElementById("add-form");
document.getElementById("show-add-form").addEventListener("click", () => {
    addForm.classList.toggle("hidden");
});

document.getElementById("cancel-add").addEventListener("click", () => {
    addForm.classList.add("hidden");
});

document.getElementById("save-command").addEventListener("click", async () => {
    const name = document.getElementById("add-name").value.trim();
    const command = document.getElementById("add-command").value.trim();
    const description = document.getElementById("add-desc").value.trim();
    const category = document.getElementById("add-category").value;

    if (!name || !command) {
        alert("Name and Command are required");
        return;
    }

    const res = await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, command, description, category })
    });

    if (res.ok) {
        const newCmd = await res.json();
        commands.push(newCmd);
        applyFilters();
        addForm.classList.add("hidden");
        document.getElementById("add-name").value = "";
        document.getElementById("add-command").value = "";
        document.getElementById("add-desc").value = "";
    } else {
        alert("Failed to add command");
    }
});

loadCommands();
