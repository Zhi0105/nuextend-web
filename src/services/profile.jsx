import { apiClient } from "@_src/http-commons";

export const updateProfile = async (payload) => {
  const { user, token, file } = payload;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (file) { 
    const formData = new FormData();
    formData.append("user", user);
    formData.append("file", file);

    return apiClient
      .post("api/v1/user-update", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error updating e-signature:", err);
        throw err;
      });
  }

  // No file: send minimal JSON with just user ID
  return apiClient
    .post("api/v1/user-update", { user }, {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.error("Error updating user:", err);
      throw err;
    });
};
// New officer assignment function
export const assignOfficerRole = async (payload) => {
  const { token, officer_user_id, role_id } = payload;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return apiClient
    .post("api/v1/assign-officer", { officer_user_id, role_id }, { headers })
    .then((res) => res.data)
    .catch((err) => {
      console.error("Error assigning officer role:", err);
      throw err;
    });
};

// New officer removal function
export const removeOfficerRole = async (payload) => {
  const { token, user_id } = payload;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return apiClient
    .post("api/v1/remove-officer", { user_id }, { headers })
    .then((res) => res.data)
    .catch((err) => {
      console.error("Error removing officer role:", err);
      throw err;
    });
};
