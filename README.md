# Spider-Verse Cart API

This project uses FastAPI as its only backend. The cart API is served at
`http://127.0.0.1:8000/cart`.
Cart data is persisted in `backend/cart.json`. Completed bookings, including the
customer details entered in the booking form, are persisted in
`backend/orders.json`. Passwords are never written to either file.

## Run locally

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m uvicorn backend.main:app --reload --port 8000
```

In a second terminal, serve the frontend:

```bash
python3 -m http.server 5500
```

Open `http://127.0.0.1:5500`. Interactive API documentation is at
`http://127.0.0.1:8000/docs`.

## Cart endpoints

- `GET /cart/`
- `POST /cart/`
- `PUT /cart/update/{item_id}`
- `DELETE /cart/remove/{item_id}`
- `DELETE /cart/clear`
- `PUT /cart/replace`
- `GET /orders/`
- `POST /orders/`
