import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";

export const Activity = ({
    modelId,
    activities = [],
    activityKeys = [],
    onRemove,
    onChange
}) => {
    const getDisabledDates = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const fourWeeksLater = new Date();
        fourWeeksLater.setDate(today.getDate() + 28);
        fourWeeksLater.setHours(23, 59, 59, 999);
        
        const disabledDates = [];
        const currentDate = new Date(today);
        
        while (currentDate <= fourWeeksLater) {
            disabledDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return disabledDates;
    };

    const getAllSelectedDates = (currentIndex) => {
        const selectedDates = [];
        
        activities.forEach((activity, index) => {
            if (index !== currentIndex && activity.duration) {
                const [start, end] = activity.duration;
                if (start && end) {
                    const startDate = new Date(start);
                    const endDate = new Date(end);
                    const current = new Date(startDate);
                    
                    while (current <= endDate) {
                        selectedDates.push(new Date(current));
                        current.setDate(current.getDate() + 1);
                    }
                }
            }
        });
        
        return selectedDates;
    };

    const getMinDate = () => {
        const disabledDates = getDisabledDates();
        const minSelectableDate = new Date(disabledDates[disabledDates.length - 1]);
        minSelectableDate.setDate(minSelectableDate.getDate() + 1);
        return minSelectableDate;
    };

    if(modelId !== 3) {
        return (
            <div className="flex flex-col gap-4">
                {activities?.map((activity, index) => (
                    <div key={activityKeys[index] ?? index} className="flex gap-4 px-2 pr-4 items-center">
                        <div className="w-full flex flex-col gap-4 mb-8">
                            {/* Activity Name */}
                            <div>
                                <label htmlFor={`activity-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Activity Name
                                </label>
                                <InputText
                                    value={activity?.name ?? ""}
                                    onChange={(e) => onChange(index, "name", e.target.value)}
                                    name="name"
                                    type="text"
                                    id={`activity-name-${index}`}
                                    placeholder="Enter your activity name"
                                    className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                />
                            </div>

                            {/* Activity Location */}
                            <div>
                                <label htmlFor={`activity-address-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Activity Location
                                </label>
                                <InputText
                                    value={activity?.address ?? ""}
                                    onChange={(e) => onChange(index, "address", e.target.value)}
                                    name="Address"
                                    type="text"
                                    id={`activity-address-${index}`}
                                    placeholder="Enter your activity location"
                                    className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                />
                            </div>

                            {/* Activity Description */}
                            <div>
                                <label htmlFor={`activity-description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Activity Description
                                </label>
                                <InputTextarea
                                    className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                    name="description"
                                    id={`activity-description-${index}`}
                                    value={activity?.description ?? ""}
                                    onChange={(e) => onChange(index, "description", e.target.value)}
                                    rows={4}
                                    placeholder="Enter your activity description"
                                />
                            </div>
                            
                            {/* Activity Dates */}
                            <div className="activity-dates">
                                <label htmlFor={`activity-dates-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Activity Dates
                                </label>
                                <Calendar
                                    id={`activity-dates-${index}`}
                                    className="w-full" 
                                    inputClassName="w-full"           
                                    value={activity.duration}
                                    onChange={(e) => onChange(index, "duration", e.value)}
                                    selectionMode="range"
                                    readOnlyInput
                                    hideOnRangeSelection
                                    placeholder="Select activity dates"
                                    disabledDates={[...getDisabledDates(), ...getAllSelectedDates(index)]}
                                    minDate={getMinDate()}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Select the start and end date for this activity
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if(!activities?.length) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-gray-400">No activity yet. add new ? </h1>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {activities?.map((activity, index) => (
                <div key={activityKeys[index] ?? index} className="flex gap-4 px-2 pr-4 items-center">
                    <div className="w-full flex flex-col gap-4 mb-8">
                        {/* Activity Name */}
                        <div>
                            <label htmlFor={`activity-name-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Activity Name
                            </label>
                            <InputText
                                value={activity?.name ?? ""}
                                onChange={(e) => onChange(index, "name", e.target.value)}
                                name="name"
                                type="text"
                                id={`activity-name-${index}`}
                                placeholder="Enter your activity name"
                                className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                            />
                        </div>

                        {/* Activity Location */}
                        <div>
                            <label htmlFor={`activity-address-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Activity Location
                            </label>
                            <InputText
                                value={activity?.address ?? ""}
                                onChange={(e) => onChange(index, "address", e.target.value)}
                                name="Address"
                                type="text"
                                id={`activity-address-${index}`}
                                placeholder="Enter your activity location"
                                className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                            />
                        </div>

                        {/* Activity Description */}
                        <div>
                            <label htmlFor={`activity-description-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Activity Description
                            </label>
                            <InputTextarea
                                className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="description"
                                id={`activity-description-${index}`}
                                value={activity?.description ?? ""}
                                onChange={(e) => onChange(index, "description", e.target.value)}
                                rows={4}
                                placeholder="Enter your activity description"
                            />
                        </div>
                        
                        {/* Activity Dates */}
                        <div className="activity-dates">
                            <label htmlFor={`activity-dates-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                Activity Dates
                            </label>
                            <Calendar
                                id={`activity-dates-${index}`}
                                className="w-full" 
                                inputClassName="w-full"           
                                value={activity.duration}
                                onChange={(e) => onChange(index, "duration", e.value)}
                                selectionMode="range"
                                readOnlyInput
                                hideOnRangeSelection
                                placeholder="Select activity dates"
                                disabledDates={[...getDisabledDates(), ...getAllSelectedDates(index)]}
                                minDate={getMinDate()}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Select the start and end date for this activity
                            </p>
                        </div>
                    </div>
                    <span onClick={() => onRemove(index)} className="text-[25px] text-[#f86c6b] cursor-pointer">
                        -
                    </span>
                </div>
            ))}
    </div>
    )
}