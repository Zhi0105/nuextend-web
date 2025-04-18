import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Dashboard } from "../Pages/Dashboard"
import { Header } from "../Partial/Header"

export const DashboardScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Dashboard />
        </DashboardTemplate>
    )
}
