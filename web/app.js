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
            <p>${cmd.description}</p>
        `;

        container.appendChild(div);
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
