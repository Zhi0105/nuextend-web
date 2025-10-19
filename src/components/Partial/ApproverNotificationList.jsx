import React from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useNavigate } from "react-router-dom";
import { SetFormCodeNavigate } from "@_src/utils/helpers";

export const ApproverNotificationList = ({ eventList = [], currentUserRoleId, currentUserDepartmentId, visible, onHide }) => {
    const navigate = useNavigate();
    
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
    
    const handleFormNavigation = (rowData) => {
        if (rowData.model_id === 1) navigate("/event/form/outreach", { state: { event: rowData } });
        if (rowData.model_id === 2) navigate("/event/form/project", { state: { event: rowData } });
        if (rowData.model_id === 3) navigate("/event/form/program", { state: { event: rowData } });
        if (rowData.model_id === 4) navigate("/event/form/emergency", { state: { event: rowData } });
        onHide(); // Close modal after navigation
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
    // eslint-disable-next-line no-unused-vars
    const shouldDeanSeeForm = (event, formData, formNumber) => {
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

    // Check if current user needs to approve a specific form
    const needsMyApproval = (formData, formNumber, event) => {
        // Special handling for Form 14
        if (formNumber === 14) {
            // DON'T show Form 14 if event_status_id is 7
            if (event.event_status_id === 7) return false;

            const isComexApproved = formData.is_commex === 1 || formData.is_commex === true;
            const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
            
            if (currentUserRoleId === 1) { // Comex
                return !isComexApproved;
            } else if (currentUserRoleId === 10) { // Academic Service Director
                return isComexApproved && !isAsdApproved;
            }
            return false;
        }

        const hierarchy = approvalHierarchy[formNumber];
        if (!hierarchy) return false;

        const eventCreatorRoleId = event.user?.role_id;
        
        // If event creator is Comex (role_id: 1), skip Dean approval
        let filteredHierarchy = [...hierarchy];
        if (eventCreatorRoleId === 1) {
            filteredHierarchy = hierarchy.filter(roleId => roleId !== 9);
        }

        // Special handling for forms 4 and 5 with OR logic
        if (formNumber === 4 || formNumber === 5) {
            if (currentUserRoleId === 9) { // Dean
                // Check department-based visibility for Dean
                if (!shouldDeanSeeForm(event, formData, formNumber)) return false;
                
                const isDeanApproved = formData.is_dean === 1 || formData.is_dean === true;
                // Only show to Dean if Dean hasn't approved AND ASD also hasn't approved
                const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
                return !isDeanApproved && !isAsdApproved;
            }
            if (currentUserRoleId === 10) { // ASD
                const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
                // Only show to ASD if ASD hasn't approved AND Dean also hasn't approved
                const isDeanApproved = formData.is_dean === 1 || formData.is_dean === true;
                return !isAsdApproved && !isDeanApproved;
            }
            if (currentUserRoleId === 1) { // Comex
                // Comex approves after at least one of Dean or ASD has approved
                const isDeanApproved = formData.is_dean === 1 || formData.is_dean === true;
                const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
                const isComexApproved = formData.is_commex === 1 || formData.is_commex === true;
                
                return (isDeanApproved || isAsdApproved) && !isComexApproved;
            }
            return false;
        }

        // For regular approval flow (forms 1-3, 6-13)
        for (const roleId of filteredHierarchy) {
            const roleKey = getRoleApprovalKey(roleId);
            const approvalValue = formData[`is_${roleKey}`];
            
            // If this role hasn't approved yet
            if (approvalValue === 0 || !approvalValue || approvalValue === false) {
                // If it's my role, I need to approve it
                if (roleId === currentUserRoleId) {
                    // Special department check for Dean
                    if (roleId === 9 && !shouldDeanSeeForm(event, formData, formNumber)) {
                        return false;
                    }
                    return true;
                }
                // If someone else needs to approve first, I don't need to approve yet
                return false;
            }
        }
        return false;
    };

    // Get forms that need current user's approval
    const getFormsNeedingMyApproval = (event) => {
        const formsNeedingApproval = [];

        // Check regular forms (1-13)
        for (let i = 1; i <= 13; i++) {
            const formKey = `form${i}`;
            if (event[formKey] && event[formKey].length > 0) {
                const formData = event[formKey][0];
                
                if (needsMyApproval(formData, i, event)) {
                    formsNeedingApproval.push({
                        name: `Form ${i}`,
                        formKey: formKey,
                        formNumber: i,
                        formData: formData,
                        event: event,
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
                if (needsMyApproval(form14Data, 14, event)) {
                    formsNeedingApproval.push({
                        name: `Form 14 - ${form14Data.activity_name || 'Activity Report'}`,
                        formKey: 'form14',
                        formNumber: 14,
                        formData: form14Data,
                        event: event,
                        isActivityForm: true,
                        activity: form14Data.activity_data,
                        activity_id: form14Data.activity_id,
                        activity_name: form14Data.activity_name,
                        report_index: form14Data.report_index
                    });
                }
            });
        }

        return formsNeedingApproval;
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
                        creator_id: event.user_id, // The event creator's ID
                        isApprovalView: true // Flag to indicate this is an approval view
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
                        event: event,
                        isApprovalView: true
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
                    isApprovalView: true // Flag to indicate this is an approval view
                }
            });
        }
        onHide(); // Close modal after navigation
    };

    const getApprovalStatus = (formData, formNumber, event) => {
        // Special handling for Form 14
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
        // Check for revision and update status first
        if (formData.is_revised === true || formData.is_revised === 1) {
            return "Has been sent for revision";
        }
        
        if (formData.is_updated === true || formData.is_updated === 1) {
            return "Form has been revised/updated";
        }

        const hierarchy = approvalHierarchy[formNumber];
        if (!hierarchy) return "Unknown approval process";

        const eventCreatorRoleId = event.user?.role_id;
        
        // If event creator is Comex, skip Dean approval
        let filteredHierarchy = [...hierarchy];
        if (eventCreatorRoleId === 1) {
            filteredHierarchy = hierarchy.filter(roleId => roleId !== 9);
        }

        // Special handling for forms 4 and 5
        if (formNumber === 4 || formNumber === 5) {
            const isDeanApproved = formData.is_dean === 1 || formData.is_dean === true;
            const isAsdApproved = formData.is_asd === 1 || formData.is_asd === true;
            const isComexApproved = formData.is_commex === 1 || formData.is_commex === true;

            if (!isDeanApproved && !isAsdApproved) {
                return "Pending Dean OR Academic Service Director approval";
            } else if (isDeanApproved && !isAsdApproved) {
                return "Pending Academic Service Director approval";
            } else if (isAsdApproved && !isDeanApproved) {
                return "Pending Dean approval";
            } else if (!isComexApproved) {
                return "Pending Comex approval";
            }
            return "Fully approved";
        }

        // Regular approval flow for other forms
        for (const roleId of filteredHierarchy) {
            const roleKey = getRoleApprovalKey(roleId);
            const approvalValue = formData[`is_${roleKey}`];
            
            if (approvalValue === 0 || !approvalValue || approvalValue === false) {
                return `Pending ${roleNames[roleId]} approval`;
            }
        }
        
        return "Fully approved";
    };

    // Get status severity for tags
    const getStatusSeverity = (status) => {
        if (status.includes("Pending")) return "warning";
        if (status.includes("revision") || status.includes("revised")) return "danger";
        if (status.includes("Fully")) return "success";
        return "info";
    };

    // Filter events to only include those with forms needing current user's approval
    const eventsNeedingApproval = eventList.filter(event => {
        const formsNeedingApproval = getFormsNeedingMyApproval(event);
        return formsNeedingApproval.length > 0;
    });

    const dialogFooter = (
        <div>
            <Button 
                label="Close" 
                icon="pi pi-times" 
                onClick={onHide} 
                className="p-button-text" 
            />
        </div>
    );

    return (
        <Dialog 
            header={`Forms Waiting for Your Approval`}
            visible={visible} 
            style={{ width: '90vw', maxWidth: '1200px' }}
            maximizable
            modal 
            className="p-fluid"
            footer={dialogFooter}
            onHide={onHide}
        >
            <div className="approver-notification-main">
                <div className="mb-4">
                    <p className="text-gray-600 m-0">
                        You have {eventsNeedingApproval.length} event(s) with forms requiring your approval
                    </p>
                </div>
                
                <div className="w-full flex flex-wrap gap-4 justify-center max-h-96 overflow-y-auto">
                    {eventsNeedingApproval.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 w-full">
                            <i className="pi pi-check-circle text-4xl text-green-500 mb-3"></i>
                            <p className="text-green-600 font-semibold text-lg">All Clear!</p>
                            <p className="text-gray-500 text-sm mt-2">No forms require your approval at this time.</p>
                        </div>
                    ) : (
                        eventsNeedingApproval.map((event) => {
                            const formsNeedingApproval = getFormsNeedingMyApproval(event);

                            return (
                                <Card
                                    key={event.id}
                                    title={event.name}
                                    subTitle={
                                        <div>
                                            Submitted by: {event.user?.firstname} {event.user?.lastname} 
                                        </div>
                                    }
                                    className="shadow-2 border-round-xl w-80 md:w-96 hover:shadow-4 transition-all border-left-3 border-blue-500"
                                >
                                    <Divider className="my-0" />
                                    <div className="space-y-3 mt-2">
                                        {formsNeedingApproval.map((form, index) => (
                                            <div key={`${form.formNumber}-${form.activity_id}-${form.report_index || index}`} className="flex flex-col text-sm mb-3 p-2 bg-blue-50 border-round-md">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-extrabold text-gray-700">{form.name}</span>
                                                    <Button
                                                        label="Review & Approve"
                                                        icon="pi pi-eye"
                                                        className="p-button-primary p-button-sm"
                                                        onClick={() => handleViewForm(event, form)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Tag
                                                        value="Action Required"
                                                        severity={getStatusSeverity(getApprovalStatus(form.formData, form.formNumber, event))}
                                                        rounded
                                                        className="text-xs py-1 px-3 self-start"
                                                    />
                                                    <span className="text-xs text-gray-600">
                                                        Current status: {getApprovalStatus(form.formData, form.formNumber, event)}
                                                    </span>
                                                    <span className="text-xs text-blue-600 font-semibold">
                                                        ✓ Your approval needed as {roleNames[currentUserRoleId]}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-3 pt-2 border-top-1 border-gray-200">
                                        <span className="text-xs text-gray-500">
                                            {formsNeedingApproval.length} form(s) need your attention
                                        </span>
                                        <Button
                                            label="View All Event Forms"
                                            icon="pi pi-list"
                                            className="p-button-outlined p-button-sm"
                                            onClick={() => handleFormNavigation(event)}
                                        />
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </Dialog>
    );
};