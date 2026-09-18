import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, status

from ..models.order import Order, OrderCreate

router = APIRouter(prefix="/orders", tags=["orders"])
DB_FILE = Path(__file__).resolve().parent.parent / "orders.json"


def load_orders() -> list[Order]:
    if not DB_FILE.exists():
        return []
    with DB_FILE.open(encoding="utf-8") as file:
        return [Order.model_validate(item) for item in json.load(file)]


def save_orders(orders: list[Order]) -> None:
    temporary_file = DB_FILE.with_suffix(".tmp")
    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(
            [order.model_dump(mode="json") for order in orders],
            file,
            ensure_ascii=False,
            indent=2,
        )
        file.write("\n")
    temporary_file.replace(DB_FILE)


_orders: list[Order] = load_orders()


@router.get("/")
def get_orders():
    return _orders


@router.post("/", response_model=Order, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate):
    saved_order = Order(
        id=str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc),
        **order.model_dump(),
    )
    _orders.append(saved_order)
    save_orders(_orders)
    return saved_order
