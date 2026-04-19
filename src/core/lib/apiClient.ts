import { triggerSudoModal, getActiveSudoToken } from '@/core/hooks/useSudo';
import { supabase } from '@/core/lib/supabase';

interface RequestOptions extends RequestInit {
  sudoRequested?: boolean;
}

export const apiClient = async (url: string, options: RequestOptions = {}): Promise<Response> => {
  const headers = new Headers(options.headers || {});
  
  // ── AUTOMATIC AUTH ──
  // We centralize token management here so domain services don't call Supabase directly.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  // Attach sudo token if active
  const sudoToken = getActiveSudoToken();
  if (sudoToken) {
    headers.set('x-sudo-token', sudoToken);
  }

  const response = await fetch(url, { ...options, headers });

  // Handle sudo required (403 with requires_sudo flag)
  if (response.status === 403) {
    // We clone because we might read the body and then need to retry
    const resClone = response.clone();
    try {
      const data = await resClone.json();
      
      if (data.requires_sudo && !options.sudoRequested) {
        // Trigger the modal
        const newToken = await triggerSudoModal();
        
        if (newToken) {
          // Retry with new token
          return apiClient(url, { 
            ...options, 
            sudoRequested: true // Prevent infinite loops
          });
        }
      }
    } catch (e) {
      // Not a JSON response or doesn't have the flag, just return the original response
    }
  }

  return response;
};

// Also export a custom fetch to be used in createClient
export const customFetch = async (url: string | URL | Request, options?: RequestInit): Promise<Response> => {
    // If it's a request object, we need to handle it
    const requestUrl = typeof url === 'string' ? url : (url as URL).toString() || (url as Request).url;
    
    // Check if this is a mutation request (POST, PUT, PATCH, DELETE)
    // Or just check for specific endpoints if needed.
    // For simplicity, we wrap all calls.
    
    return apiClient(requestUrl, options || {});
};
