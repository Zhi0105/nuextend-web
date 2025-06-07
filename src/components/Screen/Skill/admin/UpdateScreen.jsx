import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Update } from "@_src/components/Pages/Skill/Update"
import { Header } from "@_src/components/Partial/Header"

export const SkillUpdateScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <Update />
        </DashboardTemplate>
    )
}
