import { useLocation  } from "react-router-dom"
import { Card } from 'primereact/card';
import dayjs from "dayjs";
import { useEffect } from "react";

export const FormDetail = () => {
    const location = useLocation()
    const data = location.state ;

    const handleStatus = (status, remarks) => {
        if(!status && !remarks) return "Pending"
        if(!status && remarks.length > 1) return "For revise"
        return "Approved"
    }

    const handlesetFullname = (data) => {
        return `${data?.lastname}, ${data?.firstname} ${data?.middlename}`
    }

    useEffect(() => {
        console.log(data)
    }, [data])

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
                    
                    {/* COMMEX */}
                        <div className="flex gap-2">
                            <h1 className="font-bold">Commex:</h1>
                            <p className="capitalize">{handleStatus(data?.is_commex, data?.commex_remarks)} {data?.commex_approved_by !== null && `(${handlesetFullname(data?.commex_approver)})`}</p>
                        </div>
                        {data?.commex_approve_date && (
                            <div className="flex gap-2">
                                <h1 className="font-bold">Commex Approved date:</h1>
                                <p>
                                    {dayjs(data?.commex_approve_date).format("MMMM D, YYYY")}
                                </p>
                            </div>    
                        )}
                        {data?.commex_remarks !== null && (
                            <div className="flex gap-2">
                                <h1 className="font-bold">Remarks:</h1>
                                <p className="capitalize">{data?.commex_remarks}</p>
                            </div>
                        )}
                    {/* COMMEX */}

                    {/* DEAN */}
                    <div className="flex gap-2">
                        <h1 className="font-bold">Dean:</h1>
                        <p className="capitalize">{handleStatus(data?.is_dean, data?.dean_remarks)} {data?.dean_approved_by !== null && `(${handlesetFullname(data?.dean_approver)})`}</p>
                    </div>
                    {data?.dean_approve_date && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Dean Approved date:</h1>
                            <p>
                                {dayjs(data?.dean_approve_date).format("MMMM D, YYYY")}
                            </p>
                        </div>    
                    )}
                    {data?.dean_remarks !== null && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize">{data?.dean_remarks}</p>
                        </div>
                    )}
                    {/* DEAN */}

                    {/* ASD */}
                    
                    <div className="flex gap-2">
                        <h1 className="font-bold">ASD:</h1>
                        <p className="capitalize">{handleStatus(data?.is_asd, data?.asd_remarks)} {data?.asd_approved_by !== null && `(${handlesetFullname(data?.asd_approver)})`}</p>
                    </div>
                    {data?.asd_approve_date && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">ASD Approved date:</h1>
                            <p>
                                {dayjs(data?.asd_approve_date).format("MMMM D, YYYY")}
                            </p>
                        </div>    
                    )}
                    {data?.asd_remarks !== null && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize">{data?.asd_remarks}</p>
                        </div>
                    )}

                    {/* ASD */}

                    {/* AD */}

                    <div className="flex gap-2">
                        <h1 className="font-bold">AD:</h1>
                        <p className="capitalize">{handleStatus(data?.is_ad, data?.ad_remarks)} {data?.ad_approved_by !== null && `(${handlesetFullname(data?.ad_approver)})`}</p>
                    </div>
                    {data?.ad_approve_date && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">ASD Approved date:</h1>
                            <p>
                                {dayjs(data?.ad_approve_date).format("MMMM D, YYYY")}
                            </p>
                        </div>    
                    )}
                    {data?.ad_remarks !== null && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize">{data?.ad_remarks}</p>
                        </div>
                    )}

                    {/* AD */}
                </div>
            </Card>
        </div>
    )
}
