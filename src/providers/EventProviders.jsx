import { EventContext } from "@_src/contexts/EventContext";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { createEvent, updateEvent } from "@_src/services/event";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"

export const EventProviders = ({ children }) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

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
            navigate('/event/view')
            }, 
        onError: (error) => {  
            console.log("@UE:", error)
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
                updateEventLoading: updateEventLoading
            }}
        >
            {children}
        </EventContext.Provider>
    )
}