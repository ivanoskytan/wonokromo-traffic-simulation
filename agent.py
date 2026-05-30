from mesa import Agent
from routes import ROUTES
import random

class VehicleAgent(Agent):
    def __init__(self, model, route_idx, is_angkot):
        super().__init__(model)
        self.route = ROUTES[route_idx]  
        self.t_idx = 1
        self.x = self.route[0]["x"]
        self.y = self.route[0]["y"]
        self.speed = random.uniform(1.5,2.2)
        self.is_angkot = is_angkot
        self.is_parking = False
        self.park_timer = 0

        self.current_must_stop = False
        self.reaction_counter = 0

    def step(self):
        if self.t_idx >= len(self.route):
            self.model.remove_queue.append(self)
            return
        
        if self.is_angkot:
            if 500 < self.y < 650 and not self.is_parking and self.park_timer == 0:
                if random.random() < 0.02:
                    self.is_parking = True
                    self.park_timer = random.randint(80, 200)
                
            if self.is_parking:
                self.park_timer -= 1
                if self.park_timer <= 0:
                    self.is_parking = False
                return
        
        target = self.route[self.t_idx]
        dx = target["x"] - self.x
        dy = target["y"] - self.y
        dist_to_target = (dx**2 + dy**2)**0.5
        perceived_stop = False

        if target["type"] == "TL":
            if self.model.tl_state[str(target["id"])] == "RED" and dist_to_target < 35:
                perceived_stop = True
            
        for other in self.model.agents:
            if other == self or other.t_idx >= len(other.route):
                continue
            d_to_other = ((self.x - other.x)**2 + (self.y - other.y)**2)**0.5
            if d_to_other < 25 and self.t_idx == other.t_idx:
                other_dx = target["x"] - other.x
                other_dy = target["y"] - other.y
                other_dist = (other_dx**2 + other_dy**2)**0.5
                if other.is_parking or other_dist < dist_to_target:
                    perceived_stop = True

        if perceived_stop != self.current_must_stop:
            self.reaction_counter += 1
            if self.reaction_counter >= self.model.reaction_val:
                self.current_must_stop = perceived_stop
                self.reaction_counter = 0
        else:
            self.reaction_counter = 0

        if not self.current_must_stop:
            if dist_to_target > self.speed:
                self.x += (dx / dist_to_target) * self.speed
                self.y += (dy / dist_to_target) * self.speed
            else:
                self.x = target["x"]
                self.y = target["y"]
                self.t_idx += 1
    