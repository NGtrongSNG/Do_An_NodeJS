(function ($) {
    "use strict";
    
    // 1. Dropdown khi di chuột qua (Dành cho Navbar)
    $(document).ready(function () {
        function toggleNavbarMethod() {
            if ($(window).width() > 992) {
                $('.navbar .dropdown').on('mouseover', function () {
                    $('.dropdown-toggle', this).trigger('click');
                }).on('mouseout', function () {
                    $('.dropdown-toggle', this).trigger('click').blur();
                });
            } else {
                $('.navbar .dropdown').off('mouseover').off('mouseout');
            }
        }
        toggleNavbarMethod();
        $(window).resize(toggleNavbarMethod);
    });
    
    // 2. Nút cuộn lên đầu trang (Back to top)
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // 3. Slide bản tin chính (Phần em muốn giữ lại và làm đẹp)
    $(".main-carousel").owlCarousel({
        autoplay: true,        // Tự động chuyển slide
        smartSpeed: 1000,      // Tốc độ chuyển mượt mà (1 giây)
        items: 1,              // Luôn hiện 1 bản tin lớn
        dots: true,            // Hiện dấu chấm chuyển trang bên dưới
        loop: true,            // Lặp lại vô tận
    });

    // 4. Slide tin vắn (Trending) - Nếu em còn dùng ở trên Navbar
    $(".tranding-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        items: 1,
        dots: false,
        loop: true,
        nav : true,
        navText : [
            '<i class="fa fa-angle-left"></i>',
            '<i class="fa fa-angle-right"></i>'
        ]
    });

})(jQuery);