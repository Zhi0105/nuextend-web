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