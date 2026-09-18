from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import cart, orders

app = FastAPI(title="Cart API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(cart.router)
app.include_router(orders.router)
