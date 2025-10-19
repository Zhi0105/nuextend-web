import React from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { SetFormCodeNavigate } from "@_src/utils/helpers";

export const FormProgressList = ({ eventList = [], currentUserRoleId, currentUserDepartmentId }) => {
    const navigate = useNavigate();
    console.log(eventList)
    
    const approvalHierarchy = {
        1: [9, 1, 10, 11],
        2: [9, 1, 10, 11],
        3: [9, 1, 10, 11],
        4: [9, 10, 1],
        5: [9, 10, 1],
        6: [1],
        7: [1],
        8: [1],
        9: [9, 1, 10, 11],
        10: [9, 1, 10, 11],
        11: [1, 10],
        12: [1, 10],
        13: [1],
        14: [1, 10],
    };

    const roleNames = {
        1: "Comex",
        9: "Dean",
        10: "Academic Service Director",
        11: "Academic Director",
    };

    const getRoleApprovalKey = (roleId) => {
        switch (roleId) {
            case 1: return "commex";
            case 9: return "dean";
            case 10: return "asd";
            case 11: return "ad";
            default: return "";
        }
    };

    // Check if Dean should see this form based on department
    const shouldDeanSeeForm = (event) => {
        // If not Dean role, skip this check
        if (currentUserRoleId !== 9) return true;
        
        const eventCreatorRoleId = event.user?.role_id;
        const eventCreatorDepartmentId = event.user?.department_id;
        
        // Skip Dean approval if event creator is Comex
        if (eventCreatorRoleId === 1) return false;
        
        // Show to Dean only if creator is from SAME department
        if (eventCreatorDepartmentId === currentUserDepartmentId) {
            return true;
        }
        
        // Don't show to Dean if creator is from different department
        return false;
    };

    const getCurrentApprover = (formData, formNumber, userRoleId, event) => {
        // If user is Dean and shouldn't see this form, return empty
        if (userRoleId === 9 && !shouldDeanSeeForm(event)) {
            return "";
        }

        // Special handling for Form 14 (uses event_status_id instead of boolean flags)
        if (formNumber === 14) {
            const eventStatusId = formData.event_status_id;
            
            // Check if form is sent for revision
            if (eventStatusId === 6) {
                return "Sent for revision";
            }
            
            // Check if form is revised/updated
            if (eventStatusId === 8) {
                return "Form has been revised/updated";
            }
            
            // Check approval status for Form 14 - Comex first, then Academic Service Director
            const isComexApproved = formData.is_commex === 1 || formData.is_commex === true;
            const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
            
            if (!isComexApproved) {
                return "Pending Comex approval";
            } else if (isComexApproved && !isAsdApproved) {
                return "Pending Academic Service Director approval";
            } else if (isComexApproved && isAsdApproved) {
                return "Fully approved";
            }
            
            return "Pending approval";
        }

        // Original logic for forms 1-13
        if (formData.is_revised === true || formData.is_revised === 1) {
            const hierarchy = approvalHierarchy[formNumber];
            if (!hierarchy) return "Sent for revision";
            let filteredHierarchy = [...hierarchy];

            if (formNumber === 4 || formNumber === 5) {
                if (userRoleId === 1) {
                    filteredHierarchy = [10, 1];
                } else {
                    const isDeanApproved = formData.is_dean === 1 || formData.is_dean === true;
                    const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;

                    if (!isDeanApproved && !isAsdApproved)
                        return "Sent for revision by Dean OR Academic Service Director";
                    filteredHierarchy = [1];
                }
            } else if (userRoleId === 1) {
                filteredHierarchy = hierarchy.filter((id) => id !== 9);
            }

            for (const roleId of filteredHierarchy) {
                const roleKey = getRoleApprovalKey(roleId);
                const approvalValue = formData[`is_${roleKey}`];
                if (approvalValue === 0 || !approvalValue || approvalValue === false)
                    return `Sent for revision by ${roleNames[roleId]}`;
            }
            return "Sent for revision";
        }

        const hierarchy = approvalHierarchy[formNumber];
        if (!hierarchy) return "Unknown approval process";
        let filteredHierarchy = [...hierarchy];

        if (formNumber === 4 || formNumber === 5) {
            if (userRoleId === 1) filteredHierarchy = [10, 1];
            else {
                const isDeanApproved = formData.is_dean === 1 || formData.is_dean === true;
                const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
                if (!isDeanApproved && !isAsdApproved)
                    return "Pending Dean OR Academic Service Director approval";
                filteredHierarchy = [1];
            }
        } else if (userRoleId === 1) {
            filteredHierarchy = hierarchy.filter((id) => id !== 9);
        }

        for (const roleId of filteredHierarchy) {
            const roleKey = getRoleApprovalKey(roleId);
            const approvalValue = formData[`is_${roleKey}`];
            if (approvalValue === 0 || !approvalValue || approvalValue === false)
                return `Pending ${roleNames[roleId]} approval`;
        }
        return "Fully approved";
    };

    // Get all Form 14 data from activity (multiple reports)
    const getAllForm14Data = (event) => {
        const form14Reports = [];
        if (event.activity && event.activity.length > 0) {
            event.activity.forEach((activityItem) => {
                if (activityItem.form14 && activityItem.form14.length > 0) {
                    // Return all Form 14 reports for this activity
                    activityItem.form14.forEach((form14Report, index) => {
                        form14Reports.push({
                            ...form14Report,
                            activity_id: activityItem.id,
                            activity_data: activityItem,
                            activity_name: activityItem.name, // Include activity name
                            report_index: index + 1 // To identify which report this is
                        });
                    });
                }
            });
        }
        return form14Reports;
    };

    const getFilledForms = (event) => {
        const filledForms = [];
        const userRoleId = currentUserRoleId;

        // Check regular forms (1-13)
        for (let i = 1; i <= 13; i++) {
            const formKey = `form${i}`;
            if (event[formKey] && event[formKey].length > 0) {
                const formData = event[formKey][0];
                const currentApprover = getCurrentApprover(formData, i, userRoleId, event);
                
                // Only add form if it should be shown to current user
                if (currentApprover !== "") {
                    filledForms.push({
                        name: `Form ${i}`,
                        status: currentApprover,
                        formKey: formKey,
                        formNumber: i,
                        formData: formData,
                        isActivityForm: false
                    });
                }
            }
        }

        // Check Form 14 (nested in activity) - handle multiple reports
        // DON'T show Form 14 if event_status_id is 7
        if (event.event_status_id !== 7) {
            const form14Reports = getAllForm14Data(event);
            form14Reports.forEach((form14Data) => {
                const currentApprover = getCurrentApprover(form14Data, 14, userRoleId, event);
                
                // Only add form if it should be shown to current user
                if (currentApprover !== "") {
                    filledForms.push({
                        name: `Form 14 - ${form14Data.activity_name || 'Activity Report'}`, // Use activity name instead of report number
                        status: currentApprover,
                        formKey: 'form14',
                        formNumber: 14,
                        formData: form14Data,
                        isActivityForm: true,
                        activity: form14Data.activity_data,
                        activity_id: form14Data.activity_id,
                        activity_name: form14Data.activity_name,
                        report_index: form14Data.report_index
                    });
                }
            });
        }

        return filledForms;
    };

    const getStatusSeverity = (status) => {
        if (status.includes("Pending")) return "warning";
        if (status.includes("revision") || status.includes("revised")) return "danger";
        if (status.includes("Fully")) return "success";
        return "info";
    };

    const handleViewForm = (event, form) => {
        if (form.formNumber === 14 || form.isActivityForm) {
            // Navigate to Form 14 view-report page with the required data
            const activity = form.activity;
            const form14Data = form.formData;
            
            if (activity && form14Data && form14Data.form14_id) {
                navigate("/view-report", { 
                    state: { 
                        activity: event,
                        report: form14Data, // The specific Form 14 report data
                        creator_id: event.user_id // The event creator's ID
                    }
                });
            } else {
                console.error("Form 14 data incomplete for navigation", { 
                    activity: activity, 
                    form14Data: form14Data,
                    hasForm14Id: form14Data?.form14_id 
                });
                // Fallback navigation if Form 14 data is missing
                navigate("/event/activities", { 
                    state: { 
                        activities_id: activity?.id,
                        creator_id: event.user_id,
                        data: activity,
                        event: event
                    }
                });
            }
        } else {
            const formCode = `NUB-ACD-CMX-F-${String(form.formNumber).padStart(3, '0')}`;
            navigate(`/event/form/detail/${SetFormCodeNavigate(formCode)}`, {
                state: {
                    event: event,
                    owner: event?.user,
                    data: event?.[form.formKey] ?? [],
                }
            });
        }
    };

    // Handle navigation to form selection based on model_id (same as in View component)
    const handleFormNavigation = (rowData) => {
        if (rowData.model_id === 1) navigate("/event/form/outreach", { state: { event: rowData } });
        if (rowData.model_id === 2) navigate("/event/form/project", { state: { event: rowData } });
        if (rowData.model_id === 3) navigate("/event/form/program", { state: { event: rowData } });
        if (rowData.model_id === 4) navigate("/event/form/emergency", { state: { event: rowData } });
    };

    // Check if all forms in an event are fully approved
    const areAllFormsApproved = (filledForms) => {
        return filledForms.length > 0 && filledForms.every(form => form.status === "Fully approved");
    };

    // Filter events to only include those with filled forms that should be shown to current user
    const eventsWithFilledForms = eventList.filter(event => {
        const filledForms = getFilledForms(event);
        return filledForms.length > 0;
    });

    return (
        <div className="form-progress-main flex flex-col gap-5 p-5">
            <Card
                title="Event Form Approval Report"
                className="shadow-2 border-round-2xl bg-white"
            >
                <div className="w-full flex flex-wrap gap-4 justify-center">
                    {eventsWithFilledForms.length === 0 ? (
                        <p className="text-gray-500 text-sm">No forms submitted</p>
                    ) : (
                        eventsWithFilledForms.map((event) => {
                            const filledForms = getFilledForms(event);
                            // Filter to only show forms that are NOT fully approved
                            const pendingForms = filledForms.filter(form => form.status !== "Fully approved");
                            const allFormsApproved = areAllFormsApproved(filledForms);

                            return (
                                <Card
                                    key={event.id}
                                    title={event.name}
                                    subTitle={`Leader: ${event.user?.firstname} ${event.user?.lastname}`}
                                    className="shadow-3 border-round-xl w-80 md:w-96 hover:shadow-4 transition-all"
                                >
                                    <Divider className="my-0" />
                                    <div className="space-y-3 mt-2">
                                        {allFormsApproved ? (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <i className="pi pi-check-circle text-4xl text-green-500 mb-2"></i>
                                                <span className="text-green-600 font-semibold text-sm">
                                                    All submitted forms have been approved
                                                </span>
                                            </div>
                                        ) : pendingForms.length > 0 ? (
                                            // Show only pending forms
                                            pendingForms.map((form, index) => (
                                                <div key={`${form.formNumber}-${form.activity_id}-${form.report_index || index}`} className="flex flex-col text-sm mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-gray-700">{form.name}</span>
                                                        <Button
                                                            label="View"
                                                            icon="pi pi-eye"
                                                            className="p-button-outlined p-button-sm"
                                                            onClick={() => handleViewForm(event, form)}
                                                        />
                                                    </div>
                                                    <Tag
                                                        value={form.status}
                                                        severity={getStatusSeverity(form.status)}
                                                        rounded
                                                        className="text-xs py-1 px-3 self-start mt-1"
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            // This case should not normally happen, but as a fallback
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <span className="text-gray-500 text-sm">
                                                    No forms needing approval
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Centered View Button for Form Navigation */}
                                    <div className="flex justify-center mt-3">
                                        <Button
                                            label="Go to Forms"
                                            icon="pi pi-file-edit"
                                            className="p-button-outlined p-button-sm"
                                            onClick={() => handleFormNavigation(event)}
                                        />
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
};