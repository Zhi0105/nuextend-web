import { Link, useLocation } from "react-router-dom"
import { useUserStore } from '@_src/store/auth';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { getForms } from "@_src/services/event";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect } from "react";
import _ from "lodash";

export const FormList = () => {
    const location = useLocation()
    const data = location.state ;
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)

    const { data: formData, isLoading: formLoading, refetch, isFetching: fetchLoading } = getForms({token: decryptedToken, event: data.id})


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

    useEffect(() => {
        refetch()
    }, [data, refetch])

    if(formLoading || fetchLoading) {
        return (
            <div className="formlist-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px] py-20">
                Loading... Please wait....
            </div>
        )
    }

    if(!formLoading || !fetchLoading || formData) {

        return (
            <div className="formlist-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
                <div className="w-full flex justify-end px-4">
                    {/* {decryptedUser.role_id !== 1 && ( */}
                        <Link
                            to="/event/form/upload"
                            state={{ event: data, forms: formData?.data.data }}
                            className="bg-blue-200 px-4 py-2"
                        >
                            Submit a form
                        </Link>
                    {/* )} */}
                </div>
                <div className="w-full mt-4">
                    <DataTable 
                        value={formData?.data.data} 
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
                        {/* <Column headerClassName="bg-[#FCA712] text-white" body={actionBodyTemplate} header="Action"></Column> */}

                    </DataTable>
                </div>
            </div>
        )  
    }
}
