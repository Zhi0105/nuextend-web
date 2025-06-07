import { useLocation } from 'react-router-dom';
import { useUserStore } from '@_src/store/auth';
import { PageTemplate } from "@_src/templates/PageTemplate"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sentVerificationNotification } from '@_src/services/email';
import { DecryptString } from '@_src/utils/helpers';
import { toast } from "react-toastify"

export const EmailSendLinkScreen = () => {
    const queryClient = useQueryClient()
    const location = useLocation();
    const state = location.state;
    const { token, setJustVerified } = useUserStore((state) => ({
        token: state.token,
        setJustVerified: state.setJustVerified

    }));
    const decryptedToken = token && DecryptString(token)
    const { mutate: handleSendEmail, isLoading: sendLoading } = useMutation({
        mutationFn: sentVerificationNotification,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['send-link'] });
            toast(data?.message, { type: "success" })
            setJustVerified(true)
        }, 
        onError: (err) => {  
            console.log("@SEC", err?.response.data)
        },
    });

    if(sendLoading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center">
                Loading....
            </div>
        )
    }

    return (
        <PageTemplate>
            <div className="min-h-screen flex flex-col justify-center items-center">
                <div className="flex flex-col bg-blue-200 border-2 border-blue-400 p-4 rounded-lg">
                    <h1 className="text-blue-500">Confirm Your Email Address</h1>
                    <p>
                        A confirmation email has been sent to <span className='font-bold text-blue-800'>{state?.email}</span> to verify your email address and activate your account.
                    </p>
                    <p className="mt-4">
                        <button onClick={() => handleSendEmail({ token: decryptedToken, is_mobile: false })} className="text-blue-800">Click here</button> if you did not receive an email or would like to change the email address you signed up with.
                    </p>
                </div>
            </div>
        </PageTemplate>
    )
}
