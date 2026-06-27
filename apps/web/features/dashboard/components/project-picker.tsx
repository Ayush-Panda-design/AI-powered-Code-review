"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setActiveProjectAction } from "@/lib/actions/shipflow";

type ProjectOption = {
  id: string;
  name: string;
};

type ProjectPickerProps = {
  projects: ProjectOption[];
  activeProjectId: string;
};

export function ProjectPicker({ projects, activeProjectId }: ProjectPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No projects yet — create one under Projects.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Project:</span>
      <Select
        value={activeProjectId}
        disabled={isPending || projects.length <= 1}
        onValueChange={(projectId) => {
          if (!projectId) return;
          startTransition(async () => {
            try {
              await setActiveProjectAction(projectId);
              router.refresh();
            } catch (error) {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to switch project",
              );
            }
          });
        }}
      >
        <SelectTrigger className="h-9 w-[220px]">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
