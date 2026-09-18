import json
import uuid
from pathlib import Path

from fastapi import APIRouter

from ..models.cart import CartItemIn, CartItem, CartItemUpdate

router = APIRouter(prefix="/cart", tags=["cart"])
DB_FILE = Path(__file__).resolve().parent.parent / "cart.json"


def load_cart() -> list[CartItem]:
    """Load the persisted cart, or start with an empty cart."""
    if not DB_FILE.exists():
        return []
    with DB_FILE.open(encoding="utf-8") as file:
        return [CartItem.model_validate(item) for item in json.load(file)]


def save_cart(items: list[CartItem]) -> None:
    """Persist changes atomically so cart.json is never partially written."""
    temporary_file = DB_FILE.with_suffix(".tmp")
    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(
            [item.model_dump() for item in items],
            file,
            ensure_ascii=False,
            indent=2,
        )
        file.write("\n")
    temporary_file.replace(DB_FILE)


_cart: list[CartItem] = load_cart()

@router.get("/")
def get_cart():
    return _cart

@router.post("/")
def add_to_cart(item: CartItemIn):
    for existing in _cart:
        if existing.name == item.name and existing.price == item.price:
            existing.qty += item.qty
            save_cart(_cart)
            return _cart
    _cart.append(CartItem(id=str(uuid.uuid4()), name=item.name, qty=item.qty, price=item.price))
    save_cart(_cart)
    return _cart

@router.put("/update/{item_id}")
def update_qty(item_id: str, body: CartItemUpdate):
    global _cart
    if body.qty <= 0:
        _cart = [i for i in _cart if i.id != item_id]
    else:
        for item in _cart:
            if item.id == item_id:
                item.qty = body.qty
                break
    save_cart(_cart)
    return _cart

@router.delete("/remove/{item_id}")
def remove_from_cart(item_id: str):
    global _cart
    _cart = [i for i in _cart if i.id != item_id]
    save_cart(_cart)
    return _cart

@router.delete("/clear")
def clear_cart():
    global _cart
    _cart = []
    save_cart(_cart)
    return _cart

@router.put("/replace")
def replace_cart(items: list[CartItem]):
    global _cart
    _cart = items
    save_cart(_cart)
    return _cart
