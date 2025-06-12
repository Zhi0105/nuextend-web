import { Link, useLocation, useNavigate } from "react-router-dom"
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { getForms } from "@_src/services/event";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { approveForm, rejectForm } from "@_src/services/form";
import { eventPost } from "@_src/services/event";
import { toast } from "react-toastify"
import { Dialog } from 'primereact/dialog';
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import _ from "lodash";

export const FormList = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const data = location.state ;
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const isAdminRole = [1, 9, 10, 11].includes(decryptedUser?.role_id);
    const isForSubmitRole = [9, 10, 11].includes(decryptedUser?.role_id);
    const [visible, setVisible] = useState(false);
    const [approveVisible, setApproveVisible] = useState(false);

    const { data: formData, isLoading: formLoading, refetch, isFetching: fetchLoading } = getForms({token: decryptedToken, event: data.id})

    const { mutate: handleAcceptForm, isLoading: approveFormLoading } = useMutation({
        mutationFn: approveForm,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['form'] });
            toast(data.message, { type: "success" })
            setApproveVisible(false)
            refetch()
            }, 
        onError: (error) => {  
            console.log("@AFE:", error)
        },
    });
    const { mutate: handleRejectForm, isLoading: rejectFormLoading } = useMutation({
        mutationFn: rejectForm,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['form'] });
            toast(data.message, { type: "success" })
            setVisible(false)
            refetch()
            }, 
        onError: (error) => {
            setVisible(false)  
            console.log("@RFE:", error)
        },
    });
    const { mutate: handleEventpost, isLoading: eventPostLoading } = useMutation({
        mutationFn: eventPost,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['post-event'] });
            toast(data.message, { type: "success" })
            navigate("/admin/event/view")
            }, 
        onError: (error) => {  
            console.log("@EPE:", error)
        },
    });

    const handleAdminActionValidation = (data, role_id) => {
        if(role_id === 1 && data?.is_commex) { // commex
            return false
        }  
        if(role_id === 9 && data?.is_dean) { // DEAN
            return false
        }  
          if(role_id === 10 && data?.is_asd) { // ASD
            return false
        }  
          if(role_id === 11 && data?.is_ad) { // AD
            return false
        } 
        return true
    }
    const RejectDialog = ({ rowData }) => {
        const { handleSubmit, control, formState: { errors }} = useForm({
            defaultValues: {
                remarks: ""
            },
        });
        const onSubmit = (data) => {
            const remarksKeyByRole = {
                1: "commex_remarks",
                9: 'dean_remarks',
                10: 'asd_remarks',
                11: 'ad_remarks'
            };

            const remarksKey = remarksKeyByRole[decryptedUser?.role_id];

            if (remarksKey) {
                handleRejectForm({
                    token: decryptedToken,
                    id: rowData?.id,
                    role_id: decryptedUser?.role_id,
                    [remarksKey]: data?.remarks
                });
            }
        };

        return (
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent flex flex-col gap-4 w-full my-8"
            >
                <div className="remarks">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <InputTextarea
                                className={`${errors.remarks && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="description"
                                value={value} 
                                onChange={onChange}
                                rows={4}
                                placeholder="Enter your remarks here"
                            />
                        )}
                        name="remarks"
                    />
                    {errors.remarks && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            remarks is required.*
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    disabled={rejectFormLoading}
                    className="bg-[#2211cc] text-[#c7c430]  flex justify-center text-center font-bold rounded-lg p-2"
                >
                    Submit
                </Button>
            </form>
        )
    }
    const ApproveDialog = ({ rowData }) => {
        const { handleSubmit, control, formState: { errors }} = useForm({
            defaultValues: {
                remarks: ""
            },
        });
        const onSubmit = (data) => {
            const remarksKeyByRole = {
                1: "commex_remarks",
                9: 'dean_remarks',
                10: 'asd_remarks',
                11: 'ad_remarks'
            };

            const remarksKey = remarksKeyByRole[decryptedUser?.role_id];

            if (remarksKey) {
                handleAcceptForm({
                    token: decryptedToken,
                    id: rowData?.id,
                    role_id: decryptedUser?.role_id,
                    [remarksKey]: data?.remarks
                });
            }
        };

        return (
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-transparent flex flex-col gap-4 w-full my-8"
            >
                <div className="remarks">
                    <Controller
                        control={control}
                        rules={{
                        required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                            <InputTextarea
                                className={`${errors.remarks && 'border border-red-500'} bg-gray-50 border border-gray-300 text-[#495057] sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block leading-normal w-full p-2.5`}
                                name="description"
                                value={value} 
                                onChange={onChange}
                                rows={4}
                                placeholder="Enter your remarks here"
                            />
                        )}
                        name="remarks"
                    />
                    {errors.remarks && (
                        <p className="text-sm italic mt-1 text-red-400 indent-2">
                            remarks is required.*
                        </p>
                    )}
                </div>
                <Button
                    type="submit"
                    disabled={rejectFormLoading}
                    className="bg-[#2211cc] text-[#c7c430]  flex justify-center text-center font-bold rounded-lg p-2"
                >
                    Submit
                </Button>
            </form>
        )
    }
    const fileBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <Link
                    className="text-blue-500"
                    to={rowData.file}
                    target="_blank"
                >
                    CLick to view
                </Link>
            </div>
        )
    }
    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-8">
                <button onClick={() => navigate('/event/form-detail', { state: rowData })} className="text-blue-400">
                    View
                </button>
                {(isAdminRole && handleAdminActionValidation(rowData, decryptedUser?.role_id)) && (
                    <>
                        <button 
                            disabled={approveFormLoading} 
                            onClick={() => setApproveVisible(true)} 
                            className="text-green-400"
                        >
                            Approve
                        </button>
                        <Dialog header="Remarks" visible={approveVisible} style={{ width: '50vw' }} onHide={() => {if (!approveVisible) return; setApproveVisible(false); }}>
                            <ApproveDialog rowData={rowData}/>
                        </Dialog>
                        <button  
                            disabled={rejectFormLoading}  
                            onClick={() => setVisible(true)} 
                            className="text-red-400"
                        >
                            Revise
                        </button>
                        <Dialog header="Remarks" visible={visible} style={{ width: '50vw' }} onHide={() => {if (!visible) return; setVisible(false); }}>
                            <RejectDialog rowData={rowData}/>
                        </Dialog>
                    </>
                )}            
            </div>
        )
    }

    const getFormData = (role_id) => {
        if (!formData?.data?.data) return [];

        if(role_id === 9) {
            return _.filter(formData.data.data, ({ is_commex }) => is_commex);
        }

        if(role_id === 10) {
            return _.filter(formData.data.data, ({ is_commex, is_dean  }) => is_commex && is_dean);
        }

        if(role_id === 11) {
            return _.filter(formData.data.data, ({ is_commex, is_dean, is_asd  }) => is_commex && is_dean && is_asd);
        }

        return formData?.data.data

    }

    useEffect(() => {
        refetch()
    }, [data, refetch])


    if(formLoading || approveFormLoading || rejectFormLoading || fetchLoading || eventPostLoading) {
        return (
            <div className="formlist-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
                Loading... Please wait....
            </div>
        )
    }

    if(!formLoading || !approveFormLoading || !rejectFormLoading || !fetchLoading || !eventPostLoading || formData) {

    return (
        <div className="formlist-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <div className="w-full flex gap-2 justify-end px-4">
                {decryptedUser?.role_id === 1 && (
                    <button
                        disabled={data?.is_posted}
                        onClick={() => handleEventpost({ token: decryptedToken, id: data?.id })}
                        className={`${data?.is_posted ? "bg-gray-200" : "bg-blue-200"} px-4 py-2`}
                    >
                        {data?.is_posted ? "already posted" : "post event"}
                    </button>
                )}
                {(!isForSubmitRole && !data?.is_posted) && (
                    <Link
                        to="/event/form/upload"
                        state={{ event: data, forms: formData?.data.data }}
                        className="bg-blue-200 px-4 py-2"
                    >
                        Submit a form
                    </Link>
                )}
            </div>
            <div className="w-full mt-4">
                <DataTable 
                    value={[...getFormData(decryptedUser?.role_id)]} 
                    size="normal"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    dataKey="id"
                    emptyMessage="form(s) Not Found."
                    className="datatable-responsive min-w-full px-2 py-2"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} forms"
                    rows={10}
                    paginator
                    removableSort
                    
                >
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="code" header="Code" />
                    <Column headerClassName="bg-[#364190] text-white" className="capitalize font-bold" field="name" header="Name of the form" />
                    <Column headerClassName="bg-[#364190] text-white" className="text-base" body={fileBodyTemplate} header="Uploaded File" />
                    <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column>
                </DataTable>
            </div>
        </div>
    )  
    }
}
