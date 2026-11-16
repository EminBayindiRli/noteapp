export const CLIENT_STATUS = [
  { value: 'teklif', label: 'Teklif aşaması', tone: 'violet' },
  { value: 'devam', label: 'Devam ediyor', tone: 'blue' },
  { value: 'beklemede', label: 'Beklemede', tone: 'amber' },
  { value: 'tamamlandi', label: 'Tamamlandı', tone: 'green' },
  { value: 'iptal', label: 'İptal', tone: 'gray' },
]

export const SERVICES = ['Web sitesi', 'Mobil uygulama', 'Web uygulaması', 'AI çözümü', 'Otomasyon', 'E-ticaret', 'Bakım / destek', 'Danışmanlık', 'Diğer']

export const LEAD_STATUS = [
  { value: 'yeni', label: 'Yeni', tone: 'gray' },
  { value: 'iletisim', label: 'İletişime geçildi', tone: 'blue' },
  { value: 'gorusme', label: 'Görüşme', tone: 'violet' },
  { value: 'teklif', label: 'Teklif verildi', tone: 'amber' },
  { value: 'kazanildi', label: 'Kazanıldı', tone: 'green' },
  { value: 'kaybedildi', label: 'Kaybedildi', tone: 'red' },
]

export const LEAD_SOURCES = ['Instagram', 'LinkedIn', 'Google Maps', 'Referans', 'Soğuk arama', 'E-posta', 'Web sitesi', 'Yüz yüze', 'Diğer']

export const PRIORITY = [
  { value: 'high', label: 'Yüksek', tone: 'red' },
  { value: 'med', label: 'Orta', tone: 'amber' },
  { value: 'low', label: 'Düşük', tone: 'gray' },
]

export const INCOME_CATS = ['Proje ödemesi', 'Kapora', 'Bakım ücreti', 'Danışmanlık', 'Diğer gelir']
export const EXPENSE_CATS = ['Yazılım / abonelik', 'Hosting / domain', 'Yemek', 'Ulaşım', 'Kira / fatura', 'Market', 'Eğlence', 'Eğitim', 'Ekipman', 'Vergi', 'Diğer']

export const byValue = (list, v) => list.find((x) => x.value === v) || list[0]
