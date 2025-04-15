import {  Routes, Route, useLocation } from 'react-router-dom'

// SCREENS
import { Home } from '@_src/components/Pages/Home'
import { LoginScreen } from '@_src/components/Screen/LoginScreen'
import { RegisterScreen } from '@_src/components/Screen/RegisterScreen'
import { HomeScreen } from '@_src/components/Screen/HomeScreen'
import { DashboardScreen } from '@_src/components/Screen/DashboardScreen'

import PrivateRoute from './PrivateRoute'
import LoginRoute from './LoginRoute'

export const RouteList = () => {
    const location = useLocation()

    return (
        <Routes location={location} key={location.pathname}>
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardScreen />} />
            </Route>

            <Route element={<LoginRoute />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
            </Route>
        </Routes>
    )
}
