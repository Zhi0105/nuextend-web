/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"

// helper to normalize different API shapes into an array
const unwrapEvents = (res) => {
    const d = res?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(res)) return res;
    return [];
};


const normalize = (res) => {
    const d = res?.data ?? res;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    return [];
};

export const fetchEventTypes = async () => {
    const res = await apiClient.get("api/v1/event_types/all");
    const rows = normalize(res);
    return rows.map((r) => ({
        label: r?.name ?? r?.label ?? r?.title ?? String(r?.id ?? r?.value ?? r?.code ?? ""),
        value: r?.id ?? r?.value ?? r?.code ?? r?.slug ?? r?.name ?? "",
    }));
};

const DEFAULT_OPT = { label: "— Select type —", value: "" };

export const getEventStatus = () => {
    return useQuery({
        queryKey: ['event-status'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/event_status/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const getEventTypes = () => {
    return useQuery({
        queryKey: ["event-types"],
        queryFn: fetchEventTypes,
        // show options agad (no spinner) while request runs
        placeholderData: (old) => old ?? [DEFAULT_OPT],
        // always include default first item
        select: (opts) => [DEFAULT_OPT, ...opts],
        // keep & reuse across visits para no refetch flicker
        staleTime: 24 * 60 * 60 * 1000, // 1 day
        cacheTime: 24 * 60 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });    
    // return useQuery({
    //     queryKey: ['event-types'],
    //     queryFn: async() => {
    //         const result = await apiClient.get('api/v1/event_types/all')
    //         return result?.data
    //     },
    //     staleTime: 5 * 60000,
    //     refetchOnWindowFocus: true,
    // })
}
export const getEvents = (payload) => {
    return useQuery({
        queryKey: ["event", Boolean(payload?.token)],
        enabled: Boolean(payload?.token) && true,
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,    
        retry: (failureCount, err) =>
        err?.response?.status === 429 ? false : failureCount < 3,
        queryFn: async () => {
        const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : {};
        const res = await apiClient.get("/api/v1/event/all", { headers });
        return unwrapEvents(res);
        },
        select: (rows) =>
        rows.map((e) => ({
            ...e,
            eventName: e?.activity?.[0]?.name ?? "",
    })),
});

}
export const getUserEvents = (payload) => {
    return useQuery({
        queryKey: ["event", payload?.user_id, Boolean(payload?.token)],
        enabled: Boolean(payload?.token && payload?.user_id) && true,
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,    
        retry: (failureCount, err) =>
        err?.response?.status === 429 ? false : failureCount < 3,
        queryFn: async () => {
        const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : {};
        const res = await apiClient.get(`/api/v1/event/${payload?.user_id}`, { headers });
        return unwrapEvents(res);
        },
        select: (rows) =>
        rows.map((e) => ({
            ...e,
            eventName: e?.activity?.[0]?.name ?? "",
        })),
    });
}
export const getForms = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

    return useQuery({
        queryKey: ['form', payload?.event],                // per-event cache
        queryFn: async () => {
        const res = await apiClient.get(`/api/v1/form/${payload?.event}`, { headers });
        return res.data;                        // return the data directly
        },
        enabled: !!payload?.token && !!payload?.event,              // gate the query
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,             // iwas extra hits
        retry: 1,
    });
}
export const createEvent = (payload) => {
    const {
        user_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        target_group,
        term,
        budget_proposal,
        skills,
        unsdgs,
        activities
    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        user_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        target_group,
        term,
        budget_proposal,
        skills: [...skills],
        unsdgs: [...unsdgs],
        activities: [...activities]
    };

    const result = apiClient.post('api/v1/event/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const updateEvent = (payload) => {
    const {
        id,
        user_id,
        activity_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        target_group,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        budget_proposal,
        skills,
        unsdgs } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        user_id,
        activity_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        target_group,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        budget_proposal,
        skills: [...skills],
        unsdgs: [...unsdgs]
    };

    const result = apiClient.post('api/v1/event/update', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const removeEvent = (payload) => {
    const { id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { id };

    const result = apiClient.post('api/v1/event/delete', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const acceptEvent = (payload ) => {
    const { id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
    };

    const result = apiClient.post('api/v1/event/accept', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const rejectEvent = (payload ) => {
    const { id, remarks } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        remarks
    };

    const result = apiClient.post('api/v1/event/reject', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const uploadForm = (payload ) => {
    const { event_id, name, code, file } = payload

    const formData = new FormData();
        formData.append("event_id", event_id);
        formData.append("name", name);
        formData.append("code", code);
        formData.append("file", file);

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    const result = apiClient.post('api/v1/forms', formData, {headers}).then(res => {
        return res.data
    })

    return result
}
export const removeForm = (payload ) => {
    const { form_id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    const result = apiClient.delete(`api/v1/forms/${form_id}`, {headers}).then(res => {
        return res.data
    })

    return result
}
export const eventPost = (payload ) => {
    const { id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
    };

    const result = apiClient.post('api/v1/event/post', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const eventTerminate = (payload ) => {
    const { id } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
    };

    const result = apiClient.post('api/v1/event/terminate', data, {headers}).then(res => {
        return res.data
    })

    return result
}