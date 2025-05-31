import { useLocation  } from "react-router-dom"
import { Card } from 'primereact/card';

export const FormDetail = () => {
    const location = useLocation()
    const data = location.state ;

    const handleStatus = (status, remarks) => {
        if(!status && !remarks) return "Pending"
        if(!status && remarks.length > 1) return "Rejected"
        return "Approved"
    }

    const handlesetFullname = (data) => {
        return `${data?.lastname}, ${data?.firstname} ${data?.middlename}`
    }

    return (
        <div className="formdetail-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] py-20">
            <Card title="Form Details:" className="w-[60%] my-4">
                <div className="w-full flex flex-col gap-4">
                    <div className="flex gap-2">
                        <h1 className="font-bold">Code:</h1>
                        <p className="capitalize">{data?.code}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Name:</h1>
                        <p className="capitalize">{data?.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Dean:</h1>
                        <p className="capitalize">{handleStatus(data?.is_dean, data?.dean_remarks)} {data?.dean_approved_by !== null && `(${handlesetFullname(data?.dean_approver)})`}</p>
                    </div>
                    {data?.dean_remarks !== null && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize">{data?.dean_remarks}</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <h1 className="font-bold">ASD:</h1>
                        <p className="capitalize">{handleStatus(data?.is_asd, data?.asd_remarks)} {data?.asd_approved_by !== null && `(${handlesetFullname(data?.asd_approver)})`}</p>
                    </div>
                    {data?.asd_remarks !== null && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize">{data?.asd_remarks}</p>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <h1 className="font-bold">AD:</h1>
                        <p className="capitalize">{handleStatus(data?.is_ad, data?.ad_remarks)} {data?.ad_approved_by !== null && `(${handlesetFullname(data?.ad_approver)})`}</p>
                    </div>
                    {data?.ad_remarks !== null && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize">{data?.ad_remarks}</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
