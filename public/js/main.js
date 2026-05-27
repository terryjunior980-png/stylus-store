var chatOpen = false;
var chatHistory = [];
var cart = JSON.parse(localStorage.getItem('stylus_cart') || '[]');
var config = {};
var allProducts = [];
var currentFilter = 'All';
var currentSort = '';
var RATES = { NGN: 1, USD: 1550, GBP: 1950 };
var SYMBOLS = { NGN: '₦', USD: '$', GBP: '£' };
var currentCurrency = localStorage.getItem('stylus_currency') || 'NGN';
var currentUser = null;

var SUPABASE_URL = 'https://fwvqrtutkchlpjhujqbf.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3dnFydHV0a2NobHBqaHVqcWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDA2NzUsImV4cCI6MjA5NTQ3NjY3NX0.2-l6oGPzpRhImO6715SET_C_d394e2oYcmBdx5o8_00';

function convertPrice(nairaPrice) {
  return Math.round(nairaPrice / RATES[currentCurrency]);
}

function formatPrice(nairaPrice) {
  return SYMBOLS[currentCurrency] + convertPrice(nairaPrice).toLocaleString();
}

document.addEventListener('DOMContentLoaded', async function() {
  // Load Supabase
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = async function() {
    var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    var session = await supabase.auth.getSession();

    if (!session.data.session) {
      // Not logged in — redirect to login
      window.location.href = '/login.html';
      return;
    }

    currentUser = session.data.session.user;

    // Update nav login button to show user name
    var loginBtn = document.getElementById('loginNavBtn');
    if (loginBtn) {
      var name = currentUser.user_metadata && currentUser.user_metadata.full_name
        ? currentUser.user_metadata.full_name.split(' ')[0]
        : currentUser.email.split('@')[0];
      loginBtn.textContent = 'Hi, ' + name;
      loginBtn.href = '/login.html';
    }

    // Init everything
    initNav();
    initCurrency();
    await loadConfig();
    await loadProducts();
    updateCartUI();
    initCart();
    initCheckout();
    setWhatsAppLinks();
    handlePaystackReturn();
  };
  document.head.appendChild(script);
});

function initCurrency() {
  var select = document.getElementById('currencySelect');
  if (!select) return;
  select.value = currentCurrency;
  select.addEventListener('change', function() {
    currentCurrency = this.value;
    localStorage.setItem('stylus_currency', currentCurrency);
    renderProducts(allProducts);
    renderCartItems();
  });
}

function initNav() {
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

async function loadConfig() {
  try {
    var res = await fetch('/api/config');
    config = await res.json();
  } catch(e) { console.error('Config load failed:', e); }
}

async function loadProducts(filter, sort) {
  filter = filter || 'All';
  sort = sort || '';
  var grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="products-loading"><div class="loading-spinner"></div></div>';
  try {
    var params = new URLSearchParams();
    if (filter !== 'All') params.set('category', filter);
    if (sort) params.set('sort', sort);
    var res = await fetch('/api/products?' + params);
    var data = await res.json();
    allProducts = data.products;
    renderProducts(data.products);
  } catch(e) {
    grid.innerHTML = '<p style="color:#888;text-align:center;padding:3rem">Failed to load products. Please refresh.</p>';
  }
}

function renderProducts(products) {
  var grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<p style="color:#888;text-align:center;padding:3rem;grid-column:1/-1">No products found.</p>';
    return;
  }
  grid.innerHTML = products.map(function(p, i) {
    return '<article class="product-card" style="animation-delay:' + (i * 0.07) + 's">' +
      '<div class="product-card-img">' +
        '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy" />' +
        '<div class="product-card-overlay">' +
          '<button class="overlay-btn" data-id="' + p.id + '">Quick View</button>' +
        '</div>' +
        (p.badge ? '<span class="product-badge">' + p.badge + '</span>' : '') +
      '</div>' +
      '<div class="product-card-info">' +
        '<div class="product-category">' + p.category + '</div>' +
        '<h3 class="product-name">' + p.name + '</h3>' +
        '<div class="product-price">' + formatPrice(p.price) + '</div>' +
      '</div>' +
    '</article>';
  }).join('');

  grid.querySelectorAll('.product-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var id = this.querySelector('.overlay-btn').getAttribute('data-id');
      openProductModal(id);
    });
  });

  grid.querySelectorAll('.overlay-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      openProductModal(this.getAttribute('data-id'));
    });
  });
}

document.querySelectorAll('.filter-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadProducts(currentFilter, currentSort);
  });
});

var sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.addEventListener('change', function() {
    currentSort = this.value;
    loadProducts(currentFilter, currentSort);
  });
}

function filterProducts(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.filter === cat);
  });
  loadProducts(cat, currentSort);
  document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });
}

function openProductModal(productId) {
  var product = allProducts.find(function(p) { return p.id === productId; });
  if (!product) return;
  var inner = document.getElementById('modalInner');
  inner.innerHTML =
    '<div class="modal-image"><img src="' + product.image + '" alt="' + product.name + '" /></div>' +
    '<div class="modal-details">' +
      '<div class="modal-category">' + product.category + ' Collection</div>' +
      '<h2 class="modal-name">' + product.name + '</h2>' +
      '<div class="modal-price">' + formatPrice(product.price) + '</div>' +
      '<p class="modal-desc">' + product.description + '</p>' +
      '<label class="select-label">Select Size</label>' +
      '<div class="size-options">' + product.sizes.map(function(s) { return '<button class="size-btn">' + s + '</button>'; }).join('') + '</div>' +
      '<label class="select-label">Select Color</label>' +
      '<div class="color-options">' + product.colors.map(function(c) { return '<button class="color-btn">' + c + '</button>'; }).join('') + '</div>' +
      '<button class="btn-primary modal-add-btn" id="addToCartBtn">Add to Cart</button>' +
    '</div>';

  inner.querySelectorAll('.size-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      inner.querySelectorAll('.size-btn').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  inner.querySelectorAll('.color-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      inner.querySelectorAll('.color-btn').forEach(function(b) { b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  document.getElementById('addToCartBtn').addEventListener('click', function() {
    var sizeBtn = inner.querySelector('.size-btn.selected');
    var colorBtn = inner.querySelector('.color-btn.selected');
    if (!sizeBtn) { alert('Please select a size'); return; }
    if (!colorBtn) { alert('Please select a color'); return; }
    var key = product.id + '_' + sizeBtn.textContent.trim() + '_' + colorBtn.textContent.trim();
    var existing = cart.find(function(c) { return c.key === key; });
    if (existing) { closeModal(); openCart(); return; }
    cart.push({ key: key, id: product.id, name: product.name, price: product.price, image: product.image, size: sizeBtn.textContent.trim(), color: colorBtn.textContent.trim(), quantity: 1 });
    saveCart(); updateCartUI(); bumpCount(); closeModal(); openCart();
  });

  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function saveCart() { localStorage.setItem('stylus_cart', JSON.stringify(cart)); }

function updateCartUI() {
  var count = cart.reduce(function(sum, i) { return sum + i.quantity; }, 0);
  document.getElementById('cartCount').textContent = count;
  renderCartItems();
}

function bumpCount() {
  var el = document.getElementById('cartCount');
  el.classList.add('bump');
  setTimeout(function() { el.classList.remove('bump'); }, 300);
}

function renderCartItems() {
  var container = document.getElementById('cartItems');
  var footer = document.getElementById('cartFooter');
  if (!cart.length) {
    container.innerHTML = '<div class="cart-empty"><p>Your cart is empty</p><button class="btn-primary" onclick="closeCart()">Continue Shopping</button></div>';
    footer.style.display = 'none';
    return;
  }
  var html = '';
  cart.forEach(function(item) {
    html += '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + item.image + '" alt="' + item.name + '" />' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-meta">' + item.size + ' &middot; ' + item.color + '</div>' +
        '<div class="cart-item-price">' + formatPrice(item.price * item.quantity) + '</div>' +
        '<div class="cart-item-qty">' +
          '<button class="qty-btn" data-key="' + item.key + '" data-delta="-1">&#8722;</button>' +
          '<span class="qty-val">' + item.quantity + '</span>' +
          '<button class="qty-btn" data-key="' + item.key + '" data-delta="1">+</button>' +
        '</div>' +
      '</div>' +
      '<button class="remove-btn" data-key="' + item.key + '" style="background:#ff4444;color:white;padding:0.35rem 0.7rem;font-size:0.65rem;border:none;cursor:pointer;align-self:flex-start;font-family:inherit;">REMOVE</button>' +
    '</div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('.remove-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = this.getAttribute('data-key');
      cart = cart.filter(function(c) { return c.key !== key; });
      saveCart(); updateCartUI();
    });
  });
  container.querySelectorAll('.qty-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var key = this.getAttribute('data-key');
      var delta = parseInt(this.getAttribute('data-delta'));
      var item = cart.find(function(c) { return c.key === key; });
      if (!item) return;
      item.quantity += delta;
      if (item.quantity <= 0) { cart = cart.filter(function(c) { return c.key !== key; }); }
      saveCart(); updateCartUI();
    });
  });
  var total = cart.reduce(function(sum, i) { return sum + i.price * i.quantity; }, 0);
  document.getElementById('cartTotal').textContent = formatPrice(total);
  footer.style.display = 'block';
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
  document.getElementById('checkoutOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeCheckout();
  });
  document.getElementById('payNowBtn').addEventListener('click', initiatePayment);
}

function openCheckout() {
  // Pre-fill form with logged in user details
  if (currentUser) {
    var name = currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name : '';
    var email = currentUser.email || '';
    if (name) document.getElementById('cName').value = name;
    if (email) document.getElementById('cEmail').value = email;
  }
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
  var list = document.getElementById('checkoutItemsList');
  var total = cart.reduce(function(sum, i) { return sum + i.price * i.quantity; }, 0);
  list.innerHTML = cart.map(function(item) {
    return '<div class="checkout-item">' +
      '<div><div class="checkout-item-name">' + item.name + '</div>' +
      '<div class="checkout-item-meta">' + item.size + ' &middot; ' + item.color + ' &middot; Qty: ' + item.quantity + '</div></div>' +
      '<div class="checkout-item-price">' + formatPrice(item.price * item.quantity) + '</div>' +
    '</div>';
  }).join('');
  document.getElementById('checkoutSubtotal').textContent = formatPrice(total);
  document.getElementById('checkoutTotal').textContent = formatPrice(total);
}

async function initiatePayment() {
  var name = document.getElementById('cName').value.trim();
  var email = document.getElementById('cEmail').value.trim();
  var phone = document.getElementById('cPhone').value.trim();
  var street = document.getElementById('cStreet').value.trim();
  var city = document.getElementById('cCity').value.trim();
  var state = document.getElementById('cState').value.trim();
  var country = document.getElementById('cCountry').value.trim();
  if (!name || !email || !phone || !street || !city || !state) { alert('Please fill in all required fields marked with *'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { alert('Please enter a valid email address'); return; }
  var btn = document.getElementById('payNowBtn');
  var btnText = document.getElementById('payBtnText');
  btn.disabled = true;
  btnText.textContent = 'Processing...';
  var orderData = {
    customer: { name: name, email: email, phone: phone },
    items: cart.map(function(item) { return { id: item.id, name: item.name, price: item.price, quantity: item.quantity, size: item.size, color: item.color }; }),
    address: { street: street, city: city, state: state, country: country }
  };
  try {
    var res = await fetch('/api/payment/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
    var data = await res.json();
    if (data.success) { window.location.href = data.authorization_url; }
    else { alert('Payment failed to start. Please try again.'); btn.disabled = false; btnText.textContent = 'Pay with Paystack'; }
  } catch(e) { alert('Something went wrong. Please try again.'); btn.disabled = false; btnText.textContent = 'Pay with Paystack'; }
}

async function handlePaystackReturn() {
  var params = new URLSearchParams(window.location.search);
  var reference = params.get('reference') || params.get('trxref');
  if (!reference) return;
  window.history.replaceState({}, document.title, '/');
  try {
    var res = await fetch('/api/payment/verify', { me
