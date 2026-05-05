import React, { useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './ProjectForm.css';

const createActivity = () => ({
  id: Date.now() + Math.random(),
  actividad: '',
  area: '',
  cantidad: '',
  valorUnitario: '',
  total: '',
  cotizacion: '',
  observacion: '',
  imagen: '',
  imagenNombre: '',
});

function ProjectForm() {
  const reportRef = useRef(null);
  const [reportInfo, setReportInfo] = useState({
    fecha: '',
    serialProyecto: '',
    cliente: '',
    cotizacionGeneral: '',
  });
  const [activities, setActivities] = useState([createActivity()]);
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);

  const grandTotal = useMemo(
    () =>
      activities.reduce((sum, activity) => {
        const total = parseFloat(activity.total);
        return sum + (Number.isNaN(total) ? 0 : total);
      }, 0),
    [activities],
  );

  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setReportInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateActivity = (index, name, value) => {
    setActivities((prev) =>
      prev.map((activity, activityIndex) => {
        if (activityIndex !== index) {
          return activity;
        }

        const nextActivity = {
          ...activity,
          [name]: value,
        };

        if (name === 'cantidad' || name === 'valorUnitario') {
          const cantidad = name === 'cantidad' ? parseFloat(value) : parseFloat(activity.cantidad);
          const valorUnitario = name === 'valorUnitario' ? parseFloat(value) : parseFloat(activity.valorUnitario);

          if (!Number.isNaN(cantidad) && !Number.isNaN(valorUnitario)) {
            nextActivity.total = (cantidad * valorUnitario).toFixed(2);
          } else {
            nextActivity.total = '';
          }
        }

        return nextActivity;
      }),
    );
  };

  const handleActivityChange = (index, e) => {
    const { name, value } = e.target;
    updateActivity(index, name, value);
  };

  const handleImageChange = (index, e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setActivities((prev) =>
        prev.map((activity, activityIndex) =>
          activityIndex === index
            ? {
                ...activity,
                imagen: reader.result,
                imagenNombre: file.name,
              }
            : activity,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const addActivity = () => {
    setActivities((prev) => [...prev, createActivity()]);
  };

  const removeActivity = (index) => {
    setActivities((prev) => prev.filter((_, activityIndex) => activityIndex !== index));
  };

  const exportToPdf = async () => {
    if (!reportRef.current) {
      return;
    }

    setExporting(true);
    setMessage('');

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`informe-siev-${reportInfo.serialProyecto || 'sin-serial'}.pdf`);
      setMessage('Informe exportado correctamente en PDF.');
    } catch (error) {
      setMessage(`No se pudo exportar el PDF: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="project-form-container">
      <div className="form-wrapper">
        <div className="form-header">
          <div>
            <p className="form-eyebrow">Informe de actividades</p>
            <h1 className="form-title">Reporte SIEV</h1>
            <p className="form-subtitle">
              Completa los datos del informe, agrega las actividades necesarias y exporta el resultado a PDF.
            </p>
          </div>

          <button type="button" className="add-activity-btn" onClick={addActivity}>
            + Agregar actividad
          </button>
        </div>

        {message && <div className="form-message">{message}</div>}

        <div className="report-capture" ref={reportRef}>
          <section className="report-top">
            <div className="report-brand">
              <img src="./images/logo-SIEV.png" alt="Logo SIEV" className="report-logo" />
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
                  onChange={handleReportChange}
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
                  onChange={handleReportChange}
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
                  onChange={handleReportChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cotizacionGeneral">Cotización general</label>
                <select
                  id="cotizacionGeneral"
                  name="cotizacionGeneral"
                  value={reportInfo.cotizacionGeneral}
                  onChange={handleReportChange}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="SI">Sí</option>
                  <option value="NO">No</option>
                </select>
              </div>
            </div>
          </section>

          {activities.map((activity, index) => (
            <section className="activity-card" key={activity.id}>
              <div className="activity-card__header">
                <div>
                  <p className="activity-number">Actividad {index + 1}</p>
                  <h3>Detalle del registro</h3>
                </div>

                {activities.length > 1 && (
                  <button type="button" className="remove-activity-btn" onClick={() => removeActivity(index)}>
                    Eliminar
                  </button>
                )}
              </div>

              <div className="activity-grid">
                <div className="form-group">
                  <label htmlFor={`actividad-${index}`}>Actividad/Material</label>
                  <input
                    type="text"
                    id={`actividad-${index}`}
                    name="actividad"
                    placeholder="Ej: Cable cobre 2.5mm"
                    value={activity.actividad}
                    onChange={(e) => handleActivityChange(index, e)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`area-${index}`}>Área</label>
                  <input
                    type="text"
                    id={`area-${index}`}
                    name="area"
                    placeholder="Ej: Instalaciones eléctricas"
                    value={activity.area}
                    onChange={(e) => handleActivityChange(index, e)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`cantidad-${index}`}>Cantidad</label>
                  <input
                    type="number"
                    id={`cantidad-${index}`}
                    name="cantidad"
                    placeholder="0"
                    step="0.01"
                    value={activity.cantidad}
                    onChange={(e) => handleActivityChange(index, e)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`valorUnitario-${index}`}>V/Unitario</label>
                  <input
                    type="number"
                    id={`valorUnitario-${index}`}
                    name="valorUnitario"
                    placeholder="0.00"
                    step="0.01"
                    value={activity.valorUnitario}
                    onChange={(e) => handleActivityChange(index, e)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`total-${index}`}>Total</label>
                  <input
                    type="number"
                    id={`total-${index}`}
                    name="total"
                    placeholder="0.00"
                    step="0.01"
                    value={activity.total}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`cotizacion-${index}`}>Cotización</label>
                  <select
                    id={`cotizacion-${index}`}
                    name="cotizacion"
                    value={activity.cotizacion}
                    onChange={(e) => handleActivityChange(index, e)}
                    required
                  >
                    <option value="">Selecciona una opción</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>
              </div>

              <div className="activity-bottom">
                <div className="form-group full-width">
                  <label htmlFor={`observacion-${index}`}>Observación</label>
                  <textarea
                    id={`observacion-${index}`}
                    name="observacion"
                    placeholder="Añade observaciones relevantes..."
                    value={activity.observacion}
                    onChange={(e) => handleActivityChange(index, e)}
                    rows="4"
                  />
                </div>

                <div className="image-upload-box">
                  <label htmlFor={`imagen-${index}`} className="image-upload-label">
                    Subir imagen de la actividad
                  </label>
                  <input
                    type="file"
                    id={`imagen-${index}`}
                    accept="image/*"
                    onChange={(e) => handleImageChange(index, e)}
                  />

                  {activity.imagen ? (
                    <div className="image-preview">
                      <img src={activity.imagen} alt={`Vista previa ${index + 1}`} />
                      <span>{activity.imagenNombre}</span>
                    </div>
                  ) : (
                    <div className="image-placeholder">Espacio para imagen</div>
                  )}
                </div>
              </div>
            </section>
          ))}

          <section className="report-summary">
            <div>
              <p>Total general estimado</p>
              <h3>${grandTotal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>

            <div className="summary-actions">
              <button type="button" className="export-btn" onClick={exportToPdf} disabled={exporting}>
                {exporting ? 'Exportando...' : 'Exportar a PDF'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProjectForm;
