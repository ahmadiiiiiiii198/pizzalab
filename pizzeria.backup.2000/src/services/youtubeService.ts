import { supabase } from '@/integrations/supabase/client';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

class YouTubeService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Check if youtube_videos table exists
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log('YouTube videos table does not exist, creating...');
        await this.createTable();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing YouTube service:', error);
    }
  }

  private async createTable() {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS youtube_videos (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            youtube_url TEXT NOT NULL,
            thumbnail_url TEXT,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Enable RLS
          ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Allow public read access" ON youtube_videos
            FOR SELECT USING (true);
          
          CREATE POLICY "Allow authenticated insert" ON youtube_videos
            FOR INSERT WITH CHECK (true);
          
          CREATE POLICY "Allow authenticated update" ON youtube_videos
            FOR UPDATE USING (true);
          
          CREATE POLICY "Allow authenticated delete" ON youtube_videos
            FOR DELETE USING (true);
        `
      });
      
      if (error) {
        console.error('Error creating youtube_videos table:', error);
      } else {
        console.log('✅ youtube_videos table created successfully');
      }
    } catch (error) {
      console.error('Error in createTable:', error);
    }
  }

  async getActiveVideos(): Promise<YouTubeVideo[]> {
    await this.initialize();
    
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching active videos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveVideos:', error);
      return [];
    }
  }

  async getAllVideos(): Promise<YouTubeVideo[]> {
    await this.initialize();
    
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching all videos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllVideos:', error);
      return [];
    }
  }

  async getFirstActiveVideo(): Promise<YouTubeVideo | null> {
    const videos = await this.getActiveVideos();
    return videos.length > 0 ? videos[0] : null;
  }

  async addVideo(video: Omit<YouTubeVideo, 'id' | 'created_at'>): Promise<YouTubeVideo | null> {
    await this.initialize();
    
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .insert([video])
        .select()
        .single();

      if (error) {
        console.error('Error adding video:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addVideo:', error);
      return null;
    }
  }

  async updateVideo(id: string, updates: Partial<YouTubeVideo>): Promise<YouTubeVideo | null> {
    await this.initialize();
    
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateVideo:', error);
      return null;
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    await this.initialize();
    
    try {
      const { error } = await supabase
        .from('youtube_videos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting video:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      return false;
    }
  }

  // Utility functions
  extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  getThumbnailUrl(url: string): string {
    const videoId = this.extractVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  }

  getEmbedUrl(url: string): string {
    const videoId = this.extractVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
  }
}

export const youtubeService = new YouTubeService();
