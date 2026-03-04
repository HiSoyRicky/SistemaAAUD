import React, { useEffect, useState } from "react";
import { Toners } from "@/features/inventory/toners/services/toners.api";
import TonerTable from "@/features/inventory/toners/components/tables/TonerTable";

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

    if (loading) return <p className="p-6">Cargando tóners...</p>;

    return (
        <TonerTable
            toners={toners}
            onRefresh={loadToners}
        />
    );
}

export default TonersPage;