document.addEventListener("DOMContentLoaded", () => {
  // -------- Scroll Animation --------
  const animatedItems = document.querySelectorAll(".animate-on-scroll");
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  animatedItems.forEach(item => observer.observe(item));

  // -------- Shared Cart Utilities --------
  function getCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    console.log('Current cart:', cart); // Debug log
    return cart;
  }

  function saveCart(cart) {
    console.log('Saving cart:', cart); // Debug log
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    // Dispatch storage event to sync across tabs
    window.dispatchEvent(new Event('storage'));
  }

  function updateCartCount() {
    const cart = getCart();
    const countEl = document.getElementById("cart-count");
    if (countEl) {
      countEl.textContent = cart.length;
      console.log('Cart count updated:', cart.length); // Debug log
    }
  }

  function addToCart(item) {
    const cart = getCart();
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.name === item.name && 
      cartItem.date === item.date && 
      cartItem.time === item.time
    );
    
    if (existingItemIndex === -1) {
      cart.push(item);
      saveCart(cart);
      console.log('Item added to cart:', item); // Debug log
    } else {
      console.log('Item already in cart:', item); // Debug log
    }
  }

  function removeItem(index) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
      const removedItem = cart.splice(index, 1);
      saveCart(cart);
      console.log('Item removed from cart:', removedItem); // Debug log
    }
  }

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('Page became visible, refreshing cart'); // Debug log
      updateCartCount();
      if (window.location.pathname.includes('cart.html') && typeof displayCart === 'function') {
        displayCart();
      }
    }
  });

  // Add storage event listener to sync between tabs
  window.addEventListener('storage', (event) => {
    if (event.key === 'cart') {
      console.log('Storage event detected, updating cart'); // Debug log
      updateCartCount();
      if (window.location.pathname.includes('cart.html') && typeof displayCart === 'function') {
        displayCart();
      }
    }
  });

  // -------- Login Page --------
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const role = document.getElementById("role").value;
      localStorage.setItem("role", role);
      window.location.href = "dashboard.html";
    });
  }

  // -------- order Page --------
  const orderModal = document.getElementById("order-modal");
  const dateInput = document.getElementById("order-date");
  const timeInput = document.getElementById("order-time");
  const confirmBtn = document.getElementById("confirm-order-btn");
  const cancelBtn = document.getElementById("cancel-order-btn");
  let selectedItemName = "";

  if (document.querySelector(".add-cart")) {
    document.querySelectorAll(".add-cart").forEach(button => {
      button.addEventListener("click", () => {
        selectedItemName = button.dataset.name;
        if (orderModal) orderModal.style.display = "flex";
      });
    });

    if (confirmBtn && cancelBtn && dateInput && timeInput) {
      confirmBtn.addEventListener("click", () => {
        const date = dateInput.value;
        const time = timeInput.value;

        if (!date || !time) {
          alert("Please select both date and time.");
          return;
        }

        const item = {
          name: selectedItemName,
          date: date,
          time: time
        };

        addToCart(item);
        alert(`"${item.name}" Ordered for ${item.date} at ${item.time}`);
        orderModal.style.display = "none";
        dateInput.value = "";
        timeInput.value = "";
      });

      cancelBtn.addEventListener("click", () => {
        orderModal.style.display = "none";
        dateInput.value = "";
        timeInput.value = "";
      });
    }
  }

  // -------- Cart Page --------
  const cartContainer = document.getElementById("cart-items");
  const emptyMsg = document.getElementById("empty-message");
  const proceedBtn = document.getElementById("proceed-btn");

  if (cartContainer) {
    function displayCart() {
      const cart = getCart();
      cartContainer.innerHTML = "";
      updateCartCount();

      if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = "block";
        if (proceedBtn) {
          proceedBtn.disabled = true;
          proceedBtn.style.opacity = "0.6";
        }
        return;
      }

      if (emptyMsg) emptyMsg.style.display = "none";
      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.style.opacity = "1";
      }

      cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "lab-card";
        div.innerHTML = `
          <h3>${item.name}</h3>
          <p>Date: <strong>${item.date}</strong></p>
          <p>Time: <strong>${item.time}</strong></p>
          <button class="btn-download" data-index="${index}">Remove</button>
        `;
        cartContainer.appendChild(div);
      });

      document.querySelectorAll(".btn-download").forEach(button => {
        button.addEventListener("click", () => {
          const index = parseInt(button.dataset.index);
          removeItem(index);
          displayCart();
        });
      });
    }

    if (proceedBtn) {
      proceedBtn.addEventListener("click", () => {
        const cart = getCart();
        if (cart.length === 0) {
          alert("Cart is empty!");
          return;
        }
        // Force a fresh load of payment page
        window.location.href = "payment.html?" + new Date().getTime();
      });
    }

    displayCart();
  }

  // -------- Payment Page --------
  const paymentSummary = document.getElementById("payment-summary");
  const paymentForm = document.getElementById("payment-form");

  if (paymentSummary && paymentForm) {
    // Force reload cart data
    const cart = getCart();
    console.log('Payment page cart:', cart); // Debug log

    if (cart.length === 0) {
      paymentSummary.innerHTML = "<p>Your cart is empty.</p>";
      paymentForm.style.display = "none";
      // Optionally redirect back to cart if empty
      setTimeout(() => {
        window.location.href = "cart.html";
      }, 1500);
    } else {
      paymentSummary.innerHTML = ""; // Clear previous content
      cart.forEach(item => {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <strong>${item.name}</strong><br/>
          Date: ${item.date} | Time: ${item.time}<br/><br/>
        `;
        paymentSummary.appendChild(div);
      });
    }

    paymentForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("cardName").value.trim();
      const number = document.getElementById("cardNumber").value.trim();
      const expiry = document.getElementById("expiry").value.trim();
      const cvv = document.getElementById("cvv").value.trim();

      if (!name || !number || !expiry || !cvv) {
        alert("Please fill all payment details.");
        return;
      }

      alert("Payment successful! Your booking is confirmed.");
      localStorage.removeItem("cart");
      window.location.href = "confirmation.html";
    });

    // Refresh payment summary when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        window.location.reload();
      }
    });
  }

 // -- view p-Category Reveal --
     document.querySelectorAll(".view-pizza").forEach(button => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const category = button.getAttribute("data-category");

        // Hide all categories
        document.querySelectorAll(".P-category").forEach(section => {
          section.style.display = "none";
        });

        // Show selected category
        const target = document.getElementById(category);
        if (target) {
          target.style.display = "block";
          target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
    function goBack() {
    window.location.href = "order.html"; // OR: window.location.href = "order.html";
  }

  // -------- Initialize --------
  updateCartCount();
});
//--------btn--------//

document.getElementById("btn-order").addEventListener("click", function () {
  window.location.href = "order.html";
});

document.getElementById("btn-order").addEventListener("click", function () {
  document.getElementById("menuSection").scrollIntoView({ behavior: "smooth" });
});


document.addEventListener("DOMContentLoaded", () => {
  // Scroll animation
  const animatedItems = document.querySelectorAll(".animate-on-scroll");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animatedItems.forEach(item => observer.observe(item));

  // Button action
  const ctaBtn = document.getElementById("ctaOrderBtn");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", () => {
      window.location.href = "order.html";
    });
  }
});
