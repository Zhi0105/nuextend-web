import { AuthContext } from "@_src/contexts/AuthContext"
import { useUserStore } from "@_src/store/auth"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Register, Login } from "@_src/services/authentications"
import { EncryptUser, EncryptString } from "@_src/utils/helpers"
import { toast } from "react-toastify"

export const AuthProviders = ({ children }) => {
    const queryClient = useQueryClient()
    const { setToken, setUser, setUserLogout } = useUserStore((state) => ({
        setToken: state.setToken,
        setUser: state.setUser,
        setUserLogout: state.setUserLogout
    }))
    const { mutate: handleRegister, isLoading: registerLoading } = useMutation({
        mutationFn: Register,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['register'] });
            authenticate(data?.data, data?.token)
            toast("User added successful!", { type: "success" })
        }, 
        onError: (err) => {  
            console.log("@RE", err?.response.data)
        },
    });
    const { mutate: handleLoginUser, isLoading: loginLoading } = useMutation({
        mutationFn: Login,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['login'] });
            authenticate(data?.data, data?.token)     
            toast(data?.message, { type: "success" })

            }, 
        onError: (error) => {
            toast(error?.response.data.message, { type: "warning" })
            console.log("@LE", error)
        },
    });
    const authenticate = async(user, token) => {
        const authenticatedUser = EncryptUser(user)
        const authenticatedToken = EncryptString(token)
        setUser(authenticatedUser)
        setToken(authenticatedToken)        
    }
    const register = (data) => {
        handleRegister(data)
    }
    const login = (data) => {
        handleLoginUser(data)
    }
    const logout = () => {
        setUserLogout()
    }

    return (
        <AuthContext.Provider
            value={{
                register:(data) => { register(data) },
                registerLoading: registerLoading,
                login:(data) => { login(data) },
                loginLoading: loginLoading,
                logout: () => { logout() }
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
