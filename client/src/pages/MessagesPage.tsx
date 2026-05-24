import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Calendar, Clock, Send, Trash2, Archive } from "lucide-react";
import { format } from "date-fns";

export default function MessagesPage() {
  const { user } = useAuth();
  const [cronExpression, setCronExpression] = useState("0 9 * * *"); // Daily at 9 AM UTC
  const [scheduleDescription, setScheduleDescription] = useState("");

  const messagesQuery = trpc.messages.list.useQuery();
  const createMessageMutation = trpc.messages.create.useMutation();
  const updateStatusMutation = trpc.messages.updateStatus.useMutation();
  const scheduleDailyMutation = trpc.messages.scheduleDaily.useMutation();

  const handleCreateMessage = async () => {
    try {
      const title = prompt("Enter message title:");
      if (!title) return;

      const description = prompt("Enter message description (optional):");
      const content = prompt("Enter message content (paste your job report):");
      
      if (!content) {
        toast.error("Message content is required");
        return;
      }

      await createMessageMutation.mutateAsync({
        title,
        description: description || undefined,
        reportDate: new Date(),
        messageContent: content,
      });

      toast.success("Message created successfully");
      messagesQuery.refetch();
    } catch (error) {
      toast.error("Failed to create message");
    }
  };

  const handleScheduleDaily = async (messageId: number) => {
    try {
      if (!cronExpression.trim()) {
        toast.error("Please enter a cron expression");
        return;
      }

      await scheduleDailyMutation.mutateAsync({
        messageId,
        cron: cronExpression,
        description: scheduleDescription || undefined,
      });

      toast.success("Message scheduled successfully");
      setCronExpression("0 9 * * *");
      setScheduleDescription("");
      messagesQuery.refetch();
    } catch (error) {
      toast.error("Failed to schedule message");
    }
  };

  const handleUpdateStatus = async (messageId: number, status: "pending" | "sent" | "archived") => {
    try {
      await updateStatusMutation.mutateAsync({
        messageId,
        status,
      });

      toast.success(`Message marked as ${status}`);
      messagesQuery.refetch();
    } catch (error) {
      toast.error("Failed to update message status");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and schedule daily job report deliveries
          </p>
        </div>
        <Button onClick={handleCreateMessage} className="gap-2">
          <Send className="w-4 h-4" />
          New Message
        </Button>
      </div>

      {messagesQuery.isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
        <div className="grid gap-4">
          {messagesQuery.data.map((message) => (
            <Card key={message.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{message.title}</CardTitle>
                    {message.description && (
                      <CardDescription className="mt-1">{message.description}</CardDescription>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    message.status === "sent" ? "bg-green-100 text-green-800" :
                    message.status === "archived" ? "bg-gray-100 text-gray-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {message.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(message.reportDate), "MMM dd, yyyy")}
                  </div>
                  {message.sentAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Sent {format(new Date(message.sentAt), "MMM dd, yyyy HH:mm")}
                    </div>
                  )}
                </div>

                <div className="bg-muted p-3 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap line-clamp-6">
                    {message.messageContent.substring(0, 300)}...
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Clock className="w-4 h-4" />
                        Schedule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Daily Delivery</DialogTitle>
                        <DialogDescription>
                          Set up automatic daily delivery of this job message
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cron">Cron Expression (6-field UTC)</Label>
                          <Input
                            id="cron"
                            placeholder="0 9 * * * (daily at 9 AM UTC)"
                            value={cronExpression}
                            onChange={(e) => setCronExpression(e.target.value)}
                            className="mt-1 font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Format: sec min hour dom mon dow (e.g., "0 9 * * *" = daily 9 AM)
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="description">Description (optional)</Label>
                          <Input
                            id="description"
                            placeholder="e.g., Daily CPU performance jobs"
                            value={scheduleDescription}
                            onChange={(e) => setScheduleDescription(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          onClick={() => handleScheduleDaily(message.id)}
                          disabled={scheduleDailyMutation.isPending}
                          className="w-full"
                        >
                          {scheduleDailyMutation.isPending ? "Scheduling..." : "Schedule"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {message.status !== "sent" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(message.id, "sent")}
                      disabled={updateStatusMutation.isPending}
                    >
                      Mark as Sent
                    </Button>
                  )}

                  {message.status !== "archived" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(message.id, "archived")}
                      disabled={updateStatusMutation.isPending}
                      className="gap-1"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No messages yet</p>
            <Button onClick={handleCreateMessage}>Create First Message</Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Cron Expression Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><code className="bg-white px-2 py-1 rounded">0 9 * * *</code> - Daily at 9:00 AM UTC</p>
          <p><code className="bg-white px-2 py-1 rounded">0 0 * * 1</code> - Every Monday at midnight UTC</p>
          <p><code className="bg-white px-2 py-1 rounded">0 */6 * * *</code> - Every 6 hours</p>
          <p className="text-xs text-muted-foreground mt-3">
            Format: seconds minutes hours day-of-month month day-of-week (all in UTC)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
