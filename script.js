const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let layouts = [];
let currentLayoutIndex = 0;
let buttons = [];
let textFields = [];
let counter = 0;
let iconCache = {};
let textValues = {}; // gemmer tekst i tekstfelter (som string eller array)

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

        // baggrund
        ctx.fillStyle = btn.type === "text" ? "#FFFFFF" : "#000000";
        ctx.fillRect(x, y, w, h);

        // kant
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // tekst
        const textToDraw =
            btn.type === "text" && btn.id && textValues[btn.id]
                ? (Array.isArray(textValues[btn.id]) ? textValues[btn.id].join("\n") : textValues[btn.id])
                : btn.text || "";

        if (btn.type !== "text") {
            // knapper: centreret tekst/ikon
            let textY = y + h / 2;
            if (btn.icon && iconCache[btn.icon]) {
                const img = iconCache[btn.icon];
                const iconSize = Math.min(w, h) * 0.4;
                ctx.drawImage(img, x + w / 2 - iconSize / 2, y + h / 2 - iconSize / 2 - 10, iconSize, iconSize);
                textY = y + h * 0.7;
            }

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 20px Helvetica";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(textToDraw, x + w / 2, textY);
        } else {
            // tekstfelter: venstre/top + flere linjer
            ctx.fillStyle = "#000000";
            ctx.font = "bold 18px Helvetica";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            const padding = 10;
            wrapText(ctx, textToDraw, x + padding, y + padding, w - 2 * padding, 22);
        }

        buttons.push({ ...btn, x, y, w, h });
        if (btn.type === "text") {
            textFields.push({ ...btn, x, y, w, h });
            if (btn.id && !textValues[btn.id]) {
                textValues[btn.id] = [btn.text];
            }
        }
    });
}

// ---------- Handle click ----------
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
            textValues[target] = [msg];
            drawLayout();
        }
    } else if (action === "append_text") {
        const target = btn.target;
        const msg = btn.message;
        if (target && msg) {
            if (!textValues[target]) textValues[target] = [];
            textValues[target].push(msg);

            // begræns til fx 15 linjer
            if (textValues[target].length > 15) {
                textValues[target].shift();
            }
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

        const valueArray = textValues[f.id] || [f.text || ""];
        const value = valueArray.join("\n");

        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px Helvetica";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const padding = 10;
        wrapText(ctx, value, f.x + padding, f.y + padding, f.w - 2 * padding, 22);
    });
}

// ---------- Tekstombrydning (multilinje) ----------
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const words = lines[i].split(" ");
        let line = "";
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + " ";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
        y += lineHeight;
    }
}

// ---------- Start ----------
loadLayouts();

