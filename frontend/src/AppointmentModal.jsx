import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AppointmentModal({ campaign, onClose, onRefresh, onOpenWaitlist, isAssigningFromWaitlist = false, waitlistId = null }) { 
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState({ date: '', time: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- State-uri pentru programarea altei persoane ---
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestSurname, setGuestSurname] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestBloodGroup, setGuestBloodGroup] = useState('Nu știu');

  // --- State-uri pentru Formularul de Eligibilitate ---
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [checklist, setChecklist] = useState({
    weight: false,
    age: false,
    surgery: false,
    anesthesia: false,
    procedures: false,
    antiinflammatory: false,
    paracetamol: false,
    vaccine: false,
    previousDonation: false
  });

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/campaigns/${campaign.id}/slots`);
      setSlots(response.data);
    } catch (err) {
      setError('Nu s-au putut încărca intervalele orare.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [campaign.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const allChecked = Object.values(checklist).every(value => value === true);
    setIsEligible(allChecked);
  }, [checklist]);

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const formatDateLabel = (dateStr, index) => {
    const dateObj = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return `Ziua ${index + 1} (${dateObj.toLocaleDateString('ro-RO', options)})`;
  };

  const handleCheckboxChange = (key) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isEligible && !isAssigningFromWaitlist) {
      setError('Nu vă puteți programa! Trebuie să accesați și să completați corect Formularul de Eligibilitate.');
      return;
    }

    if (!selectedSlot.time || !selectedSlot.date) {
      setError('Vă rugăm să selectați un interval orar.');
      return;
    }

    if (isForSomeoneElse && (!guestName || !guestSurname || !guestPhone)) {
      setError('Vă rugăm să completați toate datele persoanei pe care o programați.');
      return;
    }

    try {
      if (isAssigningFromWaitlist) {
        await axios.post(`http://127.0.0.1:8000/waitlist/${waitlistId}/assign?slot_time=${selectedSlot.time}`);
        setSuccess('Donatorul din lista de așteptare a fost asignat cu succes!');
      } else {
        const savedUser = sessionStorage.getItem('user_session');
        const user = savedUser ? JSON.parse(savedUser) : null;

        if (!user || !user.id) {
          setError('Eroare: Utilizatorul nu este autentificat corect.');
          return;
        }

        await axios.post('http://127.0.0.1:8000/appointments/', {
          campaign_id: campaign.id,
          slot_time: selectedSlot.time,
          user_id: user.id,
          appointment_date: selectedSlot.date,
          is_for_someone_else: isForSomeoneElse,
          guest_name: isForSomeoneElse ? guestName : null,
          guest_surname: isForSomeoneElse ? guestSurname : null,
          guest_phone: isForSomeoneElse ? guestPhone : null,
          guest_blood_group: isForSomeoneElse ? guestBloodGroup : "Nu știu"
        });
        
        // MESAJ DE SUCCES PERSONALIZAT CONFORM CERINȚEI
        setSuccess('Felicitări! Te-ai programat cu succes, poți să-ți vezi programarea în secțiunea Programările Mele.');
      }

      if (onRefresh) onRefresh();
      setTimeout(() => {
        onClose();
      }, 4000); // 4 secunde timp de citire înainte de închidere automată
    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare la salvarea programării.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div style={{ backgroundColor: 'white', borderRadius: '8px', maxWidth: '650px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: 'sans-serif', overflow: 'hidden' }}>
        
        {/* HEADER FIX */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '20px 25px 15px 25px' }}>
          <h3 style={{ margin: 0, color: '#e63946' }}>
            {isAssigningFromWaitlist ? `Asignare Waitlist: ${campaign.title}` : `Programare: ${campaign.title}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999', lineHeight: '1' }}>&times;</button>
        </div>

        {/* CORPUL MODALULUI CU SCROLL INDEPENDENT */}
        <div style={{ padding: '0 25px', overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
          {loading && <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Se încarcă intervalele orare...</p>}
          
          {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px', fontSize: '14px', marginTop: '15px' }}>{error}</p>}
          {success && <p style={{ color: '#155724', backgroundColor: '#d4edda', borderLeft: '5px solid #28a745', padding: '12px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', marginTop: '15px', lineHeight: '1.4' }}>{success}</p>}

          {!loading && slots.length === 0 && <p style={{ color: '#666', padding: '20px', textAlign: 'center' }}>Nu există intervale orare disponibile.</p>}

          {!loading && slots.length > 0 && (
            <div style={{ paddingTop: '15px', paddingBottom: '15px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>
                Locație: <strong>{campaign.location_name}</strong> ({campaign.address})
              </p>

              {/* INDICAȚIE TEXT / ALERTĂ PENTRU UTILIZATOR CONFORM CERINȚEI */}
              {!isAssigningFromWaitlist && (
                <div style={{ 
                  backgroundColor: isEligible ? '#e2f0d9' : '#fff3cd', 
                  color: isEligible ? '#385723' : '#856404', 
                  padding: '10px 15px', 
                  borderRadius: '6px', 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  border: isEligible ? '1px solid #c5e0b4' : '1px solid #ffeeba'
                }}>
                  {isEligible 
                    ? '✓ Chestionar completat corect! Te poți programa sau înscrie în waitlist.' 
                    : '⚠ Pentru a te putea programa sau înscrie în waitlist, trebuie să completezi Formularul de Eligibilitate.'
                  }
                </div>
              )}

              {/* OPȚIUNE PROGRAMEAZĂ PE ALTCINEVA */}
              {!isAssigningFromWaitlist && (
                <div style={{ backgroundColor: '#fdf0f1', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #f9dadc' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#e63946', fontSize: '14px' }}>
                    <input 
                      type="checkbox" 
                      checked={isForSomeoneElse} 
                      onChange={(e) => setIsForSomeoneElse(e.target.checked)}
                      style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                    />
                    Programez pentru altcineva (sot/sotie, prieten etc.)
                  </label>

                  {isForSomeoneElse && (
                    <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px', color: '#333' }}>Nume:</label>
                        <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px', color: '#333' }}>Prenume:</label>
                        <input type="text" value={guestSurname} onChange={(e) => setGuestSurname(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px', color: '#333' }}>Telefon:</label>
                        <input type="text" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '3px', color: '#333' }}>Grupa Sanguină:</label>
                        <select value={guestBloodGroup} onChange={(e) => setGuestBloodGroup(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '13px', backgroundColor: '#fff' }}>
                          <option value="Nu știu">Nu știu</option>
                          <option value="0I+">0I (+)</option>
                          <option value="0I-">0I (-)</option>
                          <option value="AII+">AII (+)</option>
                          <option value="AII-">AII (-)</option>
                          <option value="BIII+">BIII (+)</option>
                          <option value="BIII-">BIII (-)</option>
                          <option value="ABIV+">ABIV (+)</option>
                          <option value="ABIV-">ABIV (-)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* AFISARE SLOTURI ORARE */}
              {Object.keys(groupedSlots).map((dateKey, dayIndex) => (
                <div key={dateKey} style={{ marginBottom: '20px', borderBottom: Object.keys(groupedSlots).length > 1 ? '1px dashed #eee' : 'none', paddingBottom: '15px' }}>
                  
                  <h4 style={{ margin: '10px 0', color: '#333', fontSize: '14px', backgroundColor: '#f8f9fa', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold' }}>
                    {formatDateLabel(dateKey, dayIndex)}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    {groupedSlots[dateKey].map((slot) => {
                      const isDisabled = slot.available_slots <= 0;
                      const isSelected = selectedSlot.time === slot.time && selectedSlot.date === slot.date;

                      return (
                        <button
                          key={`${slot.date}-${slot.time}`}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedSlot({ date: slot.date, time: slot.time })}
                          style={{
                            padding: '8px 5px',
                            borderRadius: '4px',
                            border: isSelected ? '2px solid #e63946' : '1px solid #ccc',
                            backgroundColor: isSelected ? '#ffe3e3' : isDisabled ? '#f0f0f0' : '#fff',
                            color: isDisabled ? '#999' : '#333',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: '13px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {slot.time.substring(0, 5)}
                          <span style={{ display: 'block', fontSize: '10px', color: isDisabled ? '#999' : '#666', marginTop: '2px' }}>
                            ({slot.available_slots} locuri)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONABIL FIXAT JOS */}
        {!loading && slots.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', padding: '15px 25px 20px 25px', backgroundColor: '#fdfdfd', alignItems: 'center' }}>
            
            {!isAssigningFromWaitlist && (
              <button 
                type="button"
                disabled={!isEligible}
                onClick={() => onOpenWaitlist(campaign)}
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: isEligible ? '#2b2d42' : '#73758a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: isEligible ? 'pointer' : 'not-allowed', 
                  fontWeight: 'bold', 
                  fontSize: '13px' 
                }}
              >
                Înscriere Waitlist
              </button>
            )}
            
            {!isAssigningFromWaitlist && (
              <button
                type="button"
                onClick={() => setShowEligibilityModal(true)}
                style={{ 
                  padding: '10px 15px', 
                  backgroundColor: isEligible ? '#198754' : '#ffc107', 
                  color: isEligible ? 'white' : '#333', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isEligible ? '✓ Eligibilitate Validată' : '📋 Formular Eligibilitate'}
              </button>
            )}
            
            <button 
              type="button" 
              onClick={onClose} 
              style={{ padding: '10px 15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              Anulează
            </button>
            
            <button 
              type="button"
              onClick={handleConfirmAppointment}
              disabled={!isEligible && !isAssigningFromWaitlist}
              style={{ 
                padding: '10px 18px', 
                backgroundColor: isAssigningFromWaitlist ? '#198754' : (isEligible ? '#e63946' : '#cca3a6'), 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: (!isEligible && !isAssigningFromWaitlist) ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              {isAssigningFromWaitlist ? 'Confirmă Asignarea Orei' : 'Confirmă Rezervarea'}
            </button>
          </div>
        )}
      </div>

      {/* MODAL INTERN PENTRU CHECKLIST FORMULAR ELIGIBILITATE */}
      {showEligibilityModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto', fontFamily: 'sans-serif', boxShadow: '0 5px 25px rgba(0,0,0,0.3)' }}>
            
            <h3 style={{ margin: '0 0 15px 0', color: '#2b2d42', borderBottom: '2px solid #e63946', paddingBottom: '8px' }}>
              📋 Formular Chestionar Eligibilitate
            </h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              Pentru a finaliza programarea, trebuie să confirmați prin bifare că îndepliniți toate condițiile medicale obligatorii de mai jos:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Condiții generale */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '14px' }}>Condiții generale</h5>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '6px' }}>
                  <input type="checkbox" checked={checklist.weight} onChange={() => handleCheckboxChange('weight')} style={{ marginTop: '2px' }} />
                  am peste 50 kg
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist.age} onChange={() => handleCheckboxChange('age')} style={{ marginTop: '2px' }} />
                  am între 18 și 65 ani
                </label>
              </div>

              {/* Intervenții medicale */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '14px' }}>Intervenții medicale</h5>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '6px' }}>
                  <input type="checkbox" checked={checklist.surgery} onChange={() => handleCheckboxChange('surgery')} style={{ marginTop: '2px' }} />
                  nu am avut intervenții chirurgicale recente
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist.anesthesia} onChange={() => handleCheckboxChange('anesthesia')} style={{ marginTop: '2px' }} />
                  nu am avut anestezie recent
                </label>
              </div>

              {/* Proceduri estetice */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '14px' }}>Proceduri estetice</h5>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist.procedures} onChange={() => handleCheckboxChange('procedures')} style={{ marginTop: '2px' }} />
                  nu am avut tatuaj/piercing/acupunctură/micro-pigmentare în ultimele 6 luni
                </label>
              </div>

              {/* Medicamente */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '14px' }}>Medicamente</h5>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '6px' }}>
                  <input type="checkbox" checked={checklist.antiinflammatory} onChange={() => handleCheckboxChange('antiinflammatory')} style={{ marginTop: '2px' }} />
                  nu am luat antiinflamatoare (ex: Nurofen) în ultima săptămână
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer', marginBottom: '6px' }}>
                  <input type="checkbox" checked={checklist.paracetamol} onChange={() => handleCheckboxChange('paracetamol')} style={{ marginTop: '2px' }} />
                  nu am luat paracetamol în ultima săptămână
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist.vaccine} onChange={() => handleCheckboxChange('vaccine')} style={{ marginTop: '2px' }} />
                  nu am făcut vaccin (COVID / gripal / HPV) în ultima lună
                </label>
              </div>

              {/* Donări anterioare */}
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '14px' }}>Donări anterioare</h5>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checklist.previousDonation} onChange={() => handleCheckboxChange('previousDonation')} style={{ marginTop: '2px' }} />
                  au trecut 8 săptămâni (femei) / 12 săptămâni (bărbați) de la ultima donare
                </label>
              </div>

            </div>

            <div style={{ marginTop: '25px', paddingTop: '10px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowEligibilityModal(false)}
                style={{ 
                  padding: '8px 20px', 
                  backgroundColor: isEligible ? '#198754' : '#e63946', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                {isEligible ? 'Salvează & Continuă' : 'Închide (Neelegibil)'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AppointmentModal;