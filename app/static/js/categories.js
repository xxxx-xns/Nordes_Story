document.addEventListener('DOMContentLoaded', () => {
    const categories = document.querySelectorAll('.category-item');

    categories.forEach(category => {
        category.addEventListener('click', (e) => {
            e.preventDefault();
            console.log(`Categoria selecionada: ${category.querySelector('span').innerText}`);
        });
    });
});
