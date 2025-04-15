import { LazyLoadImage } from 'react-lazy-load-image-component'

export const LazyImage = ({ src, alt, width, height }) => {
    return (
        <LazyLoadImage 
            src={src}
            alt={alt}
            width={width}
            height={height}
        />
    )
}
