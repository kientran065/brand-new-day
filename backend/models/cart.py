from pydantic import BaseModel
class CartItemIn(BaseModel):
    name: str
    qty: int
    price: float
class CartItemUpdate(BaseModel):
    qty: int
class CartItem(BaseModel):
    id: str
    name: str
    qty: int
    price: float