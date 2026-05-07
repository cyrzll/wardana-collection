export const useImage = () => {
  const config = useRuntimeConfig()
  
  const resolveImage = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    
    // If path starts with /images, we need to handle it
    // The IMAGE_CDN_URL is http://localhost:4000/images
    // The path is /images/product/foo.png
    // We want http://localhost:4000/images/product/foo.png
    
    const baseUrl = config.public.imageBase // This is http://localhost:4000/images
    
    if (path.startsWith('/images/')) {
      return path.replace('/images/', `${baseUrl}/`)
    }
    
    return `${baseUrl}/${path.replace(/^\//, '')}`
  }
  
  return {
    resolveImage
  }
}
