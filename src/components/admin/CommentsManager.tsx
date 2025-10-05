import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Check, X, Eye, Star, Trash2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  customer_name: string;
  customer_email?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
}

const CommentsManager = () => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'Tutti i commenti', count: 0 },
    { value: 'pending', label: 'In attesa', count: 0 },
    { value: 'approved', label: 'Approvati', count: 0 },
    { value: 'rejected', label: 'Rifiutati', count: 0 }
  ];

  // Load comments from database
  const loadComments = async () => {
    try {
      let query = supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i commenti",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update comment status
  const updateCommentStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Commento ${status === 'approved' ? 'approvato' : 'rifiutato'}`,
      });

      loadComments();
    } catch (error) {
      console.error('Error updating comment status:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il commento",
        variant: "destructive",
      });
    }
  };

  // Toggle featured status
  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          is_featured: !isFeatured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Commento ${!isFeatured ? 'evidenziato' : 'rimosso dai commenti in evidenza'}`,
      });

      loadComments();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il commento",
        variant: "destructive",
      });
    }
  };

  // Delete comment
  const deleteComment = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo commento?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Commento eliminato con successo",
      });

      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il commento",
        variant: "destructive",
      });
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  // Get comment counts by status
  const getCommentCounts = () => {
    const counts = {
      all: comments.length,
      pending: comments.filter(c => c.status === 'pending').length,
      approved: comments.filter(c => c.status === 'approved').length,
      rejected: comments.filter(c => c.status === 'rejected').length
    };
    return counts;
  };

  useEffect(() => {
    loadComments();
  }, [statusFilter]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  const counts = getCommentCounts();

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestione Commenti</h3>
          <p className="text-sm text-gray-600">Modera i commenti e le recensioni dei clienti</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Tutti ({counts.all})</option>
            <option value="pending">In attesa ({counts.pending})</option>
            <option value="approved">Approvati ({counts.approved})</option>
            <option value="rejected">Rifiutati ({counts.rejected})</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale</p>
                <p className="text-2xl font-bold">{counts.all}</p>
              </div>
              <MessageSquare className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In attesa</p>
                <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
              </div>
              <Eye className="text-yellow-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approvati</p>
                <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
              </div>
              <Check className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rifiutati</p>
                <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
              </div>
              <X className="text-red-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className={`${comment.is_featured ? 'ring-2 ring-yellow-400' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{comment.customer_name}</span>
                    {comment.is_featured && (
                      <Badge className="bg-yellow-100 text-yellow-800">In evidenza</Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">{renderStars(comment.rating)}</div>
                    <span className="text-sm text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(comment.status)}>
                  {comment.status === 'pending' && 'In attesa'}
                  {comment.status === 'approved' && 'Approvato'}
                  {comment.status === 'rejected' && 'Rifiutato'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{comment.comment}</p>
              
              {comment.customer_email && (
                <p className="text-sm text-gray-500 mb-4">Email: {comment.customer_email}</p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {comment.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateCommentStatus(comment.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check size={16} className="mr-1" />
                      Approva
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateCommentStatus(comment.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X size={16} className="mr-1" />
                      Rifiuta
                    </Button>
                  </>
                )}
                
                {comment.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFeatured(comment.id, comment.is_featured)}
                    className={comment.is_featured ? 'text-yellow-600' : 'text-blue-600'}
                  >
                    <Star size={16} className="mr-1" />
                    {comment.is_featured ? 'Rimuovi evidenza' : 'Metti in evidenza'}
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteComment(comment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-1" />
                  Elimina
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {comments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 mb-4">
              {statusFilter === 'all' 
                ? 'Nessun commento presente' 
                : `Nessun commento con stato "${statusOptions.find(s => s.value === statusFilter)?.label}"`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentsManager;
