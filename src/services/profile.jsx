import { apiClient } from "@_src/http-commons";

export const updateProfile = async (payload) => {
  const { user, token, file, role, department, program, skills, officer } = payload;

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const filteredData = {};

  if (role) filteredData.role = role;
  if (department) filteredData.department = department;
  if (program) filteredData.program = program;
  if (officer) filteredData.officer = officer;
  if (Array.isArray(skills) && skills.length > 0) filteredData.skills = skills;

  if (file) { 
    const formData = new FormData();
    formData.append("user", user);
    formData.append("file", file);

    Object.entries(filteredData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(`${key}[]`, v));
      } else {
        formData.append(key, value);
      }
    });

    return apiClient
      .post("api/v1/user-update", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data", // explicitly set for Laravel
        },
      })
      .then((res) => res.data)
      .catch((err) => {
        console.error("Error updating profile with file:", err);
        throw err;
      });
  }

  // No file: send JSON
  return apiClient
    .post("api/v1/user-update", { user, ...filteredData }, {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    })
    .then((res) => res.data)
    .catch((err) => {
      console.error("Error updating profile without file:", err);
      throw err;
    });
};
