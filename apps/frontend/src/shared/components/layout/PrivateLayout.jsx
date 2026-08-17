// PrivateLayout.jsx

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';

export default function PrivateLayout({ children }) {
  const { userType } = useAuth();

  const [isFixed, setIsFixed] = useState(false);

  // Ahora SOLO depende del click (candado)
  const isSidebarOpen = isFixed;

  const showSidebar = userType !== 'trabajador';

  const location = useLocation();
  const isIncidentsPage = location.pathname.startsWith('/incidencias');

  let sidebarMargin = 'md:ml-0';

  if (showSidebar) {
    if (isFixed) {
      sidebarMargin = 'md:ml-64';
    } else {
      sidebarMargin = 'md:ml-20';
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex min-h-0 pt-16">
        {showSidebar && (
          <Sidebar
            open={isSidebarOpen}
            fixed={isFixed}
            onToggleFixed={() => setIsFixed(!isFixed)}
          />
        )}

        <div
          className={`
            flex-1 min-w-0 transition-all duration-300
            ${sidebarMargin}
          `}
        >
          <div className="flex flex-col min-h-screen">
            <main className={`${isIncidentsPage ? 'p-2 md:p-4' : 'p-4 md:p-8'} flex-1`}>
              <div className={`mx-auto ${isIncidentsPage ? 'max-w-none w-full' : 'max-w-7xl'}`}>
                {children}
              </div>
            </main>

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
