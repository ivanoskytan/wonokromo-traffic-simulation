const staticNodes = {
  TL1: { x: 550, y: 480, label: "1", type: "TL", id: "1" },
  TL2: { x: 600, y: 400, label: "2", type: "TL", id: "2" },
  TL3: { x: 400, y: 220, label: "3", type: "TL", id: "3" },
  TL4: { x: 410, y: 310, label: "4", type: "TL", id: "4" },
  TL5: { x: 250, y: 240, label: "5", type: "TL", id: "5" },
  CrossA: { x: 470, y: 410, label: "A", type: "GATE" },
  CrossB: { x: 310, y: 170, label: "B", type: "GATE" },
};

const staticRoutes = [
  [{x: 800, y: 650}, {x: 550, y: 480}, {x: 470, y: 410}, {x: -50, y: 430}],
  [{x: 800, y: 650}, {x: 550, y: 480}, {x: 470, y: 410}, {x: 410, y: 310}, {x: 310, y: 170}, {x: 50, y: -50}],
  [{x: 850, y: 380}, {x: 600, y: 400}, {x: 470, y: 410}, {x: -50, y: 430}],
  [{x: 850, y: 380}, {x: 600, y: 400}, {x: 470, y: 410}, {x: 410, y: 310}, {x: 310, y: 170}, {x: 50, y: -50}],
  [{x: 150, y: -50}, {x: 310, y: 170}, {x: 400, y: 220}, {x: 420, y: 350}, {x: 800, y: 550}],
  [{x: -50, y: 260}, {x: 250, y: 240}, {x: 310, y: 170}, {x: 50, y: -50}]
];

let socket;
let clientVehicles = [];
let currentTrainProgress = 0;

let serverTLState = { 1: "RED", 2: "RED", 3: "RED", 4: "RED", 5: "RED" };
let serverGateClosed = false;
let serverTrainState = 0;

let s_volume, s_kereta, s_lampu, s_angkot, s_react;

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent("canvas-container");
  frameRate(60);

  s_volume = document.getElementById("sliderVolume");
  s_kereta = document.getElementById("sliderKereta");
  s_lampu = document.getElementById("sliderLampu");
  s_angkot = document.getElementById("sliderAngkot");
  s_react = document.getElementById("sliderReact");

  s_volume.oninput = () => (document.getElementById("valVolume").innerText = s_volume.value > 10 ? "Padat" : s_volume.value < 4 ? "Sepi" : "Sedang");
  s_kereta.oninput = () => (document.getElementById("valKereta").innerText = s_kereta.value < 400 ? "Sering" : s_kereta.value > 1000 ? "Jarang" : "Normal");
  s_lampu.oninput = () => (document.getElementById("valLampu").innerText = s_lampu.value + " tick");
  s_angkot.oninput = () => (document.getElementById("valAngkot").innerText = s_angkot.value + "%");

  s_react.oninput = () => {
    document.getElementById("valReact").innerText = parseFloat(s_react.value).toFixed(1) + " Detik";
  };

  socket = io();

  socket.on("simulation_response", (data) => {
    serverTLState = data.tl_state;
    serverGateClosed = data.gate_closed;
    serverTrainState = data.train_state;
    
    if (serverTrainState !== 2) {
      currentTrainProgress = data.train_progress;
    }

    let updatedVehicles = [];
    for (let sv of data.vehicles) {
      let match = clientVehicles.find(cv => cv.id === sv.id);
      
      if (match) {
        match.targetX = sv.x;
        match.targetY = sv.y;
        match.tx = sv.tx;
        match.ty = sv.ty;
        match.is_angkot = sv.is_angkot;
        match.is_parking = sv.is_parking;
        updatedVehicles.push(match);
      } else {
        updatedVehicles.push({
          id: sv.id,
          x: sv.x, y: sv.y,
          targetX: sv.x, targetY: sv.y,
          tx: sv.tx, ty: sv.ty,
          is_angkot: sv.is_angkot, 
          is_parking: sv.is_parking
        });
      }
    }
    clientVehicles = updatedVehicles;
  });
}

function draw() {
  background(11, 12, 16); 

  if (frameCount % 3 === 0 && socket.connected) {
    socket.emit("request_step", {
      volume: s_volume.value,
      kereta: s_kereta.value,
      lampu: s_lampu.value,
      angkot: s_angkot.value,
      reaction: s_react.value
    });
  }

  simulateLocally();

  drawInfrastructure();
  drawVehicles();
  drawTrain();
  drawLabels();
}

function simulateLocally() {
  for (let v of clientVehicles) {
    let distToTarget = dist(v.x, v.y, v.targetX, v.targetY);

    if (!v.is_parking && distToTarget > 1.5) {
      let hX = v.tx - v.x;
      let hY = v.ty - v.y;
      let d = sqrt(hX * hX + hY * hY);
      
      if (d > 2) {
        v.x += (hX / d) * 1.9;
        v.y += (hY / d) * 1.9;
      }
    }

    if (distToTarget < 2) {
      v.x = v.targetX;
      v.y = v.targetY;
    } else {
      v.x = lerp(v.x, v.targetX, 0.4);
      v.y = lerp(v.y, v.targetY, 0.4);
    }
  }

  if (serverTrainState === 2) {
    currentTrainProgress += 0.005;
    if (currentTrainProgress > 1) currentTrainProgress = 1;
  }
}

function drawInfrastructure() {
  // 1. Gambar Jalur Rel Kereta Api Modern
  strokeWeight(14); stroke(22, 26, 38);
  line(150, -50, 750, 850);
  
  // Garis bantalan rel internal baja
  strokeWeight(2); stroke(71, 85, 105);
  for (let i = 0; i <= 1; i += 0.015) {
    let px = lerp(150, 750, i);
    let py = lerp(-50, 850, i);
    let dx = 8 * cos(atan2(900, 600) + HALF_PI);
    let dy = 8 * sin(atan2(900, 600) + HALF_PI);
    line(px - dx, py - dy, px + dx, py + dy);
  }

  // 2. Gambar Jalan Raya (Sleek Dark Asphalt)
  noFill(); strokeWeight(26); stroke(30, 41, 59);
  for (let r of staticRoutes) {
    beginShape();
    for (let pt of r) vertex(pt.x, pt.y);
    endShape();
  }

  // Marka jalan putus-putus tengah (Dotted Centerline)
  strokeWeight(1.5); stroke(148, 163, 184, 120);
  canvas.getContext('2d').setLineDash([6, 12]);
  for (let r of staticRoutes) {
    beginShape();
    for (let pt of r) vertex(pt.x, pt.y);
    endShape();
  }
  canvas.getContext('2d').setLineDash([]); // Reset default line style

  // 3. Bangunan Stasiun Futuristik
  fill(30, 41, 59, 200); stroke(51, 65, 85); strokeWeight(1.5);
  rectMode(CORNER);
  rect(680, 490, 100, 90, 12);
  
  fill(56, 189, 248, 40); noStroke();
  rect(685, 495, 90, 30, 6);
  
  fill(148, 163, 184); fontName = "Inter"; textSize(11); textStyle(BOLD); textAlign(CENTER, CENTER);
  text("ST. WONOKROMO", 730, 510);
  textStyle(NORMAL);
}

function drawVehicles() {
  for (let v of clientVehicles) {
    let angle = atan2(v.ty - v.y, v.tx - v.x);
    
    // Deteksi status apakah kendaraan sedang berhenti total/mengantre
    let isStopping = dist(v.x, v.y, v.targetX, v.targetY) < 2.5;

    push();
    translate(v.x, v.y);
    rotate(angle);

    // Headlights (Efek Lampu Depan Menyala)
    noStroke(); fill(254, 240, 138, 70);
    triangle(10, 0, 35, -12, 35, 12);

    // Brake Lights (Lampu Rem Belakang Menyala Merah Saat Berhenti)
    if (isStopping || v.is_parking) {
      fill(239, 68, 68, 200);
      ellipse(-10, -3, 3, 3);
      ellipse(-10, 3, 3, 3);
    }

    // Warna Badan Mobil Premium Glossy
    if (v.is_angkot) {
      fill(v.is_parking ? color(249, 115, 22) : color(251, 191, 36));
      stroke(v.is_parking ? "#c2410c" : "#b45309");
    } else {
      fill(56, 189, 248);
      stroke(3, 105, 161);
    }

    strokeWeight(1.5); rectMode(CENTER);
    rect(0, 0, 20, 11, 4); // Desain sasis mobil melengkung elegan
    
    // Kaca Depan Gelap
    fill(15, 23, 42); noStroke();
    rect(4, 0, 4, 8, 1);
    rect(-4, 0, 3, 8, 1);
    pop();
  }
}

function drawTrain() {
  if (serverTrainState === 2) {
    let tx = lerp(100, 800, currentTrainProgress);
    let ty = lerp(-125, 925, currentTrainProgress);
    let angle = atan2(925 - -125, 800 - 100);

    push();
    translate(tx, ty);
    rotate(angle);
    
    // Bayangan Kereta Api
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.4)';
    
    // Badan utama lokomotif & gerbong baja merah bergaris
    fill(220, 38, 38); stroke(153, 27, 27); strokeWeight(2);
    rectMode(CENTER);
    rect(0, 0, 280, 18, 4);
    
    // Detil ventilasi atas gerbong
    drawingContext.shadowBlur = 0; // Reset shadow agar tidak berat
    fill(30, 41, 59); noStroke();
    for (let i = -120; i < 130; i += 24) {
      rect(i, 0, 14, 10, 2);
    }
    pop();
  }
}

function drawLabels() {
  for (let key in staticNodes) {
    let node = staticNodes[key];
    let isTL = node.type === "TL";
    let state = isTL ? serverTLState[node.id] : serverGateClosed ? "RED" : "WHITE";

    // Konfigurasi warna hex neon modern
    let glowColor = state === "RED" ? "#ef4444" : state === "GREEN" ? "#10b981" : "#f1f5f9";
    let strokeColor = state === "RED" ? "#991b1b" : state === "GREEN" ? "#065f46" : "#cbd5e1";

    // Berikan efek pancaran cahaya (Neon Bloom Effect) pada lampu lalu lintas
    drawingContext.shadowBlur = isTL ? 12 : 4;
    drawingContext.shadowColor = glowColor;

    fill(glowColor);
    stroke(strokeColor);
    strokeWeight(2);

    if (isTL) {
      ellipse(node.x, node.y, 22, 22);
    } else {
      rectMode(CENTER);
      rect(node.x, node.y, 22, 22, 5);
    }

    // Matikan efek pancaran sebelum menulis teks di dalam node
    drawingContext.shadowBlur = 0;
    fill(state === "WHITE" ? "#0f172a" : "#ffffff");
    noStroke(); textAlign(CENTER, CENTER); textSize(11); textStyle(BOLD);
    text(node.label, node.x, node.y + 0.5);
    textStyle(NORMAL);
  }
}