# 🩸 Platformă Smart pentru Donare de Sânge - Ghidul Utilizatorului (User Guide)

O aplicație web modernă, intuitivă și eficientă creată pentru a simplifica procesul de programare la donarea de sânge, gestionarea campaniilor medicale și oferirea de suport inteligent în timp real prin intermediul unui asistent AI dedicat (**Don AI**).

---

## 📋 Cuprins

1. [Prezentare Generală](#-prezentare-generală)
2. [Funcționalități Cheie](#-funcționalități-cheie)
3. [Ghid de Utilizare: Rolul Donator](#-ghid-de-utilizare-rolul-donator)
4. [Ghid de Utilizare: Rolul Administrator](#-ghid-de-utilizare-rolul-administrator)
5. [Asistentul Virtual Don AI](#-asistentul-virtual-don-ai)
6. [Ghid de Instalare și Rulare](#-ghid-de-instalare-și-rulare)
7. [Tehnologii Utilizate](#-tehnologii-utilizate)

---

## 🌟 Prezentare Generală

Proiectul rezolvă problemele clasice de organizare ale centrelor de donare: aglomerația, lipsa de verificare a eligibilității în prealabil și comunicarea anevoioasă cu donatorii. Prin integrarea unui **sistem de sloturi orare**, a unui **chestionar de eligibilitate dinamic**, a unei **liste de așteptare (Waitlist)** și a unui **Chatbot bazat pe LLM (Don AI)**, platforma optimizează fluxul de donatori și îmbunătățește rata de participare.

---

## 🔥 Funcționalități Cheie

- 🔐 **Autentificare și Verificare Email:** Înregistrare securizată prin cod de confirmare transmis pe email (OTP).
- 📅 **Programări pe Sloturi Orare:** Vizualizarea capacității în timp real per interval orar.
- 👨‍👩‍👧 **Programare pentru Terți:** Posibilitatea de a programa un prieten sau o rudă, specificând datele de contact și grupa sanguină.
- 📋 **Chestionar Dinamic de Eligibilitate:** Formular interactiv (checkbox, radio DA/NU, introducere valori numerice) obligatoriu înainte de rezervare.
- ⏳ **Waitlist Inteligent:** Înscriere pe lista de așteptare în cazul în care sloturile sunt epuizate, cu specificarea timpului de deplasare și a intervalului preferat.
- 🔔 **Sistem de Remindere:** Trimitere notificări prin email pentru campaniile active.
- 🤖 **Asistent Virtual Don AI:** Chatbot integrat cu interfață intuitivă, suport Markdown și mecanism de protecție (Cooldown/Rate Limiting).
- 🛡️ **Panou Administrativ Avansat:** Centralizator de programări, gestiune reprezentanți, creare de campanii și administrare chestionare.

---

## 👤 Ghid de Utilizare: Rolul Donator

### 1. Creare Cont și Autentificare
1. Deschideți aplicația și selectați **Înregistrează-te**.
2. Completați numele, prenumele, numărul de telefon, grupa sanguină și adresa de email.
3. Apăsați pe **Trimite cod** și introduceți codul din 6 cifre primit pe email.
4. După ce apare mesajul `✓ Email Verificat`, setați parola și finalizați înregistrarea.

### 2. Rezervarea unei Programări
1. În **Dashboard**, consultați lista de *Campanii de Donare Active*.
2. Apăsați butonul **Programează-te** din dreptul campaniei dorite.
3. Completați **Formularul de Eligibilitate** (răspundeți la întrebările medicale/criteriile afișate).
4. *(Opțional)* Bifați căsuța **Programează pentru altcineva** dacă doriți să înregistrați un membru al familiei sau un prieten.
5. Selectați ziua și intervalul orar dorit dintre sloturile disponibile.
6. Apăsați **Confirmă Rezervarea**.

### 3. Înscrierea în Lista de Așteptare (Waitlist)
Dacă sloturile orare dorite sunt complet ocupate:
1. În modalul de programare, apăsați pe **Înscriere Waitlist**.
2. Specificați intervalul orar preferat și timpul necesar pentru deplasare până la centru.
3. Confirmați înscrierea. Administratorii vă vor contacta sau aloca direct la eliberarea unui loc.

---

## 🛠️ Ghid de Utilizare: Rolul Administrator

Dacă vă autentificați cu un cont ce deține rolul de `ADMIN`, panoul principal vă pune la dispoziție instrumente speciale de gestiune:

1. **Centralizator Management Programări:**
   - Vizualizați toate rezervările din sistem.
   - Marcați statusul donatorului când ajunge la centru: **Prezent ✓** sau **Absent ✗**.
   - Anulați programările care nu mai sunt valabile.

2. **Management Listă de Așteptare (Waitlist):**
   - Vizualizați doritorii din waitlist, timpul de deplasare și intervalul lor preferat.
   - Apăsați **Asignează** pentru a le aloca manual un slot orar disponibil.

3. **Management Chestionar Eligibilitate:**
   - Adăugați întrebări noi configurând tipul de răspuns (Căsuță de bifat, Opțiune DA/NU, Valoare Numerică).
   - Ștergeți criteriile de eligibilitate învechite.

4. **Creare Campanie Nouă:**
   - Completați titlul, locația, adresa exactă, perioada (data început/sfârșit), programul (oră start/final), durata unui slot (minute) și capacitatea per slot.

5. **Notificări & Remindere:**
   - Folosiți butonul 🔔 **Trimite Reminder** din dreptul fiecărei campanii pentru a notifica automat toți donatorii confirmați.

---

## 🤖 Asistentul Virtual Don AI

În colțul din dreapta-jos al ecranului este disponibil **Don AI**, asistentul inteligent pregătit să răspundă la întrebări despre donarea de sânge.

- **Suport Markdown:** Răspunsurile sunt structurate clar (liste, text îngroșat, sublinieri).
- **Sistem Cooldown (Rate Limiting):** Dacă trimiteți mesaje prea repede sau atingeți limita de tokeni alocați, widgetul activează un cronometru de așteptare pentru protecția serverului backend.

---

## ⚙️ Ghid de Instalare și Rulare

### Cerințe Preliminare
- **Node.js** (v16 sau mai nou)
- **npm** sau **yarn**
- Backend-ul **FastAPI** rulat local la adresa `http://127.0.0.1:8000`

### Pași de Instalare
1. Clonați depozitul direct pe calculatorul dumneavoastră:
   ```bash
   git clone [https://github.com/utilizator/donare-sange-frontend.git](https://github.com/utilizator/donare-sange-frontend.git)
   cd donare-sange-frontend