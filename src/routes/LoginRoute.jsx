import { Outlet, Navigate } from 'react-router-dom';
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from '@_src/utils/helpers';
import { AuthContext } from "@_src/contexts/AuthContext";
import { getEmailVerificationStatus } from "@_src/services/email";


const LoginRoute = () => {
    const { 
        user, 
        token,
        justVerified, 
        setJustVerified

    } = useUserStore((state) => ({
        user: state.user,
        token: state.token,
        justVerified: state.justVerified,
        setJustVerified: state.setJustVerified
    }));
    const decryptedToken = token && DecryptString(token)
    const { data: statusData, isLoading: statusLoading } = getEmailVerificationStatus({ token: decryptedToken }, { enabled: !!decryptedToken && decryptedToken.length > 0 });
    
    if (!token) {
        // Not logged in, allow access to login/register routes
        return <Outlet />;
    }

    const decryptedUser = DecryptUser(user);
    const isAdminRole = [1, 9, 10, 11].includes(decryptedUser?.role_id);

    if(!statusLoading) {
        if(!statusData?.verified) {
            return <Navigate to="/email-verified-sendlink"  state={{ from: 'login', email: decryptedUser?.email }} replace />;
        } else {
            if (justVerified) {
                setJustVerified(false); // ✅ Clear flag immediately
                return <Navigate to="/email-verified" replace />;
            }

            return isAdminRole
                ? <Navigate to="/admin/dashboard" />
                : <Navigate to="/dashboard" />;
        }
    }
};

export default LoginRoute;