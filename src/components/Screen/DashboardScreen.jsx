import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Dashboard } from "../Pages/Dashboard"
import { Header } from "../Partial/Header"
import { useUserStore } from '@_src/store/auth';
import { DecryptUser } from "@_src/utils/helpers";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const DashboardScreen = () => {
    const navigate = useNavigate()
    const { user } = useUserStore((state) => ({
        user: state.user
    }));
    const decryptedUser = DecryptUser(user);

    useEffect(() => {
        if ( decryptedUser?.role_id === 1) navigate('/admin/dashboard')
    }, [decryptedUser, navigate])

    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Dashboard />
        </DashboardTemplate>
    )
}
