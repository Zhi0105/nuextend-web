/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons";
import { useQuery } from "@tanstack/react-query";

export const getReports = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

    return useQuery({
        queryKey: ['reports', payload?.activity],                // per-event cache
        queryFn: async () => {
        const res = await apiClient.get(`/api/v1/progress-report/${payload?.activity}`, { headers });
        return res.data;                        // return the data directly
        },
        enabled: Boolean(payload.token && payload.activity),              // gate the query
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,             // iwas extra hits
        retry: 1,
    });
}
export const uploadReport = (payload) => {
    const { reports } = payload

    const formData = new FormData();
    reports.forEach((r, idx) => {
        // primitives
        if (r.event_id != null) formData.append(`reports[${idx}][event_id]`, String(r.event_id));
        if (r.activity_id != null) formData.append(`reports[${idx}][activity_id]`, String(r.activity_id));
        formData.append(`reports[${idx}][name]`, r.name ?? "");
        if (r.date) formData.append(`reports[${idx}][date]`, r.date);
        formData.append(`reports[${idx}][budget]`, String(r.budget ?? 0));

        // file (only if present and is a File/Blob)
        if (r.file instanceof File) {
        formData.append(`reports[${idx}][file]`, r.file, r.file.name);
        }
    });

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    const result = apiClient.post('api/v1/progress-report', formData, {headers}).then(res => {
        return res.data
    })

    return result
}
export const removeReport = (payload ) => {
    const { report_id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    const data = {
        report_id
    }

    const result = apiClient.post(`api/v1/progress-report/remove`, data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const approveReport = (payload ) => {
    const { id, role_id, commex_remarks, asd_remarks } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        role_id,
        commex_remarks,
        asd_remarks
    };

    const result = apiClient.post('api/v1/progress-report/approve', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const rejectReport = (payload ) => {
    const { id, role_id, commex_remarks, asd_remarks } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        role_id,
        commex_remarks,
        asd_remarks
    };

    const result = apiClient.post('api/v1/progress-report/reject', data, {headers}).then(res => {
        return res.data
    })

    return result
}