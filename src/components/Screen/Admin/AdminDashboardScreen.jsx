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
    const isAdminRole = [1, 9, 10, 11].includes(decryptedUser?.role_id);
    
    useEffect(() => {
        if ( !isAdminRole ) navigate('/dashboard')
    }, [decryptedUser, navigate, isAdminRole])

    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <AdminDashboard />
        </DashboardTemplate>
    )
}
