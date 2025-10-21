import "./style.css";

interface Command {
  draw(ctx: CanvasRenderingContext2D): void;
}

interface DrawableCommand extends Command {
  drag(x: number, y: number): void;
}

const stickerData = '["😀", "⭐", "❤️"]';
const availableStickers: string[] = JSON.parse(stickerData);
let isDrawing = false;

//class setup
class lineCommand implements DrawableCommand {
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

class StickerPreviewCommand implements Command {
  constructor(private x: number, private y: number, private sticker: string) {}
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.font =
      "24px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.5;
    ctx.fillText(this.sticker, this.x, this.y);
    ctx.globalAlpha = 1.0;
  }
}

class DrawStickerCommand implements DrawableCommand {
  constructor(private x: number, private y: number, private sticker: string) {}
  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.font =
      "24px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.sticker, this.x, this.y);
  }
}
//html stuff
document.body.innerHTML = `
  <h1>Random Title</h1>
  <div class="container">
    <div class="toolbar">
      <button id="clear" class="actionButton">Clear</button>
      <button id="undo" class="actionButton">Undo</button>
      <button id="redo" class="actionButton">Redo</button>

      <button id="regButton" class="thicknessButton" data-width="3">Regular</button>
      <button id="ThinButton" class="thicknessButton" data-width="1.5">Thin</button>
      <button id="ThickButton" class="thicknessButton" data-width="5.5">Thick</button>
    </div>
    <div class="emoji-section">
      <button id="addSticker" class="actionButton">+</button>
    </div>
    <canvas id="canvas"></canvas>
    <button id="exportButton">Export</button>
  </div>
`;

//buttons / Elements
const clear = document.getElementById("clear") as HTMLButtonElement;
const undo = document.getElementById("undo") as HTMLButtonElement;
const redo = document.getElementById("redo") as HTMLButtonElement;
const allThicknessButtons = document.querySelectorAll(".thicknessButton");
const emojiSection = document.querySelector(".emoji-section") as HTMLDivElement;
const addStickerButton = document.getElementById(
  "addSticker",
) as HTMLButtonElement;
const exportButton = document.getElementById(
  "exportButton",
) as HTMLButtonElement;

//arrays of lines
const redoStrokes: DrawableCommand[] = [];
const strokes: DrawableCommand[] = [];

//state Variables
let currentTool = "marker";
let currentSticker = "😀";
let currentLineWidth = 3;
let toolPreview: Command | null = null;

//canvas setup
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
canvas.width = 320;
canvas.height = 320;

function addStickerButtonFunc(sticker: string) {
  const button = document.createElement("button");
  button.className = "stickerButton";
  button.dataset.sticker = sticker;
  button.textContent = sticker;

  button.addEventListener("click", () => {
    currentTool = "sticker";
    currentSticker = sticker;

    document.querySelectorAll(".stickerButton, .thicknessButton")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
  });
  emojiSection.appendChild(button);
  return button;
}

availableStickers.forEach(addStickerButtonFunc);

if (ctx === null) {
  throw new Error("Failed to get 2D context");
}

function redraw() {
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
  if (!ctx) return;
  for (const command of strokes) {
    command.draw(ctx!);
  }
  if (toolPreview) {
    toolPreview.draw(ctx!);
  }
}

allThicknessButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const clickedButton = button as HTMLButtonElement;
    const width = clickedButton.dataset.width;
    if (!width) return;
    currentLineWidth = parseFloat(width);
    currentTool = "marker";
    allThicknessButtons.forEach((btn) => btn.classList.remove("active"));
    clickedButton.classList.add("active");
  });
});

exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d");
  if (!exportCtx) return;

  const scaleFactor = exportCanvas.width / canvas.width;
  exportCtx.scale(scaleFactor, scaleFactor);

  for (const command of strokes) {
    command.draw(exportCtx);
  }

  const imageUrl = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "my-drawing.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

addStickerButton.addEventListener("click", () => {
  const newSticker = prompt("Enter a new Sticker:", "😀");
  if (newSticker) {
    const stickerChar = newSticker;
    const newButton = addStickerButtonFunc(stickerChar);
    newButton.click();
  }
});
undo.addEventListener("click", () => {
  if (strokes.length > 0) {
    redoStrokes.push(strokes.pop()!);
    redraw();
  }
});
redo.addEventListener("click", () => {
  if (redoStrokes.length > 0) {
    strokes.push(redoStrokes.pop()!);
    redraw();
  }
});

canvas.addEventListener("mousedown", (event) => {
  isDrawing = true;
  toolPreview = null;

  let newCommand: DrawableCommand;

  if (currentTool === "marker") {
    newCommand = new lineCommand(
      event.offsetX,
      event.offsetY,
      currentLineWidth,
    );
  } else {
    newCommand = new DrawStickerCommand(
      event.offsetX,
      event.offsetY,
      currentSticker,
    );
  }
  strokes.push(newCommand);
  redraw();
});

canvas.addEventListener("mousemove", (event) => {
  if (isDrawing) {
    const currentCommand = strokes[strokes.length - 1];
    currentCommand?.drag(event.offsetX, event.offsetY);
    redraw();
  } else {
    if (currentTool === "marker") {
      toolPreview = new ToolPreviewCommand(
        event.offsetX,
        event.offsetY,
        currentLineWidth,
      );
    } else {
      toolPreview = new StickerPreviewCommand(
        event.offsetX,
        event.offsetY,
        currentSticker,
      );
    }
    redraw();
  }
});

canvas.addEventListener("mouseleave", () => {
  toolPreview = null;
  redraw();
});
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});
clear.addEventListener("click", () => {
  strokes.length = 0;
  redraw();
});
