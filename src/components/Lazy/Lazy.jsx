import { LazyLoadImage } from 'react-lazy-load-image-component'

export const LazyImage = ({ src, alt, width, height, style = {} }) => {
    return (
        <LazyLoadImage 
            style={style}
            src={src}
            alt={alt}
            width={width}
            height={height}
        />
    )
}
