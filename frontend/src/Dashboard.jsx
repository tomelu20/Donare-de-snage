import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppointmentModal from './AppointmentModal'; 

function Dashboard({ onLogout }) {
  // Schimbat din localStorage în sessionStorage
  const savedUser = sessionStorage.getItem('user_session');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/campaigns/');
      setCampaigns(response.data);
    } catch (err) {
      setApiError('Nu s-a putut conecta la server pentru a lua campaniile active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleLogoutClick = () => {
    // Schimbat din localStorage în sessionStorage
    sessionStorage.removeItem('user_session');
    if (onLogout) {
      onLogout();
    }
  };

  const handleAction = (campaign) => {
    if (user && user.role === 'admin') {
      alert('Funcționalitate de administrare sloturi în lucru.');
    } else {
      setSelectedCampaign(campaign);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e63946', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e63946', margin: 0 }}>Panou de Control Donatori</h2>
        <button onClick={handleLogoutClick} style={{ padding: '8px 12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Deconectare
        </button>
      </div>

      {user ? (
        <div>
          {/* Info Card */}
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Utilizator: {user.name} {user.surname}</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{user.email} | {user.phone}</p>
            </div>
            <span style={{ padding: '4px 8px', backgroundColor: user.role === 'admin' ? '#d1e7dd' : '#ffe3e3', color: user.role === 'admin' ? '#0f5132' : '#e63946', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {user.role}
            </span>
          </div>

          <h3 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Campanii Active în acest moment</h3>
          
          {loading && <p style={{ color: '#666', fontStyle: 'italic' }}>Se încarcă datele...</p>}
          {apiError && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px' }}>{apiError}</p>}
          
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            {campaigns.map((campaign) => (
              <div key={campaign.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#e63946' }}>{campaign.title}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Locație:</strong> {campaign.location_name} - {campaign.address}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                    <strong>Data:</strong> {campaign.date} | <strong>Interval orar:</strong> {campaign.start_time} - {campaign.end_time}
                  </p>
                </div>
                
                <button 
                  onClick={() => handleAction(campaign)}
                  style={{ padding: '8px 12px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {user.role === 'admin' ? 'Vezi detalii' : 'Programează-te'}
                </button>
              </div>
            ))}
          </div>

          {selectedCampaign && (
            <AppointmentModal 
              campaign={selectedCampaign} 
              onClose={() => setSelectedCampaign(null)} 
              onRefresh={fetchCampaigns}
            />
          )}

        </div>
      ) : (
        <p>Eroare fatală: Lipsă sesiune.</p>
      )}
    </div>
  );
}

export default Dashboard;