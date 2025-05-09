import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Header } from "@_src/components/Partial/Header"
import { useUserStore } from '@_src/store/auth';
import { DecryptUser } from "@_src/utils/helpers";
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Sidenav } from "@_src/routes/Sidenav"
import { Outreach } from "@_src/components/Pages/Forms/Outreach";

export const OutreachListScreen = () => {
    const { user } = useUserStore((state) => ({
        user: state.user
    }));
    const decryptedUser = DecryptUser(user);
    
    return (
        <DashboardTemplate
            sidenav={decryptedUser?.role_id === 1 ? <AdminSidenav /> : <Sidenav />}
            header={<Header />}
        >
            <Outreach />
        </DashboardTemplate>
    )
}



