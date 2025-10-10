import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Dean } from "../Pages/Dean"
import { Header } from "@_src/components/Partial/Header"

export const CreateDeanScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <Dean />
        </DashboardTemplate>
    )
}
