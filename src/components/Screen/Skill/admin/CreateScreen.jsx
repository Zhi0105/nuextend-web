import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { Create } from "@_src/components/Pages/Skill/Create"
import { Header } from "@_src/components/Partial/Header"

export const SkillCreateScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <Create />
        </DashboardTemplate>
    )
}
