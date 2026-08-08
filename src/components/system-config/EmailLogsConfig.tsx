"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/Pagination";
import { Loader2, RefreshCw, Mail, CheckCircle2, AlertCircle } from "lucide-react";

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
  const [resending, setResending] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  async function handleResend() {
    if (selected.size === 0) return;
    setResending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      setResult({ type: "success", text: data.message || "Emails resent" });
      setSelected(new Set());
      await loadLogs();
    } catch (e: any) {
      setResult({ type: "error", text: e.message });
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {["", "sent", "failed", "pending"].map((s) => (
          <Button key={s} variant={logFilter === s ? "primary" : "outline"} size="sm" onClick={() => { setLogFilter(s); setPage(1); }}>
            {s || "All"}
          </Button>
        ))}
        <span className="text-sm text-slate-400 ml-auto self-center">{logTotal} total</span>
        <Button size="sm" variant="accent" disabled={selected.size === 0 || resending} onClick={handleResend}>
          {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Resend Selected ({selected.size})
        </Button>
      </div>

      {result && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
          result.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {result.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {result.text}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={logs.length > 0 && logs.every((l) => selected.has(l.id))} onChange={toggleAll} className="h-4 w-4 accent-primary-600" title="Select all" />
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
    </div>
  );
}
