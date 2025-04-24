import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Addmember } from "@_src/components/Pages/Organization/Addmember"
import { Header } from "@_src/components/Partial/Header"

export const AddmemberScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Addmember />
        </DashboardTemplate>
    )
}
