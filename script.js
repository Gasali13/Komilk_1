// ===== CONFIG =====
// Ganti dengan nomor WhatsApp kamu (format: 628xxx)
const WHATSAPP_NUMBER = "6281241813632"; 

const PRODUCTS = [
  { 
    id: "k1", 
    name: "KOMILK Murni", 
    price: 15000, 
    image: "assets/prod_murni.png", 
    desc: "Susu murni segar, creamy, dan alami tanpa campuran." 
  },
  { 
    id: "k2", 
    name: "KOMILK Gula Aren", 
    price: 15000, 
    image: "assets/prod_gula_aren.png", 
    desc: "Perpaduan susu segar dengan manis legit gula aren asli." 
  },
  { 
    id: "k3", 
    name: "KOMILK Strawberry", 
    price: 15000, 
    image: "assets/prod_strawberry.png", 
    desc: "Rasa strawberry manis asam yang menyegarkan." 
  },
  { 
    id: "k4", 
    name: "KOMILK Matcha", 
    price: 15000, 
    image: "assets/prod_matcha.jpg", 
    desc: "Aroma teh hijau Jepang premium yang menenangkan." 
  },
  { 
    id: "k5", 
    name: "KOMILK Jahe", 
    price: 15000, 
    image: "assets/prod_jahe.jpg", 
    desc: "Hangat dan sehat dengan ekstrak jahe alami." 
  }
];

// ===== Utilities =====
const qs = sel => document.querySelector(sel);
const formatRupiah = n => {
  return 'Rp ' + Number(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// ===== State & Cart Logic =====
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
  grid.innerHTML = "";
  
  PRODUCTS.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="img-wrapper">
        <img class="product-thumb" src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-footer">
          <div class="price">${formatRupiah(p.price)}</div>
          <button class="btn btn-add" data-id="${p.id}" data-action="add">
            + Pesan
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ===== UI Updates =====
function updateCartUI(){
  const totalItems = Object.values(cart).reduce((s,q)=> s+q, 0);
  qs("#cartCount").textContent = totalItems;
  
  // Update list di drawer
  const container = qs("#cartItems");
  container.innerHTML = "";
  
  if(totalItems === 0){
    container.innerHTML = `<div class="empty-state">Keranjang masih kosong.<br>Yuk pilih minuman segarmu!</div>`;
    qs("#cartTotal").textContent = formatRupiah(0);
    return;
  }

  let grandTotal = 0;
  Object.keys(cart).forEach(pid => {
    const qty = cart[pid];
    const product = PRODUCTS.find(p => p.id === pid);
    if(!product) return;
    
    grandTotal += (product.price * qty);
    
    const item = document.createElement("div");
    item.className = "cart-item";
    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div class="cart-details">
        <div class="cart-name">${product.name}</div>
        <div class="cart-price">${formatRupiah(product.price)}</div>
      </div>
      <div class="qty-group">
        <button class="qty-btn dec" data-id="${pid}">-</button>
        <span>${qty}</span>
        <button class="qty-btn inc" data-id="${pid}">+</button>
      </div>
    `;
    container.appendChild(item);
  });
  
  qs("#cartTotal").textContent = formatRupiah(grandTotal);
}

// ===== Actions =====
function addToCart(pid, qty){
  if(!cart[pid]) cart[pid] = 0;
  cart[pid] += qty;
  if(cart[pid] <= 0) delete cart[pid];
  saveCart();
  updateCartUI();
  
  // Efek visual kecil saat tambah
  if(qty > 0) {
    const btn = qs("#openCartBtn");
    btn.classList.add("bump");
    setTimeout(()=> btn.classList.remove("bump"), 200);
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

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  renderProducts();
  updateCartUI();
  
  // Event Delegation
  qs("#productsGrid").addEventListener("click", e => {
    const btn = e.target.closest("button[data-action='add']");
    if(btn) addToCart(btn.dataset.id, 1);
  });

  qs("#cartItems").addEventListener("click", e => {
    const btn = e.target.closest(".qty-btn");
    if(!btn) return;
    const id = btn.dataset.id;
    if(btn.classList.contains("inc")) addToCart(id, 1);
    if(btn.classList.contains("dec")) addToCart(id, -1);
  });

  qs("#openCartBtn").addEventListener("click", () => {
    qs("#cartDrawer").classList.add("active");
    qs("#overlay").classList.add("active");
  });
  
  const close = () => {
    qs("#cartDrawer").classList.remove("active");
    qs("#overlay").classList.remove("active");
  };
  
  qs("#closeCartBtn").addEventListener("click", close);
  qs("#overlay").addEventListener("click", close);
  qs("#checkoutBtn").addEventListener("click", checkoutWA);
  qs("#clearCartBtn").addEventListener("click", () => {
    if(confirm("Hapus semua item?")) { cart={}; saveCart(); updateCartUI(); }
  });
});