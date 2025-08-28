import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Youtube, Save, Eye, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  thumbnail_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const YouTubeManager = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<YouTubeVideo | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    thumbnail_url: '',
    is_active: true,
    sort_order: 1
  });

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Get thumbnail URL from video ID
  const getThumbnailUrl = (url: string) => {
    const videoId = extractVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  // Get embed URL for preview
  const getEmbedUrl = (url: string) => {
    const videoId = extractVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  };

  // Load videos from database
  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save video
  const saveVideo = async () => {
    try {
      const videoData = {
        ...formData,
        thumbnail_url: formData.thumbnail_url || getThumbnailUrl(formData.youtube_url)
      };

      if (editingVideo) {
        const { error } = await supabase
          .from('youtube_videos')
          .update(videoData)
          .eq('id', editingVideo.id);

        if (error) throw error;
        
        toast({
          title: "Successo",
          description: "Video aggiornato con successo. Controlla la sezione YouTube del sito!",
        });
      } else {
        const { error } = await supabase
          .from('youtube_videos')
          .insert([videoData]);

        if (error) throw error;
        
        toast({
          title: "Successo",
          description: "Video aggiunto con successo! Vai alla homepage per vedere il video nella sezione YouTube.",
        });
      }

      resetForm();
      loadVideos();
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il video",
        variant: "destructive",
      });
    }
  };

  // Delete video
  const deleteVideo = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo video?')) return;

    try {
      const { error } = await supabase
        .from('youtube_videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Successo",
        description: "Video eliminato con successo",
      });
      
      loadVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il video",
        variant: "destructive",
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      youtube_url: '',
      thumbnail_url: '',
      is_active: true,
      sort_order: 1
    });
    setEditingVideo(null);
    setIsAddingNew(false);
  };

  // Start editing
  const startEditing = (video: YouTubeVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description,
      youtube_url: video.youtube_url,
      thumbnail_url: video.thumbnail_url || '',
      is_active: video.is_active,
      sort_order: video.sort_order
    });
    setIsAddingNew(false);
  };

  // Start adding new
  const startAddingNew = () => {
    resetForm();
    setIsAddingNew(true);
  };

  // Add sample video for testing
  const addSampleVideo = async () => {
    const sampleVideo = {
      title: "La Nostra Pizza Napoletana",
      description: "Scopri come prepariamo la nostra autentica pizza napoletana con ingredienti freschi e tradizione italiana.",
      youtube_url: "https://www.youtube.com/watch?v=sv3TXMSv6Lw",
      thumbnail_url: "",
      is_active: true,
      sort_order: 1
    };

    try {
      const { error } = await supabase
        .from('youtube_videos')
        .insert([{
          ...sampleVideo,
          thumbnail_url: sampleVideo.thumbnail_url || getThumbnailUrl(sampleVideo.youtube_url)
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Video di esempio aggiunto! Vai alla homepage per vederlo.",
      });

      loadVideos();
    } catch (error) {
      console.error('Error adding sample video:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere il video di esempio",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add New Video Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Video YouTube</h3>
        <div className="flex space-x-3">
          <Button
            onClick={() => window.open('/', '_blank')}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Eye className="mr-2" size={16} />
            Vedi Frontend
          </Button>
          <Button onClick={startAddingNew} className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2" size={16} />
            Aggiungi Video
          </Button>
        </div>
      </div>

      {/* Video Form */}
      {(isAddingNew || editingVideo) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Youtube className="mr-2 text-red-600" />
              {editingVideo ? 'Modifica Video' : 'Aggiungi Nuovo Video'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titolo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titolo del video"
                />
              </div>
              <div>
                <Label htmlFor="youtube_url">URL YouTube</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setFormData({ 
                      ...formData, 
                      youtube_url: url,
                      thumbnail_url: formData.thumbnail_url || getThumbnailUrl(url)
                    });
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione del video"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="thumbnail_url">URL Thumbnail (opzionale)</Label>
                <Input
                  id="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="URL immagine di anteprima"
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Ordine</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Video attivo</Label>
            </div>

            {/* Video Preview */}
            {formData.youtube_url && extractVideoId(formData.youtube_url) && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-800 mb-3">Anteprima Video</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Thumbnail Preview */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Thumbnail:</p>
                    <img
                      src={formData.thumbnail_url || getThumbnailUrl(formData.youtube_url)}
                      alt="Video thumbnail"
                      className="w-full h-32 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/320x180/cccccc/666666?text=No+Thumbnail';
                      }}
                    />
                  </div>

                  {/* Video Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Informazioni:</p>
                    <div className="space-y-2 text-sm">
                      <div><strong>Titolo:</strong> {formData.title || 'Nessun titolo'}</div>
                      <div><strong>Descrizione:</strong> {formData.description || 'Nessuna descrizione'}</div>
                      <div><strong>Video ID:</strong> {extractVideoId(formData.youtube_url)}</div>
                      <div><strong>Stato:</strong> {formData.is_active ? '✅ Attivo' : '❌ Inattivo'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview */}
            {formData.youtube_url && extractVideoId(formData.youtube_url) && (
              <div>
                <Label>Anteprima</Label>
                <div className="mt-2 aspect-video max-w-md">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractVideoId(formData.youtube_url)}`}
                    title="Video preview"
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button onClick={saveVideo} className="bg-green-600 hover:bg-green-700">
                <Save className="mr-2" size={16} />
                Salva
              </Button>
              <Button onClick={resetForm} variant="outline">
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card key={video.id} className={`${!video.is_active ? 'opacity-50' : ''}`}>
            <CardHeader className="pb-2">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Youtube className="text-gray-400" size={32} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm mb-2">{video.title}</CardTitle>
              <CardDescription className="text-xs mb-3 line-clamp-2">
                {video.description}
              </CardDescription>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Ordine: {video.sort_order}
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(video.youtube_url, '_blank')}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(video)}
                  >
                    Modifica
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteVideo(video.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Youtube className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 mb-4">Nessun video configurato</p>
            <div className="flex justify-center space-x-3">
              <Button onClick={addSampleVideo} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Youtube className="mr-2" size={16} />
                Aggiungi Video di Esempio
              </Button>
              <Button onClick={startAddingNew} className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2" size={16} />
                Aggiungi Video Personalizzato
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YouTubeManager;
