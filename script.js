const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let layouts = [];
let currentLayoutIndex = 0;
let buttons = [];
let textFields = [];
let counter = 0;
let iconCache = {};
let textValues = {}; // gemmer tekst i tekstfelter

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

// ---------- Draw layout ----------
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

        // baggrundsfarver
        if (btn.type === "text") {
            ctx.fillStyle = "#FFFFFF"; // hvid tekstfelt
        } else {
            ctx.fillStyle = "#000000"; // sort knap
        }
        ctx.fillRect(x, y, w, h);

        // ramme
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // find tekst (evt. opdateret)
        const textToDraw =
            btn.type === "text" && btn.id && textValues[btn.id]
                ? textValues[btn.id]
                : btn.text || "";

        // ikon + tekst centreres lodret
        let iconY = y + h / 2;
        let textY = y + h / 2;
        if (btn.icon && iconCache[btn.icon]) {
            iconY = y + h * 0.4;
            textY = y + h * 0.7;
        }

        // ikon
        if (btn.icon && iconCache[btn.icon]) {
            const img = iconCache[btn.icon];
            const iconSize = Math.min(w, h) * 0.4;
            ctx.drawImage(img, x + w / 2 - iconSize / 2, y + h / 2 - iconSize / 2 - 10, iconSize, iconSize);
        }

        // tekst
        ctx.fillStyle = btn.type === "text" ? "#000000" : "#FFFFFF";
        ctx.font = "bold 20px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textToDraw, x + w / 2, textY);

        buttons.push({ ...btn, x, y, w, h });
        if (btn.type === "text") {
            textFields.push({ ...btn, x, y, w, h });
            if (btn.id && !textValues[btn.id]) {
                textValues[btn.id] = btn.text;
            }
        }
    });
}

// ---------- Click handler ----------
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const btn of buttons) {
        if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
            handleAction(btn);
            break;
        }
    }
});

// ---------- Handle actions ----------
function handleAction(btn) {
    const action = btn.action;
    if (!action) return;

    if (action === "next_layout") {
        currentLayoutIndex = (currentLayoutIndex + 1) % layouts.length;
        drawLayout();
    } else if (action === "prev_layout") {
        currentLayoutIndex = (currentLayoutIndex - 1 + layouts.length) % layouts.length;
        drawLayout();
    } else if (action === "quit") {
        alert("Afslutter...");
    } else if (action === "update_text") {
        const target = btn.target;
        const msg = btn.message;
        if (target && msg) {
            textValues[target] = msg;
            drawLayout();
        }
    }
}

// ---------- Update dynamic text fields ----------
function updateTextFields() {
    counter++;
    textFields.forEach(f => {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(f.x, f.y, f.w, f.h);

        const value = textValues[f.id] || f.text || "";
        ctx.fillStyle = "#000000";
        ctx.font = "bold 20px Helvetica";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(value, f.x + f.w / 2, f.y + f.h / 2);
    });
}

// ---------- Start ----------
loadLayouts();
