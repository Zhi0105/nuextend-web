/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons"
import { useQuery } from "@tanstack/react-query"



export const getEventStatus = () => {
    return useQuery({
        queryKey: ['evemt-status'],
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
        queryKey: ['event-types'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/event_types/all')
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const getEvents = (payload) => {
    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    return useQuery({
        queryKey: ['event'],
        queryFn: async() => {
            const result = await apiClient.get('api/v1/event/all', {headers})
            return result
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    });

}
export const getUserEvents = (payload) => {
    return useQuery({
        queryKey: ['user-event'],
        queryFn: async() => {

            const { token } = payload

            const headers = {
                Authorization: `Bearer ${token}`
            }
            const result = await apiClient.get(`api/v1/event/${payload.user_id}`, {headers})
            return result?.data
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    })
}
export const getForms = (payload) => {
    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }

    return useQuery({
        queryKey: ['form'],
        queryFn: async() => {
            const result = await apiClient.get(`api/v1/form/${payload.event}`, {headers})
            return result
        },
        staleTime: 5 * 60000,
        refetchOnWindowFocus: true,
    });

}
export const createEvent = (payload) => {
    const {
        user_id,
        program_model_name,
        target_group_name,
        target_group_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        skills,
        unsdgs } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        user_id,
        program_model_name,
        target_group_name,
        target_group_id,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        skills: [...skills],
        unsdgs: [...unsdgs]
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
        program_model_name,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        skills,
        unsdgs } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = {
        id,
        user_id,
        program_model_name,
        organization_id,
        model_id,
        event_type_id,
        event_status_id,
        name,
        address,
        term,
        start_date,
        end_date,
        description,
        skills: [...skills],
        unsdgs: [...unsdgs]
    };

    const result = apiClient.post('api/v1/event/update', data, {headers}).then(res => {
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