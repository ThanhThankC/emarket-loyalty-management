// Hàm bật/tắt hiển thị mật khẩu
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.nextElementSibling;
    if (input.type === "password") {
        input.type = "text";
        btn.textContent = "Ẩn";
    } else {
        input.type = "password";
        btn.textContent = "Hiện";
    }
}

// Hàm làm sạch thông báo lỗi
function clearErrors() {
    const errors = document.querySelectorAll('.error-message');
    errors.forEach(err => {
        err.style.display = 'none';
        err.textContent = '';
    });
}

// Hiển thị lỗi
function showError(inputId, message) {
    const errorDiv = document.getElementById(`${inputId}-error`);
    if(errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Xử lý sự kiện đăng ký theo Business Rules của Use Case
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    clearErrors();

    const fullname = document.getElementById('fullname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    let isValid = true;

    // BR2: Các trường Họ tên, Số điện thoại, Mật khẩu là bắt buộc [cite: 2]
    if (!fullname) {
        showError('fullname', 'Vui lòng nhập họ và tên');
        isValid = false;
    }

    if (!phone) {
        showError('phone', 'Vui lòng nhập số điện thoại');
        isValid = false;
    }

    if (!password) {
        showError('password', 'Vui lòng nhập mật khẩu');
        isValid = false;
    } else if (password.length < 6) {
        showError('password', 'Mật khẩu phải có tối thiểu 6 ký tự');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showError('confirm-password', 'Mật khẩu xác nhận không khớp');
        isValid = false;
    }

    // 6a: Thông tin nhập không hợp lệ hoặc bỏ trống trường bắt buộc -> hiển thị lỗi [cite: 2]
    if (!isValid) return;

    const btn = document.getElementById('submitBtn');
    btn.textContent = "Đang xử lý...";
    btn.disabled = true;

    // Mô phỏng quá trình xử lý đăng ký < 2 giây [cite: 2]
    setTimeout(() => {
        // BR1: Số điện thoại hoặc Email đăng ký phải là duy nhất [cite: 2]
        // 7a: Số điện thoại hoặc Email đã tồn tại -> hiển thị thông báo [cite: 2]
        if (phone === "0912001001") { 
            alert("Số điện thoại đã tồn tại. Vui lòng đăng nhập!");
        } else {
            // 8-11: Tạo tài khoản, lưu thông tin, thông báo và chuyển hướng [cite: 2]
            alert("Đăng ký thành công!");
            // Chuyển khách hàng đến trang chủ hoặc màn hình đăng nhập [cite: 2]
            // window.location.href = "login.html"; 
        }
        
        btn.textContent = "Tạo tài khoản";
        btn.disabled = false;
    }, 1000); 
});