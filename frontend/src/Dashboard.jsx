import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppointmentModal from './AppointmentModal'; 

function Dashboard({ onLogout }) {
  const savedUser = sessionStorage.getItem('user_session'); 
  const user = savedUser ? JSON.parse(savedUser) : null; 

  const [campaigns, setCampaigns] = useState([]); 
  const [myAppointments, setMyAppointments] = useState([]); 
  const [adminAppointments, setAdminAppointments] = useState([]); 
  
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
      const campaignsResponse = await axios.get('http://127.0.0.1:8000/campaigns/');
      setCampaigns(campaignsResponse.data);

      // 2. Încărcăm programările mele transmițând user_id ca parametru query
      const myAppsResponse = await axios.get(`http://127.0.0.1:8000/appointments/me?user_id=${user.id}`);
      setMyAppointments(myAppsResponse.data);

      // 3. Dacă e admin, încărcăm absolut toate programările din sistem
      if (user.role === 'admin' || user.role === 'ADMIN') {
        const adminAppsResponse = await axios.get('http://127.0.0.1:8000/appointments/all');
        setAdminAppointments(adminAppsResponse.data);
      }

    } catch (err) {
      setApiError(err.response?.data?.detail || 'Eroare la comunicarea cu serverul.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Funcție unificată pentru deschiderea modalului de confirmare (atât pt user, cât și pt admin)
  const handleCancelClick = (appId) => {
    setAppointmentToCancel(appId);
  };

  const executeCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      setApiError('');
      // Trimite ID-ul programării către ruta de anulare din backend
      await axios.put(`http://127.0.0.1:8000/appointments/${appointmentToCancel}/cancel`);
      
      setSuccessNotification('Programarea a fost anulată cu succes.');
      setAppointmentToCancel(null);
      
      // Reîmprospătăm toate listele de pe ecran
      fetchData();

      setTimeout(() => {
        setSuccessNotification('');
      }, 4000);

    } catch (err) {
      setApiError(err.response?.data?.detail || 'Nu s-a putut anula programarea.');
      setAppointmentToCancel(null);
    }
  };

  const handleLocalLogout = () => {
    sessionStorage.removeItem('user_session');
    if (onLogout) {
      onLogout();
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Sesiune invalidă. Vă rugăm să vă reconectați.</h2>
        <button onClick={handleLocalLogout} style={{ padding: '10px 20px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Mergi la Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '50px' }}>
      {/* Top Navigation Bar */}
      <nav style={{ backgroundColor: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🩸</span>
          <h2 style={{ margin: 0, color: '#e63946', fontSize: '22px', fontWeight: 'bold' }}>Platformă Donare Sânge</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>{user.name} {user.surname}</span>
            <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Rol: {(user.role === 'admin' || user.role === 'ADMIN') ? 'Administrator' : 'Donator'}
            </span>
          </div>
          <button onClick={handleLocalLogout} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Deconectare
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* Notificări de eroare / succes globale */}
        {apiError && (
          <div style={{ backgroundColor: '#ffe3e3', color: '#dc3545', padding: '15px', borderRadius: '6px', marginBottom: '20px', borderLeft: '5px solid #dc3545', fontWeight: 'bold' }}>
            ❌ {apiError}
          </div>
        )}
        {successNotification && (
          <div style={{ backgroundColor: '#e3ffe3', color: '#198754', padding: '15px', borderRadius: '6px', marginBottom: '20px', borderLeft: '5px solid #198754', fontWeight: 'bold' }}>
            ✔️ {successNotification}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>Se încarcă datele panoului...</div>
        ) : (
          <>
            {/* ========================================== */}
            {/* PANOU ADMIN: Vizualizare Globală Programări */}
            {/* ========================================== */}
            {(user.role === 'admin' || user.role === 'ADMIN') && (
              <section style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '40px', border: '1px solid #e1e4e8' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>
                  📋 Management Centralizat Programări (Vizualizare Admin)
                </h3>
                {adminAppointments.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Nu există nicio programare înregistrată în sistem în acest moment.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          <th style={{ padding: '12px' }}>Donator</th>
                          <th style={{ padding: '12px' }}>Telefon</th>
                          <th style={{ padding: '12px' }}>Campanie / Locație</th>
                          <th style={{ padding: '12px' }}>Dată Campanie</th>
                          <th style={{ padding: '12px' }}>Interval Orar</th>
                          <th style={{ padding: '12px' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Acțiuni Admin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAppointments.map((app) => (
                          <tr key={app.appointment_id} style={{ borderBottom: '1px solid #eceeef' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{app.donor_name} {app.donor_surname}</td>
                            <td style={{ padding: '12px' }}>{app.donor_phone}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ fontWeight: '500' }}>{app.campaign_title}</span>
                            </td>
                            <td style={{ padding: '12px' }}>{formatRomanianDate(app.campaign_date)}</td>
                            <td style={{ padding: '12px', color: '#e63946', fontWeight: 'bold' }}>{app.slot_time.substring(0, 5)}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: app.status === 'confirmed' ? '#e3ffe3' : '#fff3cd', color: app.status === 'confirmed' ? '#198754' : '#856404' }}>
                                {app.status === 'confirmed' ? 'Confirmată' : app.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <button 
                                onClick={() => handleCancelClick(app.appointment_id)}
                                style={{ padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => { e.target.style.backgroundColor = '#dc3545'; e.target.style.color = '#fff'; }}
                                onMouseLeave={(e) => { e.target.style.backgroundColor = '#fff'; e.target.style.color = '#dc3545'; }}
                              >
                                Anulează Programarea
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* GRID PRINCIPAL */}
            <div style={{ display: 'grid', gridTemplateColumns: (user.role === 'admin' || user.role === 'ADMIN') ? '1fr' : '2fr 1fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Secțiune Campanii Active */}
              <main style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>
                  📍 Campanii de Donare Active (Disponibile Acum)
                </h3>
                {campaigns.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Momentan nu există campanii de donare de sânge programate.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    {campaigns.map((camp) => (
                      <div key={camp.id} style={{ border: '1px solid #e1e4e8', borderRadius: '6px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '18px' }}>{camp.title}</h4>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#333' }}><strong>Centru/Locație:</strong> {camp.location_name}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}><strong>Adresă exactă:</strong> {camp.address}</p>
                          <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '13px', color: '#444' }}>
                            <span>📅 <strong>Data:</strong> {formatRomanianDate(camp.date)}</span>
                            <span>🕒 <strong>Program:</strong> {camp.start_time.substring(0, 5)} - {camp.end_time.substring(0, 5)}</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedCampaign(camp)} style={{ padding: '10px 20px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                          Programează-te
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </main>

              {/* Secțiune Istoric Programări Personale (Ascunsă sau secundară pentru Admin dacă vrea să se programeze singur) */}
              {!(user.role === 'admin' || user.role === 'ADMIN') && (
                <aside style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>
                    🩸 Programările Mele
                  </h3>
                  {myAppointments.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', fontSize: '14px' }}>Nu aveți nicio programare activă rezervată.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {myAppointments.map((app) => {
                        const associatedCamp = campaigns.find(c => c.id === app.campaign_id);
                        return (
                          <div key={app.id} style={{ border: '1px solid #e1e4e8', borderRadius: '6px', padding: '15px', backgroundColor: '#fafafa' }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '15px' }}>
                              {associatedCamp ? associatedCamp.title : `Campanie (ID: ${app.campaign_id})`}
                            </h4>
                            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
                              📍 {associatedCamp ? associatedCamp.location_name : 'Locație indisponibilă'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                              <div>
                                <span>📅 {associatedCamp ? formatRomanianDate(associatedCamp.date) : 'N/A'}</span>
                                <span style={{ display: 'block', fontWeight: 'bold', color: '#e63946', marginTop: '2px' }}>🕒 Ora: {app.slot_time.substring(0, 5)}</span>
                              </div>
                              <button onClick={() => handleCancelClick(app.id)} style={{ padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                                Anulează
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </aside>
              )}

            </div>
          </>
        )}
      </div>

      {/* MODAL PROGRAMARE */}
      {selectedCampaign && (
        <AppointmentModal 
          campaign={selectedCampaign} 
          onClose={() => setSelectedCampaign(null)} 
          onRefresh={fetchData} 
        />
      )}

      {/* POPUP CONFIRMARE ANULARE (Comun pentru Admin și Utilizator) */}
      {appointmentToCancel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Confirmare Anulare</h4>
            <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>Sigur doriți anularea definitivă a acestei programări?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setAppointmentToCancel(null)} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                Renunță
              </button>
              <button onClick={executeCancel} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Da, anulează
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;