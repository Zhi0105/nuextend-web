/* eslint-disable react-hooks/rules-of-hooks */
import { apiClient } from "@_src/http-commons";
import { useQuery } from "@tanstack/react-query";


export const getOutreachProposals = (payload) => {

    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

    return useQuery({
        queryKey: ['outreach'],                // per-event cache
        queryFn: async () => {
        const res = await apiClient.get(`api/v1/outreach/proposal`, { headers });
        return res.data;                        // return the data directly
        },
        enabled: !!payload?.token ,              // gate the query
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,             // iwas extra hits
        retry: 1,
    });
    
}
export const createOutreach = (payload) => {
    const { 
        title,
        description,
        targetGroup,
        startDate,
        endDate,
        activityPlanBudget,
        detailedBudget,
        budgetSourcing,
        projectLeader,
        mobile,
        email
    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { 
        title,
        description,
        targetGroup,
        startDate,
        endDate,
        activity_plan_budget: [ ...activityPlanBudget ],
        detailed_budget: [ ...detailedBudget ],
        budget_sourcing: [ ...budgetSourcing ],
        projectLeader,
        mobile,
        email
    };

    const result = apiClient.post('api/v1/outreach/proposal/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const updateOutreach = (payload) => {
    const { 
        id,
        title,
        description,
        targetGroup,
        startDate,
        endDate,
        activityPlanBudget,
        detailedBudget,
        budgetSourcing,
        projectLeader,
        mobile,
        email
    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { 
        title,
        description,
        targetGroup,
        startDate,
        endDate,
        activity_plan_budget: [ ...activityPlanBudget ],
        detailed_budget: [ ...detailedBudget ],
        budget_sourcing: [ ...budgetSourcing ],
        projectLeader,
        mobile,
        email
    };

    const result = apiClient.post(`api/v1/outreach/proposal/${id}`, data, {headers}).then(res => {
        return res.data
    })

    return result
}



export const getProjectProposals = (payload) => {

    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

    return useQuery({
        queryKey: ['project'],                // per-event cache
        queryFn: async () => {
        const res = await apiClient.get(`api/v1/project/proposal`, { headers });
        return res.data;                        // return the data directly
        },
        enabled: !!payload?.token ,              // gate the query
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,             // iwas extra hits
        retry: 1,
    });
    
}
export const createProject = (payload) => {
    const { 
        projectTitle,
        projectType,
        proponents,
        collaborators,
        participants,
        partners,
        implementationDate,
        durationHours,
        area,
        budgetRequirement,
        budgetRequested,
        background,
        
        objectives,
        impactOutcome,
        risks,
        staffing,
        workPlan,
        detailedBudget,
        
        otherInfo,
        projectLeader,
        mobile,
        email
    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { 
        event_type_id: projectType,
        projectTitle,
        proponents,
        collaborators,
        participants,
        partners,
        implementationDate,
        durationHours,
        area,
        budgetRequirement,
        budgetRequested,
        background,
        otherInfo,
        projectLeader,
        mobile,
        email,
        project_objectives: [ ...objectives ],
        project_impact_outcomes: [ ...impactOutcome ],
        project_risks: [ ...risks ],
        project_staffings: [ ...staffing ],
        project_work_plans: [ ...workPlan ],
        project_detailed_budgets: [ ...detailedBudget ]

    };

    const result = apiClient.post('api/v1/project/proposal/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const updateProject = (payload) => {
    const { 
        id,
        projectTitle,
        projectType,
        proponents,
        collaborators,
        participants,
        partners,
        implementationDate,
        durationHours,
        area,
        budgetRequirement,
        budgetRequested,
        background,
        
        objectives,
        impactOutcome,
        risks,
        staffing,
        workPlan,
        detailedBudget,
        
        otherInfo,
        projectLeader,
        mobile,
        email
    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { 
        event_type_id: projectType,
        projectTitle,
        proponents,
        collaborators,
        participants,
        partners,
        implementationDate,
        durationHours,
        area,
        budgetRequirement,
        budgetRequested,
        background,
        otherInfo,
        projectLeader,
        mobile,
        email,
        project_objectives: [ ...objectives ],
        project_impact_outcomes: [ ...impactOutcome ],
        project_risks: [ ...risks ],
        project_staffings: [ ...staffing ],
        project_work_plans: [ ...workPlan ],
        project_detailed_budgets: [ ...detailedBudget ]
    };

    const result = apiClient.post(`api/v1/project/proposal/${id}`, data, {headers}).then(res => {
        return res.data
    })

    return result
}


export const getProgramProposals = (payload) => {
    const headers = payload?.token ? { Authorization: `Bearer ${payload?.token}` } : undefined;

    return useQuery({
        queryKey: ['proposal'],                // per-event cache
        queryFn: async () => {
        const res = await apiClient.get(`api/v1/program/proposal`, { headers });
        return res.data;                        // return the data directly
        },
        enabled: !!payload?.token ,              // gate the query
        staleTime: 0,                            // stale agad
        refetchOnMount: 'always',                // 👈 laging refetch on revisit
        refetchOnWindowFocus: false,             // iwas extra hits
        retry: 1,
    });
}
export const createProgram = (payload) => {
    const { 
        title,
        implementer,
        programTeamMembers,
        targetGroup,
        cooperatingAgencies,
        duration,
        proposalBudget,
        background,
        overallGoal,
        scholarlyConnection,
        coordinator,
        mobileNumber,
        email,

        componentProjects,
        projects,
        activityPlans

    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { 
        title,
        implementer,
        programTeamMembers: [ ...programTeamMembers ],
        targetGroup,
        cooperatingAgencies: [ ...cooperatingAgencies ],
        duration,
        proposalBudget,
        background,
        overallGoal,
        scholarlyConnection,
        coordinator,
        mobileNumber,
        email,

        componentProjects: [ ...componentProjects ],
        projects: [ ...projects ],
        activityPlans: [ ...activityPlans ]
    };

    const result = apiClient.post('api/v1/program/proposal/create', data, {headers}).then(res => {
        return res.data
    })

    return result
}
export const updateProgram = (payload) => {
    const { 
        id,
        title,
        implementer,
        programTeamMembers,
        targetGroup,
        cooperatingAgencies,
        duration,
        proposalBudget,
        background,
        overallGoal,
        scholarlyConnection,
        coordinator,
        mobileNumber,
        email,

        componentProjects,
        projects,
        activityPlans
    } = payload

    const headers = {
        Authorization: `Bearer ${payload?.token}`
    }
    const data = { 
        title,
        implementer,
        programTeamMembers: [ ...programTeamMembers ],
        targetGroup,
        cooperatingAgencies: [ ...cooperatingAgencies ],
        duration,
        proposalBudget,
        background,
        overallGoal,
        scholarlyConnection,
        coordinator,
        mobileNumber,
        email,

        componentProjects: [ ...componentProjects ],
        projects: [ ...projects ],
        activityPlans: [ ...activityPlans ]
    };

    const result = apiClient.post(`api/v1/program/proposal/${id}`, data, {headers}).then(res => {
        return res.data
    })

    return result
}