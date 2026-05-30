from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from model import TrafficModel

app = Flask(__name__, template_folder="templates")
app.config["SECRET_KEY"] = 'secret_wonokromo_key'
socketio = SocketIO(app, cors_allowed_origins="*")

traffic_model = TrafficModel()

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("request_step")
def handle_step(data):
    if data:
        traffic_model.volume_val = int(data.get("volume", traffic_model.volume_val))
        traffic_model.train_val = int(data.get("train", traffic_model.train_val))
        traffic_model.light_val = int(data.get("light", traffic_model.light_val))
        traffic_model.angkot_val = int(data.get("angkot", traffic_model.angkot_val))

        raw_seconds = float(data.get("reaction", 2.1))
        traffic_model.reaction_val = int(raw_seconds*20)

    traffic_model.step()

    agent_data = []
    for a in traffic_model.agents:
        target_node = a.route[a.t_idx] if a.t_idx < len(a.route) else None
        agent_data.append({
            "id": a.unique_id,
            "x": a.x,
            "y": a.y,
            "is_angkot": a.is_angkot,
            "is_parking": a.is_parking,
            "target_node": target_node,
            "tx": target_node["x"],
            "ty": target_node["y"],
        })

    emit("simulation_response", {
        "vehicles": agent_data,
        "tl_state": traffic_model.tl_state,
        "gate_closed": traffic_model.gate_closed,
        "train_state": traffic_model.train_state,
        "train_progress": traffic_model.train_progress
    })

if __name__ == "__main__":
    socketio.run(app, port=5000, debug=True)