/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

export const getTerms = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

    return useQuery({
        queryKey: ['term'],                // per-event cache
        queryFn: async () => {
        const res = await apiClient.get(`/api/v1/terms`, { headers });
        return res.data;                        // return the data directly
        },
        enabled: !!payload?.token,              // gate the query
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,             // iwas extra hits
        retry: 1,
    });
}

export const getDashBoardReport = (payload) => {
  const {
    term,
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`,
  };

  // Shape must mirror backend validator
  const data = {
    term
  };

  return apiClient
    .post("api/v1/dashboard", data, { headers })
    .then((res) => res.data);
};