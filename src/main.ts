import "./style.css";

let isDrawing = false;

//class setup
class lineCommand {
  private points: { x: number; y: number }[] = [];
  constructor(x: number, y: number) {
    this.points.push({ x, y });
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (const point of this.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

//test
document.body.innerHTML = `
  <h1>Random Title</h1>
  <div class="container">
    <div class="toolbar">
      <button id="clear">Clear</button>
      <canvas id="canvas"></canvas>
      <button id="undo">Undo</button>
      <button id="redo">Redo</button>
    </div>
  </div>
`;

const undo = document.getElementById("undo") as HTMLButtonElement;
const redo = document.getElementById("redo") as HTMLButtonElement;
const redoStrokes: lineCommand[] = [];
const strokes: lineCommand[] = [];
const clear = document.getElementById("clear") as HTMLButtonElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

canvas.width = 256;
canvas.height = 256;

if (ctx === null) {
  throw new Error("Failed to get 2D context");
}

function drawingChanged() {
  const event = new CustomEvent("drawingChanged", { detail: strokes });
  canvas.dispatchEvent(event);
}
undo.addEventListener("click", () => {
  if (strokes.length > 0) {
    redoStrokes.push(strokes.pop()!);
    drawingChanged();
  }
});
redo.addEventListener("click", () => {
  if (redoStrokes.length > 0) {
    strokes.push(redoStrokes.pop()!);
    drawingChanged();
  }
});
function redraw() {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of strokes) {
    command.display(ctx!);
  }
}

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  const newStroke = new lineCommand(event.offsetX, event.offsetY);
  strokes.push(newStroke);
  drawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    const currentStroke = strokes[strokes.length - 1];
    currentStroke?.drag(event.offsetX, event.offsetY);
    drawingChanged();
  }
});
canvas.addEventListener("drawingChanged", () => {
  redraw();
});
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});
clear.addEventListener("click", () => {
  strokes.length = 0;
  drawingChanged();
});
