import {  Routes, Route, useLocation } from 'react-router-dom'

// SCREENS
import { Home } from '@_src/components/Pages/Home'
import { LoginScreen } from '@_src/components/Screen/LoginScreen'
import { RegisterScreen } from '@_src/components/Screen/RegisterScreen'
import { HomeScreen } from '@_src/components/Screen/HomeScreen'
import { DashboardScreen } from '@_src/components/Screen/DashboardScreen'

import { CreateScreen } from '@_src/components/Screen/Event/CreateScreen'
import { ViewScreen } from '@_src/components/Screen/Event/ViewScreen'
import { UpdateScreen } from '@_src/components/Screen/Event/UpdateScreen'
import { DetailScreen } from '@_src/components/Screen/Event/DetailScreen'

import { OrgcreateScreen } from '@_src/components/Screen/Organization/OrgCreateScreen'
import { OrgViewScreen } from '@_src/components/Screen/Organization/OrgViewScreen'
import { AddmemberScreen } from '@_src/components/Screen/Organization/AddmemberScreen'
import { MemberScreen } from '@_src/components/Screen/Organization/MemberScreen'

import { AdminDashboardScreen } from '@_src/components/Screen/Admin/AdminDashboardScreen'
import { AdminCreateScreen } from '@_src/components/Screen/Event/admin/AdminCreateScreen'
import { AdminViewScreen } from '@_src/components/Screen/Event/admin/AdminViewScreen'
import { AdminUpdateScreen } from '@_src/components/Screen/Event/admin/AdminUpdateScreen'
import { AdminDetailScreen } from '@_src/components/Screen/Event/admin/AdminDetailScreen'

import { FormListScreen } from '@_src/components/Screen/Forms/FormListScreen'
import { UploadScreen } from '@_src/components/Screen/Forms/UploadScreen'

import PrivateRoute from './PrivateRoute'
import LoginRoute from './LoginRoute'

export const RouteList = () => {
    const location = useLocation()

    return (
        <Routes location={location} key={location.pathname}>
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />

                <Route path="/event/view" element={<ViewScreen />} />
                <Route path="/event/create" element={<CreateScreen />} />
                <Route path="/event/update" element={<UpdateScreen />} />
                <Route path="/event/detail" element={<DetailScreen />} />
                <Route path="/admin/event/create" element={<AdminCreateScreen />} />
                <Route path="/admin/event/view" element={<AdminViewScreen />} />
                <Route path="/admin/event/update" element={<AdminUpdateScreen />} />
                <Route path="/admin/event/detail" element={<AdminDetailScreen />} />
                
                <Route path="/event/form-list" element={<FormListScreen />} />
                <Route path="/event/form/upload" element={<UploadScreen />} />

                <Route path="/organization/view" element={<OrgViewScreen />} />
                <Route path="/organization/create" element={<OrgcreateScreen />} />
                <Route path="/organization/member/add" element={<AddmemberScreen />} />
                <Route path="/organization/member" element={<MemberScreen />} />         

            </Route>

            <Route element={<LoginRoute />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/login" element={<LoginScreen />} />
                <Route path="/register" element={<RegisterScreen />} />
            </Route>
        </Routes>
    )
}
