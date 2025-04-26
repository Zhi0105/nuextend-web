/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getUsers = (payload) => {
    return useQuery({
        queryKey: ['users'],
        queryFn: async() => {

            const { token } = payload

            const headers = {
                Authorization: `Bearer ${token}`
            }
            const result = await apiClient.get('api/v1/user/all', {headers})
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}