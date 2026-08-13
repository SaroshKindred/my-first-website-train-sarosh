document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = !!document.getElementById('login-form');
    const isStorePage = !!document.querySelector('.store-card');

    const navSignin = document.getElementById('nav-signin');
    const navStore = document.getElementById('nav-store');
    const logoutBtn = document.getElementById('logout-btn');

    const urlParams = new URLSearchParams(window.location.search);

    // ВАЖНО: При заходе на index.html — всегда очищаем сессию
    if (isLoginPage) {
        localStorage.removeItem('isLoggedIn');
    }

    // 1. ЗАЩИТА СТРАНИЦЫ МАГАЗИНА
    if (isStorePage) {
        const isAuth = urlParams.get('auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
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
                localStorage.setItem('isLoggedIn', 'true');
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
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    if (navStore) {
        navStore.addEventListener('click', () => {
            const isAuth = urlParams.get('auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
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
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    // ================= ЛОГИКА КОРЗИНЫ =================
    function initCart() {
        let cart = JSON.parse(localStorage.getItem('userCart')) || [];

        const buyButtons = document.querySelectorAll('.buy-btn');
        const cartItemsBody = document.getElementById('cart-items-body');
        const cartTotalPrice = document.getElementById('cart-total-price');
        const cartCount = document.getElementById('cart-count');
        const placeOrderBtn = document.getElementById('place-order-btn');
        const checkoutMsg = document.getElementById('checkout-msg');

        // Функция отрисовки содержимого корзины
        function renderCart() {
            cartItemsBody.innerHTML = '';
            let totalSum = 0;
            let totalCount = 0;

            if (cart.length === 0) {
                cartItemsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777;">Your cart is empty.</td></tr>`;
            } else {
                cart.forEach((item, index) => {
                    const itemTotal = item.price * item.qty;
                    totalSum += itemTotal;
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

            cartTotalPrice.textContent = `$${totalSum.toFixed(2)}`;
            cartCount.textContent = totalCount;
            localStorage.setItem('userCart', JSON.stringify(cart));
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

                // Эффект подсвечивания кнопки
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

        // Оформление заказа (косметический сабмит)
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

                // Успешный косметический «заказ»
                checkoutMsg.style.color = '#00ff00';
                checkoutMsg.textContent = `ORDER RECEIVED! DISPATCHED TO ${msgBox.toUpperCase()}. WE KNOW WHERE YOU LIVE.`;

                // Очищаем корзину и инпуты
                cart = [];
                renderCart();
                document.getElementById('msg-box').value = '';
                document.getElementById('delivery-address').value = '';
            });
        }

        // Запуск при старте
        renderCart();
    }
});