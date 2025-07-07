"use client"

import { Grid3X3, List, LayoutGrid, Table } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ViewType } from "@/app/page"

interface ViewSelectorProps {
  viewType: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewSelector({ viewType, onViewChange }: ViewSelectorProps) {
  return (
    <ToggleGroup type="single" value={viewType} onValueChange={(value) => value && onViewChange(value as ViewType)}>
      <ToggleGroupItem value="grid" aria-label="Grid view" size="sm" className="bg-white/50 hover:bg-white/70">
        <Grid3X3 className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" size="sm" className="bg-white/50 hover:bg-white/70">
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="cards" aria-label="Card view" size="sm" className="bg-white/50 hover:bg-white/70">
        <LayoutGrid className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view" size="sm" className="bg-white/50 hover:bg-white/70">
        <Table className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
