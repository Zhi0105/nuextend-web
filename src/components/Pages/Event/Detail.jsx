import { useContext } from "react";
import { useUserStore } from '@_src/store/auth';
import { EventContext } from "@_src/contexts/EventContext";
import { useLocation } from "react-router-dom"
import { Card } from 'primereact/card';
import { Button } from "primereact/button";
import { DecryptString } from "@_src/utils/helpers";
import dayjs from "dayjs";

export const Detail = () => {
    const location = useLocation();
    const event = location.state
    const { token } = useUserStore((state) => ({ token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const { acceptEvent, rejectEvent, acceptEventLoading, rejectEventLoading } = useContext(EventContext)

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MMMM D, YYYY')
    }
    const setFullname = (firstname, lastname, middlename) => {
        return `${lastname}, ${firstname} ${middlename}`
    }

    if(acceptEventLoading || rejectEventLoading) {
        return (
            <div className="view-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
                Processing event approvals......
            </div>
        )
    }
    
    return (
        <div className="view-main min-h-screen bg-white w-full flex flex-col items-center xs:pl-[0px] sm:pl-[200px] pt-[5rem]">
            <Card title="Event Details:" className="w-[60%] my-4">
                <div className="w-full flex flex-col gap-4">
                    <div className="flex gap-2">
                        <h1 className="font-bold">Name:</h1>
                        <p className="capitalize">{event?.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Description:</h1>
                        <p className="capitalize">{event?.description}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Start date:</h1>
                        <p className="capitalize">{setFormatDate(event?.start_date)}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">End date:</h1>
                        <p className="capitalize">{setFormatDate(event?.end_date)}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Event Type:</h1>
                        <p className="capitalize">{event?.eventtype.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Model:</h1>
                        <p className="capitalize">{event?.model.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Location:</h1>
                        <p className="capitalize">{event?.address}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Created By:</h1>
                        <p className="capitalize">{setFullname(event?.user.lastname, event?.user.firstname, event?.user.middlename)}</p>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Owned By:</h1>
                        <p className="capitalize">
                            {event?.organization?.name ? (
                                event?.organization?.name
                            ) : (
                                setFullname(event?.user.lastname, event?.user.firstname, event?.user.middlename)
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">Event Skills List:</h1>
                        <ul className="indent-12">
                            {event?.skills.length && (
                                event?.skills.map((skill, index) => {
                                    return (
                                        <li key={index}>
                                            - {skill.name}
                                        </li>
                                    )
                                })
                            )}
                        </ul>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="font-bold">UNSDG Skills List:</h1>
                        <ul className="indent-12">
                            {event?.unsdgs.length && (
                                event?.unsdgs.map((unsdg, index) => {
                                    return (
                                        <li key={index}>
                                            - {unsdg.name}
                                        </li>
                                    )
                                })
                            )}
                        </ul>
                    </div>
                    <div className="flex gap-2">
                        <h1 className="font-bold">Status:</h1>
                        <p className="capitalize">{event?.eventstatus.name}</p>
                    </div>
                    {event?.event_status_id !== 2 && (
                        <div className="flex gap-16 justify-center">
                            <Button
                                onClick={() => acceptEvent({
                                    token: decryptedToken,
                                    id: event?.id
                                })}
                                disabled={acceptEventLoading}
                                className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-lg p-2"
                            >
                                Accept
                            </Button>
                            <Button
                                onClick={() => rejectEvent({
                                    token: decryptedToken,
                                    id: event?.id
                                })}
                                disabled={rejectEventLoading}
                                className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-lg p-2"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}   
