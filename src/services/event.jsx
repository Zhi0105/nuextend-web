/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getEventStatus = () => {
    return useQuery({
        queryKey: ['evemt-status'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/event_status/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const getEventTypes = () => {
    return useQuery({
        queryKey: ['event-types'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/event_types/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const createEvent = (payload) => {
    const {
        user_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        skills,
        unsdgs } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        user_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        skills: [...skills],
        unsdgs: [...unsdgs]
    };

    const result = apiClient.post('api/v1/event/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}