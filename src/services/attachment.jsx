import { apiClient } from "@_src/http-commons";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch attachments by event_id
 */
export const useGetAttachments = (token, event_id) => {
  return useQuery({
    queryKey: ["get-attachments", event_id],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      // Use /v1/ instead of /api/v1/
      const result = await apiClient.get(`api/v1/attachments/event/${event_id}`, { headers });
      return result.data;
    },
  });
};

/**
 * Fetch a single attachment by attachment_id
 */
export const useGetAttachment = (token, attachment_id) => {
  return useQuery({
    queryKey: ["get-attachment", attachment_id],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const result = await apiClient.get(`api/v1/attachments/${attachment_id}`, { headers });
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Fetch attachments by event ID (non-hook version)
 */
export const getAttachmentsByEvent = async ({ token, event_id }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.get(`api/v1/attachments/event/${event_id}`, { headers });
  return res.data;
};

/**
 * Create Attachment
 */
export const createAttachment = async ({ token, formData }) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "multipart/form-data",
  };
  const res = await apiClient.post(`api/v1/attachments`, formData, { headers });
  return res.data;
};

/**
 * Update Attachment Remarks
 */
export const updateAttachmentRemarks = async ({ token, id, remarks }) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const data = { remarks };
  const res = await apiClient.patch(`api/v1/attachments/${id}/remarks`, data, { headers });
  return res.data;
};

/**
 * Delete Attachment
 */
export const deleteAttachment = async ({ token, id }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.delete(`api/v1/attachments/${id}`, { headers });
  return res.data;
};