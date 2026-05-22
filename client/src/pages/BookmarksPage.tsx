import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Bookmark, MapPin, TrendingUp, Trash2, FileText } from "lucide-react";

export default function BookmarksPage() {
  const { data: bookmarks, isLoading, refetch } = trpc.bookmarks.list.useQuery();
  const removeBookmarkMutation = trpc.bookmarks.remove.useMutation();
  const updateNotesMutation = trpc.bookmarks.updateNotes.useMutation();

  const [editingBookmarkId, setEditingBookmarkId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);

  const handleRemoveBookmark = async (jobId: number) => {
    try {
      await removeBookmarkMutation.mutateAsync({ jobId });
      toast.success("Bookmark removed");
      refetch();
    } catch (error) {
      toast.error("Failed to remove bookmark");
      console.error(error);
    }
  };

  const handleUpdateNotes = async (jobId: number) => {
    try {
      await updateNotesMutation.mutateAsync({
        jobId,
        notes: editingNotes || null,
      });
      toast.success("Notes updated");
      setEditingBookmarkId(null);
      setEditingNotes("");
      setIsNotesDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update notes");
      console.error(error);
    }
  };

  const openNotesDialog = (bookmark: any) => {
    setEditingBookmarkId(bookmark.jobId);
    setEditingNotes(bookmark.notes || "");
    setIsNotesDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-muted-foreground mt-1">
            Your saved job listings and notes
          </p>
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
      ) : bookmarks && bookmarks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">
                      {bookmark.job?.title || "Job"}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {bookmark.job?.company || "Company"}
                    </CardDescription>
                  </div>
                  <Bookmark className="h-5 w-5 text-primary shrink-0 mt-1 fill-current" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                {bookmark.job && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{bookmark.job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{bookmark.job.experienceYearsMin}–{bookmark.job.experienceYearsMax} years</span>
                    </div>
                  </div>
                )}

                {bookmark.notes && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground line-clamp-3">{bookmark.notes}</p>
                  </div>
                )}

                {bookmark.job?.salary && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {bookmark.job.salary}
                  </Badge>
                )}

                <div className="flex gap-2 mt-auto pt-2">
                  <Dialog open={isNotesDialogOpen && editingBookmarkId === bookmark.jobId} onOpenChange={(open) => {
                    if (!open) {
                      setEditingBookmarkId(null);
                      setEditingNotes("");
                      setIsNotesDialogOpen(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => openNotesDialog(bookmark)}
                      >
                        <FileText className="h-3 w-3" />
                        Notes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Notes</DialogTitle>
                        <DialogDescription>
                          Add or update your notes for this job
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <div className="gap-2 flex flex-col">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add your thoughts about this job..."
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            className="min-h-32"
                          />
                        </div>
                        <Button
                          onClick={() => handleUpdateNotes(bookmark.jobId)}
                          className="w-full"
                          disabled={updateNotesMutation.isPending}
                        >
                          {updateNotesMutation.isPending ? "Saving..." : "Save Notes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {bookmark.job?.jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => bookmark.job?.jobUrl && window.open(bookmark.job.jobUrl, "_blank")}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleRemoveBookmark(bookmark.jobId)}
                    disabled={removeBookmarkMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Start bookmarking jobs from the job feed to save them for later
          </p>
          <Button
            onClick={() => window.location.href = "/"}
            className="gap-2"
          >
            Browse Jobs
          </Button>
        </div>
      )}
    </div>
  );
}
