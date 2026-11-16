import { AlertTriangle, CloudUpload, Database, Download, FolderOpen, Keyboard, RefreshCw, ShieldCheck, Upload, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, CardHeader, Field, Input, PageHeader } from '../components/ui'
import { useStore } from '../store'
import { cn, fmtDateTime } from '../utils'

function BackupCard({ data }) {
  const [st, setSt] = useState(null)
  const [busy, setBusy] = useState(false)
  const refresh = () => window.api.backup.status().then(setSt)

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      await refresh()
      setBusy(false)
    }
  }

  if (!st) return null
  const ok = st.dir && !st.error

  return (
    <Card>
      <CardHeader title="Otomatik yedek (bilgisayar dışına)" icon={CloudUpload} />
      <div className="px-4 pb-4 space-y-3">
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg p-3',
            ok ? 'bg-ok-soft' : st.dir ? 'bg-bad-soft' : 'bg-warn-soft',
          )}
        >
          {ok ? <ShieldCheck size={18} className="text-ok shrink-0 mt-0.5" /> : <AlertTriangle size={18} className={cn('shrink-0 mt-0.5', st.dir ? 'text-bad' : 'text-warn')} />}
          <div className="text-[12.5px] leading-relaxed min-w-0">
            {ok ? (
              <>
                <div className="font-medium text-fg">
                  Açık{st.isOneDrive ? ' — OneDrive ile buluta gidiyor' : ''}
                </div>
                <div className="text-muted">Her değişiklikte verinin bir kopyası bu klasöre yazılır, son 30 günün günlük kopyaları da saklanır.</div>
                <div className="text-muted break-all mt-1 select-text">
                  <code className="text-fg-2">{st.dir}</code>
                </div>
                <div className="text-muted mt-1">Son yedek: {st.lastAt ? fmtDateTime(st.lastAt) : 'bu oturumda henüz değişiklik yok'}</div>
              </>
            ) : st.dir ? (
              <>
                <div className="font-medium text-bad">Yedek yazılamadı</div>
                <div className="text-muted break-all">{st.error}</div>
                <div className="text-muted">Klasör silinmiş ya da USB bellek takılı olmayabilir. Başka bir klasör seç.</div>
              </>
            ) : (
              <>
                <div className="font-medium text-fg">Kapalı — verin sadece bu bilgisayarda</div>
                <div className="text-muted">Bilgisayar bozulursa verin kaybolabilir. OneDrive, Google Drive ya da USB bellekte bir klasör seç.</div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!st.dir && st.suggested && (
            <Button variant="primary" icon={CloudUpload} disabled={busy} onClick={() => run(() => window.api.backup.useDefault(data))}>
              OneDrive'a yedekle
            </Button>
          )}
          <Button icon={FolderOpen} disabled={busy} onClick={() => run(() => window.api.backup.choose(data))}>
            {st.dir ? 'Klasörü değiştir' : 'Klasör seç'}
          </Button>
          {st.dir && (
            <>
              <Button icon={RefreshCw} disabled={busy} onClick={() => run(() => window.api.backup.now(data))}>
                Şimdi yedekle
              </Button>
              <Button variant="ghost" onClick={() => window.api.backup.open()}>Klasörü aç</Button>
              <Button variant="ghost" disabled={busy} onClick={() => window.confirm('Otomatik yedek kapatılsın mı? Verin sadece bu bilgisayarda kalır.') && run(() => window.api.backup.disable())}>
                Kapat
              </Button>
            </>
          )}
        </div>

        <div className="text-[11.5px] text-muted leading-relaxed border-t border-line pt-3">
          <b className="text-fg-2">Bilgisayar değişirse:</b> Önce OneDrive'a aynı hesapla giriş yapıp eşitlemenin bitmesini bekle, sonra NoteApp'i kur. Veriler ilk açılışta otomatik geri gelir.
          Gelmezse <i>Ayarlar → Yedekten geri yükle</i> ile yedek klasöründeki <code>noteapp-data.json</code> dosyasını seç.
        </div>
      </div>
    </Card>
  )
}

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
      <PageHeader title="Ayarlar & yedek" subtitle="Uygulama internetsiz çalışır. Verilerin bu bilgisayarda ve seçtiğin yedek klasöründe tutulur." />

      <div className="space-y-5">
        <Card>
          <CardHeader title="Profil" icon={User} />
          <div className="px-4 pb-4">
            <Field label="Adın (karşılama mesajında görünür)">
              <Input value={data.settings.name} onChange={(e) => setSetting('name', e.target.value)} placeholder="Örn. Emin" />
            </Field>
          </div>
        </Card>

        {window.api && <BackupCard data={data} />}

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
