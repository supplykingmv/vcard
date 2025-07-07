"use client"

import { X, SortAsc, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FilterSortPanelProps {
  sortBy: string
  setSortBy: (value: string) => void
  filterCategory: string
  setFilterCategory: (value: string) => void
  groupBy: string
  setGroupBy: (value: string) => void
  onClose: () => void
}

export function FilterSortPanel({
  sortBy,
  setSortBy,
  filterCategory,
  setFilterCategory,
  groupBy,
  setGroupBy,
  onClose,
}: FilterSortPanelProps) {
  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="h-5 w-5 text-green-600" />
            Filter & Sort Options
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <SortAsc className="h-4 w-4 text-green-600" />
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="company">Company (A-Z)</SelectItem>
                <SelectItem value="dateAdded">Date Added (Newest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-green-600" />
              Filter by Category
            </Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-green-600" />
              Group By
            </Label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="bg-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="category">Group by Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSortBy("name")
              setFilterCategory("all")
              setGroupBy("none")
            }}
            className="bg-white/50 hover:bg-white/70"
          >
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
