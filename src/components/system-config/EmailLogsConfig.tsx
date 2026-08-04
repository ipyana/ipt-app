"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

const statusBadge: Record<string, any> = {
  sent: { variant: "success", label: "Sent" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "danger", label: "Failed" },
};

export function EmailLogsConfig() {
  const [logs, setLogs] = useState<any[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState("");

  async function loadLogs() {
    const params = new URLSearchParams();
    if (logFilter) params.set("status", logFilter);
    const res = await fetch(`/api/admin/email?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setLogs(data.items || []);
    setLogTotal(data.total || 0);
  }

  useEffect(() => { loadLogs().finally(() => setLoading(false)); }, [logFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["", "sent", "failed", "pending"].map((s) => (
          <Button key={s} variant={logFilter === s ? "primary" : "outline"} size="sm" onClick={() => setLogFilter(s)}>
            {s || "All"}
          </Button>
        ))}
        <span className="text-sm text-slate-400 ml-auto self-center">{logTotal} total</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-slate-400">No email logs found</TableCell></TableRow>
              ) : logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{log.recipient}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{log.subject}</TableCell>
                  <TableCell className="text-xs text-slate-400">{log.template || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[log.status]?.variant || "secondary"}>
                      {statusBadge[log.status]?.label || log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-red-500 max-w-[150px] truncate">{log.error || "—"}</TableCell>
                  <TableCell className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
