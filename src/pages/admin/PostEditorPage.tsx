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
            // Handle both old ('image') and new ('featuredImage') field names
            featuredImage: post.featuredImage || (post as any).image || null,
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
    setFormData(prev => {
      // Auto-update slug if it was empty OR if it matches the generated slug of the previous title (synced)
      // This ensures we don't overwrite manual edits
      const isSynced = !prev.slug || prev.slug === generateSlug(prev.title);

      return {
        ...prev,
        title,
        slug: isSynced ? generateSlug(title) : prev.slug,
      };
    });
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => {
      // Auto-update excerpt if it was empty OR matches the generated excerpt of previous content
      const generatedExcerpt = getExcerpt(content);
      const isExcerptSynced = !prev.excerpt || prev.excerpt === getExcerpt(prev.content);

      // Auto-update Meta Description if empty OR matches generated excerpt (syncing them)
      const isMetaSynced = !prev.metaDescription || prev.metaDescription === getExcerpt(prev.content);

      return {
        ...prev,
        content,
        excerpt: isExcerptSynced ? generatedExcerpt : prev.excerpt,
        metaDescription: isMetaSynced ? generatedExcerpt : prev.metaDescription,
      };
    });
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter(id => id !== categoryId),
    }));
  };

  // ... (skipping unchanged functions)

  {/* SEO */ }
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
          // Allow typing dashes/intermediate states; sanitize only valid URL chars but don't strip trailing dashes aggressively while typing
          onChange={(e) => setFormData(prev => ({
            ...prev,
            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
          }))}
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
        </div >
      </div >
    </div >
  );
}
