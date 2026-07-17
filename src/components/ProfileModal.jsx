import React, { useState } from 'react';
import './ProfileModal.css';

const ProfileModal = ({ usuario, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: usuario || '',
    email: '',
    telefono: '',
    empresa: 'SIEV',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí se guardaría el perfil
    console.log('Perfil actualizado:', formData);
    alert('Perfil actualizado correctamente');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'profile-overlay') {
      onClose();
    }
  };

  return (
    <div className="profile-overlay" onClick={handleOverlayClick}>
      <div className="profile-modal">
        <button className="profile-close" onClick={onClose}>
          ✕
        </button>

        <div className="profile-header">
          <div className="profile-avatar">{usuario?.charAt(0).toUpperCase()}</div>
          <h2>Mi Perfil</h2>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre de Usuario</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre de usuario"
              disabled
            />
            <small>No se puede cambiar el nombre de usuario</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className="form-group">
            <label htmlFor="empresa">Empresa</label>
            <input
              id="empresa"
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              placeholder="Nombre de la empresa"
              disabled
            />
            <small>Empresa fija: SIEV</small>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              💾 Guardar Cambios
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              ❌ Cancelar
            </button>
          </div>
        </form>

        <div className="profile-footer">
          <hr />
          <p className="info-text">Tus datos se guardan de forma segura</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
