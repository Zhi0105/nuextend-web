import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Create } from "@_src/components/Pages/Organization/Create"
import { Header } from "@_src/components/Partial/Header"

export const OrgcreateScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Create />
        </DashboardTemplate>
    )
}
