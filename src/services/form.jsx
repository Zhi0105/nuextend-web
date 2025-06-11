import { apiClient } from "@_src/http-commons"


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
