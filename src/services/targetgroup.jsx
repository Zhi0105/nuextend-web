/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const getTargetGroups = () => {
    const qc = useQueryClient();

    return useQuery({
        queryKey: ["targetgroup"],
        queryFn: async () => {
        const res = await apiClient.get("/api/v1/targetgroup/all");
        return res.data;
        },

        // lessen background churn
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,

        // Respect server backoff hints
        retry: (failureCount, error) => {
        const status = error?.response?.status;
        // Retry 429 (with backoff) and retry other errors up to 2 times
        if (status === 429) return true;
        return failureCount < 2;
        },
        retryDelay: (attempt, error) => {
        const ra = Number(error?.response?.headers?.["retry-after"]);
        if (!Number.isNaN(ra) && ra > 0) return ra * 1000; // follow server
        // fallback exponential backoff
        return Math.min(1000 * 2 ** attempt, 30_000);
        },

        // optional: auto-schedule a refetch after Retry-After if a manual refetch is needed elsewhere
        onError: (error) => {
        const ra = Number(error?.response?.headers?.["retry-after"]);
        if (!Number.isNaN(ra) && ra > 0) {
            setTimeout(() => {
            qc.invalidateQueries({ queryKey: ["targetgroup"] });
            }, ra * 1000);
        }
        },
    });
}