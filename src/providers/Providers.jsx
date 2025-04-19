import { BrowserRouter as Router } from 'react-router-dom'
import { Navigation } from '@_src/routes/Navigation'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


import { TanstackProviders } from './TanstackProviders'
import { PrimeReactProviders } from './PrimeReactProviders'
import { AuthProviders } from './AuthProviders'
import { EventProviders } from './EventProviders'

export const Providers = () => {
    return (
        <Router>
            <TanstackProviders>
                <AuthProviders>
                    <EventProviders>
                        <PrimeReactProviders>
                            <Navigation />
                            <ToastContainer />  
                        </PrimeReactProviders>
                    </EventProviders>
                </AuthProviders>
            </TanstackProviders>
        </Router>
    )
}
