import './Header.css';

function Header() {
    const openMail = () => {
        window.location.href = 'https://eliezer.colombiahosting.com.co:2096/logout/?locale=es';
    };

    return (
        <header className="site-header">
            <div className="brand-wrap">
                <img src="./images/logo-SIEV.png" alt="Logo SIEV" className="brand-logo" />
                 <div>

                </div> 
            </div>

            <nav className="site-nav" aria-label="Navegacion principal">
                <a href="#inicio">Inicio</a>
                <a href="#servicios">Servicios</a>
                <a href="#nosotros">Nosotros</a>
                <a href="#contacto">Contacto</a>
                <button type="button" className="mail-link" onClick={openMail}>
                    Abrir correo SIEV
                </button>
            </nav>
        </header>
    );
}

export default Header;