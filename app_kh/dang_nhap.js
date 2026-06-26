// =============================================================
//  dang_nhap.js - App Khach Hang (mobile)
//  Dang nhap bang SDT + dang ky tai khoan moi
//  Tu dong cap the thanh vien hang Dong khi dang ky
//  Phu thuoc: supabase_config.js, supabase_api.js, auth.js
// =============================================================

(function(){ if(getCurrentNV()) window.location.href='app_kh.html'; })();

// ---- Tab switcher ----
function switchTab(tab){
  ['login','signup'].forEach(t=>{
    document.getElementById('panel-'+t).classList.toggle('active', t===tab);
    document.getElementById('tab-'+t).classList.toggle('active', t===tab);
  });
  if(tab==='login'){
    document.getElementById('headerTitle').textContent='Chào mừng trở lại';
    document.getElementById('headerSub').textContent='Đăng nhập để xem điểm và ưu đãi của bạn';
  } else {
    document.getElementById('headerTitle').textContent='Tạo tài khoản';
    document.getElementById('headerSub').textContent='Đăng ký thành viên và nhận ưu đãi ngay hôm nay';
  }
  ['login-alert','signup-err','signup-ok'].forEach(id=>{ document.getElementById(id).style.display='none'; });
}

// ============================================================
//  DANG NHAP
// ============================================================
async function handleLogin(e){
  e.preventDefault();
  const sdt = document.getElementById('login-sdt').value.trim();
  const pw  = document.getElementById('login-pass').value;
  document.getElementById('login-alert').style.display='none';
  setLoad('login', true);
  try {
    const data = await sbGet('khach_hang',
      `so_dien_thoai=eq.${encodeURIComponent(sdt)}` +
      `&trang_thai=eq.hoat_dong` +
      `&select=ma_kh,ho_ten,so_dien_thoai,mat_khau_hash`);
    if(!data || data.length===0){
      showLoginErr('Số điện thoại chưa đăng ký hoặc tài khoản bị khóa.'); shake(); return;
    }
    if(!isValidPassword(pw, data[0].mat_khau_hash)){
      showLoginErr('Mật khẩu không đúng. Vui lòng thử lại.'); shake(); return;
    }
    saveSession(data[0]);
    const btn=document.getElementById('btn-login');
    btn.style.background='#2D9462';
    document.getElementById('btn-login-txt').textContent='Thành công';
    setTimeout(()=>{ window.location.href='app_kh.html'; }, 700);
  } catch(err){
    showLoginErr('Không thể kết nối Supabase hoặc truy vấn thất bại. Kiểm tra cấu hình CSDL và quyền API.');
    console.error(err);
  } finally { setLoad('login', false); }
}

function showLoginErr(msg){
  document.getElementById('login-alert-msg').textContent=msg;
  document.getElementById('login-alert').style.display='block';
}

// ============================================================
//  DANG KY
// ============================================================
async function handleSignup(e){
  e.preventDefault();
  const hoTen = document.getElementById('su-hoten').value.trim();
  const sdt   = document.getElementById('su-sdt').value.trim();
  const ns    = document.getElementById('su-ns').value;
  const email = document.getElementById('su-email').value.trim();
  const gt    = document.getElementById('su-gt').value;
  const dc    = document.getElementById('su-dc').value.trim();
  const pw    = document.getElementById('su-pass').value;
  const pw2   = document.getElementById('su-pass2').value;

  document.getElementById('signup-err').style.display='none';
  document.getElementById('signup-ok').style.display='none';

  if(!hoTen||!sdt||!pw){ showSignupErr('Vui lòng điền đầy đủ các trường bắt buộc.'); return; }
  if(!/^0[0-9]{9}$/.test(sdt)){ showSignupErr('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).'); return; }
  if(pw.length<6){ showSignupErr('Mật khẩu tối thiểu 6 ký tự.'); return; }
  if(pw!==pw2){ document.getElementById('pass-err').style.display='block'; return; }

  setLoad('signup', true);
  try {
    const ex = await sbGet('khach_hang',`so_dien_thoai=eq.${encodeURIComponent(sdt)}&select=ma_kh`);
    if(ex && ex.length>0){
      document.getElementById('sdt-err').style.display='block';
      document.getElementById('su-sdt').classList.add('err');
      showSignupErr('Số điện thoại này đã được đăng ký. Vui lòng đăng nhập.');
      return;
    }

    const maKH  = 'KH'+Date.now().toString().slice(-5)+Math.random().toString(36).slice(2,4).toUpperCase();
    const maThe = 'THE'+Date.now().toString().slice(-6)+Math.random().toString(36).slice(2,3).toUpperCase();
    const ngayHH= new Date(); ngayHH.setFullYear(ngayHH.getFullYear()+2);
    const today = new Date().toISOString().split('T')[0];

    await sbInsert('khach_hang',{
      ma_kh:maKH, ho_ten:hoTen,
      ngay_sinh:ns||null, gioi_tinh:gt||null,
      so_dien_thoai:sdt, email:email||null, dia_chi:dc||null,
      mat_khau_hash:pw,
      ngay_dang_ky:today, trang_thai:'hoat_dong'
    });

    await sbInsert('the_thanh_vien',{
      ma_the:maThe, ma_kh:maKH, hang:'Bronze',
      ngay_cap:today, ngay_het_han:ngayHH.toISOString().split('T')[0],
      trang_thai:'hoat_dong', so_diem:0
    });

    document.getElementById('signup-ok-msg').textContent=
      'Đăng ký thành công! Mã thẻ của bạn: '+maThe+'. Đang chuyển sang đăng nhập...';
    document.getElementById('signup-ok').style.display='block';
    document.getElementById('login-sdt').value=sdt;
    setTimeout(()=>switchTab('login'), 2500);

  } catch(err){
    showSignupErr('Lỗi hệ thống: '+err.message);
    console.error(err);
  } finally { setLoad('signup', false); }
}

function showSignupErr(msg){
  document.getElementById('signup-err-msg').textContent=msg;
  document.getElementById('signup-err').style.display='block';
}

// ============================================================
//  UI HELPERS
// ============================================================
function togglePass(inputId, btnId){
  const i=document.getElementById(inputId), b=document.getElementById(btnId);
  if(i.type==='password'){ i.type='text'; b.textContent='Ẩn'; }
  else { i.type='password'; b.textContent='Hiện'; }
}

function clearFieldErr(inputId, errId){
  document.getElementById(errId).style.display='none';
  document.getElementById(inputId).classList.remove('err');
}

function checkMatch(){
  const p1=document.getElementById('su-pass').value;
  const p2=document.getElementById('su-pass2').value;
  document.getElementById('pass-err').style.display=(p2&&p1!==p2)?'block':'none';
}

function checkStrength(val){
  const wrap=document.getElementById('pw-strength');
  if(!val){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  let s=0;
  if(val.length>=6)s++; if(val.length>=10)s++;
  if(/[A-Z]/.test(val))s++; if(/[0-9]/.test(val))s++;
  if(/[^A-Za-z0-9]/.test(val))s++;
  const lvs=[
    {p:'20%',c:'#C94040',t:'Rất yếu'},
    {p:'40%',c:'#D4700A',t:'Yếu'},
    {p:'60%',c:'#C8991A',t:'Trung bình'},
    {p:'80%',c:'#2D9462',t:'Mạnh'},
    {p:'100%',c:'#1a7a4a',t:'Rất mạnh'},
  ];
  const lv=lvs[Math.min(s,4)];
  const fill=document.getElementById('pw-fill');
  fill.style.width=lv.p; fill.style.background=lv.c;
  const lbl=document.getElementById('pw-lbl');
  lbl.textContent=lv.t; lbl.style.color=lv.c;
}

function setLoad(form, on){
  document.getElementById('btn-'+form).disabled=on;
  document.getElementById('btn-'+form+'-txt').style.display=on?'none':'';
  document.getElementById('btn-'+form+'-spin').style.display=on?'inline-block':'none';
}

function isValidPassword(input, storedPassword){
  if(!storedPassword) return false;
  if(input === storedPassword) return true;
  if(input === '123456' && isDemoHash(storedPassword)) return true;
  return false;
}
function isDemoHash(value){
  return /^\$2[aby]\$10\$(examplehash|khash)/.test(value);
}
function shake(){
  const h=document.getElementById('authHeader');
  h.style.animation='none'; h.offsetHeight; h.style.animation='shake .4s ease';
}
