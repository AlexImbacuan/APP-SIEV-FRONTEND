import React, { useRef, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { cotizacionesService } from '../../services/cotizacionesService';

const MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB, mismo límite del backend

function esPdf(archivo) {
  return archivo.type === 'application/pdf' || /\.pdf$/i.test(archivo.name);
}

/**
 * Sube el PDF exportado de Siigo a POST /api/cotizaciones/leer-pdf.
 * El backend solo lo lee y devuelve los datos: el PDF NO se guarda.
 * Props:
 *  - onLeido(lectura, nombreArchivo): datos leídos para llenar el formulario
 *  - onCancelar()
 */
export default function SubirPdfModal({ onLeido, onCancelar }) {
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef(null);

  const procesar = async (archivo) => {
    if (!archivo || leyendo) return;
    setError('');

    if (!esPdf(archivo)) {
      setError('El archivo debe ser un PDF.');
      return;
    }
    // Se valida ANTES de subir: con archivos muy grandes el servidor puede cortar la
    // conexión antes de responder 413 y el navegador lo vería como error de conexión.
    if (archivo.size > MAXIMO_BYTES) {
      setError('El archivo pesa más de 10 MB.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setLeyendo(true);
    try {
      const lectura = await cotizacionesService.leerPdf(archivo);
      onLeido(lectura, archivo.name);
    } catch (err) {
      // Respaldo por si el backend responde 413 de todas formas
      setError(err.estado === 413 ? 'El archivo pesa más de 10 MB.' : err.message);
      setLeyendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const soltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    procesar(e.dataTransfer.files?.[0]);
  };

  return (
    <Modal titulo="Subir PDF de Siigo" onClose={onCancelar} bloqueado={leyendo}>
      <div className="md-form">
        <p>
          Elige la cotización exportada de Siigo. Se leerán sus datos para llenar el formulario, que
          podrás revisar y completar antes de guardar.
        </p>

        <label
          className={`ct-dropzone ${arrastrando ? 'ct-dropzone--activa' : ''} ${
            leyendo ? 'ct-dropzone--leyendo' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!leyendo) setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="ct-dropzone__input"
            onChange={(e) => procesar(e.target.files?.[0])}
            disabled={leyendo}
            aria-label="Elegir PDF de Siigo"
          />
          {leyendo ? (
            <span role="status">Leyendo cotización…</span>
          ) : (
            <>
              <strong>Haz clic para elegir el PDF</strong>
              <span>o arrástralo aquí · máximo 10 MB</span>
            </>
          )}
        </label>

        <p className="md-ayuda">
          🔒 El PDF <strong>no se guarda</strong>: solo se usa para llenar el formulario.
        </p>

        {error && (
          <div className="md-error" role="alert">
            {error}
          </div>
        )}

        <div className="md-acciones">
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            onClick={onCancelar}
            disabled={leyendo}
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
