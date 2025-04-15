import { Outlet, Navigate } from 'react-router-dom'
import { useUserStore } from '@_src/store/auth';

const LoginRoute = () => {
    const { token } = useUserStore((state) => ({
        token: state.token,
    }));

    return (
        !token ? <Outlet /> : <Navigate to="/dashboard" /> 
    )
}


export default LoginRoute