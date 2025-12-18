// Footer.jsx
import React from 'react'

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-6 text-white border-t border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900">
            <div className="container mx-auto text-center">

                {/* Identidad */}
                <div className="text-center md:text-left">

                    <h3 className="text-lg font-extrabold tracking-wide">
                        Sistema AAUD
                    </h3>

                    <p className="mt-1 text-sm text-white/70">
                        Autoridad de Aseo Urbano y Domiciliario
                    </p>

                </div>

                {/* Enlaces */}
                <nav className="container mx-auto mt-2 mb-4 space-x-4 text-center">
                    <a
                        href="https://www.aaud.gob.pa/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition text-white/70 hover:text-white"
                    >
                        Página oficial
                    </a>

                    <span className="text-gray-500">|</span>

                    <a
                        href="https://www.aaud.gob.pa/index.asp?id=agencias"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition text-white/70 hover:text-white"
                    >
                        Contacto
                    </a>

                    <span className="text-gray-500">|</span>

                    <a
                        href="/"
                        title="Ricardo Vargas - Desarrollador"
                        className="transition text-white/70 hover:text-white"
                    >
                        Inicio
                    </a>
                </nav>

                <p className="mt-1 text-sm text-white/70">
                    &copy; {currentYear} AAUD. Todos los derechos reservados.
                </p>

            </div>
        </footer>
    );
}

export default Footer;