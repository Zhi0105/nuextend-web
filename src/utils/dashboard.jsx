import _ from "lodash"


const formatCurrency = (total) => {
    return `₱${total.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export const getTotalVolunteer = (reports) => {
    return _.sumBy(reports, (item) => _.size(item.participants))
}
export const getTotalRoleCount = (reports, role = "student") => {
    const counts =  _(reports).flatMap('participants').groupBy('user.role_id').mapValues('length').value()

    if(role === 'student') {
        return counts[3] || 0
    }
    
    //  FOR FACULTY
    return counts[4] || 0
}
export const getAllActiveStatusEvents = (reports) => {
    return _.filter(reports, { event_status_id: 10})?.length
}
export const getModelCount = (reports, model) => {
    return _.filter(reports, { model_id: model})?.length
}
export const getTotalUtilizedBudget = (reports) => {
    const cost = _(reports).flatMap('activity').flatMap('form14').flatMap('budget_summaries').sumBy('cost')
    return formatCurrency(cost)
}
export const getAllPendingEvents = (reports) => {
    return _.filter(reports, { event_status_id: 1})?.length
}
export const getEventStatus = (reports, status_id) => {
    return _.filter(reports, { event_status_id: status_id})?.length
}
export const getTop3Org = (reports) => {
    const orgCount = {}

    reports.forEach(report =>{
        const org = report?.organization
        if(org && org.name) {
            orgCount[org.name] = (orgCount[org.name] || 0) + 1
        }
    }) 

    const top3Orgs = Object.entries(orgCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

    return top3Orgs
}
export const getVolunteerPerDepartment = (reports = []) => {
  // Flatten all participants from all reports
  const allParticipants = reports.flatMap(
    report => Array.isArray(report.participants) ? report.participants : []
  );

  // Count volunteers per department
  const departmentMap = allParticipants.reduce((acc, participant) => {
    const dept = participant.user?.department?.initial || "Unknown";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Convert to desired array format
  return Object.entries(departmentMap).map(([department, volunteer]) => ({
    name: department,
    volunteers: volunteer
  }));
};
export const getVolunteerPerRole = (reports = []) => {
  // Flatten all participants from all reports
  const allParticipants = reports.flatMap(
    report => Array.isArray(report.participants) ? report.participants : []
  );

  // Initialize role counts
  const roleCounts = {
    students: 0,
    faculty: 0,
  };

  // Loop through participants and count by role_id
  allParticipants.forEach(participant => {
    const roleId = participant.user?.role_id;
    if (roleId === 3) {
      roleCounts.students++;
    } else if (roleId === 4) {
      roleCounts.faculty++;
    }
  });

  // Convert to desired output format
  return Object.entries(roleCounts).map(([name, volunteer]) => ({
    name,
    value: volunteer
  }));
};