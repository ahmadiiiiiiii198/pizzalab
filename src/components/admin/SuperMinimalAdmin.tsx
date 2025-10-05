import React from 'react';

const SuperMinimalAdmin = () => {
  console.log('🚀 [SuperMinimal] Component rendering...');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ Pannello Admin Super Minimale</h1>
      <p>Se vedi questo, React funziona correttamente!</p>
      <p>Ora attuale: {new Date().toLocaleString()}</p>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        marginTop: '20px',
        borderRadius: '5px'
      }}>
        <h3>Risultati Test Base:</h3>
        <ul>
          <li>✅ Rendering componenti React</li>
          <li>✅ Esecuzione JavaScript</li>
          <li>✅ Styling CSS</li>
          <li>✅ Funzioni data/ora</li>
        </ul>
      </div>

      <button 
        onClick={() => alert('Pulsante cliccato! Il pannello admin funziona.')}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
      >
        Pulsante Test
      </button>
    </div>
  );
};

export default SuperMinimalAdmin;
