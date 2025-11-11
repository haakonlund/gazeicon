const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let layouts = [];
let currentLayoutIndex = 0;
let buttons = [];
let textFields = [];
let counter = 0;
let iconCache = {}; // gemmer allerede hentede ikoner

// ---------- Load all JSON layouts ----------
async function loadLayouts() {
    const layoutFiles = ["layouts/layout1.json", "layouts/layout2.json"];
    for (const file of layoutFiles) {
        const res = await fetch(file);
        const json = await res.json();
        layouts.push(json);
    }

    await preloadIcons();
    drawLayout();
    setInterval(updateTextFields, 1000);
}

// ---------- Preload all icons ----------
async function preloadIcons() {
    const iconNames = new Set();
    layouts.forEach(l =>
        l.buttons.forEach(b => {
            if (b.icon) iconNames.add(b.icon);
        })
    );

    const promises = [...iconNames].map(name => {
        return new Promise(resolve => {
            const img = new Image();
            img.src = `icons/${name}`;
            img.onload = () => {
                iconCache[name] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Kunne ikke loade ikon: ${name}`);
                resolve();
            };
        });
    });

    await Promise.all(promises);
}

// ---------- Draw the current layout ----------
function drawLayout() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    buttons = [];
    textFields = [];

    const layout = layouts[currentLayoutIndex];
    const rows = layout.rows;
    const cols = layout.cols;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    layout.buttons.forEach(btn => {
        const { row, col, span = 1 } = btn;
        const x = col * cellW;
        const y = row * cellH;
        const w = cellW * span;
        const h = cellH;

        // farvevalg: tekstfelter lyse, knapper sorte
        if (btn.type === "text") {
            ctx.fillStyle = "#3A3A3A"; // mørk grå for tekstfelter
        } else {
            ctx.fillStyle = "#000000"; // sort for knapper
        }
        ctx.fillRect(x, y, w, h);

        // hvid kant for kontrast
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // ikon
        if (btn.icon && iconCache[btn.icon]) {
            const img = iconCache[btn.icon];
            const iconSize = Math.min(w, h) * 0.4;
            ctx.drawImage(img, x + w / 2 - iconSize / 2, y + h / 2 - iconSize * 0.9, iconSize, iconSize);
        }

        // tekst (altid hvid)
        if (btn.text) {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 20px Helvetica";
            ctx.textAlign = "center";
            ctx.textBaseline = "center";
            ctx.fillText(btn.text, x + w / 2, y + h - 10);
        }

        buttons.push({ ...btn, x, y, w, h });
        if (btn.type === "text") textFields.push({ ...btn, x, y, w, h });
    });
}

// ---------- Handle click ----------
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const btn of buttons) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
            handleAction(btn.action);
            break;
        }
    }
});

// ---------- Handle actions ----------
function handleAction(action) {
    if (!action) return;
    if (action === "next_layout") {
        currentLayoutIndex = (currentLayoutIndex + 1) % layouts.length;
        drawLayout();
    } else if (action === "prev_layout") {
        currentLayoutIndex = (currentLayoutIndex - 1 + layouts.length) % layouts.length;
        drawLayout();
    } else if (action === "quit") {
        alert("Afslutter...");
    }
}

// ---------- Update text fields dynamically ----------
function updateTextFields() {
    counter++;
    textFields.forEach(f => {
        ctx.fillStyle = "#FFFFFF"; // hvid baggrund
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(f.x, f.y, f.w, f.h);

        ctx.fillStyle = "#3A3A3A";
        ctx.font = "bold 20px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`Live: ${counter}`, f.x + f.w / 2, f.y + f.h / 2);
    });
}

// ---------- Start ----------
loadLayouts();
