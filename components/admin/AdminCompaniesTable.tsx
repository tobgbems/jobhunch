"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCompany } from "@/app/admin/companies/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type AdminCompanyRow = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  size: string | null;
  website: string | null;
  description: string | null;
  created_at: string;
};

type AdminCompaniesTableProps = {
  companies: AdminCompanyRow[];
};

function formatAdminDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AdminCompaniesTable({ companies }: AdminCompaniesTableProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [selected, setSelected] = React.useState<AdminCompanyRow | null>(null);

  const [name, setName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [size, setSize] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [description, setDescription] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  function openEditor(company: AdminCompanyRow) {
    setSelected(company);
    setName(company.name);
    setIndustry(company.industry ?? "");
    setSize(company.size ?? "");
    setWebsite(company.website ?? "");
    setDescription(company.description ?? "");
    setOpen(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setSaving(true);
    try {
      const result = await updateCompany(selected.id, { name, industry, size, website, description });
      if (result.ok) {
        toast.success("Company updated.");
        setOpen(false);
        setSelected(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Companies</h1>
          <p className="mt-1 text-sm text-slate-400">
            {companies.length} total compan{companies.length === 1 ? "y" : "ies"}
            {query.trim() ? ` · ${filtered.length} shown` : ""}
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company name..."
          className="w-full border-slate-600 bg-slate-900 text-slate-100 sm:w-80"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Name</TableHead>
              <TableHead className="text-slate-400">Slug</TableHead>
              <TableHead className="text-slate-400">Industry</TableHead>
              <TableHead className="text-slate-400">Size</TableHead>
              <TableHead className="text-slate-400">Website</TableHead>
              <TableHead className="text-slate-400">Created At</TableHead>
              <TableHead className="text-right text-slate-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                  No companies match your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((company) => (
                <TableRow key={company.id} className="border-slate-700">
                  <TableCell className="max-w-[220px] truncate font-medium text-slate-100">{company.name}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-slate-300">{company.slug}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-slate-300">{company.industry ?? "—"}</TableCell>
                  <TableCell className="text-slate-300">{company.size ?? "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-slate-300">{company.website ?? "—"}</TableCell>
                  <TableCell className="text-slate-400">{formatAdminDate(company.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                      onClick={() => openEditor(company)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-slate-600 bg-slate-900 text-slate-100">
          <form onSubmit={(e) => void onSave(e)} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-white">Edit company</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update public company details used across reviews and jobs.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="company-name" className="text-slate-200">
                Name
              </Label>
              <Input
                id="company-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-slate-600 bg-slate-800 text-slate-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-industry" className="text-slate-200">
                  Industry
                </Label>
                <Input
                  id="company-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="border-slate-600 bg-slate-800 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-size" className="text-slate-200">
                  Size
                </Label>
                <Input
                  id="company-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="border-slate-600 bg-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-website" className="text-slate-200">
                Website
              </Label>
              <Input
                id="company-website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="border-slate-600 bg-slate-800 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-description" className="text-slate-200">
                Description
              </Label>
              <Textarea
                id="company-description"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-slate-600 bg-slate-800 text-slate-100"
              />
            </div>

            <DialogFooter className="border-slate-700 bg-slate-900/70">
              <Button
                type="button"
                variant="outline"
                className="border-slate-600 bg-slate-800 text-slate-100"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#27AE60] text-white hover:bg-[#219653]">
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
