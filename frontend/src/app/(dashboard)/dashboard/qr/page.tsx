'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWorkspaceStore } from '@/lib/stores';
import { QrCode, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QrPage() {
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const wsId = workspace?.id || '';
  const [form, setForm] = useState({ linkId: '', fgColor: '#000000', bgColor: '#ffffff', errorLevel: 'M' });
  const [qrData, setQrData] = useState<{ data: string; format: string; url: string } | null>(null);

  const { data: linksData } = useQuery({
    queryKey: ['links', wsId],
    queryFn: () => api.links.list(wsId, { limit: 100 }),
    enabled: !!wsId,
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => api.qr.generate(wsId, data),
    onSuccess: (res) => {
      setQrData(res);
      toast.success('QR code generated');
    },
    onError: (err: any) => toast.error(err.message || 'Failed'),
  });

  const links = linksData?.data || [];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      linkId: form.linkId,
      format: 'svg',
      fgColor: form.fgColor,
      bgColor: form.bgColor,
      errorLevel: form.errorLevel,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">QR Code Generator</h1>
        <p className="text-zinc-500 mt-1">Generate customizable QR codes for your links</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Config */}
        <form onSubmit={handleGenerate} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Select Link *</label>
            <select
              className="input"
              value={form.linkId}
              onChange={(e) => setForm({ ...form, linkId: e.target.value })}
              required
            >
              <option value="">Choose a link...</option>
              {links.map((l: any) => (
                <option key={l.id} value={l.id}>/{l.slug} – {l.title || l.destinationUrl}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Foreground Color</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer" value={form.fgColor} onChange={(e) => setForm({ ...form, fgColor: e.target.value })} />
                <input className="input flex-1" value={form.fgColor} onChange={(e) => setForm({ ...form, fgColor: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Background Color</label>
              <div className="flex items-center gap-3">
                <input type="color" className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} />
                <input className="input flex-1" value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Error Correction</label>
            <select className="input" value={form.errorLevel} onChange={(e) => setForm({ ...form, errorLevel: e.target.value })}>
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>

          <button type="submit" disabled={generateMutation.isPending} className="btn-primary w-full">
            {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <><QrCode className="w-4 h-4" /> Generate QR Code</>
            )}
          </button>
        </form>

        {/* Preview */}
        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[400px]">
          {qrData ? (
            <>
              <div
                className="bg-white rounded-2xl p-6 shadow-2xl"
                dangerouslySetInnerHTML={{ __html: qrData.data }}
              />
              <p className="text-xs text-zinc-500 mt-4">{qrData.url}</p>
              <button
                className="btn-secondary mt-4"
                onClick={() => {
                  const blob = new Blob([qrData.data], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'qrcode.svg';
                  a.click();
                }}
              >
                <Download className="w-4 h-4" /> Download SVG
              </button>
            </>
          ) : (
            <div className="text-center">
              <QrCode className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-500">Select a link and generate your QR code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
