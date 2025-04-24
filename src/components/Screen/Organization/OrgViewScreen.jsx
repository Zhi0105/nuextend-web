import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { View } from "@_src/components/Pages/Organization/View"
import { Header } from "@_src/components/Partial/Header"

export const OrgViewScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <View />
        </DashboardTemplate>
    )
}
