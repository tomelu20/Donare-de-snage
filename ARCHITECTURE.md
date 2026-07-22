# 🏛️ Documentație de Concepție și Arhitectură (Architecture & Design Document)

Documentul descrie principiile arhitecturale, deciziile de design, structura fișierelor și fluxul de date pentru modulul Front-End al **Platformei de Donare de Sânge**.

---

## 🎯 1. Scopul și Viziunea Arhitecturală

Aplicația a fost concepută ca un **Single Page Application (SPA)** modern, axat pe performanță, reacție rapidă și o experiență utilizator (UX) fără cusur. Arhitectura separă clar logica de prezentare, gestionarea stării locale și interacțiunea cu API-ul REST (**FastAPI**).

### Obiective Principale de Design:
1. **Modelare bazată pe roluri (RBAC):** Renders condiționate în funcție de rolul utilizatorului autentificat (`donor` vs. `admin`).
2. **Validare Proactivă Client-Side:** Chestionar dinamic de eligibilitate integrat direct în procesul de rezervare.
3. **Resiliență și Tratare Erori:** Gestionarea elegantă a limitărilor de rată (Rate-Limiting/Cooldown) pentru modulul AI și feedback vizual instant pentru utilizator.
4. **Izolarea Sesiunilor:** Utilizarea `sessionStorage` pentru a asigura deconectarea automată la închiderea tab-ului/browserului.

---

## 📁 2. Structura Proiectului (Directory Tree)

```text
src/
├── components/           # (Componete modulare ale aplicației)
│   ├── AIChatbox.jsx     # Widget floating chat cu LLM (ReactMarkdown + Cooldown timer)
│   ├── AppointmentModal.jsx # Modal complex pt. programări, eligibilitate & rezervare terți
│   ├── Dashboard.jsx     # Panou principal (Condiționat per rol: Admin/Donor)
│   ├── Login.jsx         # Ecran de autentificare utilizator
│   ├── Register.jsx      # Formular de înregistrare cu verificare OTP pe Email
│   └── WaitlistModal.jsx # Formular de înscriere pe lista de așteptare
├── App.jsx               # Stateful Router component (Gestionare ecran curent)
├── main.jsx              # Punctul de intrare React (DOM Mount & StrictMode)
└── index.css             # Stiluri globale