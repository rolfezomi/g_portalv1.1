// Oturum kontrolü - Diğer HTML sayfaları için
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const username = localStorage.getItem('username');
    
    // Eğer oturum yoksa anasayfaya yönlendir
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return false;
    }

    // Kullanıcı adını ve saati göster
    const userEl = document.getElementById('logged-user');
    if (userEl && username) {
        userEl.textContent = username;
    }
    
    // Saat gösterimi
    updateTime();
    setInterval(updateTime, 1000);
    
    return true;
}

function updateTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

function showHomepage() {
    window.location.href = 'index.html';
}

// Sayfa yüklendiğinde oturum kontrolü yap
document.addEventListener('DOMContentLoaded', checkAuth);