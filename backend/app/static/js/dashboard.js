const canvas = document.getElementById("pulseChart");
const sampleTime = document.getElementById("sample-time");
const context = canvas.getContext("2d", { alpha: false });

const maxSamples = 30;
const samples = [];
let socket = null;
let reconnectTimer = null;
let lastPaintAt = 0;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(320, Math.floor(rect.width * ratio));
  canvas.height = Math.max(180, Math.floor(rect.height * ratio));
  drawChart();
}

function pushSample(snapshot) {
  samples.push({
    time: new Date(),
    cpu: Number(snapshot.cpu || 0),
    memory: Number(snapshot.memory || 0),
  });

  while (samples.length > maxSamples) {
    samples.shift();
  }

  sampleTime.textContent = `${samples[samples.length - 1].time.toLocaleTimeString()} local`;
  requestPaint();
}

function requestPaint() {
  const now = performance.now();
  if (now - lastPaintAt < 900) {
    return;
  }

  lastPaintAt = now;
  window.requestAnimationFrame(drawChart);
}

function drawChart() {
  const width = canvas.width;
  const height = canvas.height;
  const padding = 28;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  context.fillStyle = "#06070d";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = padding + (plotHeight / 4) * index;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  drawSeries("cpu", "#4fe8ff", padding, plotWidth, plotHeight);
  drawSeries("memory", "#ff3df2", padding, plotWidth, plotHeight);
  drawLegend(width);
}

function drawSeries(key, color, padding, plotWidth, plotHeight) {
  if (samples.length < 2) {
    return;
  }

  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();

  samples.forEach((sample, index) => {
    const x = padding + (plotWidth * index) / (maxSamples - 1);
    const y = padding + plotHeight - (plotHeight * sample[key]) / 100;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();
}

function drawLegend(width) {
  context.font = "12px Consolas, monospace";
  context.fillStyle = "#4fe8ff";
  context.fillText("CPU", width - 118, 24);
  context.fillStyle = "#ff3df2";
  context.fillText("RAM", width - 68, 24);
}

function connectPulseSocket() {
  if (document.hidden) {
    return;
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocol}://${window.location.host}/ws/pulse`);

  socket.addEventListener("message", (event) => {
    pushSample(JSON.parse(event.data));
  });

  socket.addEventListener("close", scheduleReconnect);
  socket.addEventListener("error", () => socket?.close());
}

function scheduleReconnect() {
  socket = null;
  window.clearTimeout(reconnectTimer);
  if (!document.hidden) {
    reconnectTimer = window.setTimeout(connectPulseSocket, 3000);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    window.clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
    return;
  }

  connectPulseSocket();
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
connectPulseSocket();
