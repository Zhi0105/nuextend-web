import { useContext, useState } from "react";
import { useUserStore } from '@_src/store/auth';
import { EventContext } from "@_src/contexts/EventContext";
import { useLocation } from "react-router-dom"
import { useForm, Controller } from "react-hook-form";
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from 'primereact/card';
import { Button } from "primereact/button";
import { Dialog } from 'primereact/dialog';
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import dayjs from "dayjs";

export const Detail = () => {
    const location = useLocation();
    const event = location.state
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedToken = token && DecryptString(token)
    const decryptedUser = token && DecryptUser(user)
    const { acceptEvent, rejectEvent, acceptEventLoading, rejectEventLoading } = useContext(EventContext)
    const [visible, setVisible] = useState(false);

    const setFormatDate = (date) => {
        return dayjs(new Date(date)).format('MMMM D, YYYY')
    }
    const setFullname = (firstname, lastname, middlename) => {
        return `${lastname}, ${firstname} ${middlename}`
    }
    const RejectDialog = () => {
        const { handleSubmit, control, formState: { errors }} = useForm({
            defaultValues: {
                remarks: ""
            },
        });
        const onSubmit = (data) => {
            rejectEvent({
                token: decryptedToken,
                id: event?.id,
                remarks: data?.remarks
            })
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
                    disabled={rejectEventLoading}
                    className="bg-[#2211cc] text-[#c7c430]  flex justify-center text-center font-bold rounded-lg p-2"
                >
                    Submit
                </Button>
            </form>
        )
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
                    {event?.remarks && (
                        <div className="flex gap-2">
                            <h1 className="font-bold">Remarks:</h1>
                            <p className="capitalize text-red-400">{event?.remarks}</p>
                        </div>
                    )}
                    {((event?.event_status_id !== 2) && (decryptedUser?.role_id === 1)) &&  (
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
                                onClick={() => setVisible(true)}
                                className="bg-[#2211cc] text-[#c7c430] text-center font-bold rounded-lg p-2"
                            >
                                Reject
                            </Button>
                            <Dialog header="Remarks" visible={visible} style={{ width: '50vw' }} onHide={() => {if (!visible) return; setVisible(false); }}>
                                <RejectDialog />
                            </Dialog>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}   
