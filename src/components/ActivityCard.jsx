import React from 'react';
import './ActivityCard.css';

export default function ActivityCard({
  activity,
  index,
  activitiesLength,
  onActivityChange,
  onImageChange,
  onRemove,
}) {
  return (
    <section className="activity-card" key={activity.id}>
      <div className="activity-card__header">
        <div>
          <p className="activity-number">Actividad {index + 1}</p>
          <h3>Detalle del registro</h3>
        </div>

        {activitiesLength > 1 && (
          <button type="button" className="remove-activity-btn" onClick={() => onRemove(index)}>
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
            onChange={(e) => onActivityChange(index, e)}
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
            onChange={(e) => onActivityChange(index, e)}
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
            onChange={(e) => onActivityChange(index, e)}
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
            onChange={(e) => onActivityChange(index, e)}
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
            onChange={(e) => onActivityChange(index, e)}
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
            onChange={(e) => onActivityChange(index, e)}
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
            onChange={(e) => onImageChange(index, e)}
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
  );
}
