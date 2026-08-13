document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = !!document.getElementById('login-form');
    const isStorePage = !!document.getElementById('cart-items-body');
    const isServicesPage = !!document.querySelector('.services-card');
    const isForumPage = !!document.getElementById('bbs-posts');

    const navSignin = document.getElementById('nav-signin');
    const navStore = document.getElementById('nav-store');
    const navServices = document.getElementById('nav-services');
    const navForum = document.getElementById('nav-forum');
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

    // Посимвольная печать текста (тип-эффект терминала)
    function typeMessage(el, text, speed = 25, done) {
        el.textContent = "";
        let i = 0;
        const timer = setInterval(() => {
            el.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                if (done) done();
            }
        }, speed);
    }

    // Краткий сдвиг кадров (глитч) на блоке
    function triggerGlitch(el) {
        if (!el) return;
        el.classList.remove('glitching');
        void el.offsetWidth; // рестарт CSS-анимации
        el.classList.add('glitching');
    }

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

    // 1a. ЗАЩИТА СТРАНИЦЫ УСЛУГ
    if (isServicesPage) {
        const isAuth = urlParams.get('auth') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
        if (!isAuth) {
            window.location.href = 'index.html';
            return;
        }

        // Инициализация лотов услуг
        initServices();
    }

    // 1b. ЗАЩИТА СТРАНИЦЫ ФОРУМА
    if (isForumPage) {
        const isAuth = urlParams.get('auth') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
        if (!isAuth) {
            window.location.href = 'index.html';
            return;
        }

        // Инициализация гостевой книги
        initForum();
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

            // Глитч-сдвиг кадров при нажатии LOGIN
            triggerGlitch(document.querySelector('.main-card'));

            if (username === "Starkweather" && password === "nastyscum") {
                sessionStorage.setItem('isLoggedIn', 'true');
                setTimeout(() => {
                    window.location.href = 'store.html?auth=true';
                }, 550);
            } else {
                passwordInput.value = "";
                typeMessage(errorMsg, "ACCESS DENIED: Invalid credentials");
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
                if (errorMsg) typeMessage(errorMsg, "ACCESS DENIED: Please login first!");
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    if (navServices) {
        navServices.addEventListener('click', () => {
            const isAuth = urlParams.get('auth') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
            if (isAuth) {
                window.location.href = 'services.html?auth=true';
            } else if (isLoginPage) {
                const errorMsg = document.getElementById('error-msg');
                if (errorMsg) typeMessage(errorMsg, "ACCESS DENIED: Members only!");
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    if (navForum) {
        navForum.addEventListener('click', () => {
            const isAuth = urlParams.get('auth') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true';
            if (isAuth) {
                window.location.href = 'forum.html?auth=true';
            } else if (isLoginPage) {
                const errorMsg = document.getElementById('error-msg');
                if (errorMsg) typeMessage(errorMsg, "ACCESS DENIED: Members only!");
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

    // ================= ЛОГИКА УСЛУГ (SERVICES) =================
    function initServices() {

        // Кнопки HIRE
        document.querySelectorAll('.hire-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const originalText = btn.textContent;
                btn.textContent = 'CONFIRMED';
                btn.classList.add('hire-btn-active');
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('hire-btn-active');
                }, 1200);
            });
        });

        // Форма запроса услуги
        const submitBtn = document.getElementById('req-submit-btn');
        const output = document.getElementById('req-msg-out');

        if (submitBtn && output) {
            submitBtn.addEventListener('click', () => {
                const name = document.getElementById('req-name').value.trim();
                const pager = document.getElementById('req-pager').value.trim();
                const lot = document.getElementById('req-lot').value.trim();

                if (!name || !pager || !lot) {
                    output.style.color = '#ffaa00';
                    output.textContent = 'FILL IN ALL FIELDS, MEMBER!';
                    return;
                }

                output.style.color = '#00ff00';
                typeMessage(output, `REQUEST RECEIVED. LOT ${lot.toUpperCase()} ASSIGNED. OUR HUNTERS WILL PAGE ${pager.toUpperCase()}. DO NOT CALL US.`);

                document.getElementById('req-name').value = '';
                document.getElementById('req-pager').value = '';
                document.getElementById('req-lot').value = '';
                document.getElementById('req-msg').value = '';
            });
        }
    }

    // ================= ЛОГИКА ФОРУМА (GUESTBOOK / BBS) =================
    function initForum() {
        const STORAGE_KEY = 'vve_guestbook_posts';
        const MODERATOR_NICKS = ['VALIANT', 'MANAGEMENT'];

        // Первичные посты, если в хранилище пусто
        function seedPosts() {
            const now = Date.now();
            const min = 60 * 1000;
            return [
                {
                    nick: 'MANAGEMENT',
                    text: 'WELCOME TO THE VALIANT VIDEO BULLETIN BOARD.\nLEAVE YOUR ORDERS. LEAVE YOUR HATE. LEAVE NOTHING ELSE.\nTHE BOARD IS ALWAYS WATCHED. — MANAGEMENT',
                    ts: now - 3 * min,
                    mod: true
                },
                {
                    nick: 'PIG_FODDER',
                    text: 'anyone got the number for the wardogs? got a runner that needs pacifying. got the cash. no questions asked, no questions answered.',
                    ts: now - 2 * min,
                    mod: false
                },
                {
                    nick: 'REGULAR_DUST',
                    text: 'saw a tape the other night. you know the one. the guy in the corner lot. the sound stayed with me all week. keep up the good product, management.',
                    ts: now - 1 * min,
                    mod: false
                }
            ];
        }

        function loadPosts() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch (e) {}
            const seeded = seedPosts();
            savePosts(seeded);
            return seeded;
        }

        function savePosts(posts) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
            } catch (e) {}
        }

        function formatTime(ts) {
            const d = new Date(ts);
            const p = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
        }

        function renderPosts(posts) {
            const container = document.getElementById('bbs-posts');
            const countEl = document.getElementById('bbs-count');
            const lastEl = document.getElementById('bbs-last');

            container.innerHTML = '';

            countEl.textContent = posts.length;
            lastEl.textContent = posts.length ? posts[posts.length - 1].nick : '-';

            if (posts.length === 0) {
                container.innerHTML = `<div class="bbs-empty">NO POSTS. THE BOARD IS EMPTY. LIKE YOUR FUTURE.</div>`;
                return;
            }

            posts.forEach((post, idx) => {
                const isMod = post.mod || MODERATOR_NICKS.includes(String(post.nick).toUpperCase());

                const el = document.createElement('div');
                el.className = 'bbs-post';

                const meta = document.createElement('div');
                meta.className = 'bbs-post-meta';

                const nick = document.createElement('span');
                nick.className = 'bbs-post-nick' + (isMod ? ' moderator' : '');
                nick.textContent = isMod ? `★ ${post.nick}` : `» ${post.nick}`;

                const stamp = document.createElement('span');
                stamp.textContent = `#${String(idx + 1).padStart(3, '0')} :: ${formatTime(post.ts)}`;

                meta.appendChild(nick);
                meta.appendChild(stamp);

                const body = document.createElement('div');
                body.className = 'bbs-post-text';
                body.textContent = post.text;

                el.appendChild(meta);
                el.appendChild(body);

                if (isMod) {
                    const flag = document.createElement('div');
                    flag.className = 'bbs-mod-flag';
                    flag.textContent = '● MODERATED BY VALIANT';
                    el.appendChild(flag);
                }

                container.appendChild(el);
            });
        }

        let posts = loadPosts();
        renderPosts(posts);

        // Фейковое число онлайн
        const onlineEl = document.getElementById('bbs-online');
        if (onlineEl) {
            onlineEl.textContent = 3 + Math.floor(Math.random() * 17);
        }

        // Публикация поста
        const postBtn = document.getElementById('bbs-post-btn');
        const nickInput = document.getElementById('bbs-nick');
        const textInput = document.getElementById('bbs-text');
        const msgEl = document.getElementById('bbs-msg');

        if (postBtn && nickInput && textInput) {
            postBtn.addEventListener('click', () => {
                const nick = nickInput.value.trim().toUpperCase() || 'ANON';
                const text = textInput.value.trim();

                if (!text) {
                    msgEl.style.color = '#ffcc00';
                    msgEl.textContent = 'ERROR: MESSAGE REQUIRED!';
                    return;
                }

                const isMod = MODERATOR_NICKS.includes(nick);
                posts.push({ nick, text, ts: Date.now(), mod: isMod });
                savePosts(posts);
                renderPosts(posts);

                textInput.value = '';
                nickInput.value = '';

                msgEl.style.color = '#33ff33';
                typeMessage(msgEl, `POST RECEIVED. THANKS FOR SHARING, ${nick}.`);
            });
        }
    }
});