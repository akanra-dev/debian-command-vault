let commands = [];

function getCategories() {
    const cats = new Set(commands.map(c => c.category));
    return [...cats].sort();
}

function fillCategorySelects() {
    const cats = getCategories();
    for (const id of ["category-filter", "add-category"]) {
        const sel = document.getElementById(id);
        const val = sel.value;
        const isFilter = id === "category-filter";

        sel.innerHTML = "";
        if (isFilter) {
            const all = document.createElement("option");
            all.value = "all";
            all.textContent = "All Categories";
            sel.appendChild(all);
        }

        for (const c of cats) {
            const opt = document.createElement("option");
            opt.value = c;
            opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
            sel.appendChild(opt);
        }

        if (val && (isFilter || cats.includes(val))) {
            sel.value = val;
        }
    }
}

function badgeColor(category) {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 45%)`;
}

function renderCommands(list) {
    const container = document.getElementById("commands");
    const counter = document.getElementById("counter");

    counter.innerHTML = `Showing <b>${list.length}</b> of <b>${commands.length}</b> commands`;

    container.innerHTML = "";

    if (list.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.innerHTML = `
            <div class="empty-icon">🐧</div>
            <p>No commands found</p>
            <p>Try a different search or category.</p>
        `;
        container.appendChild(empty);
        return;
    }

    list.forEach(cmd => {
        const div = document.createElement("div");
        div.className = "command-card";

        const badge = document.createElement("span");
        badge.className = "category-badge";
        badge.textContent = cmd.category;
        badge.style.background = badgeColor(cmd.category);

        div.innerHTML = `
            <h3>
                ${cmd.name}
                <span class="card-actions">
                    <button class="copy-btn">Copy</button>
                    <button class="delete-btn">Delete</button>
                </span>
            </h3>
            <code>${cmd.command}</code>
            <p class="command-desc">${cmd.description}</p>
        `;

        div.querySelector("h3").prepend(badge);

        container.appendChild(div);

        const copyBtn = div.querySelector(".copy-btn");
        copyBtn.addEventListener("click", async () => {
            await navigator.clipboard.writeText(cmd.command);
            copyBtn.textContent = "Copied!";
            copyBtn.classList.add("copied");
            setTimeout(() => {
                copyBtn.textContent = "Copy";
                copyBtn.classList.remove("copied");
            }, 1200);
        });

        const deleteBtn = div.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
            if (!confirm(`Delete "${cmd.name}"?`)) return;

            const res = await fetch(`/api/commands/${cmd.id}`, { method: "DELETE" });

            if (res.ok) {
                commands = commands.filter(c => c.id !== cmd.id);
                fillCategorySelects();
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
        fillCategorySelects();
        applyFilters();
    } catch (error) {
        console.error(error);
    }
}

const searchInput = document.getElementById("search");
searchInput.addEventListener("input", applyFilters);

document.getElementById("category-filter").addEventListener("change", applyFilters);

document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
    if (e.key === "Escape" && document.activeElement === searchInput) {
        searchInput.blur();
    }
});

// Theme toggle
const themeButton = document.getElementById("theme-toggle");
const themeIcon = themeButton.querySelector(".theme-icon");
const themeLabel = themeButton.querySelector(".theme-label");

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeLabel.textContent = isDark ? "Light" : "Dark";
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    setTheme(true);
} else if (savedTheme === "light") {
    setTheme(false);
}

themeButton.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark-mode"));
});

// Add command form
const addForm = document.getElementById("add-form");
document.getElementById("show-add-form").addEventListener("click", () => {
    fillCategorySelects();
    addForm.classList.toggle("hidden");
});

document.getElementById("cancel-add").addEventListener("click", () => {
    addForm.classList.add("hidden");
});

document.getElementById("add-new-category").addEventListener("input", function () {
    const select = document.getElementById("add-category");
    if (this.value.trim()) {
        select.disabled = true;
        select.style.opacity = "0.5";
    } else {
        select.disabled = false;
        select.style.opacity = "1";
    }
});

document.getElementById("save-command").addEventListener("click", async () => {
    const name = document.getElementById("add-name").value.trim();
    const command = document.getElementById("add-command").value.trim();
    const description = document.getElementById("add-desc").value.trim();
    const newCat = document.getElementById("add-new-category").value.trim();
    let category = document.getElementById("add-category").value;

    if (newCat) {
        category = newCat.toLowerCase().replace(/\s+/g, "-");
    }

    if (!name || !command) {
        alert("Name and Command are required");
        return;
    }

    if (!category) {
        alert("Please select or type a category");
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
        fillCategorySelects();
        applyFilters();
        addForm.classList.add("hidden");
        document.getElementById("add-name").value = "";
        document.getElementById("add-command").value = "";
        document.getElementById("add-desc").value = "";
        document.getElementById("add-new-category").value = "";
        document.getElementById("add-category").disabled = false;
        document.getElementById("add-category").style.opacity = "1";
    } else {
        alert("Failed to add command");
    }
});

loadCommands();
