import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"


export const useGetForm = (token) => {
    return useQuery({
        queryKey: ['get-form'],
        queryFn: async () => {
        const headers = {
            Authorization: `Bearer ${token}`
        };
        const result = await apiClient.get('api/v1/form/program/3', { headers });
        return result.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: true,
    });
};
export const approveForm = (payload ) => {
    const { id, role_id, commex_remarks, dean_remarks, asd_remarks, ad_remarks } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        role_id,
        commex_remarks,
        dean_remarks,
        asd_remarks,
        ad_remarks
    };

    const result = apiClient.post('api/v1/form/approve', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const rejectForm = (payload ) => {
    const { id, role_id, commex_remarks, dean_remarks, asd_remarks, ad_remarks } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        role_id,
        commex_remarks,
        dean_remarks,
        asd_remarks,
        ad_remarks
    };

    const result = apiClient.post('api/v1/form/reject', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const attachForm = (payload ) => {
    const { event_id, form_id} = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        event_id,
        form_id
    };

    const result = apiClient.post('api/v1/form/attachment', data, {headers}).then(res => {
        return res.data
    })

    return result
}