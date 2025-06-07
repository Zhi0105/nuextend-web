import { DashboardTemplate } from "@_src/templates/DashboardTemplate"
import { AdminSidenav } from "@_src/routes/AdminSidenav"
import { View } from "@_src/components/Pages/Skill/View"
import { Header } from "@_src/components/Partial/Header"

export const SkillViewScreen = () => {
    return (
        <DashboardTemplate
            sidenav={<AdminSidenav />}
            header={<Header />}
        >
            <View />
        </DashboardTemplate>
    )
}
