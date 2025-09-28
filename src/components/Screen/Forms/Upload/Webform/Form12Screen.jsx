import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Header } from "@_src/components/Partial/Header"
import { useUserStore } from '@_src/store/auth';
import { DecryptUser } from "@_src/utils/helpers";
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Sidenav } from "@_src/routes/Sidenav"
import { Form12 } from "@_src/components/Pages/Forms/Uploads/Webform/Form12";

export const Form12Screen = () => {
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
            <Form12 />
        </DashboardTemplate>
    )
}


