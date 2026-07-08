document.addEventListener('DOMContentLoaded', () => {
    console.log('Nordes Story App Inicializado com sucesso! 🚀');
    
    // Add scroll header effect (agora existe um <header> por aba)
    const headers = document.querySelectorAll('header');
    window.addEventListener('scroll', () => {
        const shadow = window.scrollY > 10 ? '0 2px 10px rgba(0,0,0,0.05)' : 'none';
        headers.forEach(header => {
            header.style.boxShadow = shadow;
        });
    });
});
