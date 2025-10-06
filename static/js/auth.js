// 認証画面専用JavaScript - auth.js

class AuthForm {
    constructor() {
        this.initializeLoginForm();
        this.initializeRegisterForm();
        this.setupDemoLogin();
        this.checkExistingAuth();
    }

    initializeLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const credentials = {
                username: formData.get('username'),
                password: formData.get('password')
            };

            // バリデーション
            if (!this.validateLoginForm(credentials)) {
                return;
            }

            const submitBtn = loginForm.querySelector('.auth-submit');
            const hideLoading = UI.showLoading(submitBtn);

            try {
                console.log('ログイン試行中:', credentials.username);
                const response = await ApiClient.post('/auth/login', credentials);
                console.log('ログイン成功:', response);
                
                // 認証情報を保存
                Auth.login(response.access_token, response.user);
                
                // 成功メッセージ
                UI.showAlert(`${response.user.full_name}さん、ログインしました`, 'success');
                
                // ロールに応じてリダイレクト
                this.redirectAfterLogin(response.user.role);
                
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'ログインに失敗しました';
                if (error.message.includes('Incorrect username or password')) {
                    errorMessage = 'ユーザー名またはパスワードが正しくありません';
                } else if (error.message.includes('Inactive user')) {
                    errorMessage = 'アカウントが無効になっています';
                } else {
                    errorMessage += ': ' + error.message;
                }
                UI.showAlert(errorMessage, 'danger');
            } finally {
                hideLoading();
            }
        });
    }

    initializeRegisterForm() {
        const registerForm = document.getElementById('registerForm');
        if (!registerForm) return;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password'),
                full_name: formData.get('full_name'),
                role: formData.get('role')
            };

            // バリデーション
            if (!this.validateRegisterForm(userData, formData.get('confirmPassword'))) {
                return;
            }

            const submitBtn = registerForm.querySelector('.auth-submit');
            const hideLoading = UI.showLoading(submitBtn);

            try {
                const response = await ApiClient.post('/auth/register', userData);
                
                UI.showAlert('アカウントが作成されました。ログインしてください。', 'success');
                
                // ログインページにリダイレクト
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                
            } catch (error) {
                console.error('Registration error:', error);
                UI.showAlert('登録に失敗しました: ' + error.message, 'danger');
            } finally {
                hideLoading();
            }
        });
    }

    setupDemoLogin() {
        const demoButtons = document.querySelectorAll('.demo-login-btn');
        demoButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const username = btn.dataset.username;
                const password = btn.dataset.password;
                
                try {
                    const hideLoading = UI.showLoading(btn);
                    
                    console.log('デモログイン試行中:', username);
                    const response = await ApiClient.post('/auth/login', {
                        username,
                        password
                    });
                    console.log('デモログイン成功:', response);
                    
                    Auth.login(response.access_token, response.user);
                    UI.showAlert(`${response.user.full_name}さん（${username}）でログインしました`, 'success');
                    this.redirectAfterLogin(response.user.role);
                    
                } catch (error) {
                    console.error('Demo login error:', error);
                    let errorMessage = 'デモログインに失敗しました';
                    if (error.message.includes('Incorrect username or password')) {
                        errorMessage = 'デモアカウントの認証情報が正しくありません';
                    } else {
                        errorMessage += ': ' + error.message;
                    }
                    UI.showAlert(errorMessage, 'danger');
                    hideLoading();
                }
            });
        });
    }

    validateLoginForm(credentials) {
        let isValid = true;
        
        // クリア既存のエラー
        this.clearErrors();
        
        // ユーザー名チェック
        if (!Validator.validateRequired(credentials.username)) {
            this.showFieldError('username', 'ユーザー名を入力してください');
            isValid = false;
        }
        
        // パスワードチェック
        if (!Validator.validateRequired(credentials.password)) {
            this.showFieldError('password', 'パスワードを入力してください');
            isValid = false;
        }
        
        return isValid;
    }

    validateRegisterForm(userData, confirmPassword) {
        let isValid = true;
        
        // クリア既存のエラー
        this.clearErrors();
        
        // ユーザー名チェック
        if (!Validator.validateRequired(userData.username)) {
            this.showFieldError('username', 'ユーザー名を入力してください');
            isValid = false;
        } else if (!Validator.validateMinLength(userData.username, 3)) {
            this.showFieldError('username', 'ユーザー名は3文字以上で入力してください');
            isValid = false;
        }
        
        // メールアドレスチェック
        if (!Validator.validateRequired(userData.email)) {
            this.showFieldError('email', 'メールアドレスを入力してください');
            isValid = false;
        } else if (!Validator.validateEmail(userData.email)) {
            this.showFieldError('email', '有効なメールアドレスを入力してください');
            isValid = false;
        }
        
        // パスワードチェック
        if (!Validator.validateRequired(userData.password)) {
            this.showFieldError('password', 'パスワードを入力してください');
            isValid = false;
        } else if (!Validator.validateMinLength(userData.password, 6)) {
            this.showFieldError('password', 'パスワードは6文字以上で入力してください');
            isValid = false;
        }
        
        // パスワード確認チェック
        if (userData.password !== confirmPassword) {
            this.showFieldError('confirmPassword', 'パスワードが一致しません');
            isValid = false;
        }
        
        // 氏名チェック
        if (!Validator.validateRequired(userData.full_name)) {
            this.showFieldError('full_name', '氏名を入力してください');
            isValid = false;
        }
        
        // ロールチェック
        if (!userData.role || !['customer', 'store'].includes(userData.role)) {
            this.showFieldError('role', '利用者タイプを選択してください');
            isValid = false;
        }
        
        return isValid;
    }

    showFieldError(fieldName, message) {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.classList.add('error');
            
            // エラーメッセージを表示
            let errorElement = field.parentNode.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.className = 'field-error';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }
    }

    clearErrors() {
        // エラークラスを削除
        document.querySelectorAll('.form-control.error').forEach(el => {
            el.classList.remove('error');
        });
        
        // エラーメッセージを削除
        document.querySelectorAll('.field-error').forEach(el => {
            el.remove();
        });
    }

    checkExistingAuth() {
        // 既にログイン済みの場合はリダイレクト
        if (Auth.isLoggedIn() && currentUser) {
            this.redirectAfterLogin(currentUser.role);
        }
    }

    redirectAfterLogin(role) {
        if (role === 'customer') {
            window.location.href = '/customer/home';
        } else if (role === 'store') {
            window.location.href = '/store/dashboard';
        } else {
            window.location.href = '/';
        }
    }
}

// パスワード表示切り替え機能
function setupPasswordToggle() {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    
    passwordFields.forEach(field => {
        // 目のアイコンを追加
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        
        field.parentNode.insertBefore(wrapper, field);
        wrapper.appendChild(field);
        
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            border: none;
            background: none;
            cursor: pointer;
            font-size: 16px;
            opacity: 0.6;
        `;
        
        toggleBtn.addEventListener('click', () => {
            if (field.type === 'password') {
                field.type = 'text';
                toggleBtn.innerHTML = '🙈';
            } else {
                field.type = 'password';
                toggleBtn.innerHTML = '👁️';
            }
        });
        
        wrapper.appendChild(toggleBtn);
    });
}

// リアルタイムバリデーション
function setupRealtimeValidation() {
    const form = document.querySelector('.auth-form');
    if (!form) return;
    
    const fields = form.querySelectorAll('input[required]');
    
    fields.forEach(field => {
        field.addEventListener('blur', () => {
            validateField(field);
        });
        
        field.addEventListener('input', () => {
            // エラー状態をクリア
            field.classList.remove('error');
            const errorElement = field.parentNode.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const name = field.name;
    let isValid = true;
    let message = '';
    
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        message = 'この項目は必須です';
    } else if (name === 'email' && value && !Validator.validateEmail(value)) {
        isValid = false;
        message = '有効なメールアドレスを入力してください';
    } else if (name === 'password' && value && value.length < 6) {
        isValid = false;
        message = 'パスワードは6文字以上で入力してください';
    } else if (name === 'username' && value && value.length < 3) {
        isValid = false;
        message = 'ユーザー名は3文字以上で入力してください';
    }
    
    if (!isValid) {
        field.classList.add('error');
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'field-error';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }
}

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', function() {
    new AuthForm();
    setupPasswordToggle();
    setupRealtimeValidation();
    
    // ロール選択のアニメーション
    const roleOptions = document.querySelectorAll('.role-option input[type="radio"]');
    roleOptions.forEach(option => {
        option.addEventListener('change', function() {
            // 他の選択肢をリセット
            roleOptions.forEach(other => {
                other.parentNode.classList.remove('selected');
            });
            
            // 選択された項目をハイライト
            if (this.checked) {
                this.parentNode.classList.add('selected');
            }
        });
    });
    
    // フォームのアニメーション
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.style.opacity = '0';
        authCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            authCard.style.transition = 'all 0.5s ease';
            authCard.style.opacity = '1';
            authCard.style.transform = 'translateY(0)';
        }, 100);
    }
});