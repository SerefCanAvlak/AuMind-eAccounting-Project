import { useState } from "react";
import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import { Outlet } from "react-router-dom";
import "../App.css";
const MainLayout = () => {
    const [darkMode] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className={`app ${darkMode ? "dark" : ""}`}>
            <div className="app-container">
                <div className={`content ${sidebarOpen ? "sidebar-open" : "!ml-[64px]"}`}>
                    <Header />
                    <Sidebar toggleSidebar={toggleSidebar} />
                    <main className="">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;