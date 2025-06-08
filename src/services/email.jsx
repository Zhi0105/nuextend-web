/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getEmailVerificationStatus = (payload) => {
    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    return useQuery({
        queryKey: ['email-status', payload?.token],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/email/verify-status', {headers})
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
        enabled: !!payload?.token
    })
}
export const sentVerificationNotification = (payload) => {
    const { token, is_mobile } = payload
    const headers = {
        Authorization: `Bearer ${token}`
    }
    const data = {
        is_mobile
    };

    const result = apiClient.post('api/v1/email/verification-notification', data, {headers}).then(res => {
        return res.data
    })

    return result
}