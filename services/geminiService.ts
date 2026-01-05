
import { GoogleGenAI, Type } from "@google/genai";
import { RPMInput, GeneratedRPM } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractCPTP(rawText: string): Promise<{ cp: string; tp: string }> {
  const prompt = `
    Ekstrak bagian "Capaian Pembelajaran" (CP) dan "Tujuan Pembelajaran" (TP) dari teks berikut.
    Jika tidak ditemukan secara eksplisit, simpulkan berdasarkan isi teks tersebut.
    Teks: ${rawText}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cp: { type: Type.STRING, description: "Isi Capaian Pembelajaran" },
          tp: { type: Type.STRING, description: "Isi Tujuan Pembelajaran" }
        },
        required: ["cp", "tp"]
      }
    }
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}

export async function generateIdea(
  type: 'readiness' | 'characteristics' | 'partnerships' | 'environment' | 'digital', 
  input: Partial<RPMInput>
): Promise<string> {
  let instruction = '';
  const context = `Jenjang ${input.level}, ${input.grade}, Mata Pelajaran ${input.subject}, Materi ${input.material}.`;

  switch(type) {
    case 'readiness':
      instruction = `
        Analisis kesiapan belajar siswa secara mendalam untuk ${context}.
        1. Identifikasi pengetahuan prasyarat (prior knowledge) yang mutlak dikuasai.
        2. Pertimbangkan tahap perkembangan kognitif usia siswa tersebut (misal: operasional konkret/formal).
        3. Sebutkan kemungkinan miskonsepsi atau hambatan belajar yang sering muncul pada topik ini.
        4. Berikan saran aktivitas pemantik singkat untuk mengecek kesiapan mereka.
      `;
      break;
    case 'characteristics':
      instruction = `
        Bedah karakteristik materi ${input.material} pada ${input.subject}.
        1. Tentukan apakah materi ini dominan Faktual, Konseptual, Prosedural, atau Metakognitif.
        2. Jelaskan tingkat abstraksi materi (apakah perlu alat peraga konkret atau bisa langsung simbolik).
        3. Hubungkan materi ini dengan konteks kehidupan nyata atau isu global yang relevan dengan siswa ${input.level}.
        4. Identifikasi "Big Idea" atau konsep kunci yang harus menetap di memori jangka panjang siswa.
      `;
      break;
    case 'partnerships':
      instruction = `Berikan ide kemitraan pembelajaran yang relevan dengan ${input.subject} materi ${input.material}. Contoh: kolaborasi orang tua, pakar tamu, komunitas lokal, atau dunia industri (DUDI) untuk SMK.`;
      break;
    case 'environment':
      instruction = `Rekomendasikan pengaturan lingkungan belajar (fisik/virtual) yang mendukung eksplorasi materi ${input.material}. Misal: setting laboratorium, outdoor learning, atau pojok baca spesifik.`;
      break;
    case 'digital':
      instruction = `Sebutkan tools digital spesifik yang meningkatkan pemahaman ${input.subject}. Jangan hanya menyebut 'internet', tapi sebutkan platform seperti PhET Simulation, GeoGebra, Quizizz, atau AI tools yang relevan dengan materi ${input.material}.`;
      break;
  }

  const prompt = `
    Bertindaklah sebagai Pakar Kurikulum dan Psikolog Pendidikan.
    Berikan ide profesional dan terstruktur (dalam 1-2 paragraf) tentang "${type}" untuk konteks berikut:
    ${context}
    
    Instruksi Khusus: ${instruction}
    
    Gunakan Bahasa Indonesia yang teknis-pedagogis namun tetap inspiratif. Jangan gunakan kata-kata klise, berikan wawasan yang konkret.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  return response.text || '';
}

export async function generateRPM(input: RPMInput): Promise<GeneratedRPM> {
  const majorText = input.major ? `Jurusan: ${input.major}` : '';
  const prompt = `
    Bertindaklah sebagai asisten ahli kurikulum sekolah di Indonesia (Kurikulum Merdeka). 
    Tugas Anda adalah membuat Perencanaan Pembelajaran Mendalam (RPM) / Modul Ajar lengkap berdasarkan data berikut:
    
    Satuan Pendidikan: ${input.schoolName}
    Jenjang/Kelas: ${input.level} / ${input.grade}
    ${majorText}
    Mata Pelajaran: ${input.subject}
    Materi: ${input.material}
    Kesiapan Peserta Didik: ${input.readiness}
    Karakteristik Materi: ${input.materialCharacteristics}
    Kemitraan Pembelajaran: ${input.partnerships}
    Lingkungan Pembelajaran: ${input.environment}
    Pemanfaatan Digital: ${input.digitalTools}
    Capaian Pembelajaran: ${input.cp}
    Tujuan Pembelajaran: ${input.tp}
    Model Pembelajaran: ${input.learningModel}
    Target Peserta Didik: ${input.targetStudents}
    Jumlah Pertemuan: ${input.numMeetings}
    Durasi: ${input.duration}
    Praktik Pedagogis: ${input.pedagogies.join(', ')}
    Dimensi Lulusan: ${input.dimensions.join(', ')}

    Persyaratan Tambahan:
    1. Sarana & Prasarana: Alat, bahan, dan fasilitas spesifik berdasarkan input Lingkungan Pembelajaran.
    2. Pertanyaan Pemantik: 2-3 pertanyaan pemicu rasa ingin tahu yang menantang (High Order Thinking).
    3. Persiapan Pembelajaran: Langkah teknis guru secara detail.
    4. Pengalaman Belajar: Detail per pertemuan sesuai sintaks pedagogi yang dipilih (${input.pedagogies.join(', ')}). Langkah-langkah harus logis dan mengalir.
    5. Remedial & Pengayaan: Strategi spesifik sesuai dengan analisis kesiapan siswa.
    6. Glosarium & Daftar Pustaka: Relevan dan mutakhir.

    PENTING: Maksimalkan penggunaan data 'Kesiapan Siswa' dan 'Karakteristik Materi' yang diberikan user untuk menyusun strategi diferensiasi dalam langkah pembelajaran.
    Pastikan menggunakan Bahasa Indonesia yang baku dan profesional dengan format output JSON yang ketat.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identitas: {
            type: Type.OBJECT,
            properties: {
              schoolName: { type: Type.STRING },
              subject: { type: Type.STRING },
              classSemester: { type: Type.STRING },
              major: { type: Type.STRING, nullable: true },
              duration: { type: Type.STRING },
              learningModel: { type: Type.STRING },
              targetStudents: { type: Type.STRING }
            },
            required: ["schoolName", "subject", "classSemester", "duration", "learningModel", "targetStudents"]
          },
          identifikasi: {
            type: Type.OBJECT,
            properties: {
              students: { type: Type.STRING },
              readiness: { type: Type.STRING },
              material: { type: Type.STRING },
              materialCharacteristics: { type: Type.STRING },
              dimensions: { type: Type.ARRAY, items: { type: Type.STRING } },
              infrastructure: { type: Type.STRING }
            },
            required: ["students", "readiness", "material", "materialCharacteristics", "dimensions", "infrastructure"]
          },
          desain: {
            type: Type.OBJECT,
            properties: {
              cp: { type: Type.STRING },
              crossDisciplinary: { type: Type.STRING },
              tp: { type: Type.STRING },
              topic: { type: Type.STRING },
              pedagogies: { type: Type.ARRAY, items: { type: Type.STRING } },
              partnerships: { type: Type.STRING },
              environment: { type: Type.STRING },
              digitalTools: { type: Type.STRING },
              triggerQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              preparation: { type: Type.STRING }
            },
            required: ["cp", "tp", "topic", "triggerQuestions", "preparation", "partnerships", "environment", "digitalTools"]
          },
          pengalaman: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meeting: { type: Type.NUMBER },
                understand: { type: Type.STRING },
                apply: { type: Type.STRING },
                reflect: { type: Type.STRING }
              }
            }
          },
          asesmen: {
            type: Type.OBJECT,
            properties: {
              initial: { type: Type.STRING },
              process: { type: Type.STRING },
              final: { type: Type.STRING },
              remedial: { type: Type.STRING },
              enrichment: { type: Type.STRING }
            }
          },
          pendukung: {
            type: Type.OBJECT,
            properties: {
              glossary: { type: Type.STRING },
              bibliography: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  const jsonStr = response.text || "{}";
  return JSON.parse(jsonStr);
}
