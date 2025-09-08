import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";

export const ReportForm = ({
    reports = [],
    reportKeys = [],
    onRemove,
    onChange
}) => {


    if(!reports?.length) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-gray-400">No Report yet. add new ? </h1>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {reports.map((report, index) => (
                <div
                    key={reportKeys[index] ?? index}
                    className="flex gap-4 px-2 pr-4 items-start  rounded-lg p-4"
                >
                    <div className="w-full flex flex-col gap-4">
                        <InputText
                            value={report?.name ?? ""}
                            onChange={(e) => onChange(index, "name", e.target.value)}
                            name="name"
                            type="text"
                            id={`name-${index}`}
                            placeholder="Enter report name"
                            className="bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5"
                        />

                        <Calendar
                            className="w-full"
                            inputClassName="w-full"
                            value={report?.date ?? null}
                            onChange={(e) => onChange(index, "date", e.value)}
                            readOnlyInput
                            hideOnRangeSelection
                            placeholder="Please select report date"
                            showIcon
                        />

                            {/* Basic file input; wire this up as needed in your uploader */}
                        <input
                            type="file"
                            onChange={(e) => onChange(index, "file", e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-gray-700
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-md file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-gray-100 file:text-gray-700
                                        hover:file:bg-gray-200"
                        />

                    <InputNumber
                        value={report?.budget ?? null}
                        onValueChange={(e) => onChange(index, "budget", e.value ?? null)}
                        mode="currency"
                        currency="PHP"
                        locale="en-PH"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        min={0}
                        placeholder="₱0.00"
                        inputClassName="px-4 py-1 border border-gray-400"
                        className="bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5"
                        inputId={`budget-${index}`}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-[28px] text-[#f86c6b] cursor-pointer"
                        aria-label="Remove report"
                        title="Remove report"
                    >
                        –
                    </button>
                </div>
            ))}
        </div>
    )
}
