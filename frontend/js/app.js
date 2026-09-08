const API = "/api";
const $ = s => document.querySelector(s);

const state = {
  cart: JSON.parse(localStorage.getItem("novacart_cart") || "[]"),
  user: JSON.parse(localStorage.getItem("novacart_user") || "null"),
  token: localStorage.getItem("novacart_token")
};

function saveCart() {
  localStorage.setItem("novacart_cart", JSON.stringify(state.cart));
  updateCartCount();
}
function updateCartCount() {
  const el = $("#cartCount");
  if (el) el.textContent = state.cart.reduce((sum, x) => sum + x.quantity, 0);
}
function toast(message) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message; el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2200);
}
function money(n) { return `$${Number(n).toFixed(2)}`; }
function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}
async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
function setAuth(data) {
  state.token = data.token; state.user = data.user;
  localStorage.setItem("novacart_token", data.token);
  localStorage.setItem("novacart_user", JSON.stringify(data.user));
}
function clearAuth() {
  state.token = null; state.user = null;
  localStorage.removeItem("novacart_token"); localStorage.removeItem("novacart_user");
}
function setupHeader() {
  const login = $("#loginLink"), logout = $("#logoutBtn"), orders = $("#ordersLink");
  if (state.user) {
    login?.classList.add("hidden"); logout?.classList.remove("hidden"); orders?.classList.remove("hidden");
    logout?.addEventListener("click", () => { clearAuth(); location.href = "/"; });
  }
  updateCartCount();
}

async function loadProducts() {
  const grid = $("#productGrid"); if (!grid) return;
  const search = encodeURIComponent($("#search")?.value || "");
  const category = encodeURIComponent($("#category")?.value || "all");
  grid.innerHTML = `<div class="empty">Loading products...</div>`;
  try {
    const products = await api(`/products?search=${search}&category=${category}`);
    grid.innerHTML = products.length ? products.map(productCard).join("") : `<div class="empty">No products found.</div>`;
  } catch (e) { grid.innerHTML = `<div class="empty">${e.message}</div>`; }
}
function productCard(p) {
  return `<article class="product-card">
    <a href="/product.html?id=${p._id}"><img class="product-img" src="${p.image}" alt="${escapeHtml(p.name)}"></a>
    <div class="product-info"><div class="meta"><span class="category">${escapeHtml(p.category)}</span><span class="price">${money(p.price)}</span></div>
    <h3><a href="/product.html?id=${p._id}">${escapeHtml(p.name)}</a></h3>
    <div class="stock">${p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</div>
    <div class="product-actions"><a class="btn secondary" href="/product.html?id=${p._id}">Details</a><button class="btn primary" ${p.stock < 1 ? "disabled" : ""} onclick='addToCart(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Add</button></div></div></article>`;
}
async function initHome() {
  if (!$("#productGrid")) return;
  try {
    const cats = await api("/products/categories");
    $("#category").innerHTML = `<option value="all">All categories</option>` + cats.map(c => `<option>${escapeHtml(c)}</option>`).join("");
  } catch {}
  loadProducts();
  let timer;
  $("#search")?.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(loadProducts, 250); });
  $("#category")?.addEventListener("change", loadProducts);
}
function addToCart(p) {
  const existing = state.cart.find(x => x.productId === p._id);
  if (existing) {
    if (existing.quantity >= p.stock) return toast("Maximum available stock reached");
    existing.quantity++;
  } else state.cart.push({ productId: p._id, name: p.name, image: p.image, price: p.price, quantity: 1, stock: p.stock });
  saveCart(); toast("Added to cart");
}
async function initProduct() {
  const root = $("#productDetail"); if (!root) return;
  const id = new URLSearchParams(location.search).get("id");
  try {
    const p = await api(`/products/${id}`);
    root.innerHTML = `<img src="${p.image}" alt="${escapeHtml(p.name)}"><div class="detail-info"><span class="category">${escapeHtml(p.category)}</span><h1>${escapeHtml(p.name)}</h1><p>${escapeHtml(p.description)}</p><div class="price">${money(p.price)}</div><div class="stock">${p.stock} available</div><div class="quantity"><button id="minus">−</button><b id="qty">1</b><button id="plus">+</button></div><button id="addDetail" class="btn primary">Add to cart</button></div>`;
    let qty = 1; const qtyEl = $("#qty");
    $("#minus").onclick = () => { qty = Math.max(1, qty - 1); qtyEl.textContent = qty; };
    $("#plus").onclick = () => { qty = Math.min(p.stock, qty + 1); qtyEl.textContent = qty; };
    $("#addDetail").onclick = () => { for(let i=0;i<qty;i++) addToCart(p); };
  } catch(e) { root.innerHTML = `<div class="empty">${e.message}</div>`; }
}
function initCart() {
  const root = $("#cartView"); if (!root) return;
  renderCart();
}
function renderCart() {
  const root = $("#cartView"); if (!root) return;
  if (!state.cart.length) {
    root.innerHTML = `<div class="empty">Your cart is empty.<br><br><a class="btn primary" href="/">Start shopping</a></div>`;
    return;
  }
  const subtotal = state.cart.reduce((s,x) => s + x.price*x.quantity, 0);
  root.innerHTML = `<div class="cart-list">${state.cart.map((x,i) => `<div class="cart-row"><img src="${x.image}" alt=""><div><h3>${escapeHtml(x.name)}</h3><small>${money(x.price)} each</small><div class="qty"><button onclick="changeQty(${i},-1)">−</button><b>${x.quantity}</b><button onclick="changeQty(${i},1)">+</button><button class="link-button" onclick="removeItem(${i})">Remove</button></div></div><strong class="row-price">${money(x.price*x.quantity)}</strong></div>`).join("")}</div><aside class="summary"><h3>Summary</h3><div class="summary-line"><span>Subtotal</span><b>${money(subtotal)}</b></div><div class="summary-line"><span>Shipping</span><b>Free</b></div><div class="summary-line total"><span>Total</span><b>${money(subtotal)}</b></div><a class="btn primary full" href="/checkout.html">Checkout</a></aside>`;
}
function changeQty(i, delta) {
  const item = state.cart[i]; item.quantity += delta;
  if (item.quantity < 1) state.cart.splice(i,1);
  if (item.quantity > item.stock) item.quantity = item.stock;
  saveCart(); renderCart();
}
function removeItem(i) { state.cart.splice(i,1); saveCart(); renderCart(); }

async function initCheckout() {
  const form = $("#checkoutForm"); if (!form) return;
  if (!state.user) { location.href = "/login.html?next=/checkout.html"; return; }
  if (!state.cart.length) { location.href = "/cart.html"; return; }
  const total = state.cart.reduce((s,x) => s + x.price*x.quantity, 0);
  $("#checkoutSummary").innerHTML = `<h3>Order summary</h3>${state.cart.map(x => `<div class="summary-line"><span>${escapeHtml(x.name)} × ${x.quantity}</span><b>${money(x.price*x.quantity)}</b></div>`).join("")}<div class="summary-line total"><span>Total</span><b>${money(total)}</b></div>`;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button"); btn.disabled = true;
    $("#checkoutError").textContent = "";
    const data = Object.fromEntries(new FormData(form));
    try {
      const order = await api("/orders", { method:"POST", body: JSON.stringify({ items: state.cart.map(x => ({ productId:x.productId, quantity:x.quantity })), shippingAddress:data }) });
      state.cart = []; saveCart(); location.href = `/orders.html?success=${order._id}`;
    } catch(err) { $("#checkoutError").textContent = err.message; btn.disabled = false; }
  });
}
async function initOrders() {
  const root = $("#ordersView"); if (!root) return;
  if (!state.user) { root.innerHTML = `<div class="empty">Please <a href="/login.html">sign in</a> to view your orders.</div>`; return; }
  try {
    const orders = await api("/orders/mine");
    root.innerHTML = orders.length ? orders.map(o => `<article class="order"><div class="order-head"><div><b>Order #${String(o._id).slice(-8).toUpperCase()}</b><div class="order-items">${new Date(o.createdAt).toLocaleString()}</div></div><span class="status">${o.status}</span></div><div class="order-items">${o.items.map(i => `${escapeHtml(i.name)} × ${i.quantity}`).join(" · ")}</div><strong>Total: ${money(o.totalAmount)}</strong></article>`).join("") : `<div class="empty">No orders yet. <a href="/">Shop now →</a></div>`;
  } catch(e) { root.innerHTML = `<div class="empty">${e.message}</div>`; }
}
function initAuth() {
  $("#loginForm")?.addEventListener("submit", async e => {
    e.preventDefault(); const form=e.currentTarget, error=$("#loginError"); error.textContent="";
    try { setAuth(await api("/auth/login",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(form)))})); location.href=new URLSearchParams(location.search).get("next") || "/"; }
    catch(err){error.textContent=err.message;}
  });
  $("#registerForm")?.addEventListener("submit", async e => {
    e.preventDefault(); const form=e.currentTarget, error=$("#registerError"); error.textContent="";
    try { setAuth(await api("/auth/register",{method:"POST",body:JSON.stringify(Object.fromEntries(new FormData(form)))})); location.href="/"; }
    catch(err){error.textContent=err.message;}
  });
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }

setupHeader(); initHome(); initProduct(); initCart(); initCheckout(); initOrders(); initAuth();
