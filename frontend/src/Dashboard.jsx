import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppointmentModal from './AppointmentModal'; 

function Dashboard({ onLogout }) {
  const savedUser = sessionStorage.getItem('user_session'); 
  const user = savedUser ? JSON.parse(savedUser) : null; 

  const [campaigns, setCampaigns] = useState([]); 
  const [myAppointments, setMyAppointments] = useState([]); // Programările personale (acum și pt Admin)
  const [adminAppointments, setAdminAppointments] = useState([]); // Toate programările (doar pt Admin)
  
  const [loading, setLoading] = useState(true); 
  const [apiError, setApiError] = useState(''); 
  const [selectedCampaign, setSelectedCampaign] = useState(null); 

  const [appointmentToCancel, setAppointmentToCancel] = useState(null); 
  const [successNotification, setSuccessNotification] = useState(''); 

  const formatRomanianDate = (dateString) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}-${parts[1]}-${parts[0]}`; 
  };

  const fetchData = async () => {
    if (!user) return; 
    try {
      setLoading(true); 
      setApiError(''); 
      
      // 1. Încărcăm campaniile active
      const campaignsRes = await axios.get('http://127.0.0.1:8000/campaigns/'); 
      setCampaigns(campaignsRes.data); 

      // 2. Încărcăm programările personale (valabil pentru ORICE utilizator logat, inclusiv Admin)
      const myAppointmentsRes = await axios.get('http://127.0.0.1:8000/appointments/me'); 
      setMyAppointments(myAppointmentsRes.data); 

      // 3. Dacă este admin, încărcăm suplimentar și lista globală pentru tabel
      if (user.role === 'admin' || user.role === 'ADMIN') { 
        const adminRes = await axios.get('http://127.0.0.1:8000/appointments/all'); 
        setAdminAppointments(adminRes.data); 
      }
    } catch (err) {
      setApiError('A apărut o eroare la sincronizarea datelor cu serverul.'); 
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData(); 
  }, []); 

  const handleLogoutClick = () => {
    sessionStorage.removeItem('user_session'); 
    if (onLogout) { 
      onLogout(); 
    }
  };

  const triggerCancelConfirmation = (appId) => {
    setAppointmentToCancel(appId); 
  };

  const executeCancel = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/appointments/${appointmentToCancel}/cancel`); 
      setAppointmentToCancel(null); 
      setSuccessNotification("Programarea a fost anulată cu succes."); 
      
      setTimeout(() => setSuccessNotification(''), 3000); 
      fetchData(); 
    } catch (err) {
      alert("Nu s-a putut anula programarea."); 
      setAppointmentToCancel(null); 
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {successNotification && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', backgroundColor: '#d1e7dd', color: '#0f5132', padding: '15px 25px', borderRadius: '6px', borderLeft: '5px solid #0f5132', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 2000, fontWeight: 'bold' }}>
          {successNotification}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e63946', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#e63946', margin: 0 }}>Panou de Control Donatori</h2>
        <button onClick={handleLogoutClick} style={{ padding: '8px 12px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Deconectare
        </button>
      </div>

      {user ? (
        <div>
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '6px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>Utilizator: {user.name} {user.surname}</h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{user.email} | {user.phone}</p>
            </div>
            <span style={{ padding: '4px 8px', backgroundColor: (user.role === 'admin' || user.role === 'ADMIN') ? '#d1e7dd' : '#ffe3e3', color: (user.role === 'admin' || user.role === 'ADMIN') ? '#0f5132' : '#e63946', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {(user.role === 'admin' || user.role === 'ADMIN') ? 'Medic / Personal Centru' : 'Donator'}
            </span>
          </div>

          {loading && <p style={{ color: '#666', fontStyle: 'italic' }}>Se încarcă datele din sistem...</p>}
          {apiError && <p style={{ color: 'red', backgroundColor: '#ffe3e3', padding: '10px', borderRadius: '4px' }}>{apiError}</p>}

          {!loading && (
            <>
              {/* ========================================== */}
              {/* VEDERE MODIFICATĂ: PROGRAMĂRILE MELE PERS. (Pt toată lumea) */}
              {/* ========================================== */}
              <div style={{ marginBottom: '35px', padding: '15px', backgroundColor: '#fff5f5', border: '1px solid #ffa3a3', borderRadius: '6px' }}>
                <h3 style={{ color: '#e63946', margin: '0 0 10px 0' }}>📅 Programările Mele Personale</h3>
                {myAppointments.length === 0 ? (
                  <p style={{ color: '#666', margin: 0, fontStyle: 'italic' }}>Nu ai nicio programare activă rezervată pe numele tău.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {[...myAppointments]
                      .sort((a, b) => {
                        const campA = campaigns.find(c => c.id === a.campaign_id);
                        const campB = campaigns.find(c => c.id === b.campaign_id);
                        if (!campA) return 1;
                        if (!campB) return -1;
                        return campA.date.localeCompare(campB.date);
                      })
                      .map((app) => {
                        const camp = campaigns.find(c => c.id === app.campaign_id);
                        return (
                          <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '12px', borderRadius: '4px', border: '1px solid #ddd' }}>
                            <div>
                              <strong style={{ color: '#e63946' }}>{camp ? camp.title : `Campania #${app.campaign_id}`}</strong>
                              <div style={{ fontSize: '13px', color: '#555', marginTop: '3px' }}>
                                Data: <strong style={{ color: '#000' }}>{camp ? formatRomanianDate(camp.date) : 'N/A'}</strong> | Locație: {camp ? camp.location_name : 'N/A'} | Ora: <strong style={{ color: '#000' }}>{app.slot_time}</strong>
                              </div>
                            </div>
                            <button 
                              onClick={() => triggerCancelConfirmation(app.id)}
                              style={{ padding: '6px 10px', backgroundColor: '#fff', color: '#dc3545', border: '1px solid #dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                            >
                              Anulează
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* VEDERE ADMIN: CENTRALIZATOR GLOBAL */}
              {/* ========================================== */}
              {(user.role === 'admin' || user.role === 'ADMIN') && (
                <div style={{ marginBottom: '35px' }}>
                  <h3 style={{ color: '#0f5132', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>📋 Centralizator Global Programări (Vizualizare Toți Donatorii)</h3>
                  {adminAppointments.length === 0 ? (
                    <p style={{ color: '#777', fontStyle: 'italic' }}>Nu există nicio programare înregistrată.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
                          <th style={{ padding: '10px', border: '1px solid #ddd' }}>Donator</th>
                          <th style={{ padding: '10px', border: '1px solid #ddd' }}>Telefon</th>
                          <th style={{ padding: '10px', border: '1px solid #ddd' }}>Campanie / Centru</th>
                          <th style={{ padding: '10px', border: '1px solid #ddd' }}>Data & Ora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAppointments.map((app) => (
                          <tr key={app.appointment_id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{app.donor_name} {app.donor_surname}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.donor_phone}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{app.campaign_title}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', color: '#e63946', fontWeight: 'bold' }}>
                              {formatRomanianDate(app.campaign_date)} | {app.slot_time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* CAMPANII ACTIVE (Cu buton activ pt TOȚI) */}
              {/* ========================================== */}
              <h3 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '5px', marginTop: '20px' }}>Campanii Active în acest moment</h3>
              <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
                {campaigns.map((campaign) => (
                  <div key={campaign.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#e63946' }}>{campaign.title}</h4>
                      <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>Locație:</strong> {campaign.location_name} - {campaign.address}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                        <strong>Data:</strong> {formatRomanianDate(campaign.date)} | <strong>Interval orar:</strong> {campaign.start_time} - {campaign.end_time}
                      </p>
                    </div>
                    {/* MODIFICAT: Butonul este acum disponibil și pentru admin */}
                    <button 
                      onClick={() => setSelectedCampaign(campaign)}
                      style={{ padding: '8px 12px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Programează-te
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedCampaign && (
            <AppointmentModal 
              campaign={selectedCampaign} 
              onClose={() => setSelectedCampaign(null)} 
              onRefresh={fetchData}
            />
          )}

          {appointmentToCancel && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Confirmare Anulare</h4>
                <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>Ești sigur că vrei să anulezi această programare?</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => setAppointmentToCancel(null)} 
                    style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Renunță
                  </button>
                  <button 
                    onClick={executeCancel} 
                    style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Da, anulează
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <p>Eroare fatală: Lipsă sesiune.</p>
      )}
    </div>
  );
}

export default Dashboard;