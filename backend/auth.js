/**
 * Modul de autentificare și înregistrare
 */

const Auth = {
    /**
     * Inițializare modul
     */
    init() {
        this.setupLoginForm();
        this.setupRegisterForm();
        this.checkAuthState();
    },

    /**
     * Verifică starea de autentificare
     */
    checkAuthState() {
        // Dacă utilizatorul e deja autentificat și este pe pagina de login/register
        if (Utils.isLoggedIn()) {
            const currentPage = window.location.pathname;
            if (currentPage.includes('index.html') || 
                currentPage.includes('register.html') ||
                currentPage === '/' ||
                currentPage.endsWith('/')) {
                Utils.redirect('dashboard.html');
            }
        }
    },

    /**
     * Setup formular de login
     */
    setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Resetare erori
            Utils.hideError('emailError');
            Utils.hideError('passwordError');

            // Validări
            if (!Utils.isValidEmail(email)) {
                Utils.showError('emailError', 'Introduceți o adresă de email validă');
                return;
            }

            // Simulare verificare credențiale (în producție - API call)
            const users = Utils.getFromStorage('users') || [];
            const user = users.find(u => u.email === email);

            if (!user) {
                Utils.showError('emailError', 'Nu există un cont cu acest email');
                return;
            }

            if (user.password !== password) {
                Utils.showError('passwordError', 'Parolă incorectă');
                return;
            }

            // Autentificare reușită
            const sessionUser = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                bloodType: user.bloodType
            };

            Utils.saveToStorage('currentUser', sessionUser);
            Utils.redirect('dashboard.html');
        });
    },

    /**
     * Setup formular de înregistrare
     */
    setupRegisterForm() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                bloodType: document.getElementById('bloodType').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            // Resetare erori
            Utils.hideError('emailError');
            Utils.hideError('passwordError');
            Utils.hideError('confirmPasswordError');

            // Validări
            if (!Utils.isValidEmail(formData.email)) {
                Utils.showError('emailError', 'Introduceți o adresă de email validă');
                return;
            }

            if (!Utils.isValidPassword(formData.password)) {
                Utils.showError('passwordError', 'Parola trebuie să aibă minim 8 caractere');
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                Utils.showError('confirmPasswordError', 'Parolele nu coincid');
                return;
            }

            // Verificare email existent
            const users = Utils.getFromStorage('users') || [];
            if (users.some(u => u.email === formData.email)) {
                Utils.showError('emailError', 'Există deja un cont cu acest email');
                return;
            }

            // Creare utilizator nou
            const newUser = {
                id: Utils.generateId(),
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                bloodType: formData.bloodType,
                password: formData.password,
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            Utils.saveToStorage('users', users);

            // Autentificare automată după înregistrare
            const sessionUser = {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                bloodType: newUser.bloodType
            };

            Utils.saveToStorage('currentUser', sessionUser);
            Utils.redirect('dashboard.html');
        });
    },

    /**
     * Deconectare
     */
    logout() {
        Utils.removeFromStorage('currentUser');
        Utils.redirect('index.html');
    }
};

// Inițializare la încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Export pentru utilizare globală
window.Auth = Auth;
