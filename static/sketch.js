let socket;

let simState = {
  vehicles: [],
  train: {},
};

function setup() {

  createCanvas(1000, 700);

  socket = new WebSocket(
    "ws://localhost:8000/ws"
  );

  socket.onmessage = (event) => {

    simState = JSON.parse(event.data);

  };
}

function draw() {

  background(35);

  drawRoads();

  drawVehicles();

  drawTrain();

  drawTrafficInfo();
}

function drawRoads() {

  strokeWeight(24);
  stroke(70);

  line(800,650,470,410);
  line(470,410,-50,430);

  line(850,380,470,410);

  line(470,410,310,170);

  line(150,-50,310,170);

  line(310,170,800,550);

  strokeWeight(12);
  stroke(20);

  line(150,-50,750,850);
}

function drawVehicles() {

  for (let v of simState.vehicles) {

    push();

    translate(v.x, v.y);

    rectMode(CENTER);

    if (v.isAngkot) {

      if (v.isParking) {
        fill(249,115,22);
      } else {
        fill(234,179,8);
      }

    } else {

      fill(59,130,246);

    }

    rect(0,0,18,10,3);

    pop();
  }
}

function drawTrain() {

  if (simState.train.state === 2) {

    let tx = lerp(
      100,
      800,
      simState.train.progress
    );

    let ty = lerp(
      -125,
      925,
      simState.train.progress
    );

    push();

    translate(tx, ty);

    rotate(atan2(
      925 + 125,
      800 - 100
    ));

    fill(220,38,38);

    rectMode(CENTER);

    rect(0,0,300,20);

    pop();
  }
}

function drawTrafficInfo() {

  fill(255);

  textSize(18);

  text(
    "Traffic Phase: " +
    simState.tlPhase,
    20,
    30
  );

  text(
    "Gate Closed: " +
    simState.gateClosed,
    20,
    60
  );

  text(
    "Vehicles: " +
    simState.vehicles.length,
    20,
    90
  );
}