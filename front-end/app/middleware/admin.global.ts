export default defineNuxtRouteMiddleware((to, from) => {
  // Only apply to routes starting with /admin
  if (to.path.startsWith('/admin')) {
    if (import.meta.client) {
      const savedUser = localStorage.getItem('user_info')
      
      // If no user info found, redirect to login
      if (!savedUser) {
        return navigateTo('/auth/login')
      }
      
      try {
        const user = JSON.parse(savedUser)
        
        // If user is not an admin, redirect to home page
        if (user.level !== 'admin') {
          return navigateTo('/')
        }
      } catch (e) {
        // If data is corrupted, clear and redirect
        localStorage.removeItem('user_info')
        return navigateTo('/auth/login')
      }
    }
  }
})
