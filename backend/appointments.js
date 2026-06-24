/**
 * Modul pentru gestionarea programărilor
 */

const Appointments = {
    currentDate: new Date(),
    selectedDate: null,
    selectedTime: null,
    selectedCenter: null,

    /**
     * Inițializare modul
     */
    init() {
        // Verificare autentificare
        if (!Utils.isLoggedIn()) {
            Utils.redirect('index.html');
            return;
        }

        this.displayUserName();
        this.setupLogout();
        this.setupCenterSelect();
        this.renderCalendar();
        this.setupCalendarNavigation();
        this.loadUserAppointments();
        this.setupModal();
    },

    /**
     * Afișare nume utilizator
     */
    displayUserName() {
        const user = Utils.getCurrentUser();
        const nameElement = document.getElementById('userName');
        if (nameElement && user) {
            nameElement.textContent = user.firstName;
        }
    },

    /**
     * Setup buton deconectare
     */
    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout());
        }
    },

    /**
     * Setup selectare centru
     */
    setupCenterSelect() {
        const centerSelect = document.getElementById('centerSelect');
        if (centerSelect) {
            centerSelect.addEventListener('change', (e) => {
                this.selectedCenter = e.target.value;
                this.updateConfirmSection();
            });
        }
    },

    /**
     * Randare calendar
     */
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const monthDisplay = document.getElementById('currentMonth');
        
        if (!grid || !monthDisplay) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Afișare luna curentă
        const monthNames = [
            'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
            'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
        ];
        monthDisplay.textContent = `${monthNames[month]} ${year}`;

        // Golire grid
        grid.innerHTML = '';

        // Adăugare header zile
        const dayNames = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });

        // Prima zi a lunii
        const firstDay = new Date(year, month, 1);
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        // Număr de zile în lună
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Zile goale la început
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        // Zile din lună
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const currentDay = new Date(year, month, day);
            currentDay.setHours(0, 0, 0, 0);

            // Verificare dacă e ziua de azi
            if (currentDay.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }

            // Dezactivare zile trecute și weekend
            const dayOfWeek = currentDay.getDay();
            if (currentDay < today || dayOfWeek === 0 || dayOfWeek === 6) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => {
                    this.selectDate(currentDay, dayElement);
                });
            }

            // Verificare dacă e selectat
            if (this.selectedDate && currentDay.getTime() === this.selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }

            grid.appendChild(dayElement);
        }
    },

    /**
     * Selectare dată
     */
    selectDate(date, element) {
        // Resetare selecție anterioară
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        element.classList.add('selected');
        this.selectedDate = date;
        this.selectedTime = null;

        // Afișare ore disponibile
        this.showTimeSlots(date);
        this.updateConfirmSection();
    },

    /**
     * Navigare calendar
     */
    setupCalendarNavigation() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
    },

    /**
     * Afișare ore disponibile
     */
    showTimeSlots(date) {
        const section = document.getElementById('timeSlotsSection');
        const grid = document.getElementById('timeSlotsGrid');
        const dateDisplay = document.getElementById('selectedDateDisplay');

        if (!section || !grid || !dateDisplay) return;

        dateDisplay.textContent = Utils.formatDate(date);
        section.style.display = 'block';

        // Generare ore disponibile (8:00 - 16:00, interval 30 min)
        const timeSlots = [];
        for (let hour = 8; hour <= 15; hour++) {
            timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        timeSlots.push('16:00');

        // Obținere programări existente pentru această dată
        const bookedSlots = this.getBookedSlots(date);

        grid.innerHTML = '';

        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;

            if (bookedSlots.includes(time)) {
                slot.classList.add('unavailable');
            } else {
                slot.addEventListener('click', () => {
                    this.selectTimeSlot(time, slot);
                });
            }

            if (this.selectedTime === time) {
                slot.classList.add('selected');
            }

            grid.appendChild(slot);
        });
    },

    /**
     * Obținere ore ocupate pentru o dată
     */
    getBookedSlots(date) {
        const appointments = Utils.getFromStorage('appointments') || [];
        const dateStr = date.toISOString().split('T')[0];
        
        return appointments
            .filter(apt => apt.date === dateStr && apt.status !== 'cancelled')
            .map(apt => apt.time);
    },

    /**
     * Selectare oră
     */
    selectTimeSlot(time, element) {
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        element.classList.add('selected');
        this.selectedTime = time;
        this.updateConfirmSection();
    },

    /**
     * Actualizare secțiune confirmare
     */
    updateConfirmSection() {
        const section = document.getElementById('confirmSection');
        if (!section) return;

        if (this.selectedDate && this.selectedTime && this.selectedCenter) {
            section.style.display = 'block';

            const centerSelect = document.getElementById('centerSelect');
            const centerName = centerSelect.options[centerSelect.selectedIndex].text;

            document.getElementById('summaryCenter').textContent = centerName;
            document.getElementById('summaryDate').textContent = Utils.formatDate(this.selectedDate);
            document.getElementById('summaryTime').textContent = this.selectedTime;

            // Setup buton confirmare
            const confirmBtn = document.getElementById('confirmAppointment');
            confirmBtn.onclick = () => this.confirmAppointment();
        } else {
            section.style.display = 'none';
        }
    },

    /**
     * Confirmare programare
     */
    confirmAppointment() {
        const user = Utils.getCurrentUser();
        if (!user) return;

        const centerSelect = document.getElementById('centerSelect');
        const centerName = centerSelect.options[centerSelect.selectedIndex].text;

        const appointment = {
            id: Utils.generateId(),
            userId: user.id,
            center: this.selectedCenter,
            centerName: centerName,
            date: this.selectedDate.toISOString().split('T')[0],
            time: this.selectedTime,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Salvare programare
        const appointments = Utils.getFromStorage('appointments') || [];
        appointments.push(appointment);
        Utils.saveToStorage('appointments', appointments);

        // Afișare modal succes
        this.showModal('success', 'Programare confirmată!', 
            `Programarea ta pentru ${Utils.formatDateShort(this.selectedDate)} la ora ${this.selectedTime} a fost înregistrată cu succes.`
        );

        // Resetare selecții
        this.selectedDate = null;
        this.selectedTime = null;
        document.getElementById('centerSelect').value = '';
        document.getElementById('timeSlotsSection').style.display = 'none';
        document.getElementById('confirmSection').style.display = 'none';

        // Re-render
        this.renderCalendar();
        this.loadUserAppointments();
    },

    /**
     * Încărcare programări utilizator
     */
    loadUserAppointments() {
        const user = Utils.getCurrentUser();
        if (!user) return;

        const container = document.getElementById('userAppointments');
        const emptyState = document.getElementById('noAppointments');
        
        if (!container) return;

        const appointments = Utils.getFromStorage('appointments') || [];
        const userAppointments = appointments.filter(
            apt => apt.userId === user.id && apt.status !== 'cancelled'
        );

        // Filtrare doar programări viitoare
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureAppointments = userAppointments.filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= today;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Golire container (păstrăm empty state)
        container.querySelectorAll('.appointment-card').forEach(card => card.remove());

        if (futureAppointments.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        futureAppointments.forEach(apt => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.innerHTML = `
                <div class="appointment-info">
                    <h3>${apt.centerName}</h3>
                    <p>📅 ${Utils.formatDate(apt.date)} la ora ${apt.time}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-cancel" data-id="${apt.id}">Anulează</button>
                </div>
            `;

            card.querySelector('.btn-cancel').addEventListener('click', () => {
                this.cancelAppointment(apt.id);
            });

            container.appendChild(card);
        });
    },

    /**
     * Anulare programare
     */
    cancelAppointment(appointmentId) {
        if (!confirm('Sigur dorești să anulezi această programare?')) return;

        const appointments = Utils.getFromStorage('appointments') || [];
        const index = appointments.findIndex(apt => apt.id === appointmentId);
        
        if (index !== -1) {
            appointments[index].status = 'cancelled';
            Utils.saveToStorage('appointments', appointments);
            this.loadUserAppointments();
            this.showModal('success', 'Programare anulată', 'Programarea a fost anulată cu succes.');
        }
    },

    /**
     * Setup modal
     */
    setupModal() {
        const modal = document.getElementById('notificationModal');
        const closeBtn = document.getElementById('modalClose');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    },

    /**
     * Afișare modal
     */
    showModal(type, title, message) {
        const modal = document.getElementById('notificationModal');
        const body = document.getElementById('modalBody');

        if (!modal || !body) return;

        body.className = `modal-body ${type}`;
        body.innerHTML = `
            <h3>${type === 'success' ? '✅' : '❌'} ${title}</h3>
            <p>${message}</p>
        `;

        modal.classList.add('active');
    }
};

// Inițializare la încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    Appointments.init();
});

// Export pentru utilizare globală
window.Appointments = Appointments;
