import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getFooterPages, 
  createFooterPage, 
  updateFooterPage, 
  deleteFooterPage,
  updateFooterPagesOrder,
} from '@/lib/api';
import { FooterPage } from '@/types/blog';
import { generateSlug } from '@/lib/storage';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  FileText,
  GripVertical,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

interface FooterPageFormData {
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  metaDescription: string;
  status: 'draft' | 'published';
  showInFooter: boolean;
}

const emptyFormData: FooterPageFormData = {
  title: '',
  slug: '',
  content: '',
  seoTitle: '',
  metaDescription: '',
  status: 'draft',
  showInFooter: true,
};

export default function FooterPagesPage() {
  const { toast } = useToast();
  const [pages, setPages] = useState<FooterPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<FooterPage | null>(null);
  const [formData, setFormData] = useState<FooterPageFormData>(emptyFormData);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<FooterPage | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    const pagesData = await getFooterPages();
    setPages(pagesData.sort((a, b) => a.sortOrder - b.sortOrder));
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingPage(null);
    setFormData(emptyFormData);
    setSlugManuallyEdited(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (page: FooterPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      seoTitle: page.seoTitle,
      metaDescription: page.metaDescription,
      status: page.status,
      showInFooter: page.showInFooter,
    });
    setSlugManuallyEdited(true);
    setIsDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : generateSlug(title),
      seoTitle: prev.seoTitle || title,
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Please enter a title', variant: 'destructive' });
      return;
    }
    if (!formData.slug.trim()) {
      toast({ title: 'Error', description: 'Please enter a URL slug', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const pageData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
      };

      if (editingPage) {
        await updateFooterPage(editingPage.id, pageData);
        toast({ title: 'Page updated', description: 'Changes have been saved.' });
      } else {
        await createFooterPage({
          ...pageData,
          sortOrder: pages.length,
        });
        toast({ title: 'Page created', description: 'New footer page has been added.' });
      }

      setIsDialogOpen(false);
      loadPages();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save page', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (page: FooterPage) => {
    setPageToDelete(page);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;
    
    try {
      await deleteFooterPage(pageToDelete.id);
      toast({ title: 'Page deleted', description: 'Footer page has been removed.' });
      loadPages();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPages = [...pages];
    const [draggedPage] = newPages.splice(draggedIndex, 1);
    newPages.splice(dragOverIndex, 0, draggedPage);

    // Update sort orders
    const reorderedPages = newPages.map((page, index) => ({
      ...page,
      sortOrder: index,
    }));

    setPages(reorderedPages);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Save new order to server
    try {
      await updateFooterPagesOrder(reorderedPages.map(p => p.id));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save order', variant: 'destructive' });
      loadPages(); // Reload on error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Footer Pages</h1>
          <p className="text-muted-foreground">Manage static pages like About, Privacy Policy, Terms, etc.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Page
        </Button>
      </div>

      {/* Pages List */}
      {pages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No footer pages yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Create pages like About, Privacy Policy, or Contact to display in your footer.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pages.map((page, index) => (
            <Card 
              key={page.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all cursor-move ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${
                dragOverIndex === index && draggedIndex !== index 
                  ? 'border-primary border-2' 
                  : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{page.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>/p/{page.slug}</span>
                      <span>•</span>
                      <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                        {page.status === 'published' ? 'Published' : 'Draft'}
                      </Badge>
                      <span>•</span>
                      {page.showInFooter ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Eye className="h-3 w-3" />
                          In Footer
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {page.status === 'published' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteClick(page)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Footer Page' : 'Create Footer Page'}</DialogTitle>
            <DialogDescription>
              {editingPage ? 'Update page content and settings.' : 'Add a new static page to your site.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Page Title *</Label>
                <Input
                  placeholder="Privacy Policy"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug *</Label>
                <Input
                  placeholder="privacy-policy"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }}
                />
                <p className="text-xs text-muted-foreground">Preview: /p/{formData.slug || 'your-slug'}</p>
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Content</Label>
              <div className="min-h-[300px] border rounded-md">
                <TipTapEditor
                  content={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                />
              </div>
            </div>

            {/* SEO Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">SEO Settings</h3>
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input
                  placeholder="Privacy Policy - Your Site Name"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">{formData.seoTitle.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  placeholder="A brief description of this page for search engines..."
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{formData.metaDescription.length}/160 characters</p>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Display Settings</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center justify-between sm:gap-4">
                  <Label htmlFor="status-toggle">Published</Label>
                  <Switch
                    id="status-toggle"
                    checked={formData.status === 'published'}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, status: checked ? 'published' : 'draft' }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between sm:gap-4">
                  <Label htmlFor="footer-toggle">Show in Footer</Label>
                  <Switch
                    id="footer-toggle"
                    checked={formData.showInFooter}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, showInFooter: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingPage ? 'Save Changes' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Footer Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
