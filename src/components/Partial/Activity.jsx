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


    if(modelId !== 3) {
        return (
            <div className="flex flex-col gap-4">
                {activities?.map((activity, index) => (
                    <div key={activityKeys[index] ?? index} className="flex gap-4 px-2 pr-4 items-center">
                        <div className="w-full flex flex-col gap-4 mb-8">
                        
                            <InputText
                                value={activity?.name ?? ""}
                                onChange={(e) => onChange(index, "name", e.target.value)}
                                name="name"
                                type="text"
                                id="name"
                                placeholder="Enter your activity name"
                                className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                            />

                            <InputText
                                value={activity?.address ?? ""}
                                onChange={(e) => onChange(index, "address", e.target.value)}
                                name="Address"
                                type="text"
                                id="Address"
                                placeholder="Enter your activity location"
                                className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                            />

                            <InputTextarea
                                className={` bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="description"
                                value={activity?.description ?? ""}
                                onChange={(e) => onChange(index, "description", e.target.value)}
                                rows={4}
                                placeholder="Enter your activity description"
                            />
                            <Calendar
                                className="w-full" 
                                inputClassName="w-full"           
                                value={activity.duration}
                                onChange={(e) => onChange(index, "duration", e.value)}
                                selectionMode="range"
                                readOnlyInput
                                hideOnRangeSelection
                                placeholder="please select activity dates"
                            />
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
                    
                        <InputText
                            value={activity?.name ?? ""}
                            onChange={(e) => onChange(index, "name", e.target.value)}
                            name="name"
                            type="text"
                            id="name"
                            placeholder="Enter your activity name"
                            className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />

                        <InputText
                            value={activity?.address ?? ""}
                            onChange={(e) => onChange(index, "address", e.target.value)}
                            name="Address"
                            type="text"
                            id="Address"
                            placeholder="Enter your activity location"
                            className={`bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                        />

                        <InputTextarea
                            className={` bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                            name="description"
                            value={activity?.description ?? ""}
                            onChange={(e) => onChange(index, "description", e.target.value)}
                            rows={4}
                            placeholder="Enter your activity description"
                        />
                        <Calendar
                            className="w-full" 
                            inputClassName="w-full"           
                            value={activity.duration}
                            onChange={(e) => onChange(index, "duration", e.value)}
                            selectionMode="range"
                            readOnlyInput
                            hideOnRangeSelection
                            placeholder="please select activity dates"
                        />
                    </div>
                    <span onClick={() => onRemove(index)} className="text-[25px] text-[#f86c6b] cursor-pointer">
                    -
                    </span>
                </div>
            ))}
        </div>
    )
}
