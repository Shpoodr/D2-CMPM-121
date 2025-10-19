import "./style.css";

let isDrawing = false;

interface Command {
  draw(ctx: CanvasRenderingContext2D): void;
}

//class setup
class lineCommand {
  private points: { x: number; y: number }[] = [];
  private lineWidth: number;
  constructor(x: number, y: number, lineWidth: number) {
    this.points.push({ x, y });
    this.lineWidth = lineWidth;
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
  draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
    for (const point of this.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }
}

class ToolPreviewCommand implements Command {
  constructor(
    private x: number,
    private y: number,
    private lineWidth: number,
  ) {}
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

document.body.innerHTML = `
  <h1>Random Title</h1>
  <div class="container">
    <div class="toolbar">
      <button id="clear" class="actionButton">Clear</button>
      <button id="undo" class="actionButton">Undo</button>
      <button id="redo" class="actionButton">Redo</button>

      <button id="regButton" class="thicknessButton">Regular</button>
      <button id="ThinButton" class="thicknessButton">Thin</button>
      <button id="ThickButton" class="thicknessButton">Thick</button>
    </div>
    <canvas id="canvas"></canvas>
  </div>
`;

const clear = document.getElementById("clear") as HTMLButtonElement;
const undo = document.getElementById("undo") as HTMLButtonElement;
const redo = document.getElementById("redo") as HTMLButtonElement;
const regLine = document.getElementById("regButton") as HTMLButtonElement;
const thinLine = document.getElementById("ThinButton") as HTMLButtonElement;
const thickLine = document.getElementById("ThickButton") as HTMLButtonElement;

const redoStrokes: lineCommand[] = [];
const strokes: lineCommand[] = [];

let toolPreview: ToolPreviewCommand | null = null;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
let currentLineWidth = 3;

canvas.width = 320;
canvas.height = 320;

if (ctx === null) {
  throw new Error("Failed to get 2D context");
}

function drawingChanged() {
  redraw();
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
regLine.addEventListener("click", () => {
  currentLineWidth = 3;
  regLine.classList.add("active");
  thinLine.classList.remove("active");
  thickLine.classList.remove("active");
});
thinLine.addEventListener("click", () => {
  currentLineWidth = 1.5;
  thinLine.classList.add("active");
  thickLine.classList.remove("active");
  regLine.classList.remove("active");
});

thickLine.addEventListener("click", () => {
  currentLineWidth = 5.5;
  thickLine.classList.add("active");
  thinLine.classList.remove("active");
  regLine.classList.remove("active");
});
function redraw() {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of strokes) {
    command.draw(ctx!);
  }
  if (toolPreview) {
    toolPreview.draw(ctx!);
  }
}

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  toolPreview = null;
  const newStroke = new lineCommand(
    event.offsetX,
    event.offsetY,
    currentLineWidth,
  );
  strokes.push(newStroke);
  drawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    const currentStroke = strokes[strokes.length - 1];
    currentStroke?.drag(event.offsetX, event.offsetY);
    drawingChanged();
  } else {
    toolPreview = new ToolPreviewCommand(
      event.offsetX,
      event.offsetY,
      currentLineWidth,
    );
    drawingChanged();
  }
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  drawingChanged();
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
