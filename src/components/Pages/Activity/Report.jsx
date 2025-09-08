import { useCallback, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { useUserStore } from '@_src/store/auth'
import { Button } from "primereact/button"
import { useForm, Controller, useFieldArray  } from "react-hook-form";
import { ReportForm } from "@_src/components/Partial/ReportForm";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { DecryptString } from "@_src/utils/helpers";
import { getReports, removeReport, uploadReport } from "@_src/services/report";
import { toast } from "react-toastify";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BsTrash } from "react-icons/bs";
import { Tooltip } from "primereact/tooltip";
import _ from "lodash";
import dayjs from "dayjs";

export const Report = () => {
    const queryClient = useQueryClient()
    const location = useLocation()
    const data = location.state 
    const { token } = useUserStore((state) => ({  token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const [globalFilter, setGlobalFilter] = useState("");

    const { data: reportData, isLoading: reportLoading } = getReports({token: decryptedToken, activity: data?.id})

    const { handleSubmit, control, watch, setValue, reset } = useForm({
        defaultValues: {
            reports: []
        },
    });

    const { mutate: handleUploadReport, isLoading: uploadLoading } = useMutation({
        mutationFn: uploadReport,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            toast(data.message, { type: "success" })
            reset({
                reports: []
            })
        }, 
        onError: (error) => {  
            console.log("@UE:", error)
            toast(error.response.data.message, { type: "warning" })
        },
    });
    const { mutate: handleRemoveUploadedReport, isLoading: removeLoading } = useMutation({
        mutationFn: removeReport,
            onSuccess: (data) => {
                queryClient.invalidateQueries({ queryKey: ['reports'] });
                toast(data.message, { type: "success" })
            }, 
            onError: (error) => {  
                console.log("@RRE:", error)
            },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "reports" });
    const reportsValues = watch("reports") || [];
    const handleAddReport = useCallback(() => {
        append({ event_id: data?.event_id, activity_id: data?.id, name: "", file: null, date: null, budget: 0 })
    }, [append, data])
    const handleRemoveReport = useCallback((index) => {
        remove(index);
    }, [remove]);
    const handleReportChange = (index, key, value) => {
        setValue(`reports.${index}.${key}`, value, {
            shouldDirty: true,
            shouldValidate: true,
        });
    };
    const onSubmit = async (form) => {
        // 1) Format dates first
        const formattedReports = (form.reports || []).map((r) => ({
            ...r,
            date: r.date ? dayjs(r.date).format("MM-DD-YYYY") : "",
        }));

        handleUploadReport({
            token: decryptedToken,
            reports: [
                ...formattedReports
            ]
        })
    };



    const rows = useMemo(() => {
    // API shape looked like: { status: 200, data: [ { id, event_id, activity_id, name, file, date, budget, created_at, updated_at } ] }
    const arr = reportData?.data ?? [];
    return (Array.isArray(arr) ? arr : []).map((item, idx) => ({
        // stable key
        id: item?.id ?? idx,
        activity_id: item?.activity_id ?? "",
        event_id: item?.event_id ?? "",
        name: item?.name ?? "",
        date: item?.date ?? item?.created_at ?? "",
        budget: typeof item?.budget === "number" ? item.budget : Number(item?.budget ?? 0),
        file: item?.file ?? "",
        created_at: item?.created_at ?? "",
        updated_at: item?.updated_at ?? "",
    }));
    }, [reportData]);

    // optional: file link + budget format
    const fileBody = (row) =>
    row.file ? (
        <a href={`${import.meta.env.VITE_API_URL}${_.trimStart(row.file, '/')}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Download
        </a>
    ) : ("-");

    const budgetBody = (row) =>
    Number.isFinite(row.budget) ? row.budget.toLocaleString() : "-";

        
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <button 
                    disabled={removeLoading}
                    onClick={() => handleRemoveUploadedReport({
                        token: decryptedToken,
                        report_id: rowData?.id
                    })}
                >
                    <Tooltip target=".delete" content="Delete" position="right" />
                    <BsTrash className="delete w-7 h-7 text-[#364190]" />
                </button>
            </div>
        )
    }
    
    if(reportLoading) {
        return (
            <div className="report-main min-h-screen bg-white w-full flex flex-col  items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Loading reports...
            </div>
        )
    }

    return (
        <div className="report-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent flex flex-col gap-4 w-1/2 my-8"
            >
                <div>
                    <div className="w-full capitalize flex flex-col gap-2">
                        <ReportForm 
                            reports={reportsValues}
                            reportsKeys={fields.map(f => f.id)}
                            onRemove={handleRemoveReport}
                            onChange={handleReportChange}
                        />
                        <span
                            className="text-[25px] text-[#5b9bd1] cursor-pointer"
                            onClick={handleAddReport}
                        >
                        +
                        </span>
                    </div>
                    <div className="flex pt-4 justify-between">
                            
                        <Button
                            disabled={uploadLoading}
                            type="submit" 
                            className="w-full bg-[#2211cc] text-[#c7c430] px-4 py-2" 
                            label={uploadLoading ? "uploading..." : "submit"} 
                            iconPos="right" 
                        />
                    </div>
                </div>
            </form>  

            <div className="w-11/12 lg:w-9/12 mb-6">
                <div className="flex items-center gap-2 px-2 mb-3">
                    <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        className="text-sm p-2"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Search reports"
                    />
                    </span>
                </div>

                <DataTable
                    size="normal"
                    value={rows}
                    dataKey="id"
                    paginator
                    rows={10}
                    removableSort
                    emptyMessage="No reports found."
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reports"
                    // SAME API as your OutreachData:
                    globalFilter={globalFilter}
                    globalFilterFields={[
                    "name",
                    "date",
                    "budget",
                    "id",
                    "event_id",
                    "activity_id",
                    "file",
                    ]}
                >
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="id" header="ID" sortable />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Name" sortable />
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="date" header="Date" sortable />
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" field="budget" header="Budget" body={budgetBody} sortable />
                    <Column headerClassName="bg-[#364190] text-white" className="font-bold" header="File" body={fileBody} />
                    <Column headerClassName="bg-[#FCA712] text-white" className="font-bold" header="Action" body={actionBodyTemplate} />
                </DataTable>
            </div>
        </div>
    )
}
