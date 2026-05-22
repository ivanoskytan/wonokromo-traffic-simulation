from mesa import Model
from agents import VehicleAgent

import random

class TrafficModel(Model):
    def __init__(self):
        super().__init__()

        self.tl_phase = 1
        self.tl_timer = 150

        self.train_state = 0
        self.train_timer = 600
        self.train_progress = 0

        self.gate_closed = False

        self.spawn_rate = 0.06
        self.angkot_probability = 0.15

        self.routes = [
            [(800,650),(550,480),(470,410),(-50,430)],
            [(800,650),(550,480),(470,410),(410,310),(310,170),(50,-50)],
            [(850,380),(600,400),(470,410),(-50,430)],
            [(850,380),(600,400),(470,410),(410,310),(310,170),(50,-50)],
            [(150,-50),(310,170),(400,220),(420,350),(800,550)],
            [(-50,260),(250,240),(310,170),(50,-50)],
        ]

    def spawn_vehicle(self):
        if random.random() < self.spawn_rate:
            route_idx = random.randint(0, len(self.routes)-1)
        
            route = self.routes[route_idx]

            is_angkot = False

            if route_idx in [0, 1]:
                if random.random() < self.angkot_probability:
                    is_angkot = True

            agent = VehicleAgent(self, route, is_angkot)

    def update_traffic_lights(self):
        if self.gate_closed:
            return
        
        self.tl_timer -= 1

        if self.tl_timer <= 0:
            self.tl_phase = (
                self.tl_phase % 3
            ) + 1

            self.tl_timer = 150

    def update_train(self):
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
                self.train_progress = 0
        
        elif self.train_state == 2:
            self.train_state = 0
            self.gate_closed = False

            self.train_timer = random.randint(500, 1200)

    def step(self):
        self.spawn_vehicle()
        self.update_train()
        self.update_traffic_lights()

        self.agents.shuffle_do("step")

    def get_state(self):
        return {
            "vehicles": [
                a.serialize() for a in self.agents
            ],
            "train": {
                "state": self.train_state,
                "progress": self.train_progress
            },
            "gateClosed": self.gate_closed,
            "tlPhase": self.tl_phase
        }