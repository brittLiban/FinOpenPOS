"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(async ({ data }) => {
        setLogs(data || []);
        // Collect unique user_ids
        const userIds = Array.from(new Set((data || []).map((log: any) => log.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          // Fetch user emails in batch
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds);
          const map: Record<string, string> = {};
          (profiles || []).forEach((p: any) => { map[p.id] = p.email; });
          setUserMap(map);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>
      {loading ? (
        <div>Loading...</div>
      ) : logs.length === 0 ? (
        <div>No log entries found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Time</th>
                <th className="px-4 py-2 border-b">User</th>
                <th className="px-4 py-2 border-b">Action</th>
                <th className="px-4 py-2 border-b">Entity</th>
                <th className="px-4 py-2 border-b">Entity ID</th>
                <th className="px-4 py-2 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-2 border-b whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">{log.user_id ? (userMap[log.user_id] || log.user_id) : 'System'}</td>
                  <td className="px-4 py-2 border-b">{log.action_type}</td>
                  <td className="px-4 py-2 border-b">{log.entity_type}</td>
                  <td className="px-4 py-2 border-b">{log.entity_id || '-'}</td>
                  <td className="px-4 py-2 border-b max-w-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-all text-xs bg-gray-50 p-2 rounded">{JSON.stringify(log.details, null, 2)}</pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
