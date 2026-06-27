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

  // Listener pentru tasta Escape (ESC) pentru închiderea ferestrei modalului
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Vă rugăm să selectați o oră.');
      return;
    }

    setError('');
    setSuccess('');

    const savedUser = sessionStorage.getItem('user_session');
    const user = savedUser ? JSON.parse(savedUser) : null;

    if (!user) {
      setError('Sesiunea a expirat. Te rugăm să re-intri în cont.');
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/appointments/', {
        user_id: user.id,
        campaign_id: campaign.id,
        slot_time: selectedSlot
      });

      setSuccess('Programarea ta a fost confirmată cu succes!');
      setTimeout(() => {
        onRefresh(); 
        onClose();   
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.detail || 'A apărut o eroare. Locul ar putea fi deja ocupat.');
    }
  };

  const formatRomanianDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  return (
    <div 
      onClick={onClose} // Închidere la click în afara ferestrei (pe fundal)
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Oprește propagarea evenimentului din interior
        style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', maxWidth: '550px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#e63946' }}>Alege Ora Programării</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>&times;</button>
        </div>

        <div style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '6px', fontSize: '14px', lineHeight: '1.5' }}>
          <p style={{ margin: '0 0 5px 0' }}><strong>Campanie:</strong> {campaign.title}</p>
          <p style={{ margin: '0 0 5px 0' }}><strong>Centru:</strong> {campaign.location_name}</p>
          <p style={{ margin: '0 0 5px 0' }}><strong>Adresă:</strong> {campaign.address}</p>
          <p style={{ margin: '0 0 10px 0' }}><strong>Data:</strong> {formatRomanianDate(campaign.date)}</p>
          
          {/* MESAJUL NOU ADĂUGAT SUB DATĂ */}
          <p style={{ margin: '10px 0 0 0', paddingWith: 'top', borderTop: '1px dashed #ccc', paddingTop: '10px', color: '#555', fontSize: '13px', fontStyle: 'italic' }}>
            <strong>Recomandare:</strong> In masura in care puteti si este loc disponibil, se recomanda ca donatorii fideli cu grupa sanguina 0-I sa doneze in prima parte a diminetii (pana la ora 11).
          </p>
        </div>

        {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{error}</p>}
        {success && <p style={{ color: 'green', backgroundColor: '#e3ffe3', padding: '10px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{success}</p>}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Se încarcă orele disponibile...</p>
        ) : (
          <form onSubmit={handleConfirmAppointment}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px' }}>Intervale orare rămase libere:</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {slots.map((slot) => {
                  const isDisabled = slot.available_slots <= 0;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedSlot(slot.time)}
                      style={{
                        padding: '10px 5px',
                        borderRadius: '4px',
                        border: selectedSlot === slot.time ? '2px solid #e63946' : '1px solid #ccc',
                        backgroundColor: selectedSlot === slot.time ? '#ffe3e6' : isDisabled ? '#e9ecef' : '#fff',
                        color: isDisabled ? '#999' : '#333',
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