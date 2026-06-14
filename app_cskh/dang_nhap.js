// =============================================================
//  dang_nhap.js — App CSKH
//  Chỉ đăng nhập, không đăng ký
//  Phụ thuộc: supabase_config.js, supabase_api.js, auth.js
// =============================================================
(function(){ if(getCurrentNV()) window.location.href='index.html'; })();

async function handleLogin(e){
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  hide('alertBox'); setLoading(true);
  try {
    const data = await sbGet('nhan_vien',
      `ten_dang_nhap=eq.${encodeURIComponent(username)}` +
      `&vai_tro=eq.cskh&trang_thai=eq.hoat_dong` +
      `&select=ma_nv,ho_ten,vai_tro,ten_dang_nhap`);
    if(!data || data.length===0){
      showAlert('Tên đăng nhập không tồn tại hoặc không có quyền CSKH.'); shake(); return;
    }
    if(password !== '123456'){ // demo — production: bcrypt verify
      showAlert('Mật khẩu không đúng. Vui lòng thử lại.'); shake(); return;
    }
    saveSession(data[0]);
    const btn = document.getElementById('btnLogin');
    btn.style.background='#2D9462';
    document.getElementById('btnText').textContent='Thành công';
    setTimeout(()=>{ window.location.href='index.html'; }, 700);
  } catch(err){
    showAlert('Không thể kết nối hệ thống. Kiểm tra mạng và thử lại.');
    console.error(err);
  } finally { setLoading(false); }
}

function togglePass(){
  const i=document.getElementById('password'), b=document.getElementById('eyeBtn');
  if(i.type==='password'){ i.type='text'; b.textContent='Ẩn'; }
  else { i.type='password'; b.textContent='Hiện'; }
}
function setLoading(on){
  document.getElementById('btnLogin').disabled=on;
  document.getElementById('btnText').style.display=on?'none':'';
  document.getElementById('btnSpin').style.display=on?'inline-block':'none';
}
function showAlert(msg){ document.getElementById('alertMsg').textContent=msg; show('alertBox'); }
function hide(id){ document.getElementById(id).style.display='none'; }
function show(id){ document.getElementById(id).style.display='flex'; }
function shake(){
  const c=document.getElementById('loginCard');
  c.style.animation='none'; c.offsetHeight; c.style.animation='shake .4s ease';
}

