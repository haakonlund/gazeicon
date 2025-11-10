const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");

let layouts = [];           // Gem alle layout JSON
let currentLayoutIndex = 0; // Startlayout
let buttons = [];
let textFields = [];
let counter = 0;

// ------------------ Load JSON layouts ------------------
async function loadLayouts() {
    // Her kan du liste filnavne manuelt eller dynamisk
    const layoutFiles = ["layouts/layout1.json","layouts/layout2.json"];
    for(const file of layoutFiles){
        const res = await fetch(file);
        const json = await res.json();
        layouts.push(json);
    }
    drawLayout();
    setInterval(updateTextFields, 1000); // opdater hvert sekund
}

// ------------------ Tegn layout ------------------
function drawLayout(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    buttons = [];
    textFields = [];

    const layout = layouts[currentLayoutIndex];
    const rows = layout.rows;
    const cols = layout.cols;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    layout.buttons.forEach(btn=>{
        const r = btn.row;
        const c = btn.col;
        const span = btn.span || 1;
        const x = c*cellW;
        const y = r*cellH;
        const w = cellW*span;
        const h = cellH;

        ctx.fillStyle = btn.type === "text" ? "#CCE5FF" : "#DDDDDD";
        ctx.fillRect(x,y,w,h);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(x,y,w,h);

        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(btn.text,x+w/2,y+h/2);

        buttons.push({...btn,x,y,w,h});
        if(btn.type==="text"){
            textFields.push({...btn,x,y,w,h});
        }
    });
}

// ------------------ Klik-event ------------------
canvas.addEventListener("click",(e)=>{
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for(const btn of buttons){
        if(mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h){
            handleAction(btn.action);
            break;
        }
    }
});

// ------------------ Handle actions ------------------
function handleAction(action){
    if(!action) return;
    if(action==="next_layout"){
        currentLayoutIndex = (currentLayoutIndex + 1) % layouts.length;
        drawLayout();
    } else if(action==="prev_layout"){
        currentLayoutIndex = (currentLayoutIndex - 1 + layouts.length) % layouts.length;
        drawLayout();
    } else if(action==="quit"){
        alert("Afslutter...");
    }
}

// ------------------ Dynamisk tekstfelt ------------------
function updateTextFields(){
    counter++;
    textFields.forEach(f=>{
        // Clear felt
        ctx.fillStyle="#CCE5FF";
        ctx.fillRect(f.x,f.y,f.w,f.h);
        ctx.strokeStyle="#ffffff";
        ctx.lineWidth=2;
        ctx.strokeRect(f.x,f.y,f.w,f.h);

        // Tegn ny tekst
        ctx.fillStyle="black";
        ctx.font="18px Arial";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(`Live ${counter}`, f.x + f.w/2, f.y + f.h/2);
    });
}

// ------------------ Start ------------------
loadLayouts();
