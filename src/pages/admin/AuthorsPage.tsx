import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  getAuthors, 
  createAuthor, 
  updateAuthor, 
  deleteAuthor,
  getPostsByAuthor,
} from '@/lib/api';
import { Author } from '@/types/seo';
import { generateSlug } from '@/lib/storage';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  UserCircle,
  Twitter,
  Linkedin,
  Github,
  Globe,
  Youtube,
  Instagram,
  Image as ImageIcon,
  X,
  FileText,
  Star,
} from 'lucide-react';

interface AuthorFormData {
  name: string;
  slug: string;
  bio: string;
  credentials: string;
  image: string | null;
  expertise: string[];
  isActive: boolean;
  isDefault: boolean;
  socialLinks: {
    twitter: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
    youtube: string | null;
    instagram: string | null;
  };
}

const emptyFormData: AuthorFormData = {
  name: '',
  slug: '',
  bio: '',
  credentials: '',
  image: null,
  expertise: [],
  isActive: true,
  isDefault: false,
  socialLinks: {
    twitter: null,
    linkedin: null,
    github: null,
    website: null,
    youtube: null,
    instagram: null,
  },
};

export default function AuthorsPage() {
  const { toast } = useToast();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [formData, setFormData] = useState<AuthorFormData>(emptyFormData);
  const [expertiseInput, setExpertiseInput] = useState('');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  useEffect(() => {
    loadAuthors();
  }, []);

  const loadAuthors = async () => {
    setLoading(true);
    const authorsData = await getAuthors();
    setAuthors(authorsData);
    
    // Load post counts for each author
    const counts: Record<string, number> = {};
    await Promise.all(
      authorsData.map(async (author) => {
        const posts = await getPostsByAuthor(author.id);
        counts[author.id] = posts.length;
      })
    );
    setPostCounts(counts);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingAuthor(null);
    setFormData(emptyFormData);
    setExpertiseInput('');
    setIsDialogOpen(true);
  };

  const handleEdit = (author: Author) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      slug: author.slug,
      bio: author.bio,
      credentials: author.credentials,
      image: author.image,
      expertise: author.expertise,
      isActive: author.isActive ?? true,
      isDefault: author.isDefault ?? false,
      socialLinks: {
        twitter: author.socialLinks?.twitter || null,
        linkedin: author.socialLinks?.linkedin || null,
        github: author.socialLinks?.github || null,
        website: author.socialLinks?.website || null,
        youtube: author.socialLinks?.youtube || null,
        instagram: author.socialLinks?.instagram || null,
      },
    });
    setExpertiseInput(author.expertise.join(', '));
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const authorData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        expertise: expertiseInput.split(',').map(e => e.trim()).filter(Boolean),
      };

      if (editingAuthor) {
        await updateAuthor(editingAuthor.id, authorData);
        toast({ title: 'Author updated', description: 'Changes have been saved.' });
      } else {
        await createAuthor(authorData);
        toast({ title: 'Author created', description: 'New author has been added.' });
      }

      setIsDialogOpen(false);
      loadAuthors();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save author', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (author: Author) => {
    setAuthorToDelete(author);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!authorToDelete) return;
    
    try {
      await deleteAuthor(authorToDelete.id);
      toast({ title: 'Author deleted', description: 'Author has been removed.' });
      loadAuthors();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete author', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setAuthorToDelete(null);
    }
  };

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
          <h1 className="text-2xl font-bold">Authors</h1>
          <p className="text-muted-foreground">Manage blog authors and their profiles</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Author
        </Button>
      </div>

      {/* Authors Grid */}
      {authors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No authors yet</h3>
            <p className="text-muted-foreground mb-4">Create your first author to get started.</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Author
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <Card key={author.id} className="relative">
              {author.isDefault && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={author.image || undefined} alt={author.name} />
                    <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{author.name}</CardTitle>
                    {author.credentials && (
                      <p className="text-sm text-muted-foreground truncate">{author.credentials}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={author.isActive ? 'default' : 'outline'}>
                        {author.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {postCounts[author.id] || 0} posts
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {author.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{author.bio}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {author.socialLinks?.twitter && <Twitter className="h-4 w-4 text-muted-foreground" />}
                    {author.socialLinks?.linkedin && <Linkedin className="h-4 w-4 text-muted-foreground" />}
                    {author.socialLinks?.github && <Github className="h-4 w-4 text-muted-foreground" />}
                    {author.socialLinks?.youtube && <Youtube className="h-4 w-4 text-muted-foreground" />}
                    {author.socialLinks?.instagram && <Instagram className="h-4 w-4 text-muted-foreground" />}
                    {author.socialLinks?.website && <Globe className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(author)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!author.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClick(author)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAuthor ? 'Edit Author' : 'Create Author'}</DialogTitle>
            <DialogDescription>
              {editingAuthor ? 'Update author details and profile.' : 'Add a new author to your blog.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Profile Image */}
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.image} alt="Profile" />
                    <AvatarFallback>{getInitials(formData.name || 'AA')}</AvatarFallback>
                  </Avatar>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed rounded-full cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
              <div>
                <p className="font-medium">Profile Photo</p>
                <p className="text-sm text-muted-foreground">Click to upload. Max 2MB.</p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  placeholder="john-doe"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role / Title</Label>
              <Input
                placeholder="Music Producer, Mixing Engineer"
                value={formData.credentials}
                onChange={(e) => setFormData(prev => ({ ...prev, credentials: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                placeholder="Write a short bio..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Expertise / Skills</Label>
              <Input
                placeholder="Mixing, Mastering, Synthesis (comma-separated)"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
              />
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Social Links</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://twitter.com/username"
                    value={formData.socialLinks.twitter || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value || null } 
                    }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://linkedin.com/in/username"
                    value={formData.socialLinks.linkedin || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, linkedin: e.target.value || null } 
                    }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://github.com/username"
                    value={formData.socialLinks.github || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, github: e.target.value || null } 
                    }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://yourwebsite.com"
                    value={formData.socialLinks.website || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, website: e.target.value || null } 
                    }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Youtube className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://youtube.com/@channel"
                    value={formData.socialLinks.youtube || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value || null } 
                    }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="https://instagram.com/username"
                    value={formData.socialLinks.instagram || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value || null } 
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="author-active">Active Author</Label>
                <p className="text-sm text-muted-foreground">Inactive authors won't appear in author selection</p>
              </div>
              <Switch
                id="author-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingAuthor ? 'Save Changes' : 'Create Author'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Author</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{authorToDelete?.name}"? 
              This action cannot be undone. Posts by this author will retain the author name but lose the profile link.
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
