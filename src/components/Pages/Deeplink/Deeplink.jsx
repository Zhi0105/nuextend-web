import { useEffect } from 'react';


export const Deeplink = () => {
    useEffect(() => {
        const target = new URLSearchParams(window.location.search).get('target');
        if (target) {
        window.location.href = target;
        }
    }, []);

    return <p>Opening your app...</p>;
}
