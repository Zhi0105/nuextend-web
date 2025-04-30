import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Detail } from "@_src/components/Pages/Event/Detail"
import { Header } from "@_src/components/Partial/Header"

export const AdminDetailScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <Detail />
        </DashboardTemplate>
    )
}
