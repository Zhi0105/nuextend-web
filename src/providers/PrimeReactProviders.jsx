import { PrimeReactProvider } from 'primereact/api'

// PrimeReact theme (pick one)
import 'primereact/resources/themes/lara-light-indigo/theme.css'; // or any other theme you like

// Core PrimeReact styles
import 'primereact/resources/primereact.min.css';

// PrimeIcons
import 'primeicons/primeicons.css';

export const PrimeReactProviders = ({ children }) => {
    return (
        <PrimeReactProvider>
            {children}
        </PrimeReactProvider>
    )
}
