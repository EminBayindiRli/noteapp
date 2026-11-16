import { Database, Download, FolderOpen, Keyboard, Upload, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, Field, Input, PageHeader } from '../components/ui'
import { useStore } from '../store'

export default function Settings() {
  const { data, setSetting, replaceAll } = useStore()
  const [path, setPath] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    window.api?.dataPath().then(setPath)
  }, [])

  const flash = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  const exportData = async () => {
    if (window.api) {
      if (await window.api.exportBackup(data)) flash('Yedek kaydedildi.')
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      a.download = 'noteapp-yedek.json'
      a.click()
    }
  }
  const importData = async () => {
    if (!window.api) return
    try {
      const d = await window.api.importBackup()
      if (!d) return
      if (!window.confirm('Mevcut tüm veriler bu yedekle değiştirilecek. Devam edilsin mi?')) return
      replaceAll(d)
      flash('Yedek geri yüklendi.')
    } catch {
      flash('Dosya okunamadı.')
    }
  }

  const stats = [
    ['Müşteri', data.clients.length],
    ['Görev', data.tasks.length],
    ['Rutin', data.routines.length],
    ['Para hareketi', data.transactions.length],
    ['Aday', data.leads.length],
    ['Not', data.notes.length],
  ]

  return (
    <div className="px-10 pb-10 max-w-[760px] mx-auto">
      <PageHeader title="Ayarlar & yedek" subtitle="Tüm veriler yalnızca bu bilgisayarda saklanır. İnternet gerekmez." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Profil" icon={User} />
          <div className="px-4 pb-4">
            <Field label="Adın (karşılama mesajında görünür)">
              <Input value={data.settings.name} onChange={(e) => setSetting('name', e.target.value)} placeholder="Örn. Emin" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader title="Veriler" icon={Database} />
          <div className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-6 gap-2">
              {stats.map(([l, n]) => (
                <div key={l} className="rounded-lg bg-surface-2 p-2.5">
                  <div className="text-[17px] font-semibold tabular">{n}</div>
                  <div className="text-[11px] text-muted">{l}</div>
                </div>
              ))}
            </div>
            {path && (
              <div className="text-[12px] text-muted">
                Kayıt dosyası: <code className="text-fg-2 select-text break-all">{path}</code>
                <div className="mt-1">Her gün otomatik olarak bir yedek alınır (son 30 gün saklanır).</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button icon={Download} onClick={exportData}>Yedeği dışa aktar</Button>
              {window.api && <Button icon={Upload} onClick={importData}>Yedekten geri yükle</Button>}
              {window.api && <Button variant="ghost" icon={FolderOpen} onClick={() => window.api.openDataFolder()}>Klasörü aç</Button>}
            </div>
            {msg && <div className="text-[12.5px] text-ok">{msg}</div>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Kısayollar" icon={Keyboard} />
          <div className="px-4 pb-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[12.5px]">
            {[
              ['Ctrl + 1…7', 'Bölümler arası geçiş'],
              ['Ctrl + 8', 'Ayarlar'],
              ['Ctrl + N', 'Yeni not (Notlar bölümünde)'],
              ['Ctrl + Enter', 'Müşteri notunu kaydet'],
              ['Esc', 'Pencereyi kapat'],
            ].map(([k, d]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-muted">{d}</span>
                <kbd className="px-1.5 h-5 rounded border border-line bg-surface-2 text-[11px] font-mono">{k}</kbd>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
