document.addEventListener('DOMContentLoaded', () => {
    const isLoginPage = !!document.getElementById('login-form');
    const isStorePage = !!document.querySelector('.store-card');

    const navSignin = document.getElementById('nav-signin');
    const navStore = document.getElementById('nav-store');
    const logoutBtn = document.getElementById('logout-btn');

    const urlParams = new URLSearchParams(window.location.search);

    // ВАЖНО: Если пользователь зашел на страницу входа (index.html) — сбрасываем авторизацию!
    if (isLoginPage) {
        localStorage.removeItem('isLoggedIn');
    }

    // 1. ЗАЩИТА СТРАНИЦЫ МАГАЗИНА (store.html)
    if (isStorePage) {
        const isAuth = urlParams.get('auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';
        if (!isAuth) {
            // Если не авторизован — выкидываем на index.html
            window.location.href = 'index.html';
            return;
        }
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

    // 3. НАВИГАЦИЯ В ВЕРХНЕМ МЕНЮ
    if (navSignin) {
        navSignin.addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
        });
    }

    if (navStore) {
        navStore.addEventListener('click', () => {
            // Проверяем статус входа прямо в момент клика
            const isAuth = urlParams.get('auth') === 'true' || localStorage.getItem('isLoggedIn') === 'true';

            if (isAuth) {
                window.location.href = 'store.html?auth=true';
            } else {
                if (isLoginPage) {
                    const errorMsg = document.getElementById('error-msg');
                    if (errorMsg) {
                        errorMsg.textContent = "ACCESS DENIED: Please login first!";
                    }
                } else {
                    window.location.href = 'index.html';
                }
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
});