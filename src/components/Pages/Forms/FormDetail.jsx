import { useLocation  } from "react-router-dom"
import { Card } from 'primereact/card';
import dayjs from "dayjs";

export const FormDetail = () => {
    const location = useLocation()
    const { data, event } = location.state ;

    const handleStatus = (status, remarks) => {
        if(!status && !remarks) return "Pending"
        if(!status && remarks.length > 1) return "For revise"
        return "Approved"
    }
    const handlesetFullname = (data) => {
        return `${data?.lastname}, ${data?.firstname} ${data?.middlename}`
    }

    const handleAdminsValidation = () => {
        const lastDigit = parseInt(data?.code?.slice(-1));
        const validators = {
            1: ["commex", "dean", "asd", "ad"],
            2: ["commex", "dean", "asd", "ad"],
            3: ["commex", "dean", "asd", "ad"],
            4: ["commex", "dean", "asd"],
            5: ["commex", "dean", "asd"],
            6: ["commex"],
            7: ["commex"],
            8: ["commex"],
            9: ["commex", "dean", "asd", "ad"],
            0: ["commex", "dean", "asd", "ad"], // form 10
            11: ["commex", "asd"], // fallback if you use double digits directly
            12: ["commex", "asd"],
            13: ["commex"],
            14: ["commex", "asd"]
        };

        // eslint-disable-next-line no-prototype-builtins
        const key = validators.hasOwnProperty(lastDigit) ? lastDigit : parseInt(data?.code);
        const allowed = validators[key] || [];

        return {
            commex: allowed.includes("commex"),
            dean: allowed.includes("dean"),
            asd: allowed.includes("asd"),
            ad: allowed.includes("ad")
        };
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
                    
                    {/* COMMEX */}
                    {handleAdminsValidation().commex && (
                        <>
                            <div className="flex gap-2">
                                <h1 className="font-bold">ComEx:</h1>
                                <p className="capitalize">{handleStatus(data?.is_commex, data?.commex_remarks)} {data?.commex_approved_by !== null && `(${handlesetFullname(data?.commex_approver)})`}</p>
                            </div>
                            {data?.commex_approve_date && (
                                <div className="flex gap-2">
                                    <h1 className="font-bold">ComEx Approved date:</h1>
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
                        </>
                    )}
                    {/* COMMEX */}

                    {/* DEAN */}
                    {(handleAdminsValidation().dean && event?.user_id !== 1) && (
                        <>
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
                        </>
                    )}
                    {/* DEAN */}

                    {/* ASD */}
                    {handleAdminsValidation().asd && (
                        <>
                            <div className="flex gap-2">
                                <h1 className="font-bold">Academic Services Director:</h1>
                                <p className="capitalize">{handleStatus(data?.is_asd, data?.asd_remarks)} {data?.asd_approved_by !== null && `(${handlesetFullname(data?.asd_approver)})`}</p>
                            </div>
                            {data?.asd_approve_date && (
                                <div className="flex gap-2">
                                    <h1 className="font-bold">Academic Services Director Approved date:</h1>
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
                        </>
                    )}
                    {/* ASD */}

                    {/* AD */}
                    {handleAdminsValidation().ad && (
                        <>
                            <div className="flex gap-2">
                                <h1 className="font-bold">Academic Director:</h1>
                                <p className="capitalize">{handleStatus(data?.is_ad, data?.ad_remarks)} {data?.ad_approved_by !== null && `(${handlesetFullname(data?.ad_approver)})`}</p>
                            </div>
                            {data?.ad_approve_date && (
                                <div className="flex gap-2">
                                    <h1 className="font-bold">Academic Director Approved date:</h1>
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
                        </>
                    )}

                    {/* AD */}
                </div>
            </Card>
        </div>
    )
}
