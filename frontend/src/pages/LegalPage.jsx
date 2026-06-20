import React from 'react';
import { Terminos, Privacidad } from '../components/Legal';

function LegalPage() {
  return (
    <main className="layout-container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--vinotinto)', marginBottom: '30px', fontFamily: 'Montserrat, sans-serif', fontWeight: 800 }}>Documentos Legales</h1>
        
        <section style={{ marginBottom: '50px', background: '#fff', padding: '30px', borderRadius: '12px', border: '1.5px solid #e5e0d8', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <h2 style={{ color: 'var(--vinotinto)', borderBottom: '2px solid var(--vinotinto)', paddingBottom: '10px', marginBottom: '20px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.4rem' }}>Política de Privacidad</h2>
          <div style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.7' }}>
            <Privacidad />
          </div>
        </section>

        <section style={{ background: '#fff', padding: '30px', borderRadius: '12px', border: '1.5px solid #e5e0d8', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <h2 style={{ color: 'var(--vinotinto)', borderBottom: '2px solid var(--vinotinto)', paddingBottom: '10px', marginBottom: '20px', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '1.4rem' }}>Términos y Condiciones</h2>
          <div style={{ fontSize: '0.9rem', color: '#444', lineHeight: '1.7' }}>
            <Terminos />
          </div>
        </section>
      </div>
    </main>
  );
}

export default LegalPage;
