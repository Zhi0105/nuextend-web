import { EventContext } from "@_src/contexts/EventContext";
import { useUserStore } from '@_src/store/auth'
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { acceptEvent, createEvent, rejectEvent, updateEvent } from "@_src/services/event";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"
import { DecryptUser } from "@_src/utils/helpers";

export const EventProviders = ({ children }) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const { user, token } = useUserStore((state) => ({ user: state.user, token: state.token }));
    const decryptedUser = token && DecryptUser(user)
    
    const { mutate: handleCreateEvent, isLoading: createEventLoading } = useMutation({
        mutationFn: createEvent
        // onSuccess: () => {
        //     queryClient.invalidateQueries({ queryKey: ['event'] });
        //     toast("new event created", { type: "success" })
        //     }, 
        // onError: (error) => {  
        //     console.log("@CE:", error)
        // },
    });
    const { mutate: handleUpdateEvent, isLoading: updateEventLoading } = useMutation({
        mutationFn: updateEvent,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['event'] });
            toast(data.message, { type: "success" })
            if(decryptedUser?.role_id === 1) {
                navigate('/admin/event/view')
            } else {
                navigate('/event/view')
            }
            }, 
        onError: (error) => {  
            console.log("@UE:", error)
        },
    });
    const { mutate: handleAcceptEvent, isLoading: acceptEventLoading } = useMutation({
        mutationFn: acceptEvent,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['event'] });
            toast(data.message, { type: "success" })
            if(decryptedUser?.role_id === 1) {
                navigate('/admin/event/view')
            } else {
                navigate('/event/view')
            }
            }, 
        onError: (error) => {  
            console.log("@AEE:", error)
        },
    });
    const { mutate: handleRejectEvent, isLoading: rejectEventLoading } = useMutation({
        mutationFn: rejectEvent,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['event'] });
            toast(data.message, { type: "success" })
            if(decryptedUser?.role_id === 1) {
                navigate('/admin/event/view')
            } else {
                navigate('/event/view')
            }
            }, 
        onError: (error) => {  
            console.log("@REE:", error)
        },
    });
    

    return (     
        <EventContext.Provider
            value={{
                createEvent: (data, options) => {
                    handleCreateEvent(data, {
                        onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: ['event'] });
                            toast("new event created", { type: "success" });
                            options?.onSuccess?.(); // allow form to do its own thing
                        },
                        onError: (error) => {
                            console.log("@CE:", error);
                            options?.onError?.(error);
                        },
                    });
                },
                createEventLoading: createEventLoading,
                updateEvent: (data) => handleUpdateEvent(data),
                updateEventLoading: updateEventLoading,
                acceptEvent: (data) => handleAcceptEvent(data),
                acceptEventLoading: acceptEventLoading,
                rejectEvent: (data) => handleRejectEvent(data),
                rejectEventLoading: rejectEventLoading
            }}
        >
            {children}
        </EventContext.Provider>
    )
}