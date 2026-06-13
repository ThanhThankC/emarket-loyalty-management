// pages/gia_han.js
// _giaHanData: được set bởi chuyenGiaHan() khi chuyển từ quan_ly_the
var _giaHanData = null;

registerPage('gia_han', function(opts) {
  // opts.maThe được truyền từ chuyenGiaHan() hoặc navigate trực tiếp
  if (opts && opts.maThe) {
    _giaHanData = opts;
    // TODO: điền thông tin thẻ vào form gia hạn
  }
});
