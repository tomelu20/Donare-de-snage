import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AppointmentModal({ campaign, onClose, onRefresh }) {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Încărcăm sloturile de timp pentru campania selectată
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        // Apelăm endpoint-ul din campaigns.py
        const response = await axios.get(`http://127.0.0.1:8000/campaigns/${campaign.id}/slots`);
        setSlots(response.data);
      } catch (err) {
        setError('Nu s-au putut încărca intervalele orare.');
      } finally {
        setLoading(false);
      }
    };

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

    try {
      // Trimitem cererea conform schemei AppointmentCreate (campaign_id și slot_time)
      await axios.post('http://127.0.0.1:8000/appointments/', {
        campaign_id: campaign.id,
        slot_time: selectedSlot
      });

      setSuccess('Programare confirmată cu succes!');
      
      // Reîmprospătăm datele după 1.5 secunde și închidem fereastra modală
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1500);

    } catch (err) {
      // Prindem mesajul de eroare trimis de backend (ex: "Ne pare rău, acest interval orar s-a ocupat între timp!")
      setError(err.response?.data?.detail || 'A apărut o eroare la salvarea programării.');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '100%', maxWidth: '450px', boxSizing: 'border-box' }}>
        
        <h3 style={{ color: '#e63946', marginTop: 0, marginBottom: '10px' }}>Programare: {campaign.title}</h3>
        <p style={{ fontSize: '14px', color: '#555', margin: '0 0 20px 0' }}>
          <strong>Data:</strong> {campaign.date} <br />
          <strong>Locație:</strong> {campaign.location_name}
        </p>

        {error && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{error}</p>}
        {success && <p style={{ color: 'green', backgroundColor: '#e3ffe3', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{success}</p>}

        {loading ? (
          <p style={{ textStyle: 'italic', color: '#666' }}>Se încarcă intervalele disponibile...</p>
        ) : (
          <form onSubmit={handleConfirmAppointment}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Selectează Ora:</label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}>
                {slots.map((slot) => {
                  const isDisabled = !slot.is_available;
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
                        backgroundColor: isDisabled ? '#eee' : selectedSlot === slot.time ? '#ffeef0' : 'white',
                        color: isDisabled ? '#999' : selectedSlot === slot.time ? '#e63946' : '#333',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontWeight: selectedSlot === slot.time ? 'bold' : 'normal',
                        fontSize: '13px'
                      }}
                    >
                      {slot.time}
                      <span style={{ display: 'block', fontSize: '10px', color: isDisabled ? '#999' : '#666' }}>
                        ({slot.available_slots} locuri)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={onClose} 
                style={{ padding: '8px 15px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              >
                Anulează
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