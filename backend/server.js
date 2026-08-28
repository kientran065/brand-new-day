const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "cart.json");

app.use(cors());
app.use(express.json());

// ---- Helper: đọc / ghi file JSON làm database tạm ----
function readCart() {
    if (!fs.existsSync(DB_FILE)) return [];
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return data ? JSON.parse(data) : [];
}

function writeCart(cart) {
    fs.writeFileSync(DB_FILE, JSON.stringify(cart, null, 2));
}

// ================== GET: lấy toàn bộ giỏ hàng ==================
app.get("/api/cart", (req, res) => {
    const cart = readCart();
    res.json(cart);
});

// ================== POST: thêm sản phẩm ==================
// Nếu sản phẩm (theo name) đã tồn tại -> cộng dồn số lượng
// Nếu chưa có -> tạo item mới với id riêng
app.post("/api/cart", (req, res) => {
    const { name, qty, price } = req.body;

    if (!name || !qty) {
        return res.status(400).json({ error: "Thiếu 'name' hoặc 'qty' trong body" });
    }

    const cart = readCart();
    const existing = cart.find(item => item.name === name);

    if (existing) {
        existing.qty += qty;
        if (price !== undefined) existing.price = price;
    } else {
        cart.push({
            id: Date.now().toString(),
            name,
            qty,
            price: price || 0
        });
    }

    writeCart(cart);
    res.status(201).json(cart);
});

// ================== PUT: cập nhật số lượng theo id ==================
app.put("/api/cart/:id", (req, res) => {
    const { id } = req.params;
    const { qty } = req.body;

    if (qty === undefined) {
        return res.status(400).json({ error: "Thiếu 'qty' trong body" });
    }

    const cart = readCart();
    const item = cart.find(i => i.id === id);

    if (!item) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm trong giỏ" });
    }

    if (qty <= 0) {
        // Số lượng <= 0 thì coi như xóa luôn item đó
        const filtered = cart.filter(i => i.id !== id);
        writeCart(filtered);
        return res.json(filtered);
    }

    item.qty = qty;
    writeCart(cart);
    res.json(cart);
});

// ================== DELETE: xóa 1 sản phẩm theo id ==================
app.delete("/api/cart/:id", (req, res) => {
    const { id } = req.params;
    const cart = readCart();
    const filtered = cart.filter(i => i.id !== id);

    if (filtered.length === cart.length) {
        return res.status(404).json({ error: "Không tìm thấy sản phẩm để xóa" });
    }

    writeCart(filtered);
    res.json(filtered);
});

// ================== DELETE: xóa toàn bộ giỏ hàng ==================
app.delete("/api/cart", (req, res) => {
    writeCart([]);
    res.json([]);
});

app.listen(PORT, () => {
    console.log(`✅ Cart API đang chạy tại http://localhost:${PORT}`);
});