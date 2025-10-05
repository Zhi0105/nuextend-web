import { apiClient } from "@_src/http-commons";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetch all announcements
 */
export const useGetAnnouncements = (token) => {
  return useQuery({
    queryKey: ["get-announcements"],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await apiClient.get(`api/v1/announcements`, { headers });
      return res.data;
    },
  });
};

/**
 * Fetch single announcement by ID
 */
export const useGetAnnouncement = (token, announcement_id) => {
  return useQuery({
    queryKey: ["get-announcement", announcement_id],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await apiClient.get(`api/v1/announcements/${announcement_id}`, { headers });
      return res.data;
    },
    enabled: !!announcement_id,
  });
};

/**
 * Fetch announcements by Event ID
 */
export const useGetAnnouncementsByEvent = (token, event_id) => {
  return useQuery({
    queryKey: ["get-announcements-by-event", event_id],
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await apiClient.get(`api/v1/events/${event_id}/announcements`, { headers });
      return res.data;
    },
    enabled: !!event_id,
  });
};

/**
 * Create an announcement
 */
export const createAnnouncement = async ({ token, formData }) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const res = await apiClient.post(`api/v1/announcements`, formData, { headers });
  return res.data;
};

/**
 * Update an announcement
 */
export const updateAnnouncement = async ({ token, id, data }) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const res = await apiClient.put(`api/v1/announcements/${id}`, data, { headers });
  return res.data;
};

/**
 * Delete an announcement
 */
export const deleteAnnouncement = async ({ token, id }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await apiClient.delete(`api/v1/announcements/${id}`, { headers });
  return res.data;
};
