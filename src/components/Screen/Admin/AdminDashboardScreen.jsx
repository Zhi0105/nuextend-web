import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { useNavigate } from "react-router-dom"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { AdminDashboard } from "@_src/components/Pages/Admin/AdminDashboard"
import { Header } from "@_src/components/Partial/Header"
import { useUserStore } from '@_src/store/auth';
import { DecryptUser } from "@_src/utils/helpers";
import { useEffect } from "react";

export const AdminDashboardScreen = () => {
    const navigate = useNavigate()
    const { user } = useUserStore((state) => ({
        user: state.user
    }));
    const decryptedUser = DecryptUser(user);
    
    useEffect(() => {
        if ( decryptedUser?.role_id !== 1) navigate('/dashboard')
    }, [decryptedUser, navigate])

    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <AdminDashboard />
        </DashboardTemplate>
    )
}
