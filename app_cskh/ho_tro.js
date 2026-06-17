/* ==========================
   UC12 - Hỗ trợ khách hàng
========================== */

let khachHangDangChon = null;
let daXacMinh = false;

/* Dữ liệu demo */
const dsKhachHang = [
    { maKH: "KH001", hoTen: "Nguyễn Văn A", sdt: "0901234567", hangThe: "Vàng", diem: 2500 },
    { maKH: "KH002", hoTen: "Trần Thị B", sdt: "0912345678", hangThe: "Bạc", diem: 1200 },
    { maKH: "KH003", hoTen: "Lê Văn C", sdt: "0988888888", hangThe: "Kim Cương", diem: 5000 }
];

/* Chương trình ưu đãi mẫu dựa trên Hạng thẻ (Phục vụ Luồng 6a) */
const chuongTrinhUuDai = {
    "Bạc": "Chương trình 'Tích điểm liền tay': Nhân hệ số tích điểm x1.2 cho hóa đơn tiếp theo.",
    "Vàng": "Chương trình 'Khách hàng thân thiết VIP Gold': Tặng voucher giảm 10% dịch vụ sinh nhật và phòng chờ hạng thương gia.",
    "Kim Cương": "Chương trình 'Đặc quyền Diamond': Miễn phí nâng cấp hạng phòng, dịch vụ đưa đón sân bay và nhân hệ số tích điểm x2.0."
};

/* Khởi tạo */
document.addEventListener("DOMContentLoaded", function () {
    const actionCards = document.querySelectorAll(".ho-tro-action");
    actionCards.forEach(function(card){
        card.addEventListener("click", function(){
            if(!daXacMinh) {
                alert("Vui lòng thực hiện xác minh khách hàng trước khi chọn yêu cầu.");
                return;
            }

            actionCards.forEach(function(item){
                item.classList.remove("active");
            });

            this.classList.add("active");
            const selectedValue = this.dataset.value;
            document.getElementById("loaiYeuCau").value = selectedValue;

            // Xử lý các luồng rẽ nhánh (Alternative Flows) theo tài liệu Đặc tả
            xuLyReNhanh(selectedValue);
        });
    });
});

/* Hàm xử lý luồng rẽ nhánh cụ thể */
function xuLyReNhanh(value) {
    const consultingDiv = document.getElementById("dynamicConsulting");
    const txtArea = document.getElementById("ketQuaHoTro");

    // Ẩn vùng thông tin tư vấn trước khi tính toán lại
    consultingDiv.style.display = "none";

    switch(value) {
        case "tu_van": // Alternative Flow 6a
            if(khachHangDangChon) {
                const uuDai = chuongTrinhUuDai[khachHangDangChon.hangThe] || "Hiện chưa có chương trình riêng cho hạng thẻ này.";
                consultingDiv.innerHTML = `<strong>[Gợi ý 6a]</strong> Khách hàng hạng <b>${khachHangDangChon.hangThe}</b> (${khachHangDangChon.diem} điểm). <br>${uuDai}`;
                consultingDiv.style.display = "block";
                txtArea.value = `Đã tư vấn cho khách hàng về: ${uuDai}`;
            }
            break;

        case "the": // Alternative Flow 6b
            if(confirm("Hệ thống sẽ chuyển tiếp sang chức năng Quản lý thẻ thành viên (UC2). Bạn có muốn tiếp tục?")) {
                // Thay thế link tương ứng của file cấp/đổi thẻ trên hệ thống của bạn
                window.location.href = "../app_cskh/quan_ly_the.html?maKH=" + khachHangDangChon.maKH; 
            }
            break;

        case "qua": // Alternative Flow 6c
            if(confirm("Hệ thống sẽ chuyển tiếp sang chức năng Đổi điểm / Nhận quà voucher (UC9). Bạn có muốn tiếp tục?")) {
                // Thay thế link tương ứng của file đổi quà trên hệ thống của bạn
                window.location.href = "../app_cskh/doi_qua.html?maKH=" + khachHangDangChon.maKH;
            }
            break;

        case "chuong_trinh": // Alternative Flow 6d
            // Gợi ý điều kiện (ví dụ: cần trên 2000 điểm để đăng ký chương trình đặc biệt)
            if(khachHangDangChon.diem >= 2000) {
                consultingDiv.innerHTML = `<strong>[Kiểm tra điều kiện 6d]</strong> Khách hàng ĐỦ ĐIỀU KIỆN tham gia chương trình Trải nghiệm đặc quyền (Yêu cầu > 2000 điểm).`;
                consultingDiv.style.display = "block";
                txtArea.value = `Ghi nhận khách hàng đăng ký tham gia chương trình Trải nghiệm đặc quyền thành công.`;
            } else {
                consultingDiv.innerHTML = `<strong>[Kiểm tra điều kiện 6d]</strong> Khách hàng KHÔNG ĐỦ ĐIỀU KIỆN tham gia (Yêu cầu tích lũy tối thiểu 2000 điểm).`;
                consultingDiv.style.display = "block";
                txtArea.value = `Khách hàng không đủ điều kiện tham gia chương trình do thiếu điểm tích lũy.`;
            }
            break;
    }
}

/* Tìm khách hàng */
function timKhachHang(){
    const keyword = document.getElementById("txtSearch").value.trim();

    if(keyword === ""){
        alert("Vui lòng nhập mã khách hàng hoặc số điện thoại");
        return;
    }

    const kh = dsKhachHang.find(function(item){
        return (
            item.maKH.toLowerCase() === keyword.toLowerCase() || item.sdt === keyword
        );
    });

    if(!kh){
        alert("Không tìm thấy khách hàng");
        return;
    }

    khachHangDangChon = kh;

    document.getElementById("maKH").value = kh.maKH;
    document.getElementById("hoTenKH").value = kh.hoTen;
    document.getElementById("sdtKH").value = kh.sdt;
    document.getElementById("hangTheKH").value = kh.hangThe;
    document.getElementById("diemKH").innerText = kh.diem;

    // Reset lại trạng thái xác minh nếu tìm kiếm một khách hàng khác
    daXacMinh = false;
    document.getElementById("trangThaiXacMinh").innerHTML = '<span class="badge b-pend">Chưa xác minh</span>';
    
    // Ẩn các khu vực phía dưới cho đến khi bấm nút xác minh
    document.getElementById("supportSection").classList.add("ho-tro-hidden");
    document.getElementById("resultSection").classList.add("ho-tro-hidden");

    document.getElementById("khachHangInfo").classList.remove("ho-tro-hidden");
    alert("Đã tìm thấy thông tin khách hàng. Vui lòng thực hiện đối chiếu và xác minh.");
}

/* Xác minh khách hàng */
function xacMinhKH(){
    if(!khachHangDangChon){
        alert("Chưa chọn khách hàng");
        return;
    }

    daXacMinh = true;
    document.getElementById("trangThaiXacMinh").innerHTML = '<span class="badge b-done">Đã xác minh</span>';

    document.getElementById("supportSection").classList.remove("ho-tro-hidden");
    document.getElementById("resultSection").classList.remove("ho-tro-hidden");

    alert("Xác minh khách hàng thành công. Ghi nhận mở các chức năng xử lý.");
}

/* Xử lý yêu cầu */
function xuLyYeuCau(){
    if(!daXacMinh){
        alert("Vui lòng xác minh khách hàng trước");
        return;
    }

    const loai = document.getElementById("loaiYeuCau").value;
    const noiDung = document.getElementById("ketQuaHoTro").value.trim();

    if(loai === ""){
        alert("Vui lòng chọn loại yêu cầu");
        return;
    }

    if(noiDung === ""){
        alert("Vui lòng nhập nội dung hỗ trợ");
        return;
    }

    const phieuHoTro = {
        maKH: khachHangDangChon.maKH,
        tenKH: khachHangDangChon.hoTen,
        loaiYeuCau: loai,
        noiDung: noiDung,
        thoiGian: new Date().toLocaleString()
    };

    console.log("PHIẾU HỖ TRỢ ĐÃ GHI NHẬN (Bước 8):", phieuHoTro);
    alert("Hệ thống đã ghi nhận kết quả hỗ trợ thành công.");
    resetForm();
}

/* Reset form */
function resetForm(){
    daXacMinh = false;
    khachHangDangChon = null;

    document.getElementById("txtSearch").value = "";
    document.getElementById("ketQuaHoTro").value = "";
    document.getElementById("loaiYeuCau").value = "";
    document.getElementById("dynamicConsulting").style.display = "none";
    document.getElementById("dynamicConsulting").innerHTML = "";

    document.querySelectorAll(".ho-tro-action").forEach(function(item){
        item.classList.remove("active");
    });

    document.getElementById("khachHangInfo").classList.add("ho-tro-hidden");
    document.getElementById("supportSection").classList.add("ho-tro-hidden");
    document.getElementById("resultSection").classList.add("ho-tro-hidden");
}