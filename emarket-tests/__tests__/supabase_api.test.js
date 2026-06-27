// supabase_api.test.js
// Unit test cho các hàm gọi Supabase REST API
// Dùng Jest + mock fetch (không cần network thật)

const { sbGet, sbInsert, sbUpdate, sbDelete } = require('../src/supabase_api');

// ── Helper: tạo mock response thành công ──────────────────────────────────────
const mockOk = (data) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(''),
    status: 200,
  });

// ── Helper: tạo mock response lỗi ────────────────────────────────────────────
const mockFail = (status, message) =>
  Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(message),
    status,
  });

// ── Setup / Teardown ──────────────────────────────────────────────────────────
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

// =============================================================================
//  sbGet
// =============================================================================
describe('sbGet', () => {
  test('gọi đúng URL và trả về data khi thành công', async () => {
    const mockData = [{ ma_kh: 'KH001', ten: 'Nguyễn Văn A' }];
    global.fetch.mockReturnValue(mockOk(mockData));

    const result = await sbGet('khach_hang', 'ma_kh=eq.KH001');

    // Kiểm tra URL được gọi đúng
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/khach_hang?ma_kh=eq.KH001'),
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(result).toEqual(mockData);
  });

  test('gọi không có params vẫn hoạt động (params mặc định rỗng)', async () => {
    global.fetch.mockReturnValue(mockOk([]));

    await sbGet('khach_hang');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/khach_hang?'),
      expect.any(Object)
    );
  });

  test('ném lỗi khi server trả về HTTP lỗi (4xx/5xx)', async () => {
    global.fetch.mockReturnValue(mockFail(404, 'Not Found'));

    await expect(sbGet('khach_hang', 'ma_kh=eq.NONE'))
      .rejects
      .toThrow('sbGet [khach_hang] lỗi 404');
  });

  test('ném lỗi khi mất kết nối (fetch reject)', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    await expect(sbGet('khach_hang')).rejects.toThrow('Network error');
  });
});

// =============================================================================
//  sbInsert
// =============================================================================
describe('sbInsert', () => {
  test('gửi POST với body JSON đúng và trả về bản ghi mới', async () => {
    const newRecord = { ma_the: 'THE001', so_diem: 100 };
    global.fetch.mockReturnValue(mockOk([newRecord]));

    const result = await sbInsert('the_thanh_vien', newRecord);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/the_thanh_vien'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newRecord),
      })
    );
    expect(result).toEqual([newRecord]);
  });

  test('ném lỗi khi insert thất bại (ví dụ vi phạm unique constraint)', async () => {
    global.fetch.mockReturnValue(mockFail(409, 'duplicate key value'));

    await expect(sbInsert('khach_hang', { sdt: '0912000000' }))
      .rejects
      .toThrow('sbInsert [khach_hang] lỗi 409');
  });

  test('insert bản ghi lịch sử đổi quà đúng cấu trúc', async () => {
    const lichSu = {
      ma_the: 'THE001',
      ma_qua: 'QUA001',
      so_luong: 1,
      so_diem_da_dung: 500,
      ngay_doi: '2025-01-01T00:00:00Z',
      trang_thai: 'cho_nhan',
    };
    global.fetch.mockReturnValue(mockOk([lichSu]));

    await sbInsert('lich_su_doi_qua', lichSu);

    const callBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callBody).toMatchObject({
      ma_the: 'THE001',
      so_diem_da_dung: 500,
      trang_thai: 'cho_nhan',
    });
  });
});

// =============================================================================
//  sbUpdate
// =============================================================================
describe('sbUpdate', () => {
  test('gửi PATCH đúng URL và body', async () => {
    global.fetch.mockReturnValue(mockOk([{ so_diem: 300 }]));

    await sbUpdate('the_thanh_vien', 'ma_the=eq.THE001', { so_diem: 300 });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/the_thanh_vien?ma_the=eq.THE001'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ so_diem: 300 }),
      })
    );
  });

  test('ném lỗi khi record không tồn tại', async () => {
    global.fetch.mockReturnValue(mockFail(400, 'no rows updated'));

    await expect(sbUpdate('the_thanh_vien', 'ma_the=eq.KHONG_CO', { so_diem: 0 }))
      .rejects
      .toThrow('sbUpdate [the_thanh_vien] lỗi 400');
  });
});

// =============================================================================
//  sbDelete
// =============================================================================
describe('sbDelete', () => {
  test('gửi DELETE đúng URL và trả về true khi thành công', async () => {
    global.fetch.mockReturnValue(mockOk(null));

    const result = await sbDelete('voucher', 'ma_voucher=eq.V001');

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/v1/voucher?ma_voucher=eq.V001'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  test('ném lỗi khi server từ chối xóa (ví dụ foreign key constraint)', async () => {
    global.fetch.mockReturnValue(mockFail(409, 'foreign key violation'));

    await expect(sbDelete('khach_hang', 'ma_kh=eq.KH001'))
      .rejects
      .toThrow('sbDelete [khach_hang] lỗi 409');
  });
});
