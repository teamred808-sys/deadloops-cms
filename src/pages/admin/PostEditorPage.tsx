import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  getPost,
  createPost,
  updatePost,
  getCategories,
  getTags,
  createCategory,
  getAuthors,
} from '@/lib/api';
import { generateSlug, getExcerpt } from '@/lib/storage';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { Post, Category, Tag, PostFormData } from '@/types/blog';
import { Author } from '@/types/seo';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { getUploadUrl } from '@/lib/apiClient';

export default function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [defaultAuthorId, setDefaultAuthorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [formData, setFormData] = useState<PostFormData & { authorId?: string | null }>({
    title: '',
    content: '',
    excerpt: '',
    featuredImage: null,
    status: 'draft',
    publishDate: new Date().toISOString().slice(0, 16),
    categories: [],
    tags: [],
    downloadEnabled: false,
    downloadUrl: null,
    downloadFilename: null,
    downloadSize: null,
    metaDescription: '',
    slug: '',
    authorId: null,
  });

  useEffect(() => {
    const loadData = async () => {
      const [categoriesData, tagsData, authorsData] = await Promise.all([
        getCategories(),
        getTags(),
        getAuthors()
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
      const activeAuthors = authorsData.filter(a => a.isActive);
      setAuthors(activeAuthors);

      // Find the default author
      const defaultAuth = activeAuthors.find(a => a.isDefault);
      if (defaultAuth) {
        setDefaultAuthorId(defaultAuth.id);
      }

      if (isEditing && id) {
        const post = await getPost(id);
        if (post) {
          setFormData({
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            featuredImage: post.featuredImage,
            status: post.status,
            publishDate: post.publishDate.slice(0, 16),
            categories: post.categories,
            tags: post.tags,
            downloadEnabled: post.downloadEnabled,
            downloadUrl: post.downloadUrl,
            downloadFilename: post.downloadFilename,
            downloadSize: post.downloadSize,
            metaDescription: post.metaDescription,
            slug: post.slug,
            authorId: post.authorId || null,
          });
        } else {
          toast({ title: 'Error', description: 'Post not found', variant: 'destructive' });
          navigate('/admin/posts');
        }
      } else if (defaultAuth) {
        // For new posts, auto-assign the default author
        setFormData(prev => ({ ...prev, authorId: defaultAuth.id }));
      }
      setLoading(false);
    };
    loadData();
  }, [id, isEditing, navigate, toast]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      excerpt: prev.excerpt || getExcerpt(content),
    }));
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId),
    }));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const category = await createCategory({
      name: newCategory,
      slug: generateSlug(newCategory),
      description: '',
    });
    setCategories([...categories, category]);
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, category.id],
    }));
    setNewCategory('');
    toast({ title: 'Category created', description: `"${newCategory}" has been added.` });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    try {
      // Get dimensions for metadata
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          // Use addMedia to upload to server
          const media = await import('@/lib/api').then(m => m.addMedia(file, img.width, img.height));
          setFormData(prev => ({ ...prev, featuredImage: media.url }));
          toast({ title: 'Image uploaded', description: 'Featured image set successfully.' });
        } catch (error) {
          console.error(error);
          toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      };
      img.src = objectUrl;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process image', variant: 'destructive' });
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Please enter a title', variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      // Get the author name for the post
      const selectedAuthor = authors.find(a => a.id === formData.authorId);
      const postData = {
        ...formData,
        status,
        author: selectedAuthor?.name || user?.name || 'Admin',
        authorId: formData.authorId,
        slug: formData.slug || generateSlug(formData.title),
        publishDate: new Date(formData.publishDate).toISOString(),
      };

      if (isEditing && id) {
        await updatePost(id, postData);
        toast({ title: 'Post updated', description: 'Your changes have been saved.' });
      } else {
        const newPost = await createPost(postData);
        toast({ title: 'Post created', description: `Post has been ${status === 'published' ? 'published' : 'saved as draft'}.` });
        navigate(`/admin/posts/edit/${newPost.id}`);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save post', variant: 'destructive' });
    } finally {
      setIsSaving(false);
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/posts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave('draft')} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave('published')} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {formData.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <Input
            placeholder="Post title"
            className="text-2xl font-bold h-14"
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />

          {/* Editor */}
          <TipTapEditor
            content={formData.content}
            onChange={handleContentChange}
          />

          {/* Excerpt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Brief description of the post..."
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'draft' | 'published' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Publish Date</Label>
                <Input
                  type="datetime-local"
                  value={formData.publishDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Author */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Author</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.authorId || defaultAuthorId || ''}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  authorId: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select author" />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((author) => (
                    <SelectItem key={author.id} value={author.id}>
                      {author.name} {author.isDefault && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Featured Image</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.featuredImage ? (
                <div className="relative">
                  <img
                    src={getUploadUrl(formData.featuredImage)}
                    alt="Featured"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setFormData(prev => ({ ...prev, featuredImage: null }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                  <span className="text-xs text-muted-foreground">Max 2MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-40 overflow-y-auto space-y-2">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={formData.categories.includes(category.id)}
                      onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                    />
                    <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleAddCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter tags, separated by commas"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                }))}
              />
            </CardContent>
          </Card>

          {/* Download Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Download Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="download-enabled">Enable Download</Label>
                <Switch
                  id="download-enabled"
                  checked={formData.downloadEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, downloadEnabled: checked }))}
                />
              </div>
              {formData.downloadEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>File URL</Label>
                    <Input
                      placeholder="https://example.com/file.zip"
                      value={formData.downloadUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Filename</Label>
                    <Input
                      placeholder="file.zip"
                      value={formData.downloadFilename || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, downloadFilename: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File Size</Label>
                    <Input
                      placeholder="10 MB"
                      value={formData.downloadSize || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, downloadSize: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  placeholder="post-url-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  placeholder="Brief description for search engines..."
                  value={formData.metaDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
