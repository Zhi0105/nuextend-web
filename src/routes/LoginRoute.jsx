import { Outlet, Navigate } from 'react-router-dom';
import { useUserStore } from '@_src/store/auth';
import { DecryptUser } from '@_src/utils/helpers';

const LoginRoute = () => {
    const { user, token } = useUserStore((state) => ({
        user: state.user,
        token: state.token
    }));

    if (!token) {
        // Not logged in, allow access to login/register routes
        return <Outlet />;
    }

    const decryptedUser = DecryptUser(user);
    const isAdminRole = [1, 9, 10, 11].includes(decryptedUser?.role_id);

    if (isAdminRole) {
        console.log(true)
        return <Navigate to="/admin/dashboard" />;
    }

    return <Navigate to="/dashboard" />;
};

export default LoginRoute;