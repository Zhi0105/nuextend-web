import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Create } from "@_src/components/Pages/Event/Create"
import { Header } from "@_src/components/Partial/Header"

export const CreateScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Create />
        </DashboardTemplate>
    )
}
