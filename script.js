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

// ================== CART (localStorage) ==================
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

// cart = [{ name, qty, price }]
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
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
        cart.forEach((item, index) => {
            const row = document.createElement("div");
            row.className = "cart-item";
            row.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>Số lượng: ${item.qty} &times; $${item.price || 0} = $${(item.qty * (item.price || 0)).toFixed(2)}</span>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-minus" data-index="${index}">-</button>
                    <button class="cart-plus" data-index="${index}">+</button>
                    <button class="cart-item-remove" data-index="${index}">
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

function addToCart(name, qty, price) {
    const finalPrice = (price === undefined || price === null || isNaN(price)) ? (PRICE_MAP[name] || 0) : price;
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty += qty;
        if (existing.price === undefined || existing.price === null || isNaN(existing.price)) {
            existing.price = finalPrice;
        }
    } else {
        cart.push({ name, qty, price: finalPrice });
    }
    saveCart();
    renderCart();
}

// Tăng/giảm/xóa sản phẩm trong giỏ (event delegation)
cartItemsEl.addEventListener("click", (e) => {
    const minusBtn = e.target.closest(".cart-minus");
    const plusBtn = e.target.closest(".cart-plus");
    const removeBtn = e.target.closest(".cart-item-remove");
    if (!minusBtn && !plusBtn && !removeBtn) return;

    const idx = (minusBtn || plusBtn || removeBtn).dataset.index;
    if (minusBtn) {
        cart[idx].qty -= 1;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
    } else if (plusBtn) {
        cart[idx].qty += 1;
    } else if (removeBtn) {
        cart.splice(idx, 1);
    }
    saveCart();
    renderCart();
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
    cart = [];
    saveCart();
    renderCart();
});

renderCart(); // khởi tạo giỏ hàng khi load trang

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