// Simple authentication - Using your original system
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    
    // Show loading state
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    loginBtn.disabled = true;
    
    try {
        // Use your original authentication system
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // Show success animation
            loginBtn.innerHTML = '<i class="fas fa-check"></i> Login Successful!';
            loginBtn.style.background = 'linear-gradient(45deg, #00b894, #00cec9)';
            
            // Store login state
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', username);
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        } else {
            throw new Error('Invalid credentials');
        }
    } catch (error) {
        // Show error state
        loginBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Login Failed';
        loginBtn.style.background = 'linear-gradient(45deg, #ff7675, #d63031)';
        
        // Reset button after delay
        setTimeout(() => {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            loginBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #ffd93d)';
        }, 2000);
        
        console.error('Login error:', error);
    }
});

// Add input animations
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Check if already logged in
if (localStorage.getItem('adminLoggedIn') === 'true' && window.location.pathname.endsWith('index.html')) {
    window.location.href = 'admin-dashboard.html';
}