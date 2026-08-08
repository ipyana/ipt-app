"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/Pagination";
import { ResendProgressDialog } from "@/components/ResendProgressDialog";
import { Loader2, RefreshCw, Mail, CheckSquare, X } from "lucide-react";

const statusBadge: Record<string, any> = {
  sent: { variant: "success", label: "Sent" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "danger", label: "Failed" },
};

const PAGE_SIZES = [25, 50, 100, 200];

export function EmailLogsConfig() {
  const [logs, setLogs] = useState<any[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectingAll, setSelectingAll] = useState(false);
  const [allIds, setAllIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadLogs() {
    setLoading(true);
    const params = new URLSearchParams();
    if (logFilter) params.set("status", logFilter);
    params.set("limit", String(pageSize));
    params.set("offset", String((page - 1) * pageSize));
    const res = await fetch(`/api/admin/email?${params}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setLogs(data.items || []);
    setLogTotal(data.total || 0);
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, [logFilter, page, pageSize]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (logs.length > 0 && logs.every((l) => prev.has(l.id))) {
        return new Set();
      }
      return new Set(logs.map((l) => l.id));
    });
  }

  async function handleSelectAll() {
    if (selectingAll) return;
    setSelectingAll(true);
    try {
      const params = new URLSearchParams();
      if (logFilter) params.set("status", logFilter);
      params.set("idsOnly", "1");
      const res = await fetch(`/api/admin/email?${params}`);
      const data = await res.json();
      const ids: number[] = data.ids || [];
      setAllIds(ids);
      setSelected(new Set(ids));
    } catch {
      setSelected(new Set());
    } finally {
      setSelectingAll(false);
    }
  }

  function handleDialogDone(failedIds: number[]) {
    // Select the failed ones so "Resend Failed" can be re-triggered.
    setSelected(new Set(failedIds));
    setAllIds(failedIds);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {["", "sent", "failed", "pending"].map((s) => (
          <Button key={s} variant={logFilter === s ? "primary" : "outline"} size="sm" onClick={() => { setLogFilter(s); setPage(1); setSelected(new Set()); }}>
            {s || "All"}
          </Button>
        ))}
        <span className="text-sm text-slate-400 ml-auto self-center">{logTotal} total</span>
        <Button size="sm" variant="outline" disabled={selectingAll} onClick={handleSelectAll}>
          {selectingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
          Select All ({logTotal})
        </Button>
        <Button size="sm" variant="accent" disabled={selected.size === 0} onClick={() => setDialogOpen(true)}>
          <RefreshCw className="h-3.5 w-3.5" /> Resend Selected ({selected.size})
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
          <span>{selected.size} selected</span>
          <button onClick={() => setSelected(new Set())} className="ml-auto inline-flex items-center gap-1 text-xs font-medium hover:underline">
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={logs.length > 0 && logs.every((l) => selected.has(l.id))} onChange={toggleAll} className="h-4 w-4 accent-primary-600" title="Select all on this page" />
                </TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-400">No email logs found</TableCell></TableRow>
              ) : logs.map((log: any) => (
                <TableRow key={log.id} className={selected.has(log.id) ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}>
                  <TableCell>
                    <input type="checkbox" checked={selected.has(log.id)} onChange={() => toggle(log.id)} className="h-4 w-4 accent-primary-600" />
                  </TableCell>
                  <TableCell className="text-sm">{log.recipient}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" />{log.subject}</span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{log.template || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[log.status]?.variant || "secondary"}>
                      {statusBadge[log.status]?.label || log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-red-500 max-w-[150px] truncate">{log.error || "—"}</TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString("en-TZ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Pagination
        total={logTotal}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        pageSizes={PAGE_SIZES}
      />

      <ResendProgressDialog
        open={dialogOpen}
        ids={Array.from(selected)}
        onClose={() => setDialogOpen(false)}
        onDone={handleDialogDone}
      />
    </div>
  );
}
