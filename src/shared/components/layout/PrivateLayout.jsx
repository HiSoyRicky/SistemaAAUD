// PrivateLayout.jsx    
import React from "react";
import Header from "@/shared/components/layout/Header";
import Footer from "@/shared/components/layout/Footer";

export default function PrivateLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow p-6 bg-gray-100">{children}</main>
            <Footer />
        </div>
    );
}
