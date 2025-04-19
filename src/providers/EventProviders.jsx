import { EventContext } from "@_src/contexts/EventContext";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { createEvent } from "@_src/services/event";
import { toast } from "react-toastify"

export const EventProviders = ({ children }) => {
    const queryClient = useQueryClient()

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
                createEventLoading: createEventLoading
            }}
        >
            {children}
        </EventContext.Provider>
    )
}