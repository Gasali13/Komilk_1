// ===== CONFIG =====
const WHATSAPP_NUMBER = "6281234567890"; // Ganti dengan nomor WA kamu

const PRODUCTS = [
  { id: "k1", name: "KOMILK Murni", price: 17000, image: "assets/prod_murni.png", desc: "Susu murni segar, creamy, dan alami tanpa campuran." },
  { id: "k2", name: "KOMILK Gula Aren", price: 17000, image: "assets/prod_gula_aren.png", desc: "Perpaduan susu segar dengan manis legit gula aren asli." },
  { id: "k3", name: "KOMILK Strawberry", price: 17000, image: "assets/prod_strawberry.png", desc: "Rasa strawberry manis asam yang menyegarkan." },
  { id: "k4", name: "KOMILK Matcha", price: 17000, image: "assets/prod_matcha.jpg", desc: "Aroma teh hijau Jepang premium yang menenangkan." },
  { id: "k5", name: "KOMILK Jahe", price: 17000, image: "assets/prod_jahe.jpg", desc: "Hangat dan sehat dengan ekstrak jahe alami." }
];

// ===== Utilities =====
const qs = sel => document.querySelector(sel);
const formatRupiah = n => 'Rp ' + Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// ===== State =====
let cart = {};
const CART_KEY = "komilk_cart_v2";

function loadCart(){
  try {
    const raw = localStorage.getItem(CART_KEY);
    cart = raw ? JSON.parse(raw) : {};
  } catch(e){ cart = {}; }
}
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

// ===== Render =====
function renderProducts(){
  const grid = qs("#productsGrid");
  if(!grid) return;
  grid.innerHTML = "";
  
  PRODUCTS.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="img-wrapper"><img class="product-thumb" src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="product-info">
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <div class="price">${formatRupiah(p.price)}</div>
          <button class="btn btn-add" data-id="${p.id}" data-action="add">+ Pesan</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ===== UI Updates =====
function updateCartUI(){
  const totalItems = Object.values(cart).reduce((s,q)=> s+q, 0);
  const countEl = qs("#cartCount");
  if(countEl) countEl.textContent = totalItems;
  
  const container = qs("#cartItems");
  const totalEl = qs("#cartTotal");
  if(!container || !totalEl) return;

  container.innerHTML = "";
  if(totalItems === 0){
    container.innerHTML = `<div class="empty-state">Keranjang kosong.<br>Pilih minumannya dulu kak!</div>`;
    totalEl.textContent = formatRupiah(0);
    return;
  }

  let grandTotal = 0;
  Object.keys(cart).forEach(pid => {
    const qty = cart[pid];
    const p = PRODUCTS.find(x => x.id === pid);
    if(!p) return;
    grandTotal += (p.price * qty);
    
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="cart-details">
        <div class="cart-name">${p.name}</div>
        <div class="cart-price">${formatRupiah(p.price)}</div>
      </div>
      <div class="qty-group">
        <button class="qty-btn dec" data-id="${pid}">-</button>
        <span>${qty}</span>
        <button class="qty-btn inc" data-id="${pid}">+</button>
      </div>
    `;
    container.appendChild(item);
  });
  totalEl.textContent = formatRupiah(grandTotal);
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
  const toast = qs("#toast");
  if(!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => { 
    toast.className = toast.className.replace("show", ""); 
  }, 3000);
}

// ===== Actions =====
function addToCart(pid, qty){
  if(!cart[pid]) cart[pid] = 0;
  cart[pid] += qty;
  if(cart[pid] <= 0) delete cart[pid];
  saveCart();
  updateCartUI();
  
  if(qty > 0) {
    const p = PRODUCTS.find(x => x.id === pid);
    showToast(`${p.name} masuk keranjang!`, 'success');
    const btn = qs("#openCartBtn");
    if(btn) {
      btn.classList.add("bump");
      setTimeout(()=> btn.classList.remove("bump"), 200);
    }
  }
}

function checkoutWA(){
  const items = Object.keys(cart);
  if(items.length === 0) return alert("Keranjang kosong!");
  
  let text = `Halo KOMILK, saya mau pesan:\n\n`;
  let total = 0;
  items.forEach(pid => {
    const p = PRODUCTS.find(x => x.id === pid);
    const qty = cart[pid];
    const subtotal = p.price * qty;
    total += subtotal;
    text += `- ${p.name} (${qty}x) : ${formatRupiah(subtotal)}\n`;
  });
  text += `\n*Total: ${formatRupiah(total)}*`;
  text += `\n\nNama Penerima: \nAlamat: `;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank");
}

// ===== Logic Modal Kustom =====
function triggerClearCart() {
  if(Object.keys(cart).length === 0) return; // Jangan muncul kalau kosong
  
  const modal = qs("#confirmModal");
  modal.classList.add("active"); // Munculkan Modal
}

function confirmClearCart() {
  cart = {}; 
  saveCart(); 
  updateCartUI();
  showToast("Keranjang telah dikosongkan", "warning");
  closeModal();
}

function closeModal() {
  const modal = qs("#confirmModal");
  modal.classList.remove("active");
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  loadCart(); renderProducts(); updateCartUI();
  
  // Event Delegation Produk
  const grid = qs("#productsGrid");
  if(grid) grid.addEventListener("click", e => {
    const btn = e.target.closest("button[data-action='add']");
    if(btn) addToCart(btn.dataset.id, 1);
  });

  // Event Delegation Keranjang
  const cartItems = qs("#cartItems");
  if(cartItems) cartItems.addEventListener("click", e => {
    const btn = e.target.closest(".qty-btn");
    if(!btn) return;
    const id = btn.dataset.id;
    if(btn.classList.contains("inc")) addToCart(id, 1);
    if(btn.classList.contains("dec")) addToCart(id, -1);
  });

  // Drawer
  const openBtn = qs("#openCartBtn");
  const closeBtn = qs("#closeCartBtn");
  const overlay = qs("#overlay");
  const drawer = qs("#cartDrawer");

  if(openBtn) openBtn.addEventListener("click", () => { drawer.classList.add("active"); overlay.classList.add("active"); });
  const closeDrawer = () => { drawer.classList.remove("active"); overlay.classList.remove("active"); };
  if(closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if(overlay) overlay.addEventListener("click", closeDrawer);
  
  // Checkout & Clear
  const checkoutBtn = qs("#checkoutBtn");
  if(checkoutBtn) checkoutBtn.addEventListener("click", checkoutWA);
  
  const clearBtn = qs("#clearCartBtn");
  if(clearBtn) clearBtn.addEventListener("click", triggerClearCart); // Ubah ke fungsi trigger baru

  // Modal Actions
  const cancelModalBtn = qs("#cancelModalBtn");
  const confirmModalBtn = qs("#confirmModalBtn");
  
  if(cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
  if(confirmModalBtn) confirmModalBtn.addEventListener("click", confirmClearCart);
});