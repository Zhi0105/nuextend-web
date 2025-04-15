export const PageTemplate = ({ children }) => {
    return (
        <div className='min-h-screen w-full bg-[url(/bg.webp)] bg-cover bg-center bg-no-repeat'>
            {children}
        </div>
    )
}