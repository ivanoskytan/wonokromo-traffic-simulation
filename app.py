from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.websockets import WebSocket

from fastapi.templating import Jinja2Templates
from fastapi.requests import Request    

import asyncio

from model import TrafficModel

app = FastAPI()

model = TrafficModel()

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        model.step()

        await websocket.send_json(model.get_state())

        await asyncio.sleep(0.1)    