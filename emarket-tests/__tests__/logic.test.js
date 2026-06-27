// logic.test.js
// Unit test cho business logic của eMarket Loyalty
// Không cần DOM, không cần network — test thuần JS

const {
  validateDangKy,
  validateThemMoiKhachHang,
  validateDangNhap,
  validateSuKienKhuyenMai,
  kiemTraHanDoiTra,
  kiemTraDuDiem,
  tinhDiemConLai,
  filterByGiftType,
  exchangeDescription,
  escapeHtml,
  tinhDiemTuMuaHang,
  xacDinhHang,
} = require('../src/logic');

// =============================================================================
//  UC: Đổi trả hàng
// =============================================================================
describe('kiemTraHanDoiTra', () => {
  // Trường hợp lỗi: đã quá 15 ngày, không được đổi trả hàng
  test('đã quá 15 ngày -> không được đổi trả hàng', () => {
    const { isValid, soNgayDaQua, error } = kiemTraHanDoiTra('2026-06-01', '2026-06-17');

    expect(isValid).toBe(false);
    expect(soNgayDaQua).toBe(16);
    expect(error).toBeDefined();
  });

  // Trường hợp biên: đúng 15 ngày, được phép trả hàng
  test('đúng 15 ngày -> được phép trả hàng', () => {
    const { isValid, soNgayDaQua, error } = kiemTraHanDoiTra('2026-06-01', '2026-06-16');

    expect(isValid).toBe(true);
    expect(soNgayDaQua).toBe(15);
    expect(error).toBeNull();
  });

  // Trường hợp đúng: dưới 15 ngày, được phép đổi trả
  test('dưới 15 ngày -> được phép đổi trả', () => {
    const { isValid, soNgayDaQua, error } = kiemTraHanDoiTra('2026-06-01', '2026-06-10');

    expect(isValid).toBe(true);
    expect(soNgayDaQua).toBe(9);
    expect(error).toBeNull();
  });
});

// =============================================================================
//  UC: Nhân viên CSKH tạo sự kiện khuyến mãi cho khách hàng
// =============================================================================
describe('validateSuKienKhuyenMai', () => {
  const validEventDates = {
    ngayBatDau: '2026-06-27',
    ngayKetThuc: '2026-06-30',
  };

  // BR1 - Trường hợp biên: ngày bắt đầu và ngày kết thúc trùng nhau thì thỏa mãn
  test('ngày bắt đầu và ngày kết thúc trùng nhau -> hợp lệ', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({
      ngayBatDau: '2026-06-27',
      ngayKetThuc: '2026-06-27',
    });

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // BR1 - Trường hợp lỗi: ngày kết thúc trước ngày bắt đầu
  test('ngày kết thúc trước ngày bắt đầu -> lỗi ngayKetThuc', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({
      ngayBatDau: '2026-06-27',
      ngayKetThuc: '2026-06-26',
    });

    expect(isValid).toBe(false);
    expect(errors.ngayKetThuc).toBeDefined();
  });

  // BR1 - Trường hợp đúng: ngày kết thúc sau ngày bắt đầu
  test('ngày kết thúc sau ngày bắt đầu -> hợp lệ', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({
      ngayBatDau: '2026-06-27',
      ngayKetThuc: '2026-06-30',
    });

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // BR2 - Trường hợp lỗi: số lượng quà tặng là số âm hoặc bằng 0
  test('số lượng quà tặng âm hoặc bằng 0 -> lỗi soLuongQuaTang', () => {
    const soLuongAm = validateSuKienKhuyenMai({ ...validEventDates, soLuongQuaTang: -1 });
    const soLuongBangKhong = validateSuKienKhuyenMai({ ...validEventDates, soLuongQuaTang: 0 });

    expect(soLuongAm.isValid).toBe(false);
    expect(soLuongAm.errors.soLuongQuaTang).toBeDefined();
    expect(soLuongBangKhong.isValid).toBe(false);
    expect(soLuongBangKhong.errors.soLuongQuaTang).toBeDefined();
  });

  // BR2 - Trường hợp biên: số lượng quà tặng bằng 1 thì thỏa mãn
  test('số lượng quà tặng bằng 1 -> hợp lệ', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({ ...validEventDates, soLuongQuaTang: 1 });

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // BR2 - Trường hợp đúng: số lượng quà tặng là một số rất lớn
  test('số lượng quà tặng rất lớn -> hợp lệ', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({ ...validEventDates, soLuongQuaTang: 1000000 });

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // BR3 - Trường hợp lỗi: điểm đổi là số âm hoặc bằng 0
  test('điểm đổi âm hoặc bằng 0 -> lỗi diemDoi', () => {
    const diemAm = validateSuKienKhuyenMai({ ...validEventDates, diemDoi: -1 });
    const diemBangKhong = validateSuKienKhuyenMai({ ...validEventDates, diemDoi: 0 });

    expect(diemAm.isValid).toBe(false);
    expect(diemAm.errors.diemDoi).toBeDefined();
    expect(diemBangKhong.isValid).toBe(false);
    expect(diemBangKhong.errors.diemDoi).toBeDefined();
  });

  // BR3 - Trường hợp biên: điểm đổi bằng 1 thì thỏa mãn
  test('điểm đổi bằng 1 -> hợp lệ', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({ ...validEventDates, diemDoi: 1 });

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // BR3 - Trường hợp đúng: điểm đổi là một số rất lớn
  test('điểm đổi rất lớn -> hợp lệ', () => {
    const { isValid, errors } = validateSuKienKhuyenMai({ ...validEventDates, diemDoi: 1000000 });

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });
});

// =============================================================================
//  UC: Đăng nhập của cả 3 app
// =============================================================================
describe('validateDangNhap', () => {
  const loginFixtures = [
    {
      appName: 'app_kh',
      validInput: { taiKhoan: 'khachhang01', matKhau: 'kh123456' },
      danhSachTaiKhoan: [
        { taiKhoan: 'khachhang01', matKhau: 'kh123456', vaiTro: 'khach_hang' },
      ],
    },
    {
      appName: 'app_tn',
      validInput: { taiKhoan: 'thungan01', matKhau: 'tn123456' },
      danhSachTaiKhoan: [
        { taiKhoan: 'thungan01', matKhau: 'tn123456', vaiTro: 'thu_ngan' },
      ],
    },
    {
      appName: 'app_cskh',
      validInput: { taiKhoan: 'cskh01', matKhau: 'cs123456' },
      danhSachTaiKhoan: [
        { taiKhoan: 'cskh01', matKhau: 'cs123456', vaiTro: 'cskh' },
      ],
    },
  ];

  describe.each(loginFixtures)('$appName', ({ validInput, danhSachTaiKhoan }) => {
    // TC1: Đăng nhập thành công khi cả tài khoản và mật khẩu đều đúng
    test('tài khoản và mật khẩu đúng -> đăng nhập thành công', () => {
      const { isValid, errors, user } = validateDangNhap(validInput, danhSachTaiKhoan);

      expect(isValid).toBe(true);
      expect(errors).toEqual({});
      expect(user).toMatchObject(validInput);
    });

    // TC2: Đăng nhập thất bại khi nhập thiếu tài khoản hoặc mật khẩu
    test('thiếu tài khoản hoặc mật khẩu -> đăng nhập thất bại', () => {
      const thieuTaiKhoan = validateDangNhap({ ...validInput, taiKhoan: '' }, danhSachTaiKhoan);
      const thieuMatKhau = validateDangNhap({ ...validInput, matKhau: '' }, danhSachTaiKhoan);

      expect(thieuTaiKhoan.isValid).toBe(false);
      expect(thieuTaiKhoan.errors.taiKhoan).toBeDefined();
      expect(thieuMatKhau.isValid).toBe(false);
      expect(thieuMatKhau.errors.matKhau).toBeDefined();
    });

    // TC3: Đăng nhập thất bại do tên tài khoản không có trong CSDL
    test('tên tài khoản không có trong CSDL -> đăng nhập thất bại', () => {
      const { isValid, errors, user } = validateDangNhap(
        { ...validInput, taiKhoan: 'tai_khoan_khong_ton_tai' },
        danhSachTaiKhoan
      );

      expect(isValid).toBe(false);
      expect(errors.taiKhoan).toBeDefined();
      expect(user).toBeNull();
    });

    // TC4: Đăng nhập thất bại do sai mật khẩu
    test('sai mật khẩu -> đăng nhập thất bại', () => {
      const { isValid, errors, user } = validateDangNhap(
        { ...validInput, matKhau: 'sai_mat_khau' },
        danhSachTaiKhoan
      );

      expect(isValid).toBe(false);
      expect(errors.matKhau).toBeDefined();
      expect(user).toBeNull();
    });
  });
});

// =============================================================================
//  UC: Thu ngân thêm mới khách hàng
// =============================================================================
describe('validateThemMoiKhachHang', () => {
  const validInput = {
    hoTen: 'Nguyễn Văn A',
    soDienThoai: '0912345678',
    matKhau: 'abc123',
  };

  // TC1: Thêm mới thành công khi điền đầy đủ họ tên, số điện thoại, mật khẩu và dữ liệu hợp lệ
  test('dữ liệu hợp lệ -> thêm mới thành công', () => {
    const { isValid, errors } = validateThemMoiKhachHang(validInput, []);

    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // TC2: Thiếu 1 trong 3 thuộc tính họ tên, số điện thoại, mật khẩu -> thêm mới thất bại
  test('thiếu họ tên hoặc số điện thoại hoặc mật khẩu -> thêm mới thất bại', () => {
    const thieuHoTen = validateThemMoiKhachHang({ ...validInput, hoTen: '' }, []);
    const thieuSoDienThoai = validateThemMoiKhachHang({ ...validInput, soDienThoai: '' }, []);
    const thieuMatKhau = validateThemMoiKhachHang({ ...validInput, matKhau: '' }, []);

    expect(thieuHoTen.isValid).toBe(false);
    expect(thieuHoTen.errors.hoTen).toBeDefined();
    expect(thieuSoDienThoai.isValid).toBe(false);
    expect(thieuSoDienThoai.errors.soDienThoai).toBeDefined();
    expect(thieuMatKhau.isValid).toBe(false);
    expect(thieuMatKhau.errors.matKhau).toBeDefined();
  });

  // TC3: Số điện thoại nhập vào đã tồn tại trong CSDL -> thêm mới thất bại
  test('số điện thoại đã tồn tại trong CSDL -> thêm mới thất bại', () => {
    const danhSachSdtDaTonTai = ['0912345678', '0987654321'];
    const { isValid, errors } = validateThemMoiKhachHang(validInput, danhSachSdtDaTonTai);

    expect(isValid).toBe(false);
    expect(errors.soDienThoai).toBeDefined();
  });
});

// =============================================================================
//  UC-1: Validate form đăng ký tài khoản
// =============================================================================
describe('validateDangKy', () => {
  const validInput = {
    hoTen: 'Nguyễn Văn A',
    soDienThoai: '0912345678',
    matKhau: 'abc123',
    xacNhanMatKhau: 'abc123',
  };

  test('dữ liệu hợp lệ → isValid = true, không có lỗi', () => {
    const { isValid, errors } = validateDangKy(validInput);
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  // BR2: Trường bắt buộc
  test('họ tên trống → lỗi hoTen', () => {
    const { errors } = validateDangKy({ ...validInput, hoTen: '' });
    expect(errors.hoTen).toBeDefined();
  });

  test('SĐT trống → lỗi soDienThoai', () => {
    const { errors } = validateDangKy({ ...validInput, soDienThoai: '' });
    expect(errors.soDienThoai).toBeDefined();
  });

  test('mật khẩu trống → lỗi matKhau', () => {
    const { errors } = validateDangKy({ ...validInput, matKhau: '', xacNhanMatKhau: '' });
    expect(errors.matKhau).toBeDefined();
  });

  // BR3: Mật khẩu >= 6 ký tự
  test('mật khẩu < 6 ký tự → lỗi matKhau', () => {
    const { errors } = validateDangKy({ ...validInput, matKhau: '123', xacNhanMatKhau: '123' });
    expect(errors.matKhau).toMatch(/6 ký tự/);
  });

  test('mật khẩu đúng 6 ký tự → không lỗi matKhau', () => {
    const { errors } = validateDangKy({ ...validInput, matKhau: '123456', xacNhanMatKhau: '123456' });
    expect(errors.matKhau).toBeUndefined();
  });

  // BR4: Xác nhận mật khẩu phải khớp
  test('xác nhận mật khẩu không khớp → lỗi xacNhanMatKhau', () => {
    const { errors } = validateDangKy({ ...validInput, xacNhanMatKhau: 'khac123' });
    expect(errors.xacNhanMatKhau).toBeDefined();
  });

  // Validate SĐT định dạng Việt Nam
  test('SĐT sai định dạng → lỗi soDienThoai', () => {
    const { errors } = validateDangKy({ ...validInput, soDienThoai: '12345' });
    expect(errors.soDienThoai).toBeDefined();
  });

  test('SĐT bắt đầu bằng 03x → hợp lệ', () => {
    const { isValid } = validateDangKy({ ...validInput, soDienThoai: '0312345678' });
    expect(isValid).toBe(true);
  });

  // Nhiều lỗi cùng lúc
  test('tất cả trường trống → nhiều lỗi cùng lúc', () => {
    const { isValid, errors } = validateDangKy({ hoTen: '', soDienThoai: '', matKhau: '', xacNhanMatKhau: '' });
    expect(isValid).toBe(false);
    expect(Object.keys(errors).length).toBeGreaterThan(1);
  });
});

// =============================================================================
//  UC-9: Đổi điểm lấy quà
// =============================================================================
describe('kiemTraDuDiem', () => {
  test('đủ điểm → true', () => {
    expect(kiemTraDuDiem(1000, 500)).toBe(true);
  });

  test('bằng đúng điểm yêu cầu → true (đủ điều kiện biên)', () => {
    expect(kiemTraDuDiem(500, 500)).toBe(true);
  });

  test('thiếu 1 điểm → false', () => {
    expect(kiemTraDuDiem(499, 500)).toBe(false);
  });

  test('không có điểm → false', () => {
    expect(kiemTraDuDiem(0, 100)).toBe(false);
  });
});

describe('tinhDiemConLai', () => {
  test('trừ điểm bình thường', () => {
    expect(tinhDiemConLai(1000, 300)).toBe(700);
  });

  test('dùng hết điểm → về 0', () => {
    expect(tinhDiemConLai(500, 500)).toBe(0);
  });

  test('không trả về âm dù diem_doi > diem_hien_tai', () => {
    // Math.max(0, ...) trong logic
    expect(tinhDiemConLai(100, 500)).toBe(0);
  });
});

describe('filterByGiftType', () => {
  const gifts = [
    { ma_qua: 'Q1', loai: 'voucher_giam_gia', ten_qua: 'Voucher 50k' },
    { ma_qua: 'Q2', loai: 'qua_hien_vat',    ten_qua: 'Cà phê' },
    { ma_qua: 'Q3', loai: 'voucher_giam_gia', ten_qua: 'Voucher 100k' },
    { ma_qua: 'Q4', loai: 'uu_dai_dich_vu',  ten_qua: 'Sửa xe miễn phí' },
  ];

  test('lọc đúng tab voucher → 2 items', () => {
    expect(filterByGiftType(gifts, 'voucher_giam_gia')).toHaveLength(2);
  });

  test('lọc tab quà hiện vật → 1 item', () => {
    const result = filterByGiftType(gifts, 'qua_hien_vat');
    expect(result).toHaveLength(1);
    expect(result[0].ten_qua).toBe('Cà phê');
  });

  test('lọc loại không tồn tại → mảng rỗng', () => {
    expect(filterByGiftType(gifts, 'loai_khong_co')).toHaveLength(0);
  });

  test('danh sách rỗng → mảng rỗng', () => {
    expect(filterByGiftType([], 'voucher_giam_gia')).toHaveLength(0);
  });
});

// =============================================================================
//  filterByGiftType: Lọc danh sách quà theo loại tab đang active
// =============================================================================
describe('filterByGiftType - test case theo bảng', () => {
  // Test case 1: Lọc đúng loại
  test("items có 2 voucher + 1 uu_dai, activeType='voucher_giam_gia' -> trả về 2 phần tử", () => {
    const items = [
      { ma_qua: 'Q1', loai: 'voucher_giam_gia', ten_qua: 'Voucher 50k' },
      { ma_qua: 'Q2', loai: 'voucher_giam_gia', ten_qua: 'Voucher 100k' },
      { ma_qua: 'Q3', loai: 'uu_dai_dich_vu', ten_qua: 'Miễn phí giao hàng' },
    ];

    const result = filterByGiftType(items, 'voucher_giam_gia');

    expect(result).toHaveLength(2);
    expect(result.every(item => item.loai === 'voucher_giam_gia')).toBe(true);
  });

  // Test case 2: Không có phần tử khớp
  test("items có 2 voucher, activeType='uu_dai_dich_vu' -> mảng rỗng", () => {
    const items = [
      { ma_qua: 'Q1', loai: 'voucher_giam_gia', ten_qua: 'Voucher 50k' },
      { ma_qua: 'Q2', loai: 'voucher_giam_gia', ten_qua: 'Voucher 100k' },
    ];

    const result = filterByGiftType(items, 'uu_dai_dich_vu');

    expect(result).toEqual([]);
  });

  // Test case 3: Danh sách rỗng
  test("items=[], activeType='voucher_giam_gia' -> mảng rỗng", () => {
    const result = filterByGiftType([], 'voucher_giam_gia');

    expect(result).toEqual([]);
  });
});

describe('exchangeDescription', () => {
  test('voucher giảm giá → mô tả có giá trị tiền', () => {
    const desc = exchangeDescription({ loai: 'voucher_giam_gia', gia_tri: 50000 });
    expect(desc).toContain('50.000');
    expect(desc).toContain('Voucher');
  });

  test('ưu đãi dịch vụ → mô tả cụ thể', () => {
    const desc = exchangeDescription({ loai: 'uu_dai_dich_vu' });
    expect(desc).toMatch(/ưu đãi dịch vụ/i);
  });

  test('quà hiện vật → mô tả mặc định', () => {
    const desc = exchangeDescription({ loai: 'qua_hien_vat' });
    expect(desc).toMatch(/quà tặng/i);
  });

  test('gia_tri = 0 → mô tả vẫn render được (không crash)', () => {
    expect(() => exchangeDescription({ loai: 'voucher_giam_gia', gia_tri: 0 })).not.toThrow();
  });
});

// =============================================================================
//  exchangeDescription: Tạo mô tả hiển thị cho từng loại quà tặng
// =============================================================================
describe('exchangeDescription - test case theo bảng', () => {
  // Test case 1: Voucher giảm giá
  test("loai='voucher_giam_gia', gia_tri=50000 -> chuỗi chứa '50.000'", () => {
    const desc = exchangeDescription({ loai: 'voucher_giam_gia', gia_tri: 50000 });

    expect(desc).toContain('50.000');
  });

  // Test case 2: Ưu đãi dịch vụ
  test("loai='uu_dai_dich_vu' -> 'Ưu đãi dịch vụ dành cho thành viên'", () => {
    const desc = exchangeDescription({ loai: 'uu_dai_dich_vu' });

    expect(desc).toBe('Ưu đãi dịch vụ dành cho thành viên');
  });

  // Test case 3: Loại khác hoặc không xác định
  test("loai='khac' -> 'Quà tặng dành cho thành viên'", () => {
    const desc = exchangeDescription({ loai: 'khac' });

    expect(desc).toBe('Quà tặng dành cho thành viên');
  });

  // Test case 4: gia_tri = 0 hoặc undefined
  test("loai='voucher_giam_gia', gia_tri=undefined -> không lỗi và hiển thị '0'", () => {
    const desc = exchangeDescription({ loai: 'voucher_giam_gia', gia_tri: undefined });

    expect(desc).toContain('0');
    expect(() => exchangeDescription({ loai: 'voucher_giam_gia', gia_tri: undefined })).not.toThrow();
  });
});

// =============================================================================
//  Security: Escape HTML — tránh XSS khi render tên quà
// =============================================================================
describe('escapeHtml', () => {
  test('escape các ký tự đặc biệt HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escape dấu nháy đôi', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test('escape dấu nháy đơn', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  test('escape &', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  test('chuỗi bình thường không thay đổi', () => {
    expect(escapeHtml('Voucher 50k')).toBe('Voucher 50k');
  });

  test('null → chuỗi rỗng', () => {
    expect(escapeHtml(null)).toBe('');
  });

  test('undefined → chuỗi rỗng', () => {
    expect(escapeHtml(undefined)).toBe('');
  });
});

// =============================================================================
//  Tính điểm từ mua hàng
// =============================================================================
describe('tinhDiemTuMuaHang', () => {
  test('100,000đ → 10 điểm (tỷ lệ 10,000đ/điểm)', () => {
    expect(tinhDiemTuMuaHang(100000)).toBe(10);
  });

  test('làm tròn xuống: 15,000đ → 1 điểm', () => {
    expect(tinhDiemTuMuaHang(15000)).toBe(1);
  });

  test('dưới ngưỡng tối thiểu: 9,999đ → 0 điểm', () => {
    expect(tinhDiemTuMuaHang(9999)).toBe(0);
  });

  test('0đ → 0 điểm', () => {
    expect(tinhDiemTuMuaHang(0)).toBe(0);
  });

  test('giá trị âm → 0 điểm (không tính điểm âm)', () => {
    expect(tinhDiemTuMuaHang(-50000)).toBe(0);
  });

  test('mua hàng 1,000,000đ → 100 điểm', () => {
    expect(tinhDiemTuMuaHang(1000000)).toBe(100);
  });
});

// =============================================================================
//  Xác định hạng thành viên
// =============================================================================
describe('xacDinhHang', () => {
  test('0 điểm → Member', () => {
    expect(xacDinhHang(0)).toBe('Member');
  });

  test('99 điểm → vẫn là Member (dưới ngưỡng Silver)', () => {
    expect(xacDinhHang(99)).toBe('Member');
  });

  test('100 điểm → Silver (điều kiện biên)', () => {
    expect(xacDinhHang(100)).toBe('Silver');
  });

  test('499 điểm → Silver', () => {
    expect(xacDinhHang(499)).toBe('Silver');
  });

  test('500 điểm → Gold (điều kiện biên)', () => {
    expect(xacDinhHang(500)).toBe('Gold');
  });

  test('1999 điểm → Gold', () => {
    expect(xacDinhHang(1999)).toBe('Gold');
  });

  test('2000 điểm → Platinum (điều kiện biên)', () => {
    expect(xacDinhHang(2000)).toBe('Platinum');
  });

  test('điểm rất cao → vẫn là Platinum', () => {
    expect(xacDinhHang(99999)).toBe('Platinum');
  });
});
