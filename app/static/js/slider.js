document.addEventListener('DOMContentLoaded', () => {
    const scrolls = document.querySelectorAll('.moments-scroll, .arrivals-scroll');

    scrolls.forEach(scroll => {
        let isDown = false;
        let startX;
        let scrollLeft;

        scroll.addEventListener('mousedown', (e) => {
            isDown = true;
            scroll.classList.add('active');
            startX = e.pageX - scroll.offsetLeft;
            scrollLeft = scroll.scrollLeft;
        });

        scroll.addEventListener('mouseleave', () => {
            isDown = false;
            scroll.classList.remove('active');
        });

        scroll.addEventListener('mouseup', () => {
            isDown = false;
            scroll.classList.remove('active');
        });

        scroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scroll.offsetLeft;
            const walk = (x - startX) * 2;
            scroll.scrollLeft = scrollLeft - walk;
        });
    });
});
