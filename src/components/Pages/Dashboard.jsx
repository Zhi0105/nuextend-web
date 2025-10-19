import { getUserEvents } from "@_src/services/event";
import { useUserStore } from "@_src/store/auth";
import { DecryptString, DecryptUser } from "@_src/utils/helpers";
import { FormProgressList } from "../Partial/FormProgressList";
import { useMemo } from "react";
import _ from 'lodash';

export const Dashboard = () => {
    const { user, token } = useUserStore((state) => ({
        user: state.user,
        token: state.token,
    }));

    const decryptedToken = useMemo(() => (token ? DecryptString(token) : null), [token]);
    const decryptedUser = useMemo(() => (token ? DecryptUser(user) : null), [token, user]);
    const roleId = decryptedUser?.role_id;

    const needsAllEvents = useMemo(() => [1, 9, 10, 11].includes(roleId), [roleId]);
    const needsUserEvents = !needsAllEvents;

    const {
        data: myEvents = [],
        isLoading: userEventLoading,
        isRefetching: userEventRefetchLoading,
        } = getUserEvents({
        token: decryptedToken,
        user_id: decryptedUser?.id,
        enabled: needsUserEvents,
    });

    const filteredEvents = _.filter(myEvents, (e) => e.event_status_id !== 2);

    if ( userEventLoading || userEventRefetchLoading) {
        return (
        <div className="view-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
            Dashboard loading...
        </div>
        );
    }

    return (
        <div className="dashboard-main min-h-screen bg-white w-full flex flex-col justify-center items-center xs:pl-[0px] sm:pl-[200px]">
            <FormProgressList 
                eventList={filteredEvents}
            />
        </div>
    )
}
