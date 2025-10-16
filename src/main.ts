import "./style.css";

let isDrawing = false;

document.body.innerHTML = `
  <h1>Random Title</h1>
  <div class="container">
    <div class="toolbar">
      <button id="clear">Clear</button>
      <canvas id="canvas"></canvas>
    </div>
  </div>
`;

const strokes: { x: number; y: number }[][] = [];
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

function redraw() {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    ctx?.beginPath();
    ctx?.moveTo(stroke[0]!.x, stroke[0]!.y);
    for (const point of stroke.slice(1)) {
      ctx?.lineTo(point.x, point.y);
    }
    ctx?.stroke();
  }
}

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  strokes.push([{ x: event.offsetX, y: event.offsetY }]);
  drawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    const currentStroke = strokes[strokes.length - 1];
    currentStroke?.push({ x: event.offsetX, y: event.offsetY });
    drawingChanged();
  }
});
canvas.addEventListener("drawingChanged", (e) => {
  redraw();
  const event = e as CustomEvent<{ x: number; y: number }[]>;
  console.log(event.detail);
});
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});
clear.addEventListener("click", () => {
  strokes.length = 0;
  drawingChanged();
});
