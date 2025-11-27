// ===== CONFIG =====
// Ganti nomor tujuan WhatsApp (format internasional tanpa +)
// contoh: "6281234567890"
const WHATSAPP_NUMBER = "62812YOURNUMBER";

// Produk contoh — sesuaikan nama, harga (angka), gambar (assets/)
const PRODUCTS = [
  { id: "p1", name: "KOMILK Original 250ml", price: 8000, image: "assets/prod_original.png", desc: "Susu segar original, lembut dan bergizi." },
  { id: "p2", name: "KOMILK Coklat 250ml", price: 9000, image: "assets/prod_coklat.png", desc: "Rasa coklat nikmat, favorit keluarga." },
  { id: "p3", name: "KOMILK Strawberry 250ml", price: 9000, image: "assets/prod_strawberry.png", desc: "Rasa strawberry segar." }
];

// ===== Utilities =====
const qs = sel => document.querySelector(sel);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const formatRupiah = n => {
  const num = Number(n || 0);
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ===== State =====
let cart = {}; // { productId: qty }
const CART_KEY = "komilk_cart_v2";
function loadCart(){
  try {
    const raw = localStorage.getItem(CART_KEY);
    if(raw) cart = JSON.parse(raw) || {};
  } catch(e){ cart = {}; }
}
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

// ===== Render products =====
function renderProducts(){
  const grid = qs("#productsGrid");
  grid.innerHTML = "";
  PRODUCTS.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <img class="product-thumb" src="${p.image}" alt="${escapeHtml(p.name)}" onerror="this.src='assets/placeholder.png'">
      <div class="product-info">
        <div class="product-title">${escapeHtml(p.name)}</div>
        <p class="product-desc">${escapeHtml(p.desc)}</p>
        <div class="product-row">
          <div class="price">${formatRupiah(p.price)}</div>
          <div class="card-actions">
            <button class="btn btn-ghost" data-id="${p.id}" data-action="quick">Lihat</button>
            <button class="btn btn-primary" data-id="${p.id}" data-action="add">Tambah</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ===== Cart UI =====
const cartDrawer = qs("#cartDrawer");
const overlay = qs("#overlay");
const cartCountEl = qs("#cartCount");
const cartItemsEl = qs("#cartItems");
const cartTotalEl = qs("#cartTotal");

function updateCartUI(){
  // count
  const totalItems = Object.values(cart).reduce((s,q)=> s+q,0);
  cartCountEl.textContent = totalItems;

  // render items
  cartItemsEl.innerHTML = "";
  if(totalItems === 0){
    cartItemsEl.innerHTML = `<p class="empty-note">Keranjang kosong — pilih produk dulu.</p>`;
    cartTotalEl.textContent = formatRupiah(0);
    return;
  }

  Object.keys(cart).forEach(pid => {
    const qty = cart[pid];
    const product = PRODUCTS.find(p => p.id === pid);
    if(!product) return;
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <img src="${product.image}" alt="${escapeHtml(product.name)}" onerror="this.src='assets/placeholder.png'">
      <div style="flex:1; min-width:0;">
        <div style="font-weight:800">${escapeHtml(product.name)}</div>
        <div style="font-size:13px; color:#6b7280">${formatRupiah(product.price)}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
        <div class="qty-controls">
          <button data-id="${product.id}" class="dec" aria-label="Kurangi">-</button>
          <div style="min-width:28px; text-align:center; font-weight:800">${qty}</div>
          <button data-id="${product.id}" class="inc" aria-label="Tambah">+</button>
        </div>
        <div style="font-weight:900; color:var(--primary)">${formatRupiah(product.price * qty)}</div>
      </div>
    `;
    cartItemsEl.appendChild(item);
  });

  const totalPrice = Object.keys(cart).reduce((s,pid)=> {
    const pr = PRODUCTS.find(x => x.id === pid);
    return s + (pr ? pr.price * cart[pid] : 0);
  }, 0);

  cartTotalEl.textContent = formatRupiah(totalPrice);
}

// ===== Cart operations =====
function addToCart(productId, qty=1){
  if(!cart[productId]) cart[productId] = 0;
  cart[productId] += qty;
  if(cart[productId] <= 0) delete cart[productId];
  saveCart();
  updateCartUI();
}

function clearCart(confirmAsk = true){
  if(confirmAsk){
    if(!confirm("Kosongkan keranjang?")) return;
  }
  cart = {};
  saveCart();
  updateCartUI();
}

// ===== Drawer open/close =====
function openCart(){
  cartDrawer.classList.add("open");
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden","false");
  cartDrawer.setAttribute("aria-hidden","false");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden","true");
  cartDrawer.setAttribute("aria-hidden","true");
}

// ===== Checkout (WhatsApp) =====
function checkoutToWhatsApp(){
  const items = Object.keys(cart);
  if(items.length === 0){
    alert("Keranjang kosong. Tambahkan produk terlebih dahulu.");
    return;
  }
  // build message
  let lines = [];
  lines.push("Halo KOMILK, saya ingin memesan:");
  items.forEach(pid => {
    const p = PRODUCTS.find(x => x.id === pid);
    if(!p) return;
    lines.push(`- ${p.name} x ${cart[pid]}`);
  });
  const total = Object.keys(cart).reduce((s,pid)=>{
    const p = PRODUCTS.find(x => x.id === pid);
    return s + (p ? p.price * cart[pid] : 0);
  }, 0);
  lines.push(`Total: ${formatRupiah(total)}`);
  lines.push("");
  lines.push("Alamat pengiriman: ");
  lines.push("Nomor telepon: ");

  const text = encodeURIComponent(lines.join("\n"));
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  window.open(url, "_blank");
}

// ===== Events =====
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
  loadCart();
  updateCartUI();
  qs("#year").textContent = new Date().getFullYear();

  // product buttons (delegation)
  qs("#productsGrid").addEventListener("click", e => {
    const btn = e.target.closest("button");
    if(!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if(action === "add") addToCart(id, 1);
    if(action === "quick"){
      const p = PRODUCTS.find(x => x.id === id);
      if(p) alert(`${p.name}\n\n${p.desc}\n\nHarga: ${formatRupiah(p.price)}`);
    }
  });

  // open/close cart
  qs("#openCartBtn").addEventListener("click", openCart);
  qs("#closeCartBtn").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  // cart inc/dec (delegation)
  cartItemsEl.addEventListener("click", e => {
    const inc = e.target.closest(".inc");
    const dec = e.target.closest(".dec");
    if(inc){
      const id = inc.dataset.id;
      addToCart(id, 1);
    } else if(dec){
      const id = dec.dataset.id;
      addToCart(id, -1);
    }
  });

  // checkout & clear
  qs("#checkoutBtn").addEventListener("click", checkoutToWhatsApp);
  qs("#clearCartBtn").addEventListener("click", () => clearCart(true));
});
