// Ждем полной загрузки HTML
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('main-btn');

    if (button) {
        button.addEventListener('click', () => {
            alert('Кнопка работает! Интерактив подключен.');
        });
    } else {
        console.error('Кнопка с id="main-btn" не найдена!');
    }
});