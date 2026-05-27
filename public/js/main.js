'use strict';

var cart = JSON.parse(localStorage.getItem('stylus_cart') || '[]');
var config = {};
var allProducts = [];
var currentFilter = 'All';
var currentSort = '';
var RATES = { NGN: 1, USD: 1550, GBP: 1950 };
var SYMBOLS = { NGN: '₦', USD: '$', GBP: '£' };
var currentCurrency = localStorage.getItem('stylus_currency') || 'NGN';

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  await loadConfig();
  await loadProducts();
  updateCartUI();
  initCart();
  initCheckout();
  setWhatsAppLinks();
});

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    config = await res.json();
  } catch (e) { console.error('Config load failed:', e); }
}

function initNav() {
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));
}

async function loadProducts(filter = 'All', sort = '') {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="products-loading"><div class="loading-spinner"></div></div>';
  try {
    const params = new URLSearchParams();
    if (filter !== 'All') params.set('category', filter);
    if (sort) params.set('sort', sort);
    const res = await fetch('/api/products?' + params);
    const data = await res.json();
    allProducts = data.products;
    renderProducts(data.products);
  } catch (e) {
    grid.innerHTML = '<p style="color:#888;text-align:center;padding:3rem">Failed to load products. Please refresh.</p>';
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<p style="color:#888;text-align:center;padding:3rem;grid-column:1/-1">No products found.</p>';
    return;
  }
  grid.innerHTML = products.map((p, i) => `
    <article class="product-card" style="animation-delay:${i * 0.07}s">
      <div class="product-card-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="product-card-overlay">
          <button class="overlay-btn" data-id="${p.id}">Quick View</button>
        </div>
        ${p.badge ? '<span class="product-badge">' + p.badge + '</span>' : ''}
      </div>
      <div class="product-card-info">
        <div class="product-category">${p.category}</div>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price">&#8358;${p.price.toLocaleString()}</div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function () {
      const id = this.querySelector('.overlay-btn').getAttribute('data-id');
      openProductModal(id);
    });
  });

  grid.querySelectorAll('.overlay-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      openProductModal(this.getAttribute('data-id'));
    });
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadProducts(currentFilter, currentSort);
  });
});

document.getElementById('sortSelect').addEventListener('change', function () {
  currentSort = this.value;
  loadProducts(currentFilter, currentSort);
});

function filterProducts(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === cat));
  loadProducts(cat, currentSort);
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const inner = document.getElementById('modalInner');
  inner.innerHTML = `
    <div class="modal-image"><img src="${product.image}" alt="${product.name}" /></div>
    <div class="modal-details">
      <div class="modal-category">${product.category} Collection</div>
      <h2 class="modal-name">${product.name}</h2>
      <div class="modal-price">&#8358;${product.price.toLocaleString()}</div>
      <p class="modal-desc">${product.description}</p>
      <label class="select-label">Select Size</label>
      <div class="size-options">
        ${product.sizes.map(s => '<button class="size-btn">' + s + '</button>').join('')}
      </div>
      <label class="select-label">Select Color</label>
      <div class="color-options">
        ${product.colors.map(c => '<button class="color-btn">' + c + '</button>').join('')}
      </div>
      <button class="btn-primary modal-add-btn" id="addToCartBtn">Add to Cart</button>
    </div>
  `;

  inner.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      inner.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  inner.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      inner.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  document.getElementById('addToCartBtn').addEventListener('click', function () {
    const sizeBtn = inner.querySelector('.size-btn.selected');
    const colorBtn = inner.querySelector('.color-btn.selected');
    if (!sizeBtn) { alert('Please select a size'); return; }
    if (!colorBtn) { alert('Please select a color'); return; }

    const key = product.id + '_' + sizeBtn.textContent.trim() + '_' + colorBtn.textContent.trim();
    const existing = cart.find(c => c.key === key);

    if (existing) {
      // Already in cart — just open cart, don't add again
      closeModal();
      openCart();
      return;
    }

    cart.push({
      key: key,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: sizeBtn.textContent.trim(),
      color: colorBtn.textContent.trim(),
      quantity: 1
    });

    saveCart();
    updateCartUI();
    bumpCount();
    closeModal();
    openCart();
  });

  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function saveCart() {
  localStorage.setItem('stylus_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartCount').textContent = count;
  renderCartItems();
}

function bumpCount() {
  const el = document.getElementById('cartCount');
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 300);
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');

  if (!cart.length) {
    container.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p><button class="btn-primary" onclick="closeCart()">Continue Shopping</button></div>';
    footer.style.display = 'none';
    return;
  }

  let html = '';
  cart.forEach(function(item) {
    html += '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + item.image + '" alt="' + item.name + '" />' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-meta">' + item.size + ' &middot; ' + item.color + '</div>' +
        '<div class="cart-item-price">&#8358;' + (item.price * item.quantity).toLocaleString() + '</div>' +
        '<div class="cart-item-qty">' +
          '<button class="qty-btn" data-key="' + item.key + '" data-delta="-1">&#8722;</button>' +
          '<span class="qty-val">' + item.quantity + '</span>' +
          '<button class="qty-btn" data-key="' + item.key + '" data-delta="1">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="remove-btn" data-key="' + item.key + '" style="background:#ff4444;color:white;padding:0.35rem 0.7rem;font-size:0.65rem;letter-spacing:0.08em;border:none;cursor:pointer;align-self:flex-start;font-family:inherit;">REMOVE</button>' +
    '</div>';
  });

  container.innerHTML = html;

  // Attach remove buttons
  container.querySelectorAll('.remove-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = this.getAttribute('data-key');
      cart = cart.filter(function(c) { return c.key !== key; });
      saveCart();
      updateCartUI();
    });
  });

  // Attach qty buttons
  container.querySelectorAll('.qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = this.getAttribute('data-key');
      var delta = parseInt(this.getAttribute('data-delta'));
      var item = cart.find(function(c) { return c.key === key; });
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) {
        cart = cart.filter(function(c) { return c.key !== key; });
      }
      saveCart();
      updateCartUI();
    });
  });

  const total = cart.reduce(function(sum, i) { return sum + i.price * i.quantity; }, 0);
  document.getElementById('cartTotal').textContent = '&#8358;' + total.toLocaleString();
  footer.style.display = 'block';
}

function clearCart() {
  if (confirm('Are you sure you want to clear your cart?')) {
    cart = [];
    saveCart();
    updateCartUI();
  }
}

function initCart() {
  document.getElementById('cartToggle').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
}

function openCart() {
  document.getElementById('cartSidebar').classList.add('active');
  document.getElementById('cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartSidebar').classList.remove('active');
  document.getElementById('cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function initCheckout() {
  document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
  document.getElementById('checkoutOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeCheckout();
  });
  document.getElementById('payNowBtn').addEventListener('click', initiatePayment);
}

function openCheckout() {
  closeCart();
  renderCheckoutSummary();
  document.getElementById('checkoutOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function renderCheckoutSummary() {
  const list = document.getElementById('checkoutItemsList');
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  list.innerHTML = cart.map(item => `
    <div class="checkout-item">
      <div>
        <div class="checkout-item-name">${item.name}</div>
        <div class="checkout-item-meta">${item.size} &middot; ${item.color} &middot; Qty: ${item.quantity}</div>
      </div>
      <div class="checkout-item-price">&#8358;${(item.price * item.quantity).toLocaleString()}</div>
    </div>
  `).join('');
  document.getElementById('checkoutSubtotal').textContent = '&#8358;' + total.toLocaleString();
  document.getElementById('checkoutTotal').textContent = '&#8358;' + total.toLocaleString();
}

async function initiatePayment() {
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const street = document.getElementById('cStreet').value.trim();
  const city = document.getElementById('cCity').value.trim();
  const state = document.getElementById('cState').value.trim();
  const country = document.getElementById('cCountry').value.trim();

  if (!name || !email || !phone || !street || !city || !state) {
    alert('Please fill in all required fields marked with *');
    return;
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  const btn = document.getElementById('payNowBtn');
  const btnText = document.getElementById('payBtnText');
  btn.disabled = true;
  btnText.textContent = 'Processing...';

  const orderData = {
    customer: { name, email, phone },
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color
    })),
    address: { street, city, state, country }
  };

  try {
    const res = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (data.success) {
      window.location.href = data.authorization_url;
    } else {
      alert('Payment failed to start. Please try again.');
      btn.disabled = false;
      btnText.textContent = 'Pay with Paystack';
    }
  } catch (e) {
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btnText.textContent = 'Pay with Paystack';
  }
}

async function handlePaystackReturn() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || params.get('trxref');
  if (!reference) return;
  window.history.replaceState({}, document.title, '/');
  try {
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference })
    });
    const data = await res.json();
    if (data.success) {
      cart = [];
      saveCart();
      updateCartUI();
      // Save order to admin dashboard
      const adminOrders = JSON.parse(localStorage.getItem('stylus_orders') || '[]');
      adminOrders.push(data.order);
      localStorage.setItem('stylus_orders', JSON.stringify(adminOrders));
      const customerName = data.order && data.order.customer ? ', ' + data.order.customer.name : '';
      document.getElementById('successMsg').textContent = 'Order ' + reference + ' confirmed! Thank you' + customerName + '.';
      document.getElementById('successOverlay').classList.add('active');
    }
  } catch (e) { console.error('Verify error:', e); }
}

function closeSuccess() {
  document.getElementById('successOverlay').classList.remove('active');
}

function setWhatsAppLinks() {
  const num = (config && config.whatsappNumber) ? config.whatsappNumber : '2348144548826';
  const msg = encodeURIComponent('Hello STYLUS! I have a question about your clothing.');
  const url = 'https://wa.me/' + num + '?text=' + msg;
  const floatBtn = document.getElementById('whatsappFloat');
  if (floatBtn) floatBtn.href = url;
  const footerWa = document.getElementById('footerWhatsapp');
  if (footerWa) footerWa.href = url;
}

handlePaystackReturn();
