import { useContext } from "react"
import { AuthContext } from "@_src/contexts/AuthContext"
import { useUserStore } from "@_src/store/auth"
import { Button } from "primereact/button"
import { DecryptUser } from "@_src/utils/helpers"

export const Dashboard = () => {
    const { logout } = useContext(AuthContext)
    const { user } = useUserStore((state) => ({ user: state.user }))
    const decryptedUser = DecryptUser(user)

    return (
        <div className="dashboard-main min-h-screen flex flex-col justify-center items-center">
            <label>Hello <span className="text-lg font-bold capitalize">{decryptedUser.firstname}</span></label>
            <Button
                onClick={logout}
                className="bg-[#2211cc] text-[#c7c430] px-4 py-2" 
            >
                Logout
            </Button>
        </div>
    )
}
