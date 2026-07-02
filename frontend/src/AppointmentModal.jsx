import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AppointmentModal({ campaign, onClose, onRefresh, onOpenWaitlist, isAssigningFromWaitlist = false, waitlistId = null }) { 
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState({ date: '', time: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --- State-uri noi pentru programarea altei persoane ---
  const [isForSomeoneElse, setIsForSomeoneElse] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestSurname, setGuestSurname] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestBloodGroup, setGuestBloodGroup] = useState('Nu știu');

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

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
          // Tritem noile proprietăți către API
          is_for_someone_else: isForSomeoneElse,
          guest_name: isForSomeoneElse ? guestName : null,
          guest_surname: isForSomeoneElse ? guestSurname : null,
          guest_phone: isForSomeoneElse ? guestPhone : null,
          guest_blood_group: isForSomeoneElse ? guestBloodGroup : "Nu știu"
        });
        setSuccess('Programare realizată cu succes!');
      }

      if (onRefresh) onRefresh();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare la salvarea programării.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', maxWidth: '550px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#e63946' }}>
            {isAssigningFromWaitlist ? `Asignare Waitlist: ${campaign.title}` : `Programare: ${campaign.title}`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>&times;</button>
        </div>

        {loading && <p style={{ textAlign: 'center', color: '#666' }}>Se încarcă intervalele orare...</p>}
        
        {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{error}</p>}
        {success && <p style={{ color: 'green', backgroundColor: '#e3ffe3', padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{success}</p>}

        {!loading && slots.length === 0 && <p style={{ color: '#666' }}>Nu există intervale orare disponibile.</p>}

        {!loading && slots.length > 0 && (
          <form onSubmit={handleConfirmAppointment}>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>
                Locație: <strong>{campaign.location_name}</strong> ({campaign.address})
              </p>

              {/* OPTIUNEA NOUĂ: PROGRAMEAZĂ PE ALTCINEVA */}
              {!isAssigningFromWaitlist && (
                <div style={{ backgroundColor: '#fdf0f1', padding: '12px', borderRadius: '6px', marginBottom: '15px', border: '1px solid #f9dadc' }}>
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
              
              {Object.keys(groupedSlots).map((dateKey, dayIndex) => (
                <div key={dateKey} style={{ marginBottom: '20px', borderBottom: Object.keys(groupedSlots).length > 1 ? '1px dashed #eee' : 'none', paddingBottom: '10px' }}>
                  
                  {Object.keys(groupedSlots).length > 1 && (
                    <h4 style={{ margin: '10px 0', color: '#333', fontSize: '14px', backgroundColor: '#f8f9fa', padding: '5px' }}>
                      {formatDateLabel(dateKey, dayIndex)}
                    </h4>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
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
                            fontSize: '13px'
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              {!isAssigningFromWaitlist && (
                <button 
                  type="button"
                  onClick={() => onOpenWaitlist(campaign)}
                  style={{ padding: '8px 15px', backgroundColor: '#2b2d42', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: 'auto' }}
                >
                  Înscriere Waitlist
                </button>
              )}
              
              <button 
                type="button" 
                onClick={onClose} 
                style={{ padding: '8px 15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                Anulează
              </button>
              
              <button 
                type="submit" 
                style={{ padding: '8px 15px', backgroundColor: isAssigningFromWaitlist ? '#198754' : '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isAssigningFromWaitlist ? 'Confirmă Asignarea Orei' : 'Confirmă Rezervarea'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AppointmentModal;