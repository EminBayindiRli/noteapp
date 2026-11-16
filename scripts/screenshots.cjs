// README ekran görüntülerini demo verisiyle üretir.
// Kullanım: npm run build && npx electron scripts/screenshots.cjs
const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const out = path.join(__dirname, '..', 'docs', 'screenshots')
const k = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const iso = (n) => new Date(Date.now() + n * 86400000).toISOString()
const log = (...days) => Object.fromEntries(days.map((d) => [k(d), true]))

const demo = (theme) => ({
  version: 1,
  settings: { theme, name: 'Emin' },
  clients: [
    { id: 'c1', name: 'Kahve Durağı', company: 'Ayşe Yılmaz', phone: '0532 000 00 00', email: 'info@kahveduragi.com', service: 'Web sitesi', status: 'devam', budget: 25000, deadline: k(3), createdAt: iso(-20),
      notes: [
        { id: 'n1', text: 'Menü sayfası istiyorlar; kahverengi ve krem tonlar. Instagram akışı ana sayfada görünsün.', date: iso(-2) },
        { id: 'n2', text: 'İlk görüşme yapıldı. Mobil öncelikli, hızlı açılan bir site istiyorlar.', date: iso(-12) },
      ] },
    { id: 'c2', name: 'Mavi Diş Kliniği', company: 'Dr. Can Demir', service: 'AI çözümü', status: 'teklif', budget: 40000, deadline: k(10), createdAt: iso(-6), notes: [] },
    { id: 'c3', name: 'Atölye Mobilya', company: 'Mert Kaya', service: 'E-ticaret', status: 'devam', budget: 60000, deadline: k(21), createdAt: iso(-30), notes: [] },
    { id: 'c4', name: 'Yoga Evi', service: 'Mobil uygulama', status: 'tamamlandi', budget: 35000, deadline: k(-15), createdAt: iso(-60), notes: [] },
  ],
  tasks: [
    { id: 't1', title: 'Ana sayfa tasarımını gönder', done: false, priority: 'high', due: k(0), clientId: 'c1' },
    { id: 't2', title: 'Ekim faturasını kes', done: false, priority: 'med', due: k(-1), clientId: '' },
    { id: 't3', title: 'Chatbot demo videosu hazırla', done: false, priority: 'high', due: k(0), clientId: 'c2' },
    { id: 't4', title: 'Portfolyoyu güncelle', done: false, priority: 'low', due: k(4), clientId: '' },
    { id: 't5', title: 'Ürün yükleme şablonunu hazırla', done: false, priority: 'med', due: k(2), clientId: 'c3' },
    { id: 't6', title: 'Domain yenile', done: true, priority: 'med', due: k(-2), clientId: '', doneAt: iso(-2) },
  ],
  routines: [
    { id: 'r1', title: 'Sabah yürüyüşü', log: log(0, -1, -2, -3, -4, -6, -7, -8, -10, -11, -12) },
    { id: 'r2', title: '20 sayfa kitap', log: log(-1, -2, -4, -5, -8, -9, -13) },
    { id: 'r3', title: 'E-postaları kontrol et', log: log(0, -1, -2, -3, -4, -5, -6, -7, -8, -9) },
    { id: 'r4', title: '3 yeni adaya ulaş', log: log(-1, -3, -6, -10) },
  ],
  transactions: [
    { id: 'x1', type: 'income', amount: 10000, category: 'Kapora', note: 'Kahve Durağı kapora', date: k(0), clientId: 'c1' },
    { id: 'x2', type: 'expense', amount: 850, category: 'Yazılım / abonelik', note: 'Figma', date: k(0) },
    { id: 'x3', type: 'expense', amount: 1400, category: 'Market', note: 'Haftalık market', date: k(-1) },
    { id: 'x4', type: 'income', amount: 20000, category: 'Proje ödemesi', note: 'Atölye Mobilya 1. ödeme', date: k(-3), clientId: 'c3' },
    { id: 'x5', type: 'expense', amount: 650, category: 'Hosting / domain', note: 'Sunucu', date: k(-4) },
    { id: 'x6', type: 'expense', amount: 900, category: 'Yemek', note: 'Müşteri yemeği', date: k(-5) },
    ...[-1, -2, -3, -4, -5].flatMap((m, i) => {
      const d = new Date(); d.setDate(10); d.setMonth(d.getMonth() + m)
      const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-10`
      return [
        { id: 'pi' + i, type: 'income', amount: [32000, 18000, 41000, 26000, 22000][i], category: 'Proje ödemesi', note: 'Proje', date: dk },
        { id: 'pe' + i, type: 'expense', amount: [9000, 11000, 8500, 12500, 7600][i], category: 'Kira / fatura', note: 'Giderler', date: dk },
      ]
    }),
  ],
  leads: [
    { id: 'l1', name: 'Berber Ali', sector: 'Kuaför', contact: 'Ali Usta', phone: '0555 000 00 00', source: 'Instagram', status: 'iletisim', nextDate: k(0), nextStep: 'Örnek site gönder', note: 'Online randevu istiyor' },
    { id: 'l2', name: 'Pilates Studio', sector: 'Spor', contact: 'Elif', phone: 'DM', source: 'Instagram', status: 'gorusme', nextDate: k(2), nextStep: 'Perşembe toplantı', note: '' },
    { id: 'l3', name: 'Lezzet Pide', sector: 'Restoran', contact: '', phone: '0212 000 00 00', source: 'Google Maps', status: 'yeni', nextDate: '', nextStep: 'Ara', note: 'Sitesi yok' },
    { id: 'l4', name: 'Güneş Emlak', sector: 'Emlak', contact: 'Hakan Bey', phone: '0533 000 00 00', source: 'Referans', status: 'teklif', nextDate: k(1), nextStep: 'Teklifi takip et', note: 'İlan sistemi + AI asistan' },
    { id: 'l5', name: 'Mimoza Çiçekçilik', sector: 'Perakende', contact: 'Selin', phone: '', source: 'Yüz yüze', status: 'kazanildi', nextDate: '', nextStep: '', note: '' },
    { id: 'l6', name: 'Kral Oto Yıkama', sector: 'Otomotiv', contact: '', phone: '', source: 'Soğuk arama', status: 'kaybedildi', nextDate: '', nextStep: '', note: 'Bütçe yok' },
  ],
  notes: [
    { id: 'no1', title: 'Hizmet paketleri', body: 'Başlangıç: tek sayfa site\nProfesyonel: çok sayfalı site + SEO\nAI paketi: site + WhatsApp chatbot', pinned: true, updatedAt: iso(0) },
    { id: 'no2', title: 'İçerik fikirleri', body: 'Önce/sonra site dönüşümleri paylaş', pinned: false, updatedAt: iso(-3) },
  ],
})

const shots = [
  { file: 'dashboard.png', page: 'dashboard', theme: 'light' },
  { file: 'clients.png', page: 'clients', theme: 'light' },
  { file: 'routines.png', page: 'routines', theme: 'light' },
  { file: 'finance.png', page: 'finance', theme: 'light' },
  { file: 'leads.png', page: 'leads', theme: 'light' },
  { file: 'dashboard-dark.png', page: 'dashboard', theme: 'dark' },
]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  setTimeout(() => app.exit(1), 90000)
  fs.mkdirSync(out, { recursive: true })
  const win = new BrowserWindow({ width: 1360, height: 860, show: false, webPreferences: { partition: 'screens', backgroundThrottling: false } })
  const file = path.join(__dirname, '..', 'dist', 'index.html')
  for (const s of shots) {
    await win.loadURL('about:blank')
    await win.loadFile(file, { hash: s.page })
    await win.webContents.executeJavaScript(`localStorage.setItem('noteapp-data', ${JSON.stringify(JSON.stringify(demo(s.theme)))})`)
    win.reload()
    await wait(2500)
    const img = await win.webContents.capturePage()
    fs.writeFileSync(path.join(out, s.file), img.toPNG())
    console.log('kaydedildi', s.file)
  }
  await win.webContents.session.clearStorageData()
  app.quit()
})
