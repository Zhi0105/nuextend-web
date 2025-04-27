
import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { Sidenav } from "@_src/routes/Sidenav"
import { Member } from "@_src/components/Pages/Organization/Member"
import { Header } from "@_src/components/Partial/Header"

export const MemberScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<Sidenav />}
            header={<Header />}
        >
            <Member />
        </DashboardTemplate>
    )
}
