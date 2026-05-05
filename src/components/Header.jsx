import './Header.css';
import { useState } from 'react';

function Header({ onNavigate }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const openMail = () => {
        window.location.href = 'https://eliezer.colombiahosting.com.co:2096/logout/?locale=es';
    };

    const handleNavClick = (page) => {
        onNavigate(page);
        setIsMenuOpen(false);
    };

    return (
        <>
            <header className="site-header">
                <div className="brand-wrap">
                    <img src="/images/logo-SIEV.png" alt="Logo SIEV" className="brand-logo" />
                     <div>

                    </div> 
                </div>

                <button 
                    type="button" 
                    className="hamburger-menu" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className="site-nav" aria-label="Navegacion principal">
                    <button type="button" className="nav-link" onClick={() => handleNavClick('home')}>
                        Inicio
                    </button>
                    <a href="#servicios">Servicios</a>
                    <a href="#nosotros">Nosotros</a>
                    <a href="#contacto">Contacto</a>
                    <button type="button" className="nav-link" onClick={() => handleNavClick('form')}>
                        Registro de Proyectos
                    </button>
                    <button type="button" className="mail-link" onClick={openMail}>
                        Abrir correo SIEV
                    </button>
                </nav>
            </header>

            {isMenuOpen && (
                <div className="mobile-menu" onClick={() => setIsMenuOpen(false)}>
                    <nav className="mobile-nav" aria-label="Navegacion móvil principal">
                        <button type="button" className="mobile-nav-link" onClick={() => handleNavClick('home')}>
                            Inicio
                        </button>
                        <a href="#servicios" className="mobile-nav-link">Servicios</a>
                        <a href="#nosotros" className="mobile-nav-link">Nosotros</a>
                        <a href="#contacto" className="mobile-nav-link">Contacto</a>
                        <button type="button" className="mobile-nav-link" onClick={() => handleNavClick('form')}>
                            Registro de Proyectos
                        </button>
                        <button type="button" className="mobile-mail-link" onClick={openMail}>
                            Abrir correo SIEV
                        </button>
                    </nav>
                </div>
            )}
        </>
    );
}

export default Header;