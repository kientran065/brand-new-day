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
        addToCart(cartIcon.dataset.name, qty, parseFloat(cartIcon.dataset.price))
            .catch(() => alert("Không thể lưu giỏ hàng. Vui lòng thử lại."));
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

// ================== FIREBASE: AUTHENTICATION & DATABASE ==================
const firebaseConfig = {
    apiKey: "AIzaSyDGATweoKsqIJHldK2I8pr1q9iT24RbkYE",
    authDomain: "brandnewday-76f45.firebaseapp.com",
    projectId: "brandnewday-76f45",
    storageBucket: "brandnewday-76f45.firebasestorage.app",
    messagingSenderId: "123888001540",
    appId: "1:123888001540:web:89162d8308b122699fcb51",
    measurementId: "G-85DT28XCNF",
    databaseURL: "https://brandnewday-76f45-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
let currentUser = null;

// ================== CART (Firebase Realtime Database) ==================
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

// Cart của khách chỉ ở bộ nhớ tạm; khi đăng nhập, cart được lưu tại users/{uid}/cart.
let cart = [];

function normaliseCart(value) {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : Object.values(value);
}

async function saveCartToFirebase() {
    if (!currentUser) return;
    try {
        await db.ref(`users/${currentUser.uid}/cart`).set(cart);
    } catch (err) {
        console.error("Không thể lưu giỏ hàng vào Firebase:", err);
        throw err;
    }
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

// Giỏ hàng được cập nhật cục bộ trước rồi ghi trực tiếp vào Firebase.
async function addToCart(name, qty, price) {
    const finalPrice = (price === undefined || price === null || isNaN(price)) ? (PRICE_MAP[name] || 0) : price;
    const existing = cart.find(item => item.name === name && item.price === finalPrice);
    if (existing) existing.qty += qty;
    else cart.push({
        id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        name,
        qty,
        price: finalPrice
    });
    renderCart();
    await saveCartToFirebase();
}

async function updateQty(id, qty) {
    if (qty <= 0) cart = cart.filter(item => item.id !== id);
    else {
        const item = cart.find(item => item.id === id);
        if (item) item.qty = qty;
    }
    renderCart();
    await saveCartToFirebase();
}

async function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
    await saveCartToFirebase();
}

async function clearCart() {
    cart = [];
    renderCart();
    await saveCartToFirebase();
}

// Tăng/giảm/xóa sản phẩm trong giỏ.
cartItemsEl.addEventListener("click", (e) => {
    const minusBtn = e.target.closest(".cart-minus");
    const plusBtn = e.target.closest(".cart-plus");
    const removeBtn = e.target.closest(".cart-item-remove");
    if (!minusBtn && !plusBtn && !removeBtn) return;

    const id = (minusBtn || plusBtn || removeBtn).dataset.id;
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (minusBtn) {
        updateQty(id, item.qty - 1).catch(() => alert("Không thể cập nhật giỏ hàng."));
    } else if (plusBtn) {
        updateQty(id, item.qty + 1).catch(() => alert("Không thể cập nhật giỏ hàng."));
    } else if (removeBtn) {
        removeFromCart(id).catch(() => alert("Không thể cập nhật giỏ hàng."));
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
    clearCart().catch(() => alert("Không thể xóa giỏ hàng."));
});

const navAuth = document.getElementById("navAuth");
const authLabel = document.getElementById("authLabel");
const authOverlay = document.getElementById("authOverlay");
const authSection = document.getElementById("authSection");
const closeAuthBtn = document.getElementById("closeAuth");
const authForm = document.getElementById("authForm");
const authEmailInput = document.getElementById("AuthEmail");
const authPasswordInput = document.getElementById("AuthPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authMsg = document.getElementById("authMsg");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const forgotPasswordWrap = document.getElementById("forgotPasswordWrap");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

let authMode = "login"; // "login" | "register"

function setAuthMode(mode) {
    authMode = mode;
    authMsg.innerText = "";
    if (mode === "login") {
        tabLogin.classList.add("border-red-600", "text-red-600");
        tabLogin.classList.remove("border-transparent", "text-gray-400");
        tabRegister.classList.add("border-transparent", "text-gray-400");
        tabRegister.classList.remove("border-red-600", "text-red-600");
        authSubmitBtn.innerText = "Đăng nhập";
        forgotPasswordWrap.classList.remove("hidden");
    } else {
        tabRegister.classList.add("border-red-600", "text-red-600");
        tabRegister.classList.remove("border-transparent", "text-gray-400");
        tabLogin.classList.add("border-transparent", "text-gray-400");
        tabLogin.classList.remove("border-red-600", "text-red-600");
        authSubmitBtn.innerText = "Đăng ký";
        forgotPasswordWrap.classList.add("hidden"); // Đăng ký thì không cần quên mật khẩu
    }
}
function openAuthModal(mode = "login") {
    authOverlay.classList.remove("hidden");
    authSection.classList.remove("hidden");

    setAuthMode(mode);
}

function closeAuthModal() {
    authOverlay.classList.add("hidden");
    authSection.classList.add("hidden");

    authMsg.innerText = "";
    authMsg.classList.remove("text-green-600");
    authMsg.classList.add("text-red-600");
    authForm.reset();
}
// Bấm vào icon user: chưa đăng nhập -> mở modal; đã đăng nhập -> hỏi đăng xuất
navAuth.addEventListener("click", () => {
    if (currentUser) {
        if (confirm(`Đăng xuất tài khoản ${currentUser.email}?`)) {
            auth.signOut();
        }
    } else {
        openAuthModal("login");
    }
});
closeAuthBtn.addEventListener("click", closeAuthModal);
authOverlay.addEventListener("click", closeAuthModal);
tabLogin.addEventListener("click", () => setAuthMode("login"));
tabRegister.addEventListener("click", () => setAuthMode("register"));
const googleSignInBtn = document.getElementById("googleSignInBtn");

googleSignInBtn.addEventListener("click", async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();

        await auth.signInWithPopup(provider);

        closeAuthModal();

    } catch (error) {
        console.error(error);
        authMsg.innerText = translateAuthError(error.code);
    }
});
// Dịch mã lỗi Firebase sang thông báo tiếng Việt dễ hiểu
function translateAuthError(code) {
    const map = {
        "auth/email-already-in-use": "Email này đã được đăng ký.",
        "auth/invalid-email": "Email không đúng định dạng.",
        "auth/weak-password": "Mật khẩu phải có ít nhất 6 ký tự.",
        "auth/user-not-found": "Tài khoản không tồn tại.",
        "auth/wrong-password": "Sai mật khẩu.",
        "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
        "auth/too-many-requests": "Bạn thử sai quá nhiều lần, vui lòng thử lại sau."
    };
    return map[code] || "Đã có lỗi xảy ra, vui lòng thử lại.";
}

// Quên mật khẩu: gửi email đặt lại mật khẩu qua Firebase
forgotPasswordLink.addEventListener("click", async () => {
    authMsg.classList.remove("text-red-600");
    authMsg.classList.remove("text-green-600");
    const email = authEmailInput.value.trim();

    if (!email) {
        authMsg.classList.add("text-red-600");
        authMsg.innerText = "Vui lòng nhập email ở trên trước, sau đó bấm lại 'Quên mật khẩu?'";
        authEmailInput.focus();
        return;
    }

    forgotPasswordLink.style.pointerEvents = "none";
    forgotPasswordLink.innerText = "Đang gửi...";

    try {
        await auth.sendPasswordResetEmail(email);
        authMsg.classList.add("text-green-600");
        authMsg.innerText = `Đã gửi link đặt lại mật khẩu tới ${email}, vui lòng kiểm tra hộp thư (kể cả mục spam).`;
    } catch (err) {
        console.error("Lỗi gửi email đặt lại mật khẩu:", err);
        authMsg.classList.add("text-red-600");
        authMsg.innerText = translateAuthError(err.code);
    } finally {
        forgotPasswordLink.style.pointerEvents = "auto";
        forgotPasswordLink.innerText = "Quên mật khẩu?";
    }
});

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authMsg.classList.remove("text-green-600");
    authMsg.classList.add("text-red-600");
    authMsg.innerText = "";
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;

    if (!email) { authMsg.innerText = "Vui lòng nhập email"; return; }
    if (!password || password.length < 6) { authMsg.innerText = "Mật khẩu tối thiểu 6 ký tự"; return; }

    authSubmitBtn.disabled = true;
    try {
        if (authMode === "login") {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            await auth.createUserWithEmailAndPassword(email, password);
        }
        closeAuthModal();
    } catch (err) {
        console.error("Lỗi Firebase Auth:", err);
        authMsg.innerText = translateAuthError(err.code);
    } finally {
        authSubmitBtn.disabled = false;
    }
});

// Theo dõi trạng thái đăng nhập, tự động cập nhật giao diện header
auth.onAuthStateChanged(async (user) => {
    const guestCart = cart;
    currentUser = user;
    if (user) {
        authLabel.innerText = user.email.split("@")[0]; // hiện phần trước @ cho gọn
        navAuth.title = "Bấm để đăng xuất";

        // Lưu / cập nhật hồ sơ cơ bản của user trên Firebase (users/{uid}/profile)
        db.ref("users/" + user.uid + "/profile").update({
            email: user.email,
            lastLogin: new Date().toISOString()
        }).catch(err => console.error("Lỗi lưu hồ sơ user:", err));

        try {
            const snapshot = await db.ref(`users/${user.uid}/cart`).once("value");
            const savedCart = normaliseCart(snapshot.val());
            cart = savedCart.length ? savedCart : guestCart;
            if (!savedCart.length && guestCart.length) await saveCartToFirebase();
        } catch (err) {
            console.error("Không thể tải giỏ hàng từ Firebase:", err);
            cart = guestCart;
        }
        renderCart();
    } else {
        authLabel.innerText = "Login";
        navAuth.title = "Bấm để đăng nhập";
        cart = [];
        renderCart();
    }
});

// ================== BOOKING MODAL ==================
const bookingSection = document.getElementById("booking");
const bookingOverlay = document.getElementById("bookingOverlay");
const closeBookingBtn = document.getElementById("closeBooking");

function openBooking() {
    bookingSection.classList.add("show");
    bookingOverlay.classList.add("show");
    closeCart();
    if (currentUser) {
        document.getElementById("Mail").value = currentUser.email; // tự điền email tài khoản đang đăng nhập
    }
}
function closeBooking() {
    bookingSection.classList.remove("show");
    bookingOverlay.classList.remove("show");
}

// Bắt buộc đăng nhập, sau đó mới kiểm tra giỏ hàng trước khi mở form đặt vé
booking.addEventListener("click", () => {
    if (!currentUser) {
        alert("Vui lòng đăng nhập trước khi đặt hàng!");
        closeCart();
        openAuthModal("login");
        return;
    }
    if (cart.length === 0) {
        alert("Your shopping cart is empty. Please add products before placing your order!")
        return;
    }
    openBooking();
});
closeBookingBtn.addEventListener("click", closeBooking);
bookingOverlay.addEventListener("click", closeBooking);
// ================== FORM (lưu đơn hàng vào Firebase) ==================

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

// Chuyển tên sản phẩm thành slug (bỏ dấu, khoảng trắng -> gạch ngang, chữ thường)
function slugify(str) {
    return str
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    document.querySelectorAll(".error").forEach(el => el.innerText = "");
    document.querySelectorAll("input").forEach(el => el.classList.remove("error-input"));
    document.getElementById("successMsg").innerText = "";

    let isValid = true;
    FIELDS.forEach(field => {
        const input = document.getElementById(field.id);
        const result = field.validate(input.value);
        if (result !== true) {
            showError(input, result);
            isValid = false;
        }
    });

    if (!isValid) return;

    // Đảm bảo vẫn còn đăng nhập tại thời điểm gửi (phòng trường hợp bị đăng xuất giữa chừng)
    if (!currentUser) {
        alert("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
        closeBooking();
        openAuthModal("login");
        return;
    }

    // Mỗi đơn hàng được lưu riêng theo tài khoản ở users/{uid}/orders.
    const order = {
        user_id: currentUser.uid, // gắn đơn hàng với tài khoản Firebase đang đăng nhập
        name: document.getElementById("Name").value.trim(),
        email: document.getElementById("Mail").value.trim(),
        phone: document.getElementById("Phone").value.trim(),
        address: "", // form hiện chưa có ô Address
        message: document.getElementById("Content").value.trim(),
        items: cart.map(item => ({
            slug: slugify(item.name),
            name: item.name,
            price: item.price,
            qty: item.qty
        })),
        total: totalPrice()
    };

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.innerText = "Đang gửi...";

    try {
        const orderRef = db.ref(`users/${currentUser.uid}/orders`).push();
        await orderRef.set({
            ...order,
            id: orderRef.key,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log("Đơn hàng đã lưu trong Firebase:", orderRef.key);

        document.getElementById("successMsg").innerText = "Booking successfully!";
        form.reset();
        await clearCart(); // xóa giỏ hàng nội bộ sau khi đặt thành công
        setTimeout(closeBooking, 1500);
    } catch (err) {
        console.error("Lỗi POST /orders:", err);
        alert("Không thể gửi đơn hàng. Vui lòng kiểm tra kết nối và thử lại.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Complete";
    }
});
function showError(input, message) {
    input.classList.add("error-input");
    input.nextElementSibling.innerText = message;
}
// ================== SCROLL TOP ==================
const btn = document.getElementById("scrollTopBtn");
window.addEventListener("scroll", () => {
    btn.style.display = document.documentElement.scrollTop > 1 ? "block" : "none";
});
btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
