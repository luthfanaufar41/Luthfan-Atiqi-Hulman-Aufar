
import { GraduateDimension, PedagogicalPractice } from './types';

export const DIMENSIONS: GraduateDimension[] = [
  'Keimanan & Ketakwaan',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi'
];

export const PEDAGOGIES: PedagogicalPractice[] = [
  PedagogicalPractice.INQUIRY,
  PedagogicalPractice.PJBL,
  PedagogicalPractice.PBL,
  PedagogicalPractice.GBL,
  PedagogicalPractice.STATION
];

export const GRADES = {
  SD: ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'],
  SMP: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
  SMA: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
  SMK: ['Kelas 10', 'Kelas 11', 'Kelas 12', 'Kelas 13']
};

export const PHASES: Record<string, Record<string, string>> = {
  SD: { 'Kelas 1': 'A', 'Kelas 2': 'A', 'Kelas 3': 'B', 'Kelas 4': 'B', 'Kelas 5': 'C', 'Kelas 6': 'C' },
  SMP: { 'Kelas 7': 'D', 'Kelas 8': 'D', 'Kelas 9': 'D' },
  SMA: { 'Kelas 10': 'E', 'Kelas 11': 'F', 'Kelas 12': 'F' },
  SMK: { 'Kelas 10': 'E', 'Kelas 11': 'F', 'Kelas 12': 'F', 'Kelas 13': 'F' }
};

export const MAJORS = {
  SMA: [
    'Umum (Fase E)',
    'MIPA (Matematika dan Ilmu Pengetahuan Alam)',
    'IPS (Ilmu Pengetahuan Sosial)',
    'Bahasa dan Budaya',
    'Keagamaan',
    'Lainnya (Pilihan Manual)'
  ],
  SMK: [
    'Pengembangan Perangkat Lunak dan Gim (PPLG)',
    'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
    'Desain Komunikasi Visual (DKV)',
    'Multimedia / Animasi',
    'Penyiaran dan Produksi Film',
    'Akuntansi dan Keuangan Lembaga (AKL)',
    'Manajemen Perkantoran dan Layanan Bisnis (MPLB)',
    'Pemasaran / Bisnis Digital',
    'Teknik Otomotif (Kendaraan Ringan/Sepeda Motor)',
    'Teknik Mesin (Pemesinan/Pengelasan)',
    'Teknik Elektronika (Industri/Audio Video)',
    'Teknik Ketenagalistrikan (TITL)',
    'Teknik Konstruksi dan Perumahan',
    'Desain Pemodelan dan Informasi Bangunan (DPIB)',
    'Teknik Geomatika / Geospasial',
    'Teknik Kimia Industri / Analisis Pengujian Laboratorium',
    'Teknik Energi Terbarukan',
    'Teknik Logistik',
    'Teknik Perkapalan / Pesawat Udara',
    'Farmasi Klinis dan Komunitas',
    'Farmasi Industri',
    'Layanan Kesehatan / Keperawatan',
    'Teknik Laboratorium Medik',
    'Pekerjaan Sosial',
    'Kuliner / Tata Boga',
    'Perhotelan',
    'Usaha Layanan Wisata',
    'Tata Busana / Desain Fashion',
    'Kecantikan dan Spa',
    'Agribisnis Tanaman (Pangan/Hortikultura/Perkebunan)',
    'Agribisnis Ternak (Ruminansia/Unggas)',
    'Agribisnis Perikanan (Air Tawar/Payau/Laut)',
    'Agribisnis Pengolahan Hasil Perikanan (APHPi)',
    'Agriteknologi Pengolahan Hasil Pertanian (APHP)',
    'Kehutanan',
    'Nautika/Teknika Kapal Niaga',
    'Nautika/Teknika Kapal Penangkap Ikan',
    'Seni Lukis / Patung / Kriya Kreatif',
    'Seni Musik / Tari / Karawitan / Teater',
    'Seni Pedalangan',
    'Lainnya (Pilihan Manual)'
  ]
};
