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

const points: { x: number; y: number }[] = [];
const clear = document.getElementById("clear") as HTMLButtonElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

canvas.width = 256;
canvas.height = 256;

if (ctx === null) {
  throw new Error("Failed to get 2D context");
}

function drawingChanged() {
  const event = new CustomEvent("drawingChanged", { detail: points });
  canvas.dispatchEvent(event);
}

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  const point = { x: event.offsetX, y: event.offsetY };
  points.push(point);
  drawingChanged();
  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    const point = { x: event.offsetX, y: event.offsetY };
    points.push(point);
    drawingChanged();
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }
});
canvas.addEventListener("drawingChanged", (e) => {
  const event = e as CustomEvent<{ x: number; y: number }[]>;
  console.log(event.detail);
});
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});
clear.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
