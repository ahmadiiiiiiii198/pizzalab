
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ContentSection {
  id: string;
  section_key: string;
  section_name: string;
  content_type: string;
  content_value: string | null;
  metadata: any;
  is_active: boolean;
}

export const useContent = (sectionKey?: string) => {
  return useQuery({
    queryKey: ['content-sections', sectionKey],
    queryFn: async () => {
      console.log(`🔍 [useContent] Querying content_sections for: ${sectionKey || 'all'}`);

      let query = supabase
        .from('content_sections')
        .select('*')
        .eq('is_active', true);

      if (sectionKey) {
        query = query.eq('section_key', sectionKey);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ [useContent] Query failed for ${sectionKey || 'all'}:`, error);
        throw error;
      }

      console.log(`✅ [useContent] Query successful for ${sectionKey || 'all'}, found ${data?.length || 0} records`);

      if (sectionKey) {
        return data?.[0] as ContentSection | null;
      }

      return data as ContentSection[];
    },
    retry: 1, // Only retry once instead of default 3 times
    retryDelay: 1000, // Wait 1 second before retry
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

export const useContentBySection = (section: string) => {
  return useQuery({
    queryKey: ['content-sections-by-section', section],
    queryFn: async () => {
      console.log(`🔍 [useContentBySection] Querying content_sections for section: ${section}`);

      const { data, error } = await supabase
        .from('content_sections')
        .select('*')
        .eq('is_active', true)
        .contains('metadata', { section });

      if (error) {
        console.error(`❌ [useContentBySection] Query failed for section ${section}:`, error);
        throw error;
      }

      console.log(`✅ [useContentBySection] Query successful for section ${section}, found ${data?.length || 0} records`);
      return data as ContentSection[];
    },
    retry: 1, // Only retry once instead of default 3 times
    retryDelay: 1000, // Wait 1 second before retry
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
