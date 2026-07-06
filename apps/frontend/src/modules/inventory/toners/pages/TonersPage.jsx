import React, { useEffect, useState } from "react";
import { Toners } from "../services/toners.api";
import TonerTable from "../components/tables/TonerTable";

function TonersPage() {
    const [toners, setToners] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadToners = async () => {
        try {
            setLoading(true);
            const data = await Toners.fetchAll();
            setToners(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadToners();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                Cargando tóners...
            </div>
        );
    }

    return (
        <TonerTable
            toners={toners}
            onRefresh={loadToners}
        />
    );
}

export default TonersPage;
