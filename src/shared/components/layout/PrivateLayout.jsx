// PrivateLayout.jsx
import { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import useAuth from "@/shared/hooks/useAuth";

export default function PrivateLayout({ children }) {
  const { userType } = useAuth();

  const [isFixed, setIsFixed] = useState(false);

  // Ahora SOLO depende del click (candado)
  const isSidebarOpen = isFixed;

  const showSidebar = userType !== "trabajador";

  const location = useLocation();
  const isIncidentsPage = location.pathname.startsWith("/incidencias");

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="flex pt-16">
        {showSidebar && (
          <Sidebar
            open={isSidebarOpen}
            fixed={isFixed}
            onToggleFixed={() => setIsFixed(!isFixed)}
          />
        )}

        <div
          className={`
            flex-1 transition-all duration-300
            ${showSidebar ? (isFixed ? "md:ml-64" : "md:ml-20") : "md:ml-0"}
          `}
        >

          <main
            className={`min-h-[calc(100vh-4rem)] ${isIncidentsPage ? "p-2 md:p-4" : "p-4 md:p-8"
              }`}
          >
            <div
              className={`mx-auto ${isIncidentsPage ? "max-w-none w-full" : "max-w-7xl"
                }`}
            >
              {children}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}
