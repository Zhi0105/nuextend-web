import { Outlet, Navigate } from 'react-router-dom'
import { useUserStore } from '@_src/store/auth';

const PrivateRoute = () => {
  const { token } = useUserStore((state) => ({
      token: state.token,
  }));
 
  return (
    token ? <Outlet /> : <Navigate to="/login" />
  )
}


export default PrivateRoute