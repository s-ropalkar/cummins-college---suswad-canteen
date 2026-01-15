// Shared JS for Suswaad Café site + All New Features
let cart = JSON.parse(localStorage.getItem("suswaad_cart") || "[]");

// Mobile menu toggle
function toggleNav() {
  const nav = document.getElementById("navLinks");
  nav.classList.toggle("show");
}

// Live Clock (8AM-5PM only)
function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const clockEl = document.getElementById("clock");
  if (clockEl) {
    if (hours >= 8 && hours < 17) {
      clockEl.textContent = `🕒 ${timeStr} (Open)`;
      clockEl.style.color = "#2d7a4b";
    } else {
      clockEl.textContent = `🕒 ${timeStr} (Closed)`;
      clockEl.style.color = "#b23a3a";
    }
  }
}

// Cart Functions
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = count || "";
}

function addToCart(itemId, name, price) {
  const existing = cart.find((item) => item.id === itemId);
  const stock = MENU_ITEMS.breakfast
    .concat(MENU_ITEMS.lunch, MENU_ITEMS.sandwiches, MENU_ITEMS.beverages)
    .find((item) => item.id === itemId)?.stock;

  if (!stock || stock <= 0) {
    showMessage("Item out of stock!", false);
    return;
  }

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: itemId, name, price, qty: 1 });
  }

  localStorage.setItem("suswaad_cart", JSON.stringify(cart));
  updateCartCount();
  showMessage(`${name} added to cart!`, true);
}

function renderCart() {
  const cartEl = document.getElementById("cartItems");
  if (!cartEl) return;

  if (cart.length === 0) {
    cartEl.innerHTML = '<p class="small">Your cart is empty</p>';
    return;
  }

  let total = 0;
  cartEl.innerHTML = cart
    .map((item) => {
      total += item.price * item.qty;
      return `
      <div class="cart-item">
        <div>${item.name}</div>
        <div>
          <button onclick="updateQty(${item.id}, -1)">-</button>
          <span>${item.qty}</span>
          <button onclick="updateQty(${item.id}, 1)">+</button>
          <span>₹${item.price * item.qty}</span>
          <button onclick="removeFromCart(${item.id})">×</button>
        </div>
      </div>
    `;
    })
    .join("");

  document.getElementById("cartTotal").textContent = `₹${total}`;
}

function updateQty(id, change) {
  const item = cart.find((item) => item.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + change);
    if (item.qty === 0) removeFromCart(id);
    localStorage.setItem("suswaad_cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

function removeFromCart(id) {
  cart = cart.filter((item) => item.id !== id);
  localStorage.setItem("suswaad_cart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Auto-cancel bookings after 10 mins
function checkBookings() {
  const bookings = JSON.parse(
    localStorage.getItem("suswaad_reservations") || "[]"
  );
  const now = Date.now();
  const validBookings = bookings.filter((booking) => {
    const age = now - new Date(booking.created).getTime();
    return age < 10 * 60 * 1000; // 10 minutes
  });
  localStorage.setItem("suswaad_reservations", JSON.stringify(validBookings));
}

// Original functions + enhancements
function showMessage(message, success = true) {
  const id = "suswaad-msg";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.style.cssText = `
      position:fixed; right:18px; bottom:18px; padding:12px 16px;
      border-radius:10px; box-shadow:0 8px 26px rgba(0,0,0,0.12);
      z-index:9999; color:#fff; font-weight:600; font-family: Poppins, sans-serif;
    `;
    document.body.appendChild(el);
  }
  el.style.background = success ? "#2d7a4b" : "#b23a3a";
  el.textContent = message;
  setTimeout(() => {
    if (el) el.remove();
  }, 3500);
}

function handleReserveForm(e) {
  e.preventDefault();
  checkBookings(); // Check expired bookings

  const form = e.target;
  const name = form.fullname.value.trim();
  const email = form.email.value.trim();
  const date = form.date.value.trim();
  const time = form.time.value.trim();

  const now = new Date();
  const selectedDate = new Date(date);
  const today = new Date().toDateString();
  const selectedDay = selectedDate.toDateString();

  // Canteen timing: 8AM-5PM
  const selectedHour = parseInt(time.split(":")[0]);
  if (selectedHour < 8 || selectedHour >= 17) {
    showMessage("Canteen open only 8AM-5PM", false);
    return;
  }

  if (selectedDay === today && now.getHours() >= 16) {
    showMessage("Cannot book after 4PM for today", false);
    return;
  }

  const entry = {
    name,
    email,
    date,
    time,
    message: form.message.value.trim(),
    created: new Date().toISOString(),
  };
  let array = JSON.parse(localStorage.getItem("suswaad_reservations") || "[]");
  array.push(entry);
  localStorage.setItem("suswaad_reservations", JSON.stringify(array));
  form.reset();
  showMessage(
    `Table booked for ${time}! Auto-cancels in 10 mins if not confirmed 😊`,
    true
  );
}

function handlePickForm(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.fullname.value.trim();
  const email = form.email.value.trim();
  const date = form.date.value.trim();
  const time = form.time.value.trim();
  const item = form.item.value;

  if (!name || !email || !date || !time || !item) {
    showMessage("Please fill all required fields", false);
    return;
  }

  const order = {
    name,
    email,
    date,
    time,
    item,
    created: new Date().toISOString(),
  };
  let arr = JSON.parse(localStorage.getItem("suswaad_preorders") || "[]");
  arr.push(order);
  localStorage.setItem("suswaad_preorders", JSON.stringify(arr));
  form.reset();
  showMessage(`"${item}" pre-booked for ${time}! ✅`, true);
}

// Menu search/filter
function filterMenu(query) {
  const items = document.querySelectorAll(".menu-item");
  const q = query.toLowerCase();
  items.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(q) ? "" : "none";
  });
}

// Render menu from JSON
function renderMenu(category = null) {
  const container = document.querySelector(".menu-items");
  if (!container) return;

  let items = [];
  if (category) {
    items = MENU_ITEMS[category] || [];
  } else {
    Object.values(MENU_ITEMS).forEach((cat) => items.push(...cat));
  }

  container.innerHTML = items
    .map((item) => {
      const outOfStock = item.stock <= 0;
      return `
      <div class="menu-item card" data-item-id="${item.id}">
        ${outOfStock ? '<div class="out-of-stock">Out of Stock</div>' : ""}
        <img src="${item.img}" alt="${item.name}">
        <div class="card-body">
          <div class="meta">
            <div>
              <div class="title">${item.name}</div>
              <div class="small">${item.desc}</div>
            </div>
            <div style="text-align:right;">
              <div class="price">₹${item.price}</div>
              <div class="rating">⭐ ${item.rating}</div>
            </div>
          </div>
          ${
            outOfStock
              ? ""
              : `<button class="btn add-to-cart" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">Add to Cart</button>`
          }
        </div>
      </div>
    `;
    })
    .join("");

  // Update stock from orders
  const preorders = JSON.parse(
    localStorage.getItem("suswaad_preorders") || "[]"
  );
  preorders.forEach((order) => {
    const menuItem = items.find((item) => item.name === order.item);
    if (menuItem) menuItem.stock = Math.max(0, menuItem.stock - 1);
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateClock();
  setInterval(updateClock, 1000);
  checkBookings();

  // Navigation highlighting
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (
      a.getAttribute("href") === path ||
      (a.getAttribute("href") === "index.html" && path === "")
    ) {
      a.classList.add("active");
    }
  });

  // Form listeners
  const reserveForm = document.getElementById("reserveForm");
  if (reserveForm) reserveForm.addEventListener("submit", handleReserveForm);

  const pickForm = document.getElementById("pickForm");
  if (pickForm) pickForm.addEventListener("submit", handlePickForm);

  // Render menu if on menu page
  if (document.querySelector(".menu-items")) {
    renderMenu();
  }

  // Render cart if on cart page
  if (document.getElementById("cartItems")) {
    renderCart();
  }

  // Search functionality
  const searchInput = document.getElementById("menuSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => filterMenu(e.target.value));
  }
});
