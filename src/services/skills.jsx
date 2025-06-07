/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getSkills = () => {
    return useQuery({
        queryKey: ['skills'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/skill/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const createSkill = (payload) => {
    const { name } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { name };

    const result = apiClient.post('api/v1/skill/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const updateSkill = (payload) => {
    const { id, name } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { id, name };

    const result = apiClient.post('api/v1/skill/update', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const removeSkill = (payload) => {
    const { id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { id };

    const result = apiClient.post('api/v1/skill/delete', data, {headers}).then(res => {
        return res.data
    })

    return result
}