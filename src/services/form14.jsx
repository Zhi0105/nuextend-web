import { apiClient } from "@_src/http-commons";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch a single Form14 by form14_id
 */
export const useGetForm14 = (token, form14_id) => {
  return useQuery({
    queryKey: ["get-form14", form14_id],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const result = await apiClient.get(`api/v1/form14/proposal/${form14_id}`, { headers });
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Fetch all reports for a specific activity
 */
export const getReportsByActivity = async ({ token, activities_id }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.get(`api/v1/form14/activity/${activities_id}`, { headers });
  return res.data;
};

/**
 * Create Form14
 */
export const createForm14 = async ({ token, ...form }) => {
  if (!form.event_status_id) form.event_status_id = 3; // default Pending
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.post("api/v1/form14/proposal/create", form, { headers });
  return res.data;
};

/**
 * Update Form14
 */
export const updateForm14 = async ({ token, id, ...form }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.put(`api/v1/form14/proposal/${id}`, form, { headers });
  return res.data;
};

/**
 * Delete Form14
 */
export const deleteForm14 = async ({ token, id }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.delete(`api/v1/form14/proposal/${id}`, { headers });
  return res.data;
};

//submit
export const updateForm14Status = async ({ token, id, event_status_id, remarks }) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const data = { event_status_id };
  if (event_status_id === 6 && remarks) data.remarks = remarks; // send remarks only for revise

  const res = await apiClient.patch(`api/v1/form14/${id}/status`, data, { headers });
  return res.data;
};

//get all the status
export const getEventStatuses = async ({ token }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.get("api/v1/event_status/all", { headers });
  return res.data.data || [];
};

