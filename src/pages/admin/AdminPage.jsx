import React, { useState } from "react";
import Layout from "../../components/Layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

// Importar managers de cada sección
import DevicesManager from "../../components/admin/DevicesManager";
import UsersManager from "../../components/admin/UsersManager";



export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("devices");

    return (
        <Layout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="devices">Equipos</TabsTrigger>
                        <TabsTrigger value="users">Usuarios</TabsTrigger>
                        <TabsTrigger value="models">Modelos</TabsTrigger>
                        <TabsTrigger value="brands">Marcas</TabsTrigger>
                        <TabsTrigger value="ubications">Ubicaciones</TabsTrigger>
                        <TabsTrigger value="departments">Departamentos</TabsTrigger>
                        <TabsTrigger value="statuses">Estados</TabsTrigger>
                    </TabsList>

                    <TabsContent value="devices"><DevicesManager /></TabsContent>
                    <TabsContent value="users"><UsersManager /></TabsContent>
                    <TabsContent value="models"></TabsContent>
                    <TabsContent value="brands"></TabsContent>
                    <TabsContent value="ubications"></TabsContent>
                    <TabsContent value="departments"></TabsContent>
                    <TabsContent value="statuses"></TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
