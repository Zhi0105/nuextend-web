import { useUserStore } from "@_src/store/auth"
import { DecryptUser } from "@_src/utils/helpers"

export const Header = () => {
    const { user } = useUserStore((state) => ({ user: state.user }))
    const decryptedUser = DecryptUser(user)

    return (
        <div className="header-main w-full fixed xs:ml-[0px] sm:ml-[200px] h-[40px] flex items-center py-8 px-4 bg-white border border-1 shadow-lg z-10">
            <label>Hello, <span className="text-lg font-bold capitalize">{decryptedUser.firstname}</span></label>
            
        </div>
    )
}
