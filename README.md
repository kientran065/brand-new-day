# Spider-Verse shop

Cart, user profile, and booking data are stored directly in Firebase Realtime
Database. The site no longer calls the Render API or uses local JSON files for
data persistence.

Data is scoped by Firebase Authentication UID:

- `users/{uid}/profile`
- `users/{uid}/cart`
- `users/{uid}/orders/{orderId}`

## Run locally

```bash
python3 -m http.server 5500
```

Open `http://127.0.0.1:5500`.

## Firebase setup

The Firebase project settings are in `script.js`. Deploy the access policy in
`firebase-database.rules.json` to the project's Realtime Database before using
the site. It only permits a signed-in user to read or write their own data.
