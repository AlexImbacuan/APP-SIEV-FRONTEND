import React, { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import { clientesService } from '../../../services/clientesService';

// Dígitos, puntos, guion y espacios: "800197463", "800.197.463-1"
const NIT_VALIDO = /^[\d.\-\s]+$/;

/**
 * Crear o editar un cliente del catálogo.
 * Props:
 *  - cliente: el cliente a editar (si no viene, es uno nuevo)
 *  - nitInicial: NIT ya puesto al crear (p. ej. desde "Crear cliente" en una cotización)
 *  - onCancelar()
 *  - onGuardado(mensaje)
 */
export default function ClienteFormModal({ cliente, nitInicial = '', onCancelar, onGuardado }) {
  const esNuevo = !cliente;
  const [datos, setDatos] = useState({
    nit: cliente?.nit || nitInicial,
    nombre: cliente?.nombre || '',
    activo: cliente ? cliente.activo !== false : true,
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
    setErrorServidor('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    if (enviando) return;
    const nit = datos.nit.trim();
    const nombre = datos.nombre.trim();
    const nuevosErrores = {};
    if (!nit) nuevosErrores.nit = 'Escribe el NIT.';
    else if (!NIT_VALIDO.test(nit) || !/\d/.test(nit)) {
      nuevosErrores.nit = 'El NIT solo puede tener números, puntos y guion.';
    }
    if (!nombre) nuevosErrores.nombre = 'Escribe el nombre de la empresa.';
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    setEnviando(true);
    try {
      if (esNuevo) {
        await clientesService.crear({ nit, nombre });
        onGuardado(`Cliente ${nombre} creado.`);
      } else {
        await clientesService.editar(cliente.id, { nit, nombre, activo: datos.activo });
        onGuardado(`Cliente ${nombre} actualizado.`);
      }
    } catch (err) {
      // 409: el NIT ya existe (el mensaje dice a qué cliente pertenece)
      setErrorServidor(err.message);
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={esNuevo ? 'Nuevo cliente' : 'Editar cliente'}
      onClose={onCancelar}
      bloqueado={enviando}
    >
      <form className="md-form" onSubmit={enviar} noValidate>
        <div className="md-campo">
          <label htmlFor="cl-nit">NIT</label>
          <input
            id="cl-nit"
            value={datos.nit}
            onChange={(e) => cambiar('nit', e.target.value)}
            disabled={enviando}
            inputMode="numeric"
            autoComplete="off"
            placeholder="800197463"
            aria-invalid={Boolean(errores.nit)}
          />
          {errores.nit ? (
            <span className="md-error-campo">{errores.nit}</span>
          ) : (
            <span className="md-ayuda">Puede llevar puntos y dígito de verificación.</span>
          )}
        </div>

        <div className="md-campo">
          <label htmlFor="cl-nombre">Nombre de la empresa</label>
          <input
            id="cl-nombre"
            value={datos.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            disabled={enviando}
            autoComplete="off"
            placeholder="Cargill de Colombia"
            aria-invalid={Boolean(errores.nombre)}
          />
          {errores.nombre && <span className="md-error-campo">{errores.nombre}</span>}
        </div>

        {!esNuevo && (
          <label className="ct-check">
            <input
              type="checkbox"
              checked={datos.activo}
              onChange={(e) => cambiar('activo', e.target.checked)}
              disabled={enviando}
            />
            Cliente activo
          </label>
        )}

        {errorServidor && (
          <div className="md-error" role="alert">
            {errorServidor}
          </div>
        )}

        <div className="md-acciones">
          <button
            type="button"
            className="pl-btn pl-btn--outline"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button type="submit" className="pl-btn" disabled={enviando}>
            {enviando ? 'Guardando…' : esNuevo ? 'Crear cliente' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
