document.addEventListener('DOMContentLoaded', () => {
    // Находим экраны
    const loginScreen = document.getElementById('login-screen');
    const storeScreen = document.getElementById('store-screen');

    // Находим элементы формы
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');

    // Находим кнопки навигации
    const navSignin = document.getElementById('nav-signin');
    const navStore = document.getElementById('nav-store');
    const logoutBtn = document.getElementById('logout-btn');

    // Функция переключения активной вкладки
    function showScreen(screenToShow) {
        if (screenToShow === 'login') {
            loginScreen.classList.remove('hidden');
            storeScreen.classList.add('hidden');

            // Подсветка кнопок
            navSignin.classList.add('active');
            navStore.classList.remove('active');
        } else if (screenToShow === 'store') {
            loginScreen.classList.add('hidden');
            storeScreen.classList.remove('hidden');

            // Подсветка кнопок
            navStore.classList.add('active');
            navSignin.classList.remove('active');
        }
    }

    // 1. Успешный вход через форму
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            if (username === "Starkweather" && password === "nastyscum") {
                showScreen('store');
                errorMsg.textContent = '';
            } else {
                errorMsg.textContent = "ACCESS DENIED: Invalid credentials";
                passwordInput.value = "";
            }
        });
    }

    // 2. Клик по верхней кнопке "Sign-in"
    if (navSignin) {
        navSignin.addEventListener('click', () => {
            showScreen('login');
        });
    }

    // 3. Клик по верхней кнопке "Adult Store"
    if (navStore) {
        navStore.addEventListener('click', () => {
            showScreen('store');
        });
    }

    // 4. Клик по кнопке "Sign-out / Return" внутри магазина
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showScreen('login');
            usernameInput.value = '';
            passwordInput.value = '';
        });
    }
});