import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { View } from "@_src/components/Pages/Event/View"
import { Header } from "@_src/components/Partial/Header"

export const AdminViewScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <View />
        </DashboardTemplate>
    )
}
