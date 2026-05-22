import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Briefcase, MapPin, TrendingUp, Plus, Bookmark } from "lucide-react";

export default function JobsPage() {
  const { data: jobs, isLoading, refetch } = trpc.jobs.list.useQuery();
  const createJobMutation = trpc.jobs.create.useMutation();
  const { data: bookmarkedJobs } = trpc.bookmarks.list.useQuery();
  const addBookmarkMutation = trpc.bookmarks.add.useMutation();
  const removeBookmarkMutation = trpc.bookmarks.remove.useMutation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    experienceYearsMin: 1,
    experienceYearsMax: 3,
    salary: "",
    jobUrl: "",
    source: "",
  });

  const isJobBookmarked = (jobId: number) => {
    return bookmarkedJobs?.some(b => b.jobId === jobId) ?? false;
  };

  const handleToggleBookmark = async (jobId: number) => {
    try {
      if (isJobBookmarked(jobId)) {
        await removeBookmarkMutation.mutateAsync({ jobId });
        toast.success("Bookmark removed");
      } else {
        await addBookmarkMutation.mutateAsync({ jobId });
        toast.success("Job bookmarked");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
      console.error(error);
    }
  };

  const handleCreateJob = async () => {
    if (!formData.title || !formData.company || !formData.location) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await createJobMutation.mutateAsync({
        ...formData,
        experienceYearsMin: Number(formData.experienceYearsMin),
        experienceYearsMax: Number(formData.experienceYearsMax),
      });
      toast.success("Job added successfully");
      setFormData({
        title: "",
        company: "",
        location: "",
        description: "",
        experienceYearsMin: 1,
        experienceYearsMax: 3,
        salary: "",
        jobUrl: "",
        source: "",
      });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add job");
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Job Feed</h1>
            <p className="text-muted-foreground mt-1">
              Discover and manage job opportunities for 1-3 years of experience
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
                <DialogDescription>
                  Add a job listing to your collection
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Product Manager"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    placeholder="e.g., TechCorp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Job description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="gap-2 flex flex-col">
                    <Label htmlFor="minExp">Min Experience (years)</Label>
                    <Input
                      id="minExp"
                      type="number"
                      min="0"
                      value={formData.experienceYearsMin}
                      onChange={(e) => setFormData({ ...formData, experienceYearsMin: Number(e.target.value) })}
                    />
                  </div>
                  <div className="gap-2 flex flex-col">
                    <Label htmlFor="maxExp">Max Experience (years)</Label>
                    <Input
                      id="maxExp"
                      type="number"
                      min="0"
                      value={formData.experienceYearsMax}
                      onChange={(e) => setFormData({ ...formData, experienceYearsMax: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    placeholder="e.g., $120k - $160k"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="jobUrl">Job URL</Label>
                  <Input
                    id="jobUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.jobUrl}
                    onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    placeholder="e.g., LinkedIn, Indeed"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateJob} className="w-full" disabled={createJobMutation.isPending}>
                  {createJobMutation.isPending ? "Adding..." : "Add Job"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">{job.company}</CardDescription>
                  </div>
                  <Briefcase className="h-5 w-5 text-primary shrink-0 mt-1" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{job.experienceYearsMin}–{job.experienceYearsMax} years</span>
                  </div>
                </div>
                {job.salary && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {job.salary}
                  </Badge>
                )}
                {job.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.description}
                  </p>
                )}
                <div className="flex gap-2 mt-auto pt-2">
                  {job.jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => job.jobUrl && window.open(job.jobUrl, "_blank")}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    variant={isJobBookmarked(job.id) ? "default" : "outline"}
                    size="sm"
                    className="gap-1"
                    onClick={() => handleToggleBookmark(job.id)}
                    disabled={addBookmarkMutation.isPending || removeBookmarkMutation.isPending}
                  >
                    <Bookmark className={`h-4 w-4 ${isJobBookmarked(job.id) ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Start by adding job listings that match your 1-3 years of experience
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Job</DialogTitle>
                <DialogDescription>
                  Add a job listing to your collection
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Senior Product Manager"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    placeholder="e.g., TechCorp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Job description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="gap-2 flex flex-col">
                    <Label htmlFor="minExp">Min Experience (years)</Label>
                    <Input
                      id="minExp"
                      type="number"
                      min="0"
                      value={formData.experienceYearsMin}
                      onChange={(e) => setFormData({ ...formData, experienceYearsMin: Number(e.target.value) })}
                    />
                  </div>
                  <div className="gap-2 flex flex-col">
                    <Label htmlFor="maxExp">Max Experience (years)</Label>
                    <Input
                      id="maxExp"
                      type="number"
                      min="0"
                      value={formData.experienceYearsMax}
                      onChange={(e) => setFormData({ ...formData, experienceYearsMax: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="salary">Salary Range</Label>
                  <Input
                    id="salary"
                    placeholder="e.g., $120k - $160k"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="jobUrl">Job URL</Label>
                  <Input
                    id="jobUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.jobUrl}
                    onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    placeholder="e.g., LinkedIn, Indeed"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateJob} className="w-full" disabled={createJobMutation.isPending}>
                  {createJobMutation.isPending ? "Adding..." : "Add Job"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
