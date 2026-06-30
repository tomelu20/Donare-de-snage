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

  // State-uri pentru Formularul de Campanie Nouă (Admin)
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampLocation, setNewCampLocation] = useState('');
  const [newCampAddress, setNewCampAddress] = useState('');
  const [newCampDate, setNewCampDate] = useState('');
  const [newCampEndDate, setNewCampEndDate] = useState(''); 
  const [newCampStartTime, setNewCampStartTime] = useState('08:30');
  const [newCampEndTime, setNewCampEndTime] = useState('13:00');
  const [newCampSlotDuration, setNewCampSlotDuration] = useState('15');
  const [newCampCapacityPerSlot, setNewCampCapacityPerSlot] = useState('2');

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setApiError('');

      // 1. Preluăm toate campaniile active
      const campaignsRes = await axios.get('http://127.0.0.1:8000/campaigns/');
      setCampaigns(campaignsRes.data);

      // 2. În funcție de rol, apelăm rutele specifice din backend-ul tău
      if (user.role === 'admin' || user.role === 'ADMIN') {
        const adminAppsRes = await axios.get('http://127.0.0.1:8000/appointments/all');
        setAdminAppointments(adminAppsRes.data);
      } else {
        const myAppsRes = await axios.get(`http://127.0.0.1:8000/appointments/me?user_id=${user.id}`);
        setMyAppointments(myAppsRes.data);
      }
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Nu s-au putut încărca datele de la server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setApiError('');

    const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
    if (!dateRegex.test(newCampDate)) {
      setApiError('Data de început trebuie să fie în formatul ZZ-LL-AAAA (ex: 10-10-2026).');
      return;
    }
    if (!dateRegex.test(newCampEndDate)) {
      setApiError('Data de sfârșit trebuie să fie în formatul ZZ-LL-AAAA (ex: 12-10-2026).');
      return;
    }

    const [startDay, startMonth, startYear] = newCampDate.split('-');
    const formattedStartDate = `${startYear}-${startMonth}-${startDay}`;

    const [endDay, endMonth, endYear] = newCampEndDate.split('-');
    const formattedEndDate = `${endYear}-${endMonth}-${endDay}`;

    if (new Date(formattedStartDate) > new Date(formattedEndDate)) {
      setApiError('Data de început nu poate fi mai mare decât data de sfârșit.');
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/campaigns/', {
        title: newCampTitle,
        location_name: newCampLocation,
        address: newCampAddress,
        date: formattedStartDate,
        end_date: formattedEndDate,
        start_time: `${newCampStartTime}:00`,
        end_time: `${newCampEndTime}:00`,
        slot_duration: parseInt(newCampSlotDuration),
        capacity_per_slot: parseInt(newCampCapacityPerSlot)
      });

      setSuccessNotification('Campania a fost creată cu succes!');
      
      setNewCampTitle('');
      setNewCampLocation('');
      setNewCampAddress('');
      setNewCampDate('');
      setNewCampEndDate('');
      setNewCampStartTime('08:30');
      setNewCampEndTime('13:00');
      setNewCampSlotDuration('15');
      setNewCampCapacityPerSlot('2');

      fetchData();
      setTimeout(() => setSuccessNotification(''), 3000);
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Eroare la crearea campaniei.');
    }
  };

  const handleCancelClick = (appId) => {
    setAppointmentToCancel(appId);
  };

  const executeCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      await axios.put(`http://127.0.0.1:8000/appointments/${appointmentToCancel}/cancel`);
      setSuccessNotification('Programarea a fost anulată cu succes.');
      setAppointmentToCancel(null);
      fetchData();
      setTimeout(() => setSuccessNotification(''), 3000);
    } catch (err) {
      setApiError('Nu s-a putut anula programarea.');
      setAppointmentToCancel(null);
    }
  };

  const handleMarkAttendance = async (appId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/appointments/${appId}/attend`);
      setSuccessNotification('Donatorul a fost marcat ca Prezent.');
      fetchData();
      setTimeout(() => setSuccessNotification(''), 3000);
    } catch (err) {
      setApiError('Eroare la actualizarea statusului.');
    }
  };

  const handleMarkNoShow = async (appId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/appointments/${appId}/noshow`);
      setSuccessNotification('Donatorul a fost marcat ca Absent.');
      fetchData();
      setTimeout(() => setSuccessNotification(''), 3000);
    } catch (err) {
      setApiError('Eroare la actualizarea statusului.');
    }
  };

  const formatDateRo = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const formatTimeShort = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* NAVBAR PRINCIPAL */}
      <nav style={{ backgroundColor: '#fff', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🩸</span>
          <h2 style={{ margin: 0, color: '#e63946', fontSize: '22px', fontWeight: 'bold' }}>Platformă Donare Sânge</h2>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>{user.name} {user.surname}</span>
              <span style={{ fontSize: '12px', color: 'white', backgroundColor: '#e63946', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                {user.role === 'admin' || user.role === 'ADMIN' ? 'Administrator' : 'Donator'}
              </span>
            </div>
            <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              Deconectare
            </button>
          </div>
        )}
      </nav>

      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* STRUCTURA NOTIFICĂRI */}
        {successNotification && <div style={{ backgroundColor: '#e3ffe3', color: '#198754', padding: '15px', borderRadius: '6px', marginBottom: '20px', borderLeft: '5px solid #198754', fontWeight: 'bold' }}>✔️ {successNotification}</div>}
        {apiError && <div style={{ backgroundColor: '#ffe3e3', color: '#dc3545', padding: '15px', borderRadius: '6px', marginBottom: '20px', borderLeft: '5px solid #dc3545', fontWeight: 'bold' }}>❌ {apiError}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' }}>Se încarcă datele panoului...</div>
        ) : (
          <>
            {/* MANAGEMENT REZERVĂRI ADMIN */}
            {(user?.role === 'admin' || user?.role === 'ADMIN') && (
              <section style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '40px', border: '1px solid #e1e4e8' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>
                  📋 Centralizator Management Programări (Vizualizare Medicală)
                </h3>
                {adminAppointments.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Nu există nicio programare înregistrată în acest moment.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          <th style={{ padding: '12px' }}>Donator</th>
                          <th style={{ padding: '12px' }}>Telefon</th>
                          <th style={{ padding: '12px' }}>Campanie</th>
                          <th style={{ padding: '12px' }}>Dată & Oră</th>
                          <th style={{ padding: '12px' }}>Status</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Acțiuni Modificare Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAppointments.map((app) => (
                          <tr key={app.appointment_id || app.id} style={{ borderBottom: '1px solid #eceeef' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{app.donor_name} {app.donor_surname}</td>
                            <td style={{ padding: '12px' }}>{app.donor_phone}</td>
                            <td style={{ padding: '12px', fontWeight: '500' }}>{app.campaign_title}</td>
                            <td style={{ padding: '12px' }}>
                              {formatDateRo(app.campaign_date)} | <strong style={{ color: '#e63946' }}>{formatTimeShort(app.slot_time)}</strong>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span style={{
                                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                                backgroundColor: app.status === 'confirmed' ? '#e3ffe3' : app.status === 'attended' ? '#d1e7dd' : '#fff3cd',
                                color: app.status === 'confirmed' ? '#198754' : app.status === 'attended' ? '#0f5132' : '#856404'
                              }}>
                                {app.status === 'confirmed' ? 'Confirmată' : app.status === 'attended' ? 'Prezent ✓' : 'Absent ✗'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => handleMarkAttendance(app.appointment_id || app.id)} disabled={app.status === 'attended'} style={{ padding: '6px 10px', backgroundColor: app.status === 'attended' ? '#ccc' : '#198754', color: 'white', border: 'none', borderRadius: '4px', cursor: app.status === 'attended' ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Prezent</button>
                              <button onClick={() => handleMarkNoShow(app.appointment_id || app.id)} disabled={app.status === 'no_show'} style={{ padding: '6px 10px', backgroundColor: app.status === 'no_show' ? '#ccc' : '#ffc107', color: '#333', border: 'none', borderRadius: '4px', cursor: app.status === 'no_show' ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Absent</button>
                              <button onClick={() => handleCancelClick(app.appointment_id || app.id)} style={{ padding: '6px 10px', backgroundColor: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Anulează</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* SECȚIUNEA DE JOS: FORMULAR + LISTARE CAMPANII */}
            <div style={{ display: 'grid', gridTemplateColumns: (user?.role === 'admin' || user?.role === 'ADMIN') ? '1fr 2fr' : '2fr 1fr', gap: '30px', alignItems: 'start' }}>
              
              {/* FORMULAR ADĂUGARE (DOAR ADMIN) */}
              {(user?.role === 'admin' || user?.role === 'ADMIN') && (
                <section style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>🆕 Adaugă Campanie Nouă</h3>
                  <form onSubmit={handleCreateCampaign}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Titlu Campanie:</label>
                      <input type="text" value={newCampTitle} onChange={(e) => setNewCampTitle(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Ex: Donare de Primăvară" />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Nume Centru / Locație:</label>
                      <input type="text" value={newCampLocation} onChange={(e) => setNewCampLocation(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Ex: Sala Polivalenta" />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Adresă Exactă:</label>
                      <input type="text" value={newCampAddress} onChange={(e) => setNewCampAddress(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} placeholder="Ex: Str. Codrului, Nr. 12" />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Data Început:</label>
                        <input type="text" placeholder="ZZ-LL-AAAA" value={newCampDate} onChange={(e) => setNewCampDate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Data Sfârșit:</label>
                        <input type="text" placeholder="ZZ-LL-AAAA" value={newCampEndDate} onChange={(e) => setNewCampEndDate(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Ora Start:</label>
                        <input type="time" value={newCampStartTime} onChange={(e) => setNewCampStartTime(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Ora Final:</label>
                        <input type="time" value={newCampEndTime} onChange={(e) => setNewCampEndTime(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Minut / Slot:</label>
                        <input type="number" value={newCampSlotDuration} onChange={(e) => setNewCampSlotDuration(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Capacitate / Slot:</label>
                        <input type="number" value={newCampCapacityPerSlot} onChange={(e) => setNewCampCapacityPerSlot(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Publică Campania Activă</button>
                  </form>
                </section>
              )}
              
              {/* VIZUALIZARE CAMPANII ACTIVE */}
              <main style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>📍 Campanii de Donare Active (Disponibile Acum)</h3>
                {campaigns.length === 0 ? (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>Momentan nu există campanii active.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    {campaigns.map((camp) => (
                      <div key={camp.id} style={{ border: '1px solid #e1e4e8', borderRadius: '6px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#e63946', fontSize: '18px' }}>{camp.title}</h4>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#333' }}><strong>Locație:</strong> {camp.location_name}</p>
                          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}><strong>Adresă:</strong> {camp.address}</p>
                          <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '13px', color: '#444' }}>
                            <span>📅 <strong>Perioadă:</strong> {formatDateRo(camp.date)}{camp.end_date && camp.end_date !== camp.date ? ` -> ${formatDateRo(camp.end_date)}` : ''}</span>
                            <span>🕒 <strong>Program:</strong> {formatTimeShort(camp.start_time)} - {formatTimeShort(camp.end_time)}</span>
                          </div>
                        </div>
                        <button 
  onClick={() => setSelectedCampaign(camp)} 
  style={{ padding: '10px 20px', backgroundColor: '#e63946', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
>
  Programează-te
</button>
                      </div>
                    ))}
                  </div>
                )}
              </main>

              {/* LISTARE PROGRAMĂRI INDIVIDUALE (DOAR DONATORI) */}
              {user?.role !== 'admin' && user?.role !== 'ADMIN' && (
                <aside style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e1e4e8' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#2b2d42', borderBottom: '2px solid #f1f3f5', paddingBottom: '10px' }}>🩸 Programările Mele</h3>
                  {myAppointments.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic', fontSize: '14px' }}>Nu aveți nicio programare activă rezervată.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {myAppointments.map((app) => (
                        <div key={app.id} style={{ border: '1px solid #e1e4e8', borderRadius: '6px', padding: '15px', backgroundColor: '#fafafa' }}>
                          <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '15px' }}>{app.campaign_title || 'Campanie'}</h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '10px' }}>
                            <div>
                              <span>📅 {formatDateRo(app.appointment_date || app.campaign_date)}</span>
                              <span style={{ display: 'block', fontWeight: 'bold', color: '#e63946', marginTop: '2px' }}>🕒 Ora: {formatTimeShort(app.slot_time)}</span>
                            </div>
                            <button onClick={() => handleCancelClick(app.id)} style={{ padding: '5px 10px', backgroundColor: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Anulează</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </aside>
              )}

            </div>
          </>
        )}
      </div>

      {selectedCampaign && <AppointmentModal campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} onRefresh={fetchData} />}

      {appointmentToCancel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500 }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Confirmare Anulare</h4>
            <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>Sigur doriți anularea definitivă a acestei programări?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setAppointmentToCancel(null)} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Renunță</button>
              <button onClick={executeCancel} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Da, anulează</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;