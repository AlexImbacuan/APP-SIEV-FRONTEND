import React from 'react';
import '../pages/ProjectForm.css';

export default function ReportSummary({ grandTotal, saving, exporting, onSend, onExport }) {
  return (
    <section className="report-summary">
      <div>
        <p>Total general estimado</p>
        <h3>
          $
          {grandTotal.toLocaleString('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </h3>
      </div>

      <div className="summary-actions">
        <button type="button" className="send-btn" onClick={onSend} disabled={saving}>
          {saving ? 'Enviando al API...' : 'Enviar al API'}
        </button>
        <button type="button" className="export-btn" onClick={onExport} disabled={exporting}>
          {exporting ? 'Exportando...' : 'Exportar a PDF'}
        </button>
      </div>
    </section>
  );
}
