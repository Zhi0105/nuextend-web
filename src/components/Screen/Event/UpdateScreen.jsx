import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Update } from "@_src/components/Pages/Event/Update"
import { Header } from "@_src/components/Partial/Header"

export const UpdateScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Update />
        </DashboardTemplate>
    )
}
