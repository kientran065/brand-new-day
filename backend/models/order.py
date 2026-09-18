from datetime import datetime

from pydantic import BaseModel


class OrderItem(BaseModel):
    slug: str
    name: str
    price: float
    qty: int


class OrderCreate(BaseModel):
    user_id: str
    name: str
    email: str
    phone: str
    address: str = ""
    message: str = ""
    items: list[OrderItem]
    total: float


class Order(OrderCreate):
    id: str
    created_at: datetime
