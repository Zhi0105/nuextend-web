/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getUnsdgs = () => {
    return useQuery({
        queryKey: ['unsdgs'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/unsdg/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}