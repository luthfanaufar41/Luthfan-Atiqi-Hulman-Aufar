
export enum PedagogicalPractice {
  INQUIRY = 'Inkuiri-Discovery Learning',
  PJBL = 'PjBL',
  PBL = 'Problem Based Learning',
  GBL = 'Game Based Learning',
  STATION = 'Station Learning'
}

export type GraduateDimension = 
  | 'Keimanan & Ketakwaan' 
  | 'Kewargaan' 
  | 'Penalaran Kritis' 
  | 'Kreativitas' 
  | 'Kolaborasi' 
  | 'Kemandirian' 
  | 'Kesehatan' 
  | 'Komunikasi';

export interface RPMInput {
  schoolName: string;
  teacherName: string;
  teacherNip: string;
  principalName: string;
  principalNip: string;
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
  grade: string;
  major?: string;
  subject: string;
  cp: string;
  tp: string;
  material: string;
  readiness: string; // Kesiapan Peserta Didik
  materialCharacteristics: string; // Karakteristik Materi
  partnerships: string; // Kemitraan Pembelajaran
  environment: string; // Lingkungan Pembelajaran
  digitalTools: string; // Pemanfaatan Digital
  numMeetings: number;
  duration: string;
  pedagogies: PedagogicalPractice[];
  dimensions: GraduateDimension[];
  learningModel: 'Luring (Tatap Muka)' | 'Daring (Online)' | 'Blended Learning';
  targetStudents: 'Reguler' | 'Cerdas Istimewa (CIBI)' | 'Kesulitan Belajar' | 'Inklusi';
}

export interface GeneratedRPM {
  identitas: {
    schoolName: string;
    subject: string;
    classSemester: string;
    major?: string;
    duration: string;
    learningModel: string;
    targetStudents: string;
  };
  identifikasi: {
    students: string;
    readiness: string;
    material: string;
    materialCharacteristics: string;
    dimensions: string[];
    infrastructure: string;
  };
  desain: {
    cp: string;
    crossDisciplinary: string;
    tp: string;
    topic: string;
    pedagogies: string[];
    partnerships: string;
    environment: string;
    digitalTools: string;
    triggerQuestions: string[];
    preparation: string;
  };
  pengalaman: {
    meeting: number;
    understand: string;
    apply: string;
    reflect: string;
  }[];
  asesmen: {
    initial: string;
    process: string;
    final: string;
    remedial: string;
    enrichment: string;
  };
  pendukung: {
    glossary: string;
    bibliography: string;
  };
}
