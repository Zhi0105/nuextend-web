import { EventContext } from "@_src/contexts/EventContext";
import { useLocation } from "react-router-dom"
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from 'primereact/card';
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { Tag } from 'primereact/tag';

export const Detail = () => {
    const location = useLocation();
    const event = location.state
    console.log(event);
    
    const pesoFormat = (value) => {
        if (value == null) return "—";
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(value);
    };

    const setFullname = (firstname, lastname, middlename) => {
        return `${lastname}, ${firstname} ${middlename}`
    }

    // Format date to display month names
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid date
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString; // Return original if parsing fails
        }
    };

    // Count Form14 entries across all activities
    const countForm14Entries = () => {
        if (!event?.activity) return 0;
        
        let totalForm14Count = 0;
        event.activity.forEach(activity => {
            if (activity.form14 && Array.isArray(activity.form14)) {
                totalForm14Count += activity.form14.length;
            }
        });
        
        return totalForm14Count;
    };

    // Define model-specific form requirements including Form14
    const getModelForms = () => {
        const modelId = event?.model_id;
        const baseForms = [];
        
        switch(modelId) {
            case 1: // Outreach Project
                baseForms.push('form3', 'form5', 'form7', 'form8', 'form11', 'form12', 'form10');
                break;
            case 2: // Project
                baseForms.push('form2', 'form5', 'form7', 'form8', 'form11', 'form12', 'form10');
                break;
            case 3: // Program
                baseForms.push('form1', 'form4', 'form6', 'form8', 'form11', 'form12', 'form9');
                break;
            default:
                return []; // Return empty array for unknown models
        }
        
        // Add Form14 to the required forms
        baseForms.push('form14');
        return baseForms;
    };

    // Get form labels for display
    const getFormLabel = (formKey) => {
        const formLabels = {
            'form1': 'Form 1',
            'form2': 'Form 2', 
            'form3': 'Form 3',
            'form4': 'Form 4',
            'form5': 'Form 5',
            'form6': 'Form 6',
            'form7': 'Form 7',
            'form8': 'Form 8',
            'form9': 'Form 9',
            'form10': 'Form 10',
            'form11': 'Form 11',
            'form12': 'Form 12',
            'form14': 'Form 14'
        };
        return formLabels[formKey] || formKey;
    };

    // Check if form is completed
    const isFormCompleted = (formKey) => {
        if (formKey === 'form14') {
            // Form14 is considered completed if there's at least one entry across all activities
            return countForm14Entries() > 0;
        } else {
            // Regular forms
            return event?.[formKey] && 
                   Array.isArray(event[formKey]) && 
                   event[formKey].length > 0;
        }
    };

    // Count completed forms for the specific model
    const countCompletedForms = () => {
        const requiredForms = getModelForms();
        
        return requiredForms.filter(formField => 
            isFormCompleted(formField)
        ).length;
    };

    const completedFormsCount = countCompletedForms();
    const requiredForms = getModelForms();
    const totalForms = requiredForms.length;
    const form14Count = countForm14Entries();

    // Get model name for display
    const getModelName = () => {
        const modelId = event?.model_id;
        switch(modelId) {
            case 1: return 'Outreach Project';
            case 2: return 'Project';
            case 3: return 'Program';
            default: return 'Unknown Model';
        }
    };

    return (
        <div className="view-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <Card title="Event Details:" className="w-[80%] my-4">
                <div className="w-full flex flex-col gap-6">
                    {/* Basic Event Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex gap-2">
                            <h1 className="font-bold">Event Type:</h1>
                            <p className="capitalize">{event?.eventtype.name}</p>
                        </div>
                        <div className="flex gap-2"> 
                            <h1 className="font-bold">Model:</h1>
                            <p className="capitalize">{getModelName()} (ID: {event?.model_id})</p>
                        </div>
                        <div className="flex gap-2">
                            <h1 className="font-bold">Budget Proposal:</h1>
                            <p className="capitalize">{pesoFormat(event?.budget_proposal)}</p>
                        </div>
                        <div className="flex gap-2">
                            <h1 className="font-bold">Created By:</h1>
                            <p className="capitalize">{setFullname(event?.user.firstname, event?.user.lastname, event?.user.middlename)}</p>
                        </div>
                        <div className="flex gap-2">
                            <h1 className="font-bold">Event start date:</h1>
                            <p className="capitalize">{formatDate(event?.implement_date)}</p>
                        </div>
                        <div className="flex gap-2">
                            <h1 className="font-bold">Location:</h1>
                            <p className="capitalize">{event?.location}</p>
                        </div>
                        <div className="flex gap-2">
                            <h1 className="font-bold">Status:</h1>
                            <Tag 
                                value={event?.eventstatus.name} 
                                severity={
                                    event?.eventstatus.name === 'completed' ? 'success' : 
                                    event?.eventstatus.name === 'ongoing' ? 'warning' : 'info'
                                } 
                            />
                        </div>
                        <div className="flex gap-2">
                            <h1 className="font-bold">Forms Completed:</h1>
                            <p>{completedFormsCount} / {totalForms}</p>
                        </div>
                    </div>

                    {/* Forms Progress */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h1 className="font-bold">Required Forms for {getModelName()}:</h1>
                            <Tag 
                                value={`${completedFormsCount}/${totalForms} Completed`}
                                severity={
                                    completedFormsCount === totalForms ? 'success' :
                                    completedFormsCount > 0 ? 'warning' : 'danger'
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {requiredForms.map((formKey, index) => {
                                const isCompleted = isFormCompleted(formKey);
                                const isForm14 = formKey === 'form14';
                                
                                return (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                                        <Tag 
                                            value={getFormLabel(formKey)} 
                                            severity={isCompleted ? 'success' : 'danger'}
                                        />
                                        <span className="text-sm">
                                            {isCompleted ? '✓' : '✗'}
                                        </span>
                                        {isForm14 && isCompleted && (
                                            <span className="text-xs text-gray-500">
                                                ({form14Count} entries)
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Form Details */}
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Form Details:</h3>
                            <div className="space-y-2">
                                {requiredForms.map((formKey, index) => {
                                    const isCompleted = isFormCompleted(formKey);
                                    const isForm14 = formKey === 'form14';
                                    
                                    return (
                                        <div key={index} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold">{getFormLabel(formKey)}</h4>
                                                <Tag 
                                                    value={isCompleted ? 'Completed' : 'Pending'}
                                                    severity={isCompleted ? 'success' : 'danger'}
                                                />
                                            </div>
                                            {isCompleted && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    {isForm14 ? (
                                                        <>
                                                            <p><strong>Total Entries:</strong> {form14Count}</p>
                                                            <p><strong>Activities with Form14:</strong> {
                                                                event?.activity?.filter(activity => 
                                                                    activity.form14 && activity.form14.length > 0
                                                                ).length || 0
                                                            }</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p><strong>Entries:</strong> {event[formKey].length}</p>
                                                            <p><strong>Last Updated:</strong> {formatDate(event[formKey][0]?.updated_at) || 'N/A'}</p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Event Members */}
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">Event Members ({event?.eventmember?.length || 0}):</h1>
                        {event?.eventmember && event.eventmember.length > 0 ? (
                            <div className="border rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {event.eventmember.map((member, index) => (
                                        <div key={index} className="border-b pb-2 last:border-b-0">
                                            <p className="font-semibold">
                                                {setFullname(
                                                    member.user?.firstname, 
                                                    member.user?.lastname, 
                                                    member.user?.middlename
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Role: {member.role || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Department: {member.user?.department?.initial || 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No event members assigned</p>
                        )}
                    </div>

                    {/* Participants */}
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">Participants ({event?.participants?.length || 0}):</h1>
                        {event?.participants && event.participants.length > 0 ? (
                            <div className="border rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {event.participants.map((participant, index) => (
                                        <div key={index} className="border-b pb-2 last:border-b-0">
                                            <p className="font-semibold">
                                                {setFullname(
                                                    participant.firstname, 
                                                    participant.lastname, 
                                                    participant.middlename
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Email: {participant.email || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Contact: {participant.contact_no || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Organization: {participant.organization || 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No participants registered</p>
                        )}
                    </div>

                    {/* Activities */}
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">Activities ({event?.activity?.length || 0}):</h1>
                        {event?.activity && event.activity.length > 0 ? (
                            <div className="border rounded-lg p-4">
                                {event.activity.map((activity, index) => (
                                    <div key={index} className="border-b pb-4 mb-4 last:border-b-0 last:mb-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{activity.name}</h3>
                                                <p className="text-gray-600">{activity.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm">
                                                    <span className="font-semibold">Start:</span> {formatDate(activity.start_date)}
                                                </p>
                                                <p className="text-sm">
                                                    <span className="font-semibold">End:</span> {formatDate(activity.end_date)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm mt-2">
                                            <span className="font-semibold">Address:</span> {activity.address}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-semibold">Created:</span> {formatDate(activity.created_at)}
                                        </p>
                                        
                                        {/* Form14 for this activity */}
                                        <div className="mt-3">
                                            <h4 className="font-semibold mb-2">
                                                Form14 Data ({activity.form14?.length || 0}):
                                            </h4>
                                            {activity.form14 && activity.form14.length > 0 ? (
                                                <div className="bg-gray-50 p-3 rounded">
                                                    {activity.form14.map((form14, formIndex) => (
                                                        <div key={formIndex} className="mb-2 last:mb-0">
                                                            <p className="text-sm">
                                                                <span className="font-semibold">Activity:</span> {form14.activity_name}
                                                            </p>
                                                            <p className="text-sm">
                                                                <span className="font-semibold">Description:</span> {form14.description}
                                                            </p>
                                                            <p className="text-sm">
                                                                <span className="font-semibold">Budget:</span> {pesoFormat(form14.budget)}
                                                            </p>
                                                            <p className="text-sm">
                                                                <span className="font-semibold">Created:</span> {formatDate(form14.created_at)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">No Form14 data available</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No activities scheduled</p>
                        )}
                    </div>

                    {/* Skills */}
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">Event Skills List:</h1>
                        <ul className="indent-12">
                            {event?.skills && event.skills.length > 0 ? (
                                event.skills.map((skill, index) => (
                                    <li key={index}>- {skill.name}</li>
                                ))
                            ) : (
                                <li className="text-gray-500">No skills listed</li>
                            )}
                        </ul>
                    </div>

                    {/* UNSDG Skills */}
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">UNSDG Skills List:</h1>
                        <ul className="indent-12">
                            {event?.unsdgs && event.unsdgs.length > 0 ? (
                                event.unsdgs.map((unsdg, index) => (
                                    <li key={index}>- {unsdg.name}</li>
                                ))
                            ) : (
                                <li className="text-gray-500">No UNSDG skills listed</li>
                            )}
                        </ul>
                    </div>

                    {/* Organization */}
                    <div className="flex gap-2">
                        <h1 className="font-bold">Owned By:</h1>
                        <p className="capitalize">
                            {event?.organization?.name ? (
                                event.organization.name
                            ) : (
                                setFullname(event?.user.firstname, event?.user.lastname, event?.user.middlename)
                            )}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    )
}