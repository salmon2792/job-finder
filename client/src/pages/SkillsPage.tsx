import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Zap, Plus, Edit2, Trash2 } from "lucide-react";

export default function SkillsPage() {
  const { data: skills, isLoading, refetch } = trpc.skills.list.useQuery();
  const createSkillMutation = trpc.skills.create.useMutation();
  const updateSkillMutation = trpc.skills.update.useMutation();
  const deleteSkillMutation = trpc.skills.delete.useMutation();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    proficiency: "intermediate" as const,
    yearsOfExperience: 1,
  });

  const handleAddSkill = async () => {
    if (!formData.name) {
      toast.error("Please enter a skill name");
      return;
    }

    try {
      await createSkillMutation.mutateAsync({
        name: formData.name,
        proficiency: formData.proficiency,
        yearsOfExperience: formData.yearsOfExperience,
      });
      toast.success("Skill added successfully");
      setFormData({ name: "", proficiency: "intermediate", yearsOfExperience: 1 });
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to add skill");
      console.error(error);
    }
  };

  const handleUpdateSkill = async () => {
    if (!formData.name) {
      toast.error("Please enter a skill name");
      return;
    }

    try {
      await updateSkillMutation.mutateAsync({
        id: editingSkill.id,
        name: formData.name,
        proficiency: formData.proficiency,
        yearsOfExperience: formData.yearsOfExperience,
      });
      toast.success("Skill updated successfully");
      setFormData({ name: "", proficiency: "intermediate", yearsOfExperience: 1 });
      setEditingSkill(null);
      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update skill");
      console.error(error);
    }
  };

  const handleDeleteSkill = async (skillId: number) => {
    try {
      await deleteSkillMutation.mutateAsync({ id: skillId });
      toast.success("Skill deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete skill");
      console.error(error);
    }
  };

  const openEditDialog = (skill: any) => {
    setEditingSkill(skill);
    setFormData({
      name: skill.name,
      proficiency: skill.proficiency,
      yearsOfExperience: skill.yearsOfExperience ? Number(skill.yearsOfExperience) : 1,
    });
    setIsEditDialogOpen(true);
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case "beginner":
        return "bg-blue-100 text-blue-800";
      case "intermediate":
        return "bg-green-100 text-green-800";
      case "advanced":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
            <p className="text-muted-foreground mt-1">
              Manage your professional skills and expertise
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Skill</DialogTitle>
                <DialogDescription>
                  Add a skill to your professional profile
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="skillName">Skill Name *</Label>
                  <Input
                    id="skillName"
                    placeholder="e.g., Product Strategy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="proficiency">Proficiency Level</Label>
                  <Select value={formData.proficiency} onValueChange={(value: any) => setFormData({ ...formData, proficiency: value })}>
                    <SelectTrigger id="proficiency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="yearsExp">Years of Experience</Label>
                  <Input
                    id="yearsExp"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddSkill} className="w-full" disabled={createSkillMutation.isPending}>
                  {createSkillMutation.isPending ? "Adding..." : "Add Skill"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : skills && skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{skill.name}</CardTitle>
                  </div>
                  <Zap className="h-5 w-5 text-primary shrink-0 mt-1" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Badge className={getProficiencyColor(skill.proficiency)}>
                    {skill.proficiency.charAt(0).toUpperCase() + skill.proficiency.slice(1)}
                  </Badge>
                  {skill.yearsOfExperience && (
                    <span className="text-sm text-muted-foreground">
                      {skill.yearsOfExperience} years
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <Dialog open={isEditDialogOpen && editingSkill?.id === skill.id} onOpenChange={(open) => {
                    if (!open) {
                      setEditingSkill(null);
                      setIsEditDialogOpen(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => openEditDialog(skill)}
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Skill</DialogTitle>
                        <DialogDescription>
                          Update your skill information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <div className="gap-2 flex flex-col">
                          <Label htmlFor="editSkillName">Skill Name *</Label>
                          <Input
                            id="editSkillName"
                            placeholder="e.g., Product Strategy"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="gap-2 flex flex-col">
                          <Label htmlFor="editProficiency">Proficiency Level</Label>
                          <Select value={formData.proficiency} onValueChange={(value: any) => setFormData({ ...formData, proficiency: value })}>
                            <SelectTrigger id="editProficiency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="gap-2 flex flex-col">
                          <Label htmlFor="editYearsExp">Years of Experience</Label>
                          <Input
                            id="editYearsExp"
                            type="number"
                            min="0"
                            step="0.5"
                            value={formData.yearsOfExperience}
                            onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                          />
                        </div>
                        <Button onClick={handleUpdateSkill} className="w-full" disabled={updateSkillMutation.isPending}>
                          {updateSkillMutation.isPending ? "Updating..." : "Update Skill"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleDeleteSkill(skill.id)}
                    disabled={deleteSkillMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No skills yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add your professional skills to build your profile
          </p>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Skill</DialogTitle>
                <DialogDescription>
                  Add a skill to your professional profile
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="skillName">Skill Name *</Label>
                  <Input
                    id="skillName"
                    placeholder="e.g., Product Strategy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="proficiency">Proficiency Level</Label>
                  <Select value={formData.proficiency} onValueChange={(value: any) => setFormData({ ...formData, proficiency: value })}>
                    <SelectTrigger id="proficiency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="gap-2 flex flex-col">
                  <Label htmlFor="yearsExp">Years of Experience</Label>
                  <Input
                    id="yearsExp"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddSkill} className="w-full" disabled={createSkillMutation.isPending}>
                  {createSkillMutation.isPending ? "Adding..." : "Add Skill"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
