'use client'

interface Props {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function LpImage({ src, alt, className, loading = 'lazy' }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
