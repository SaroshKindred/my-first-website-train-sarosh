document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = !!document.getElementById('login-form');
    const isStorePage = !!document.querySelector('.store-card');

    const navSignin = document.getElementById('nav-signin');
    const navStore = document.getElementById('nav-store');
    const logoutBtn = document.getElementById('logout-btn');

    const urlParams = new URLSearchParams(window.location.search);

    // База доступных промокодов Valiant Video
    const PROMO_CODES = {
        'DISCOUNT-1997': { type: 'percent', value: 13, name: 'Скидка Valiant Club 13%' },
        'SNUFF10':       { type: 'percent', value: 10, name: 'Скидка 10%' },
        'STARKWEATHER':  { type: 'percent', value: 20, name: 'Специальный доступ 20%' },
        'MRNASTY':       { type: 'fixed',   value: 50, name: 'Скидка $50' }
    };

    let currentDiscountPercent = 0;
    let currentFixedDiscount = 0;

    // При заходе на index.html — всегда очищаем сессию
    if (isLoginPage) {
        sessionStorage.removeItem('isLoggedIn');
    }

    // 1. ЗАЩИТА СТРАНИЦЫ МАГАЗИНА
    if (isStorePage) {
        const isAuth = urlParams.get('auth') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
        if (!isAuth) {
            window.location.href = 'index.html';
            return;
        }

        // Инициализация корзины
        initCart();
    }

    // 2. ФОРМА ВХОДА (index.html)
    if (isLoginPage) {
        const loginForm = document.getElementById('login-form');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorMsg = document.getElementById('error-msg');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (username === "Starkweather" && password === "nastyscum") {
                sessionStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'store.html?auth=true';
            } else {
                errorMsg.textContent = "ACCESS DENIED: Invalid credentials";
                passwordInput.value = "";
            }
        });
    }

    // 3. НАВИГАЦИЯ В ХЕДЕРЕ
    if (navSignin) {
        navSignin.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    if (navStore) {
        navStore.addEventListener('click', () => {
            const isAuth = urlParams.get('auth') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
            if (isAuth) {
                window.location.href = 'store.html?auth=true';
            } else if (isLoginPage) {
                const errorMsg = document.getElementById('error-msg');
                if (errorMsg) errorMsg.textContent = "ACCESS DENIED: Please login first!";
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // 4. КНОПКА SIGN-OUT
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    // ================= ЛОГИКА КОРЗИНЫ =================
    function initCart() {
        
        // Корзина просто в памяти JS (при F5 или закрытии сразу сбрасывается)
        let cart = [];

        const buyButtons = document.querySelectorAll('.buy-btn');
        const cartItemsBody = document.getElementById('cart-items-body');
        const cartTotalPrice = document.getElementById('cart-total-price');
        const cartCount = document.getElementById('cart-count');
        const placeOrderBtn = document.getElementById('place-order-btn');
        const checkoutMsg = document.getElementById('checkout-msg');
        
        const applyPromoBtn = document.getElementById('apply-promo-btn');

        // Функция отрисовки содержимого корзины с учетом скидок
        function renderCart() {
            cartItemsBody.innerHTML = '';
            let subtotalSum = 0;
            let totalCount = 0;

            if (cart.length === 0) {
                cartItemsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">Your cart is empty.</td></tr>`;
            } else {
                cart.forEach((item, index) => {
                    const itemTotal = item.price * item.qty;
                    subtotalSum += itemTotal;
                    totalCount += item.qty;

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td>$${item.price.toFixed(2)}</td>
                        <td>$${itemTotal.toFixed(2)}</td>
                        <td><button class="remove-btn" data-index="${index}">X</button></td>
                    `;
                    cartItemsBody.appendChild(row);
                });
            }

            // --- РАСЧЕТ СКИДКИ ---
            let discountAmount = 0;
            if (currentDiscountPercent > 0) {
                discountAmount = (subtotalSum * currentDiscountPercent) / 100;
            } else if (currentFixedDiscount > 0) {
                discountAmount = currentFixedDiscount;
            }

            if (discountAmount > subtotalSum) {
                discountAmount = subtotalSum;
            }

            let finalTotal = subtotalSum - discountAmount;

            // --- ОБНОВЛЕНИЕ UI СУММ ---
            const subtotalBar = document.getElementById('subtotal-bar');
            const subtotalPriceEl = document.getElementById('subtotal-price');
            const discountRow = document.getElementById('discount-row');
            const discountPercentEl = document.getElementById('discount-percent');
            const discountAmountEl = document.getElementById('discount-amount');

            if (discountAmount > 0 && subtotalSum > 0) {
                if (subtotalBar) subtotalBar.style.display = 'flex';
                if (subtotalPriceEl) subtotalPriceEl.textContent = `$${subtotalSum.toFixed(2)}`;

                if (discountRow) discountRow.style.display = 'flex';
                if (discountPercentEl) discountPercentEl.textContent = currentDiscountPercent > 0 ? `${currentDiscountPercent}%` : 'FIXED';
                if (discountAmountEl) discountAmountEl.textContent = `-$${discountAmount.toFixed(2)}`;
            } else {
                if (subtotalBar) subtotalBar.style.display = 'none';
                if (discountRow) discountRow.style.display = 'none';
            }

            cartTotalPrice.textContent = `$${finalTotal.toFixed(2)}`;
            cartCount.textContent = totalCount;
            
        }

        // Применение промокода
        function applyPromoCode() {
            const input = document.getElementById('promo-input');
            const msg = document.getElementById('promo-message');

            if (!input || !msg) return;

            const code = input.value.trim().toUpperCase();

            if (!code) {
                msg.style.color = '#ff3333';
                msg.innerText = 'ENTER PROMO CODE!';
                return;
            }

            if (PROMO_CODES[code]) {
                const promo = PROMO_CODES[code];

                if (promo.type === 'percent') {
                    currentDiscountPercent = promo.value;
                    currentFixedDiscount = 0;
                } else if (promo.type === 'fixed') {
                    currentFixedDiscount = promo.value;
                    currentDiscountPercent = 0;
                }

                msg.style.color = '#33ff33';
                msg.innerText = `CODE ACTIVATED: ${promo.name}`;

                renderCart();
            } else {
                msg.style.color = '#ff3333';
                msg.innerText = 'INVALID OR EXPIRED CODE!';
            }
        }

        // Вешаем событие на кнопку промокода
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', applyPromoCode);
        }

        // Добавление товара
        buyButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const itemRow = btn.closest('.product-bar');
                const qtyInput = itemRow.querySelector('.qty-input');
                const qty = parseInt(qtyInput.value) || 1;
                const name = btn.getAttribute('data-name');
                const price = parseFloat(btn.getAttribute('data-price'));

                const existingItem = cart.find(i => i.name === name);
                if (existingItem) {
                    existingItem.qty += qty;
                } else {
                    cart.push({ name, price, qty });
                }

                renderCart();

                const originalText = btn.textContent;
                btn.textContent = 'ADDED!';
                btn.style.backgroundColor = '#00aa00';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '';
                }, 1000);
            });
        });

        // Удаление товара из корзины
        cartItemsBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const index = e.target.getAttribute('data-index');
                cart.splice(index, 1);
                renderCart();
            }
        });

        // Оформление заказа
        if (placeOrderBtn) {
            placeOrderBtn.addEventListener('click', () => {
                const msgBox = document.getElementById('msg-box').value.trim();
                const address = document.getElementById('delivery-address').value.trim();

                if (cart.length === 0) {
                    checkoutMsg.style.color = '#ff3333';
                    checkoutMsg.textContent = 'ERROR: CART IS EMPTY!';
                    return;
                }

                if (!msgBox || !address) {
                    checkoutMsg.style.color = '#ffaa00';
                    checkoutMsg.textContent = 'PLEASE FILL IN MESSAGE BOX & ADDRESS!';
                    return;
                }

                checkoutMsg.style.color = '#00ff00';
                checkoutMsg.textContent = `ORDER RECEIVED! DISPATCHED TO ${msgBox.toUpperCase()}. WE KNOW WHERE YOU LIVE.`;

                cart = [];
                currentDiscountPercent = 0;
                currentFixedDiscount = 0;
                document.getElementById('promo-input').value = '';
                document.getElementById('promo-message').innerText = '';

                renderCart();
                document.getElementById('msg-box').value = '';
                document.getElementById('delivery-address').value = '';
            });
        }

        // Запуск при старте
        renderCart();
    }
});