// ================== MENU TOGGLE ==================
const toggle = document.querySelector(".menu-toggle");
const menu = document.querySelector(".nav");
toggle.onclick = () => menu.classList.toggle("show");

// ================== DATA: POSTERS / MOVIES / PRODUCTS ==================
const POSTERS = ["poster1.png", "poster2.png", "poster3.png"];
const MOVIES = ["related movie1.png", "movie2.png", "movie3.png"];

const PRODUCTS = [
    {
        key: "Blind box",
        img: "product1.png",
        frontNote: "Click the card to order",
        title: "Blind box 6 characters in Spider-Man: Brand New Day",
        details: ["Height: 15cm", "Material: PVC"],
        price: 6,
        priceLabel: "Price: 6$/box"
    },
    {
        key: "Popcorn Bucket",
        img: "popcorn.png",
        title: "Spider-Man Popcorn Bucket",
        details: ["Height: 25cm", "Material: Plastic", "Volume: 1.5l"],
        price: 20,
        priceLabel: "Price: 20$ per one"
    },
    {
        key: "Ticket",
        img: "ticket.png",
        title: "Ticket for premiere show",
        details: ["Please give us your phone number and email<br>We will contact you to confirm soon"],
        price: 5,
        priceLabel: "Price: 5$ per one"
    },
    {
        key: "Lego",
        img: "product2.png",
        title: "Spider-Man vs Hulk<br>epic clash",
        details: ["Type: lego", "Material: Plastic"],
        price: 25,
        priceLabel: "Price: 25$ per one"
    },
    {
        key: "T-shirt",
        img: "t-shirt.jpeg",
        title: "Spider-Man: Brand New Day<br>t-shirt",
        details: ["Material: 100% cotton", "We will contact you to confirm size soon"],
        price: 10,
        priceLabel: "Price: 10$ per one"
    }
];

// Bảng giá lấy trực tiếp từ PRODUCTS, dùng để bù giá cho item cũ trong localStorage
const PRICE_MAP = Object.fromEntries(PRODUCTS.map(p => [p.key, p.price]));

// ================== RENDER: GALLERY & PRODUCTS 
function renderGallery(containerId, images) {
    document.getElementById(containerId).innerHTML = images
        .map(src => `<div class="poster-item"><img src="${src}"></div>`)
        .join("");
}

function renderProducts() {
    document.getElementById("productsContainer").innerHTML = PRODUCTS.map(p => `
        <div class="item">
            <div class="card-inner">
                <div class="front-card">
                    <img src="${p.img}">
                    ${p.frontNote ? `<p>${p.frontNote}</p>` : ""}
                </div>
                <div class="back-card">
                    <h3>${p.title}</h3>
                    ${p.details.map(d => `<p>${d}</p>`).join("")}
                    <h4>${p.priceLabel}</h4>
                    <div class="qty-selector" data-item="${p.key}">
                        <button type="button" class="qty-btn minus">-</button>
                        <input type="number" class="qty-input" value="1" min="1" max="99">
                        <button type="button" class="qty-btn plus">+</button>
                    </div>
                    <div class="cart-card">
                        <span>Add to your cart</span>
                        <i class="fa-solid fa-cart-shopping cart-icon" data-name="${p.key}" data-price="${p.price}"></i>
                    </div>
                </div>
            </div>
        </div>
    `).join("");
}

renderGallery("posterContainer", POSTERS);
renderGallery("relatedContainer", MOVIES);
renderProducts();

// ================== PRODUCT CARD: FLIP / QTY / ADD TO CART ==================
// Dùng event delegation trên container thay vì gắn listener cho từng thẻ
const productsContainer = document.getElementById("productsContainer");

productsContainer.addEventListener("click", (e) => {
    const qtySelector = e.target.closest(".qty-selector");
    const cartIcon = e.target.closest(".cart-icon");
    const item = e.target.closest(".item");

    if (qtySelector) {
        const input = qtySelector.querySelector(".qty-input");
        let val = parseInt(input.value) || 1;
        if (e.target.closest(".minus")) val = Math.max(1, val - 1);
        else if (e.target.closest(".plus")) val = Math.min(99, val + 1);
        input.value = val;
        return; // không lật thẻ khi thao tác số lượng
    }

    if (cartIcon) {
        const qty = parseInt(item.querySelector(".qty-input").value) || 1;
        addToCart(cartIcon.dataset.name, qty, parseFloat(cartIcon.dataset.price));
        openCart();
        return;
    }

    if (item) item.classList.toggle("active");
});

productsContainer.addEventListener("change", (e) => {
    if (!e.target.classList.contains("qty-input")) return;
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    e.target.value = val;
});

// ================== CART (API: GET/POST/PUT/DELETE) ==================
const API_URL = "http://localhost:3000/api/cart";

const cartCountEl = document.getElementById("cart-count");
const floatCartCountEl = document.getElementById("float-cart-count");
const cartItemsEl = document.getElementById("cartItems");
const cartEmptyEl = document.getElementById("cartEmpty");
const cartTotalEl = document.getElementById("cartTotal");
const cartTotalPriceEl = document.getElementById("cartTotalPrice");
const cartDropdown = document.getElementById("cartDropdown");
const cartOverlay = document.getElementById("cartOverlay");
const navCart = document.getElementById("navCart");
const closeCartBtn = document.getElementById("closeCart");
const clearCartBtn = document.getElementById("clearCart");
const booking = document.getElementById("Booking");

// cart = [{ id, name, qty, price }], luôn đồng bộ với dữ liệu trên server
let cart = [];

// ---- GET: lấy giỏ hàng từ server khi tải trang ----
async function fetchCart() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Không thể tải giỏ hàng");
        cart = await res.json();
    } catch (err) {
        console.error("Lỗi GET /api/cart:", err);
        cart = [];
    }
    renderCart();
}

function totalQty() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function totalPrice() {
    return cart.reduce((sum, item) => sum + item.qty * (item.price || 0), 0);
}

function updateCartCount() {
    const qty = totalQty();
    cartCountEl.innerText = qty;
    floatCartCountEl.innerText = qty;
}

function renderCart() {
    cartItemsEl.innerHTML = "";

    if (cart.length === 0) {
        cartItemsEl.appendChild(cartEmptyEl);
        cartEmptyEl.style.display = "block";
    } else {
        cart.forEach((item) => {
            const row = document.createElement("div");
            row.className = "cart-item";
            row.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>Số lượng: ${item.qty} &times; $${item.price || 0} = $${(item.qty * (item.price || 0)).toFixed(2)}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-minus" data-id="${item.id}">-</button>
                    <button class="cart-plus" data-id="${item.id}">+</button>
                    <button class="cart-item-remove" data-id="${item.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            cartItemsEl.appendChild(row);
        });
    }

    cartTotalEl.innerText = totalQty();
    cartTotalPriceEl.innerText = totalPrice().toFixed(2);
    updateCartCount();
}

// ---- POST: thêm sản phẩm vào giỏ ----
async function addToCart(name, qty, price) {
    const finalPrice = (price === undefined || price === null || isNaN(price)) ? (PRICE_MAP[name] || 0) : price;
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, qty, price: finalPrice })
        });
        if (!res.ok) throw new Error("Không thể thêm vào giỏ hàng");
        cart = await res.json();
        renderCart();
    } catch (err) {
        console.error("Lỗi POST /api/cart:", err);
        alert("Không thể thêm sản phẩm vào giỏ. Vui lòng kiểm tra server API.");
    }
}

// ---- PUT: cập nhật số lượng theo id ----
async function updateQty(id, qty) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qty })
        });
        if (!res.ok) throw new Error("Không thể cập nhật số lượng");
        cart = await res.json();
        renderCart();
    } catch (err) {
        console.error("Lỗi PUT /api/cart/:id:", err);
    }
}

// ---- DELETE: xóa 1 sản phẩm theo id ----
async function removeFromCart(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa sản phẩm");
        cart = await res.json();
        renderCart();
    } catch (err) {
        console.error("Lỗi DELETE /api/cart/:id:", err);
    }
}

// ---- DELETE: xóa toàn bộ giỏ hàng ----
async function clearCart() {
    try {
        const res = await fetch(API_URL, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa giỏ hàng");
        cart = await res.json();
        renderCart();
    } catch (err) {
        console.error("Lỗi DELETE /api/cart:", err);
    }
}

// Tăng/giảm/xóa sản phẩm trong giỏ (event delegation, gọi API tương ứng)
cartItemsEl.addEventListener("click", (e) => {
    const minusBtn = e.target.closest(".cart-minus");
    const plusBtn = e.target.closest(".cart-plus");
    const removeBtn = e.target.closest(".cart-item-remove");
    if (!minusBtn && !plusBtn && !removeBtn) return;

    const id = (minusBtn || plusBtn || removeBtn).dataset.id;
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (minusBtn) {
        updateQty(id, item.qty - 1); // server tự xóa nếu qty <= 0
    } else if (plusBtn) {
        updateQty(id, item.qty + 1);
    } else if (removeBtn) {
        removeFromCart(id);
    }
});

// Mở / đóng giỏ hàng
function openCart() {
    cartDropdown.classList.add("show");
    cartOverlay.classList.add("show");
}
function closeCart() {
    cartDropdown.classList.remove("show");
    cartOverlay.classList.remove("show");
}

navCart.addEventListener("click", openCart);
document.getElementById("floatCart").addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

clearCartBtn.addEventListener("click", () => {
    clearCart();
});

fetchCart(); // lấy giỏ hàng từ server khi load trang

// ================== BOOKING MODAL ==================
const bookingSection = document.getElementById("booking");
const bookingOverlay = document.getElementById("bookingOverlay");
const closeBookingBtn = document.getElementById("closeBooking");

function openBooking() {
    bookingSection.classList.add("show");
    bookingOverlay.classList.add("show");
    closeCart();
}
function closeBooking() {
    bookingSection.classList.remove("show");
    bookingOverlay.classList.remove("show");
}

// Chỉ mở form đặt vé khi giỏ hàng đã có sản phẩm
booking.addEventListener("click", () => {
    if (cart.length === 0) {
        alert("Your shopping cart is empty. Please add products before placing your order!")
        return;
    }
    openBooking();
});
closeBookingBtn.addEventListener("click", closeBooking);
bookingOverlay.addEventListener("click", closeBooking);
// ================== FORM ==================
const form = document.getElementById("myForm");
const FIELDS = [
    { id: "Name", validate: v => v.trim() === "" ? "Write your name" : true },
    { id: "Phone", validate: v => {
        if (v.trim() === "") return "Write your phone number";
        if(isNaN(v)) return "Wrong format number"
        if (v.length !== 10) return "Phone must have 10 numbers";
        
        return true;
    }},
    { id: "Mail", validate: v => {
        if (v.trim() === "") return "Write your email";
        if (!v.includes("@") || !v.includes(".")) return "Wrong format email";
        return true;
    }}
];

form.addEventListener("submit", function (e) {
    e.preventDefault();
    document.querySelectorAll(".error").forEach(el => el.innerText = "");
    document.querySelectorAll("input").forEach(el => el.classList.remove("error-input"));

    let isValid = true;
    FIELDS.forEach(field => {
        const input = document.getElementById(field.id);
        const result = field.validate(input.value);
        if (result !== true) {
            showError(input, result);
            isValid = false;
        }
    });

    if (isValid) {
        document.getElementById("successMsg").innerText = "Booking successfully!";
        form.reset();
    }
});
function showError(input, message) {
    input.classList.add("error-input");
    input.nextElementSibling.innerText = message;
}
// ================== SCROLL TOP ==================
const btn = document.getElementById("scrollTopBtn");
window.addEventListener("scroll", () => {
    btn.style.display = document.documentElement.scrollTop > 20 ? "block" : "none";
});
btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));