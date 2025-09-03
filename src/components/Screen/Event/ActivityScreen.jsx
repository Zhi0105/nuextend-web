import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { useUserStore } from '@_src/store/auth';
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Sidenav } from "@_src/routes/Sidenav";
import { Activity } from "@_src/components/Pages/Event/Activity";
import { Header } from "@_src/components/Partial/Header"
import { DecryptUser } from "@_src/utils/helpers";

export const ActivityScreen = () => {
    const { user } = useUserStore((state) => ({
        user: state.user
    }));
    const decryptedUser = DecryptUser(user);
    const isAdminRole = [1, 9, 10, 11].includes(decryptedUser?.role_id);
        
    return (
        <DashboardTemplate
            sidenav={isAdminRole ? <AdminSidenav /> : <Sidenav />}
            header={<Header />}
        >
            <Activity />
        </DashboardTemplate>
    )
}
