import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Detail } from "@_src/components/Pages/Event/Detail"
import { Header } from "@_src/components/Partial/Header"

export const DetailScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Detail />
        </DashboardTemplate>
    )
}
