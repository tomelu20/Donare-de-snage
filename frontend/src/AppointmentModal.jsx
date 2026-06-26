import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AppointmentModal({ campaign, onClose, onRefresh }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Vă rugăm să selectați o oră.');
      return;
    }

    setError('');
    setSuccess('');

    // Extragem user-ul curent din sessionStorage pentru a-i lua ID-ul
    const savedUser = sessionStorage.getItem('user_session');
    const user = savedUser ? JSON.parse(savedUser) : null;

    if (!user) {
      setError('Sesiunea a expirat. Te rugăm să reîntri în cont.');
      return;
    }

    try {
      // MODIFICAT: Trimitem și user_id-ul salvat în sesiune către backend!
      await axios.post('http://127.0.0.1:8000/appointments/', {
        campaign_id: campaign.id,
        slot_time: selectedSlot,
        user_id: user.id 
      });

      setSuccess('Programare înregistrată cu succes!');
      setSelectedSlot('');
      
      // Reîmprospătăm interfața din Dashboard
      if (onRefresh) onRefresh();

      // Închidem modalul după 2 secunde
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare la salvarea programării.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}>
        
        <h3 style={{ marginTop: 0, color: '#e63946', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>
          Rezervare Interval Orar
        </h3>
        <p style={{ fontSize: '15px', color: '#333', margin: '0 0 15px 0' }}>
          Alegeți ora dorită pentru campania: <strong style={{ color: '#e63946' }}>{campaign.title}</strong>
        </p>

        {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{error}</p>}
        {success && <p style={{ color: 'green', backgroundColor: '#e3ffe3', padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{success}</p>}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Se generează intervalele libere...</p>
        ) : (
          <form onSubmit={handleConfirmAppointment}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Intervale orare valabile:</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {slots.map((slot) => {
                  const isDisabled = slot.available_slots <= 0;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedSlot(slot.time);
                          setError('');
                        }
                      }}
                      style={{
                        padding: '10px 5px',
                        borderRadius: '6px',
                        border: selectedSlot === slot.time ? '2px solid #e63946' : '1px solid #ccc',
                        backgroundColor: isDisabled ? '#f1f3f5' : selectedSlot === slot.time ? '#ffebecc' : '#fff',
                        color: isDisabled ? '#999' : selectedSlot === slot.time ? '#e63946' : '#333',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontWeight: selectedSlot === slot.time ? 'bold' : 'normal',
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <button 
                type="button" 
                onClick={onClose} 
                style={{ padding: '8px 15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                Închide fereastra
              </button>
              <button 
                type="submit" 
                style={{ padding: '8px 15px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Confirmă Rezervarea
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AppointmentModal;