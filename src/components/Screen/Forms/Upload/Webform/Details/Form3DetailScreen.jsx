import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Header } from "@_src/components/Partial/Header"
import { useUserStore } from '@_src/store/auth';
import { DecryptUser } from "@_src/utils/helpers";
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Sidenav } from "@_src/routes/Sidenav"
import { Form3Detail } from "@_src/components/Pages/Forms/Uploads/Webform/Detail/Form3Detail";

export const Form3DetailScreen = () => {
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
            <Form3Detail />
        </DashboardTemplate>
    )
}
