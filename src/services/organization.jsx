/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getOrganizations = () => {
    return useQuery({
        queryKey: ['organization'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/organization/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const createOrganization = (payload) => {
    const { name } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        name
    };

    const result = apiClient.post('api/v1/organization/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const userOrganizationAssign = (payload) => {
    const { user_id, organizations } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        user_id,
        organizations
    };

    const result = apiClient.post('api/v1/user/organization_assign', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const getMembers = (payload) => {
    return useQuery({
        queryKey: ['members'],
        queryFn: async() => {

            const { token } = payload

            const headers = {
                Authorization: `Bearer ${token}`
            }
            const result = await apiClient.get(`api/v1/organization/${payload.organization_id}/members`, {headers})
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const changeRole = (payload) => {
    const { organization_id, assigner_id, assigner_role, assignee_id, assignee_role } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        organization_id,
        assigner_id,
        assigner_role,
        assignee_id,
        assignee_role
    };

    const result = apiClient.post('api/v1/organization/role/change', data, {headers}).then(res => {
        return res.data
    })

    return result
}