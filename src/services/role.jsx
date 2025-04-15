/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getRoles = () => {
    return useQuery({
        queryKey: ['roles'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/role/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}