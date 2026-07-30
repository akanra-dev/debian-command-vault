let commands = [];

function renderCommands(list) {
    const container = document.getElementById("commands");

    container.innerHTML = "";

    list.forEach(cmd => {
        const div = document.createElement("div");

        div.className = "command-card";

        div.innerHTML = `
            <h3>${cmd.name}</h3>

            <code>${cmd.command}</code>

            <button class="copy-btn">
                Copy
            </button>

            <p>${cmd.description}</p>
        `;

        container.appendChild(div);

        const button = div.querySelector(".copy-btn");

        button.addEventListener("click", async () => {
            await navigator.clipboard.writeText(cmd.command);

            button.textContent = "Copied!";

            setTimeout(() => {
                button.textContent = "Copy";
            }, 1000);
        });
    });
}

async function loadCommands() {
    try {
        const response = await fetch("/api/commands");

        commands = await response.json();

        renderCommands(commands);
    } catch (error) {
        console.error(error);
    }
}

const searchInput = document.getElementById("search");

searchInput.addEventListener("input", (event) => {
    const keyword = event.target.value.toLowerCase();

    const filtered = commands.filter(cmd =>
        cmd.name.toLowerCase().includes(keyword) ||
        cmd.command.toLowerCase().includes(keyword) ||
        cmd.description.toLowerCase().includes(keyword)
    );

    renderCommands(filtered);
});

loadCommands();

const themeButton = document.getElementById("theme-toggle");

function setTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);
    themeButton.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
    localStorage.setItem("theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    setTheme(true);
}

themeButton.addEventListener("click", () => {
    setTheme(!document.body.classList.contains("dark-mode"));
});

const categoryFilter = document.getElementById("category-filter");

categoryFilter.addEventListener("change", (event) => {
    const category = event.target.value;

    if (category === "all") {
        renderCommands(commands);
        return;
    }

    const filtered = commands.filter(
        cmd => cmd.category === category
    );

    renderCommands(filtered);
});
