/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons";
import { useQuery } from "@tanstack/react-query";

/* -------------------------------
 * Shared helpers for approve/reject
 * ------------------------------- */
const authHeaders = (token) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

const postJSON = async (url, data, token) => {
  const res = await apiClient.post(url, data, { headers: authHeaders(token) });
  return res.data;
};

const decisionForm = (form, action, payload = {}) => {
  const { token, ...rest } = payload; // keep body clean; headers carry token
  return postJSON(`api/v1/${form}/${action}`, rest, token);
};

const approveForm = (form, payload) => decisionForm(form, "approve", payload);
const rejectForm  = (form, payload) => decisionForm(form, "reject", payload);

/* ===============================
 * FORM 1 (unchanged get/create/update)
 * =============================== */
export const getForm1 = (payload) => {
  const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

  return useQuery({
    queryKey: ['proposal'],
    queryFn: async () => {
      const res = await apiClient.get(`api/v1/form1/proposal`, { headers });
      return res.data;
    },
    enabled: !!payload?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const createForm1 = (payload) => {
  const {
    event_id,
    duration,
    background,
    overall_goal,
    scholarly_connection,
    programTeamMembers,
    cooperatingAgencies,
    componentProjects,
    projects,
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`,
  };

  // Shape must mirror backend validator
  const data = {
    event_id,
    duration,
    background,
    overall_goal,
    scholarly_connection,

    programTeamMembers: [...programTeamMembers],
    cooperatingAgencies: [...cooperatingAgencies],
    componentProjects: [...componentProjects],

    // projects with nested budgetSummaries
    projects: (projects ?? []).map((proj) => ({
      title: proj.title,
      teamLeader: proj.teamLeader,
      teamMembers: [...(proj.teamMembers ?? [])],
      objectives: proj.objectives,
      budgetSummaries: (proj.budgetSummaries ?? []).map((b) => ({
        activities: b.activities,
        outputs: b.outputs,
        timeline: b.timeline, // already transformed to YYYY-MM-DD in form submit
        personnel: b.personnel,
        budget: b.budget,     // keep number or null (backend accepts nullable / decimal)
      })),
    })),
  };

  return apiClient
    .post("api/v1/form1/proposal/create", data, { headers })
    .then((res) => res.data);
};

export const updateForm1 = (payload) => {
  const {
    id,
    duration,
    background,
    overall_goal,
    scholarly_connection,
    programTeamMembers,
    cooperatingAgencies,
    componentProjects,
    projects,
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`,
  };

  const data = {
    duration,
    background,
    overall_goal,
    scholarly_connection,

    programTeamMembers: [...programTeamMembers],
    cooperatingAgencies: [...cooperatingAgencies],
    componentProjects: [...componentProjects],

    projects: (projects ?? []).map((proj) => ({
      title: proj.title,
      teamLeader: proj.teamLeader,
      teamMembers: [...(proj.teamMembers ?? [])],
      objectives: proj.objectives,
      budgetSummaries: (proj.budgetSummaries ?? []).map((b) => ({
        activities: b.activities,
        outputs: b.outputs,
        timeline: b.timeline,
        personnel: b.personnel,
        budget: b.budget,
      })),
    })),
  };

  return apiClient
    .post(`api/v1/form1/proposal/${id}`, data, { headers })
    .then((res) => res.data);
};

/* ✅ refactored approve/reject (FORM 1) */
export const approveForm1 = (payload) => approveForm("form1", payload);
export const rejectForm1  = (payload) => rejectForm("form1", payload);

/* ===============================
 * FORM 2 (unchanged get/create/update)
 * =============================== */
export const getForm2 = (payload) => {
  const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

  return useQuery({
    queryKey: ['project'],
    queryFn: async () => {
      const res = await apiClient.get(`api/v1/form2/proposal`, { headers });
      return res.data;
    },
    enabled: !!payload?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const createForm2 = (payload) => {
  const {
    event_id,
    event_type_id,
    proponents,
    collaborators,
    participants,
    partners,
    implementationDate,
    area,
    budgetRequirement,
    budgetRequested,
    background,
    otherInfo,

    project_objectives,
    project_impact_outcomes,
    project_risks,
    project_staffings,
    project_work_plans,
    project_detailed_budgets,
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    event_id,
    event_type_id,
    proponents,
    collaborators,
    participants,
    partners,
    implementationDate,
    area,
    budgetRequirement,
    budgetRequested,
    background,
    otherInfo,

    project_objectives: [ ...project_objectives ],
    project_impact_outcomes: [ ...project_impact_outcomes ],
    project_risks: [ ...project_risks ],
    project_staffings: [ ...project_staffings ],
    project_work_plans: [ ...project_work_plans ],
    project_detailed_budgets: [ ...project_detailed_budgets ]
  };

  const result = apiClient.post('api/v1/form2/proposal/create', data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

export const updateForm2 = (payload) => {
  const {
    id,
    event_type_id,
    proponents,
    collaborators,
    participants,
    partners,
    implementationDate,
    area,
    budgetRequirement,
    budgetRequested,
    background,
    otherInfo,

    project_objectives,
    project_impact_outcomes,
    project_risks,
    project_staffings,
    project_work_plans,
    project_detailed_budgets,
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    event_type_id,
    proponents,
    collaborators,
    participants,
    partners,
    implementationDate,
    area,
    budgetRequirement,
    budgetRequested,
    background,
    otherInfo,

    project_objectives: [ ...project_objectives ],
    project_impact_outcomes: [ ...project_impact_outcomes ],
    project_risks: [ ...project_risks ],
    project_staffings: [ ...project_staffings ],
    project_work_plans: [ ...project_work_plans ],
    project_detailed_budgets: [ ...project_detailed_budgets ]
  };

  const result = apiClient.post(`api/v1/form2/proposal/${id}`, data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

/* ✅ refactored approve/reject (FORM 2) */
export const approveForm2 = (payload) => approveForm("form2", payload);
export const rejectForm2  = (payload) => rejectForm("form2", payload);

/* ===============================
 * FORM 3 (unchanged get/create/update)
 * =============================== */
export const getForm3 = (payload) => {
  const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

  return useQuery({
    queryKey: ['outreach'],
    queryFn: async () => {
      const res = await apiClient.get(`api/v1/form3/proposal`, { headers });
      return res.data;
    },
    enabled: !!payload?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

export const createForm3 = (payload) => {
  const {
    event_id,
    description,
    targetGroup,
    startDate,
    endDate,
    activity_plan_budget,
    detailed_budget,
    budget_sourcing
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    event_id,
    description,
    targetGroup,
    startDate,
    endDate,
    activity_plan_budget: [ ...activity_plan_budget ],
    detailed_budget: [ ...detailed_budget ],
    budget_sourcing: [ ...budget_sourcing ]
  };

  const result = apiClient.post('api/v1/form3/proposal/create', data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

export const updateForm3 = (payload) => {
  const {
    id,
    description,
    targetGroup,
    startDate,
    endDate,
    activity_plan_budget,
    detailed_budget,
    budget_sourcing
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    description,
    targetGroup,
    startDate,
    endDate,
    activity_plan_budget: [ ...activity_plan_budget ],
    detailed_budget: [ ...detailed_budget ],
    budget_sourcing: [ ...budget_sourcing ]
  };

  const result = apiClient.post(`api/v1/form3/proposal/${id}`, data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

/* ✅ refactored approve/reject (FORM 3) */
export const approveForm3 = (payload) => approveForm("form3", payload);
export const rejectForm3  = (payload) => rejectForm("form3", payload);


export const getForm4 = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

  return useQuery({
    queryKey: ['form4'],
    queryFn: async () => {
      const res = await apiClient.get(`api/v1/form4`, { headers });
      return res.data;
    },
    enabled: !!payload?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
}
export const createForm4 = (payload) => {
  const {
    event_id,
    a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    event_id, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p
  };

  const result = apiClient.post('api/v1/form4/create', data, {headers}).then(res => {
    return res.data;
  });

  return result;
};
export const updateForm4 = (payload) => {
  const {
    id, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p
  };

  const result = apiClient.post(`api/v1/form4/${id}`, data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

/* ✅ refactored approve/reject (FORM 3) */
export const approveForm4 = (payload) => approveForm("form4", payload);
export const rejectForm4  = (payload) => rejectForm("form4", payload);

export const getForm5 = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

  return useQuery({
    queryKey: ['form5'],
    queryFn: async () => {
      const res = await apiClient.get(`api/v1/form5`, { headers });
      return res.data;
    },
    enabled: !!payload?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
}
export const createForm5 = (payload) => {
  const {
    event_id,
    a, b, c, d, e, f, g, h, i, j, k, l, m, n
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    event_id, a, b, c, d, e, f, g, h, i, j, k, l, m, n
  };

  const result = apiClient.post('api/v1/form5/create', data, {headers}).then(res => {
    return res.data;
  });

  return result;
};
export const updateForm5 = (payload) => {
  const {
    id, a, b, c, d, e, f, g, h, i, j, k, l, m, n
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    a, b, c, d, e, f, g, h, i, j, k, l, m, n
  };

  const result = apiClient.post(`api/v1/form5/${id}`, data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

export const approveForm5 = (payload) => approveForm("form5", payload);
export const rejectForm5  = (payload) => rejectForm("form5", payload);

export const getForm6 = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

  return useQuery({
    queryKey: ['form6'],
    queryFn: async () => {
      const res = await apiClient.get(`api/v1/form6`, { headers });
      return res.data;
    },
    enabled: !!payload?.token,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
}
export const createForm6 = (payload) => {
  const {
    event_id,
    designation, 
    representing, 
    partnership, 
    entitled, 
    conducted_on, 
    behalf_of, 
    organization, 
    address, 
    mobile_number, 
    email
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    event_id,
    designation, 
    representing, 
    partnership, 
    entitled, 
    conducted_on, 
    behalf_of, 
    organization, 
    address, 
    mobile_number, 
    email
  };

  const result = apiClient.post('api/v1/form6/create', data, {headers}).then(res => {
    return res.data;
  });

  return result;
};
export const updateForm6 = (payload) => {
  const {
    id,
    designation, 
    representing, 
    partnership, 
    entitled, 
    conducted_on, 
    behalf_of, 
    organization, 
    address, 
    mobile_number, 
    email
  } = payload;

  const headers = {
    Authorization: `Bearer ${payload?.token}`
  };
  const data = {
    designation, 
    representing, 
    partnership, 
    entitled, 
    conducted_on, 
    behalf_of, 
    organization, 
    address, 
    mobile_number, 
    email
  };

  const result = apiClient.post(`api/v1/form6/${id}`, data, {headers}).then(res => {
    return res.data;
  });

  return result;
};

export const approveForm6 = (payload) => approveForm("form6", payload);
export const rejectForm6  = (payload) => rejectForm("form6", payload);
