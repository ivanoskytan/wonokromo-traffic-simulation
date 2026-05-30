from mesa import Model
from agent import VehicleAgent
from routes import ROUTES
import random

class TrafficModel(Model):
    def __init__(self):
        super().__init__()
        self.volume_val = 6
        self.train_val = 800
        self.light_val =  150
        self.angkot_val = 15
        self.tl_state = {"1": "RED", "2": "RED", "3": "RED", "4": "RED", "5": "RED"}
        self.tl_phase = 1
        self.tl_timer = 150
        self.gate_closed = False
        self.train_state = 0
        self.train_timer = 600
        self.train_progress = 0.0
        self.remove_queue = []

        # Convert 2.1s into ticks (2.1 * 20 = 42) as default value
        self.reaction_val = 42

    def step(self):
        spawn_rate = self.volume_val / 100.0
        if random.random() < spawn_rate:
            r = random.random()
            if r < 0.2: route_idx = 0
            elif r < 0.4: route_idx = 1
            elif r < 0.55: route_idx = 2
            elif r < 0.7: route_idx = 3
            elif r < 0.85: route_idx = 4
            else: route_idx = 5

            start_node = ROUTES[route_idx][0]
            occupied = any(((a.x - start_node["x"])**2 + (a.y - start_node["y"])**2)**0.5 < 20 for a in self.agents)

            if not occupied:
                is_angkot = False
                angkot_prob = self.angkot_val / 100.0
                if (route_idx in [0, 1]) and random.random() < angkot_prob:
                    is_angkot = True
                VehicleAgent(self, route_idx, is_angkot)
        
        if self.train_state == 0:
            self.train_timer -= 1
            if self.train_timer <= 0:
                self.train_state = 1
                self.train_timer = 80
                self.gate_closed = True
        elif self.train_state == 1:
            self.train_timer -= 1
            if self.train_timer <= 0:
                self.train_state = 2
                self.train_progress = 0.0
        elif self.train_state == 2:
            self.train_progress += 0.005
            if self.train_progress >= 1.0:
                self.train_state = 0
                self.gate_closed = False
                self.train_timer = self.train_val + random.randint(-100, 100)
        
        if self.gate_closed:
            for k in self.tl_state:
                self.tl_state[k] = "RED"
        else:
            self.tl_timer -= 1
            if self.tl_timer <= 0:
                self.tl_phase = (self.tl_phase % 3) + 1
                self.tl_timer = self.light_val
            
            for k in self.tl_state:
                self.tl_state[k] = "RED"
            if self.tl_phase == 1:
                self.tl_state["1"] = "GREEN"
                self.tl_state["2"] = "GREEN"
                self.tl_state["4"] = "GREEN"
            elif self.tl_phase == 2:    
                self.tl_state["3"] = "GREEN"
            elif self.tl_phase == 3:
                self.tl_state["5"] = "GREEN"
                self.tl_state["4"] = "GREEN"

        self.remove_queue.clear()
        for agent in list(self.agents):
            agent.step()
        for agent in self.remove_queue:
            agent.remove()