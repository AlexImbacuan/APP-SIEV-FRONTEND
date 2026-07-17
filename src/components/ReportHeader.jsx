import React from 'react';
import '../pages/ProjectForm.css';

export default function ReportHeader({ reportInfo, onChange }) {
  return (
    <section className="report-top">
      <div className="report-brand">
        <img src="/images/logo-SIEV.png" alt="Logo SIEV" className="report-logo" />
        <div>
          <h2>SIEV</h2>
          <p>Soluciones Integrales Eléctricas del Valle</p>
        </div>
      </div>

      <div className="report-meta-grid">
        <div className="form-group">
          <label htmlFor="fecha">Fecha</label>
          <input
            type="date"
            id="fecha"
            name="fecha"
            value={reportInfo.fecha}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="serialProyecto">Serial de proyecto</label>
          <input
            type="text"
            id="serialProyecto"
            name="serialProyecto"
            placeholder="Ej: SIEV-2026-001"
            value={reportInfo.serialProyecto}
            onChange={onChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cliente">Cliente</label>
          <input
            type="text"
            id="cliente"
            name="cliente"
            placeholder="Nombre del cliente"
            value={reportInfo.cliente}
            onChange={onChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cotizacionGeneral">Cotización general</label>
          <select
            id="cotizacionGeneral"
            name="cotizacionGeneral"
            value={reportInfo.cotizacionGeneral}
            onChange={onChange}
            required
          >
            <option value="">Selecciona una opción</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
        </div>
      </div>
    </section>
  );
}
