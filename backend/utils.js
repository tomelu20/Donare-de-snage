/**
 * Funcții utilitare pentru aplicația de donare de sânge
 */

const Utils = {
    /**
     * Validare email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validare parolă (minim 8 caractere)
     */
    isValidPassword(password) {
        return password.length >= 8;
    },

    /**
     * Validare număr de telefon românesc
     */
    isValidPhone(phone) {
        const phoneRegex = /^(\+40|0)[0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    /**
     * Formatare dată în română
     */
    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(date).toLocaleDateString('ro-RO', options);
    },

    /**
     * Formatare dată scurtă
     */
    formatDateShort(date) {
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        };
        return new Date(date).toLocaleDateString('ro-RO', options);
    },

    /**
     * Salvare în localStorage
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Eroare la salvare în localStorage:', e);
            return false;
        }
    },

    /**
     * Citire din localStorage
     */
    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Eroare la citire din localStorage:', e);
            return null;
        }
    },

    /**
     * Ștergere din localStorage
     */
    removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Eroare la ștergere din localStorage:', e);
            return false;
        }
    },

    /**
     * Generare ID unic
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Afișare mesaj în element
     */
    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    },

    /**
     * Ascundere mesaj de eroare
     */
    hideError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    },

    /**
     * Verificare autentificare
     */
    isLoggedIn() {
        const user = this.getFromStorage('currentUser');
        return user !== null;
    },

    /**
     * Obținere utilizator curent
     */
    getCurrentUser() {
        return this.getFromStorage('currentUser');
    },

    /**
     * Redirecționare
     */
    redirect(url) {
        window.location.href = url;
    }
};

// Export pentru utilizare în alte fișiere
window.Utils = Utils;
