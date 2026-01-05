
import React, { useState, useRef, useEffect } from 'react';
import { RPMInput, GeneratedRPM, PedagogicalPractice, GraduateDimension } from './types';
import { DIMENSIONS, PEDAGOGIES, GRADES, MAJORS, PHASES } from './constants';
import { generateRPM, extractCPTP, generateIdea } from './services/geminiService';

interface ValidationErrors {
  [key: string]: string;
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RPMInput>({
    schoolName: '',
    teacherName: '',
    teacherNip: '',
    principalName: '',
    principalNip: '',
    level: 'SD',
    grade: 'Kelas 1',
    major: '',
    subject: '',
    cp: '',
    tp: '',
    material: '',
    readiness: '',
    materialCharacteristics: '',
    partnerships: '',
    environment: '',
    digitalTools: '',
    numMeetings: 1,
    duration: '',
    pedagogies: [],
    dimensions: [],
    learningModel: 'Luring (Tatap Muka)',
    targetStudents: 'Reguler'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<GeneratedRPM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [customMajor, setCustomMajor] = useState('');
  
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenRpmTutorial');
    if (!hasSeenTutorial) {
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const finishTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('hasSeenRpmTutorial', 'true');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: name === 'numMeetings' ? parseInt(value) || 1 : value,
      };

      if (name === 'level') {
        newState.grade = GRADES[value as keyof typeof GRADES][0];
        if (value === 'SMA' || value === 'SMK') {
          newState.major = MAJORS[value as 'SMA' | 'SMK'][0];
        } else {
          newState.major = '';
        }
        setCustomMajor('');
      }
      return newState;
    });
  };

  const handleIdeation = async (type: 'readiness' | 'characteristics' | 'partnerships' | 'environment' | 'digital') => {
    if (!formData.subject || !formData.material) {
      alert('Silakan isi Mata Pelajaran dan Materi (Langkah 2 & 5) terlebih dahulu agar AI memiliki konteks.');
      return;
    }

    setLoadingIdeas(prev => ({ ...prev, [type]: true }));

    try {
      const idea = await generateIdea(type, formData);
      const fieldName = type === 'characteristics' ? 'materialCharacteristics' : 
                        type === 'digital' ? 'digitalTools' : type;
      
      setFormData(prev => ({
        ...prev,
        [fieldName]: idea
      }));
      
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    } catch (err) {
      alert('Gagal mengambil ide AI. Silakan coba lagi.');
    } finally {
      setLoadingIdeas(prev => ({ ...prev, [type]: false }));
    }
  };

  const handlePedagogyChange = (index: number, value: PedagogicalPractice) => {
    const newPeds = [...formData.pedagogies];
    newPeds[index] = value;
    setFormData(prev => ({ ...prev, pedagogies: newPeds }));
    if (newPeds.length >= formData.numMeetings && newPeds.every(p => !!p)) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.pedagogies;
        return next;
      });
    }
  };

  const toggleDimension = (dim: GraduateDimension) => {
    const newDimensions = formData.dimensions.includes(dim)
      ? formData.dimensions.filter(d => d !== dim)
      : [...formData.dimensions, dim];

    setFormData(prev => ({ ...prev, dimensions: newDimensions }));
    if (newDimensions.length > 0) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.dimensions;
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: ValidationErrors = {};
    if (step === 1) {
      if (!formData.schoolName.trim()) errors.schoolName = "Nama Satuan Pendidikan wajib diisi.";
      if (!formData.teacherName.trim()) errors.teacherName = "Nama Guru wajib diisi.";
      if (!formData.principalName.trim()) errors.principalName = "Nama Kepala Sekolah wajib diisi.";
    } else if (step === 2) {
      if (!formData.subject.trim()) errors.subject = "Mata Pelajaran wajib diisi.";
      if (hasMajorField && isCustomMajorSelected && !customMajor.trim()) errors.customMajor = "Keahlian wajib diisi.";
    } else if (step === 3) {
      if (!formData.readiness.trim()) errors.readiness = "Kesiapan Peserta Didik wajib diisi.";
      if (!formData.materialCharacteristics.trim()) errors.materialCharacteristics = "Karakteristik Materi wajib diisi.";
      if (!formData.partnerships.trim()) errors.partnerships = "Kemitraan wajib diisi.";
      if (!formData.environment.trim()) errors.environment = "Lingkungan wajib diisi.";
      if (!formData.digitalTools.trim()) errors.digitalTools = "Pemanfaatan Digital wajib diisi.";
    } else if (step === 4) {
      if (!formData.cp.trim() || formData.cp.trim().length < 20) errors.cp = "CP wajib diisi secara lengkap.";
      if (!formData.tp.trim() || formData.tp.trim().length < 10) errors.tp = "TP wajib diisi secara lengkap.";
    } else if (step === 5) {
      if (!formData.material.trim()) errors.material = "Materi Pokok wajib diisi.";
      if (!formData.duration.trim()) errors.duration = "Durasi pertemuan wajib diisi.";
      if (formData.pedagogies.length < formData.numMeetings || formData.pedagogies.some(p => !p)) errors.pedagogies = "Pilih pedagogi tiap pertemuan.";
      if (formData.dimensions.length === 0) errors.dimensions = "Pilih minimal satu dimensi.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const runSmartExtract = async (text: string) => {
    setIsExtracting(true);
    try {
      const extracted = await extractCPTP(text);
      setFormData(prev => ({ ...prev, cp: extracted.cp, tp: extracted.tp }));
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.cp;
        delete next.tp;
        return next;
      });
      setIsImportModalOpen(false);
      setImportText('');
    } catch (err) {
      alert('Gagal mengekstrak teks.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) await runSmartExtract(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setIsLoading(true);
    setError(null);
    try {
      const finalData = { ...formData };
      if (formData.major === 'Lainnya (Pilihan Manual)' && customMajor) finalData.major = customMajor;
      const rpm = await generateRPM(finalData);
      setResult(rpm);
      setShowToast(true);
      setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      setError(err.message || 'Gagal menghasilkan RPM.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToGoogleDocs = async () => {
    const content = document.getElementById('rpm-table-container');
    if (content) {
      try {
        const blob = new Blob([content.innerHTML], { type: "text/html" });
        const data = [new ClipboardItem({ ["text/html"]: blob })];
        await navigator.clipboard.write(data);
        alert('Konten telah disalin! Tab baru Google Dokumen akan dibuka.');
        window.open('https://docs.new', '_blank');
      } catch (err) {
        alert('Gagal menyalin otomatis.');
      }
    }
  };

  const hasMajorField = formData.level === 'SMA' || formData.level === 'SMK';
  const isCustomMajorSelected = formData.major === 'Lainnya (Pilihan Manual)';
  const currentFase = PHASES[formData.level]?.[formData.grade] || '-';
  const subjectLabel = formData.level === 'SMK' ? 'Mata Pelajaran (Kejuruan/Umum)' : 'Mata Pelajaran';

  const ErrorMsg = ({ field }: { field: string }) => (
    validationErrors[field] ? <p className="mt-1 text-xs text-red-500 font-medium">{validationErrors[field]}</p> : null
  );

  const steps = [
    { id: 1, title: 'Identitas' },
    { id: 2, title: 'Konteks' },
    { id: 3, title: 'Inspirasi' },
    { id: 4, title: 'Kompetensi' },
    { id: 5, title: 'Pedagogi' }
  ];

  const TUTORIAL_STEPS = [
    { title: "Selamat Datang!", content: "Gunakan AI untuk membuat Modul Ajar secara cepat dan tepat.", position: "center" },
    { title: "Sistem Tahapan", content: "Formulir dibagi menjadi 5 bagian agar pengisian lebih terarah.", selector: "#form-stepper" },
    { title: "Inspirasi AI ✨", content: "Klik tombol Ide AI jika Anda butuh inspirasi pengisian data.", selector: "#ai-inspiration-section" },
    { title: "Generate", content: "Hasil akan muncul setelah semua tahap selesai.", selector: "#generate-btn" }
  ];

  return (
    <div className="min-h-screen pb-20 bg-slate-50 relative overflow-hidden">
      {/* Onboarding Overlay */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-indigo-100 p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{TUTORIAL_STEPS[tutorialStep].title}</h3>
            <p className="text-slate-600 leading-relaxed mb-8">{TUTORIAL_STEPS[tutorialStep].content}</p>
            <div className="flex items-center justify-between">
              <button onClick={() => setTutorialStep(prev => prev! > 0 ? prev! - 1 : prev)} disabled={tutorialStep === 0} className="px-4 py-2 text-slate-500 font-bold disabled:opacity-30">Sebelumnya</button>
              <button onClick={() => tutorialStep === TUTORIAL_STEPS.length - 1 ? finishTutorial() : setTutorialStep(prev => prev! + 1)} className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg">{tutorialStep === TUTORIAL_STEPS.length - 1 ? "Mulai" : "Lanjut"}</button>
            </div>
          </div>
          <style>{` ${TUTORIAL_STEPS[tutorialStep].selector ? `${TUTORIAL_STEPS[tutorialStep].selector} { position: relative; z-index: 210; box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.4); border-radius: 1rem; }` : ''} `}</style>
        </div>
      )}

      {/* Toast Notification */}
      <div className={`fixed top-4 right-4 z-[100] transition-all duration-700 ease-out transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
        <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-4 border border-emerald-500/30 backdrop-blur-md">
          <div className="bg-white/20 p-2 rounded-full animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <div><p className="font-bold">Berhasil!</p><p className="text-xs">Modul Ajar siap disalin.</p></div>
        </div>
      </div>

      <header className="relative z-10 bg-indigo-700 text-white py-16 px-4 shadow-2xl mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Generator RPM</h1>
        <p className="text-indigo-100 text-lg md:text-xl font-medium">Modul Ajar & Perencanaan Pembelajaran Mendalam</p>
        <div className="mt-4 text-xs font-semibold opacity-75 italic">Created by: Luthfan Atiqi H.A, S.Tr.Pi</div>
      </header>

      <main className="max-w-5xl mx-auto px-4 relative z-10">
        <div id="form-stepper" className="mb-10 px-4">
          <div className="flex items-center justify-between relative">
            {/* Stepper Progress Bar Background */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>
            {/* Stepper Active Bar */}
            <div className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
            
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep >= s.id ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>
                  {s.id}
                </div>
                <span className={`hidden md:block absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${currentStep >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <section className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-10 mb-10 border border-white/50 transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* STEP 1: IDENTITAS */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                  Langkah 1: Identitas Dasar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Satuan Pendidikan & Guru</label>
                    <input placeholder="Nama Satuan Pendidikan" name="schoolName" value={formData.schoolName} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none ${validationErrors.schoolName ? 'border-red-500' : 'border-slate-300'}`} />
                    <ErrorMsg field="schoolName" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input placeholder="Nama Guru" name="teacherName" value={formData.teacherName} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl border ${validationErrors.teacherName ? 'border-red-500' : 'border-slate-300'}`} />
                      <input placeholder="NIP Guru" name="teacherNip" value={formData.teacherNip} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Identitas Kepala Sekolah</label>
                    <input placeholder="Nama Kepala Sekolah" name="principalName" value={formData.principalName} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl border ${validationErrors.principalName ? 'border-red-500' : 'border-slate-300'}`} />
                    <ErrorMsg field="principalName" />
                    <input placeholder="NIP Kepala Sekolah" name="principalNip" value={formData.principalNip} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: KONTEKS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                  Langkah 2: Konteks Pembelajaran
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jenjang</label>
                        <select name="level" value={formData.level} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm">
                          <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="SMK">SMK</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kelas</label>
                        <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white shadow-sm">
                          {GRADES[formData.level as keyof typeof GRADES].map(g => (<option key={g} value={g}>{g}</option>))}
                        </select>
                        <p className="text-[10px] text-indigo-500 font-bold text-right">FASE {currentFase}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{subjectLabel}</label>
                      <input placeholder="Contoh: Matematika" name="subject" value={formData.subject} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl border ${validationErrors.subject ? 'border-red-500' : 'border-slate-300'}`} />
                      <ErrorMsg field="subject" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {hasMajorField && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Jurusan / Konsentrasi</label>
                        <select name="major" value={formData.major} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white">
                          {MAJORS[formData.level as 'SMA' | 'SMK'].map(m => (<option key={m} value={m}>{m}</option>))}
                        </select>
                        {isCustomMajorSelected && (
                          <input placeholder="Tulis Bidang Keahlian..." value={customMajor} onChange={(e) => setCustomMajor(e.target.value)} className="mt-2 w-full px-4 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50" />
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Model</label>
                        <select name="learningModel" value={formData.learningModel} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white">
                          <option value="Luring (Tatap Muka)">Luring</option><option value="Daring (Online)">Daring</option><option value="Blended Learning">Blended</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target</label>
                        <select name="targetStudents" value={formData.targetStudents} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white">
                          <option value="Reguler">Reguler</option><option value="CIBI">CIBI</option><option value="Kesulitan">Kesulitan</option><option value="Inklusi">Inklusi</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: INSPIRASI */}
            {currentStep === 3 && (
              <div id="ai-inspiration-section" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                  Langkah 3: Inspirasi & Lingkungan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase">Kesiapan Peserta Didik *</label>
                      <button type="button" onClick={() => handleIdeation('readiness')} disabled={loadingIdeas.readiness} className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100 hover:bg-indigo-100 transition shadow-sm">
                        {loadingIdeas.readiness ? 'Sedang Berpikir...' : 'Ide AI ✨'}
                      </button>
                    </div>
                    <textarea name="readiness" rows={3} value={formData.readiness} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Jelaskan pengetahuan awal yang dibutuhkan..." />
                    <ErrorMsg field="readiness" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase">Karakteristik Materi *</label>
                      <button type="button" onClick={() => handleIdeation('characteristics')} disabled={loadingIdeas.characteristics} className="text-[10px] bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold border border-purple-100 hover:bg-purple-100 transition shadow-sm">
                        {loadingIdeas.characteristics ? 'Sedang Berpikir...' : 'Ide AI ✨'}
                      </button>
                    </div>
                    <textarea name="materialCharacteristics" rows={3} value={formData.materialCharacteristics} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Fokus pada aspek konseptual & prosedural..." />
                    <ErrorMsg field="materialCharacteristics" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase">Kemitraan Pembelajaran *</label>
                      <button type="button" onClick={() => handleIdeation('partnerships')} disabled={loadingIdeas.partnerships} className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold border border-emerald-100 hover:bg-emerald-100 transition shadow-sm">
                        {loadingIdeas.partnerships ? 'Sedang Berpikir...' : 'Ide AI ✨'}
                      </button>
                    </div>
                    <textarea name="partnerships" rows={3} value={formData.partnerships} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Orangtua, masyarakat, industri..." />
                    <p className="text-[10px] text-slate-400 italic">Contoh: kolaborasi orangtua, masyarakat, atau rekan guru sejawat</p>
                    <ErrorMsg field="partnerships" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase">Lingkungan Belajar *</label>
                      <button type="button" onClick={() => handleIdeation('environment')} disabled={loadingIdeas.environment} className="text-[10px] bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-bold border border-orange-100 hover:bg-orange-100 transition shadow-sm">
                        {loadingIdeas.environment ? 'Sedang Berpikir...' : 'Ide AI ✨'}
                      </button>
                    </div>
                    <textarea name="environment" rows={3} value={formData.environment} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ruang kelas, laboratorium, taman..." />
                    <p className="text-[10px] text-slate-400 italic">Contoh: ruang kelas, lab atau yang lainnya</p>
                    <ErrorMsg field="environment" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 uppercase">Pemanfaatan Digital *</label>
                      <button type="button" onClick={() => handleIdeation('digital')} disabled={loadingIdeas.digital} className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-100 hover:bg-blue-100 transition shadow-sm">
                        {loadingIdeas.digital ? 'Sedang Berpikir...' : 'Ide AI ✨'}
                      </button>
                    </div>
                    <textarea name="digitalTools" rows={2} value={formData.digitalTools} onChange={handleInputChange} className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Aplikasi, LMS, platform online..." />
                    <p className="text-[10px] text-slate-400 italic text-center">Contoh: Aplikasi Pembelajaran, Platform Online, Google Classroom, dll.</p>
                    <ErrorMsg field="digitalTools" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: KOMPETENSI */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                    Langkah 4: Kompetensi Utama
                  </h3>
                  <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Impor Smart CP/TP
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Capaian Pembelajaran (CP) *</label>
                    <textarea name="cp" rows={8} value={formData.cp} onChange={handleInputChange} className={`w-full px-4 py-4 text-sm rounded-2xl border focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed ${validationErrors.cp ? 'border-red-500' : 'border-slate-300'}`} placeholder="Tempelkan paragraf CP dari kemendikbud..." />
                    <ErrorMsg field="cp" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">Tujuan Pembelajaran (TP) *</label>
                    <textarea name="tp" rows={8} value={formData.tp} onChange={handleInputChange} className={`w-full px-4 py-4 text-sm rounded-2xl border focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed ${validationErrors.tp ? 'border-red-500' : 'border-slate-300'}`} placeholder="Tuliskan butir-butir TP yang ingin dicapai..." />
                    <ErrorMsg field="tp" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: PEDAGOGI */}
            {currentStep === 5 && (
              <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span>
                  Langkah 5: Struktur & Pedagogi
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Materi Pokok *</label>
                    <input name="material" value={formData.material} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl border ${validationErrors.material ? 'border-red-500' : 'border-slate-300'}`} />
                    <ErrorMsg field="material" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Jml Pertemuan *</label>
                    <input type="number" name="numMeetings" value={formData.numMeetings} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300" min="1" max="10" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Durasi (e.g. 2 x 45 mnt) *</label>
                    <input name="duration" value={formData.duration} onChange={handleInputChange} className={`w-full px-4 py-2.5 rounded-xl border ${validationErrors.duration ? 'border-red-500' : 'border-slate-300'}`} />
                    <ErrorMsg field="duration" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700">Pilih Praktik Pedagogis per Pertemuan *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: formData.numMeetings }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                        <select value={formData.pedagogies[i] || ''} onChange={(e) => handlePedagogyChange(i, e.target.value as PedagogicalPractice)} className="flex-1 bg-transparent text-sm font-medium outline-none">
                          <option value="" disabled>Pilih Sintaks Pedagogi</option>
                          {PEDAGOGIES.map(p => (<option key={p} value={p}>{p}</option>))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <ErrorMsg field="pedagogies" />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700">Dimensi Profil Pelajar Pancasila *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DIMENSIONS.map(dim => (
                      <button key={dim} type="button" onClick={() => toggleDimension(dim)} className={`px-3 py-2 text-[10px] md:text-xs font-bold rounded-xl border transition-all ${formData.dimensions.includes(dim) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'}`}>
                        {dim}
                      </button>
                    ))}
                  </div>
                  <ErrorMsg field="dimensions" />
                </div>
              </div>
            )}

            {/* NAVIGASI TOMBOL */}
            <div className="pt-10 flex flex-col-reverse md:flex-row justify-between gap-4 border-t border-slate-100">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="w-full md:w-auto px-8 py-4 text-slate-500 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition">
                  Sebelumnya
                </button>
              )}
              <div className="flex-1"></div>
              {currentStep < 5 ? (
                <button type="button" onClick={nextStep} className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition active:scale-95">
                  Langkah Selanjutnya
                </button>
              ) : (
                <button id="generate-btn" type="submit" disabled={isLoading} className="w-full md:w-auto px-12 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-1 transition active:scale-95 disabled:opacity-50 disabled:translate-y-0">
                  {isLoading ? (
                    <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menghasilkan...</span>
                  ) : 'Generate Modul Ajar Pro'}
                </button>
              )}
            </div>
            {error && <p className="mt-4 text-red-600 text-center font-bold text-sm bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          </form>
        </section>

        {result && (
          <section id="result-section" className="mt-20 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center bg-emerald-600 text-white p-8 rounded-3xl shadow-2xl gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-extrabold mb-1 tracking-tight">Modul Ajar Berhasil Disusun!</h2>
                <p className="text-emerald-50 text-sm font-medium opacity-90">Rencana Pembelajaran Mendalam Anda telah siap ditinjau.</p>
              </div>
              <button onClick={copyToGoogleDocs} className="w-full md:w-auto bg-white text-emerald-700 px-8 py-4 rounded-2xl font-extrabold hover:scale-105 transition shadow-2xl active:scale-95 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Salin & Buka Google Dokumen
              </button>
            </div>

            <div id="rpm-table-container" className="bg-white p-6 sm:p-12 shadow-2xl rounded-3xl overflow-x-auto text-sm leading-relaxed text-justify border border-slate-100 relative">
              <style>{`
                .rpm-table { width: 100%; border-collapse: collapse; margin-bottom: 2.5rem; border: 2px solid #1e293b; min-width: 800px; } 
                .rpm-table th, .rpm-table td { border: 1px solid #1e293b; padding: 14px; word-break: break-word; vertical-align: top; } 
                .section-header { background: #1e293b; color: white; text-align: center; font-weight: 800; text-transform: uppercase; padding: 20px; letter-spacing: 0.05em; font-size: 1.1rem; }
                .meeting-subhead { background: #f1f5f9; text-align: center; font-weight: 700; }
                @media (max-width: 640px) {
                  .rpm-table { font-size: 13px; }
                }
              `}</style>
              
              <table className="rpm-table">
                <thead><tr><th colSpan={2} className="section-header">1. Identitas Pembelajaran</th></tr></thead>
                <tbody>
                  <tr><th style={{width:'35%', background:'#f8fafc'}}>Satuan Pendidikan</th><td>{result.identitas.schoolName}</td></tr>
                  {result.identitas.major && <tr><th style={{background:'#f8fafc'}}>{formData.level === 'SMK' ? 'Konsentrasi' : 'Jurusan'}</th><td>{result.identitas.major}</td></tr>}
                  <tr><th style={{background:'#f8fafc'}}>Mata Pelajaran</th><td>{result.identitas.subject}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Kelas / Semester</th><td>{result.identitas.classSemester}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Durasi Pertemuan</th><td>{result.identitas.duration}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Model Pembelajaran</th><td>{result.identitas.learningModel}</td></tr>
                </tbody>
              </table>

              <table className="rpm-table">
                <thead><tr><th colSpan={2} className="section-header">2. Identifikasi & Karakteristik</th></tr></thead>
                <tbody>
                  <tr><th style={{width:'35%', background:'#f8fafc'}}>Kesiapan Siswa</th><td>{result.identifikasi.readiness}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Karakteristik Materi</th><td>{result.identifikasi.materialCharacteristics}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Dimensi Profil Lulusan</th><td>{result.identifikasi.dimensions.join(', ')}</td></tr>
                </tbody>
              </table>

              <table className="rpm-table">
                <thead><tr><th colSpan={2} className="section-header">3. Desain & Lingkungan Belajar</th></tr></thead>
                <tbody>
                  <tr><th style={{width:'35%', background:'#f8fafc'}}>Capaian Pembelajaran</th><td>{result.desain.cp}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Tujuan Pembelajaran</th><td>{result.desain.tp}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Kemitraan</th><td>{result.desain.partnerships}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Lingkungan Belajar</th><td>{result.desain.environment}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Pemanfaatan Digital</th><td>{result.desain.digitalTools}</td></tr>
                </tbody>
              </table>

              <table className="rpm-table">
                <thead>
                  <tr><th colSpan={4} className="section-header">4. Pengalaman Belajar (Sintaks Pembelajaran)</th></tr>
                  <tr className="meeting-subhead">
                    <th style={{width: '70px'}}>Pert.</th>
                    <th>Pendahuluan (Memahami)</th>
                    <th>Kegiatan Inti (Mengaplikasi)</th>
                    <th>Penutup (Refleksi)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.pengalaman.map((exp, idx) => (
                    <tr key={idx}><td className="text-center font-bold">{exp.meeting}</td><td>{exp.understand}</td><td>{exp.apply}</td><td>{exp.reflect}</td></tr>
                  ))}
                </tbody>
              </table>

              <table className="rpm-table">
                <thead><tr><th colSpan={2} className="section-header">5. Asesmen Pembelajaran</th></tr></thead>
                <tbody>
                  <tr><th style={{width:'35%', background:'#f8fafc'}}>Asesmen Awal (Diagnostik)</th><td>{result.asesmen.initial}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Asesmen Proses (Formatif)</th><td>{result.asesmen.process}</td></tr>
                  <tr><th style={{background:'#f8fafc'}}>Asesmen Akhir (Sumatif)</th><td>{result.asesmen.final}</td></tr>
                </tbody>
              </table>

              <div className="mt-20 flex flex-col md:flex-row justify-between gap-16 md:gap-0 px-2 md:px-12">
                <div className="text-left">
                  <p className="mb-24 font-medium text-slate-700">Mengetahui,<br/>Kepala Sekolah,</p>
                  <p className="font-extrabold underline uppercase text-slate-900">{formData.principalName}</p>
                  <p className="text-slate-600">NIP. {formData.principalNip || '........................'}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="mb-24 font-medium text-slate-700">........................, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>Guru Mata Pelajaran,</p>
                  <p className="font-extrabold underline uppercase text-slate-900">{formData.teacherName}</p>
                  <p className="text-slate-600">NIP. {formData.teacherNip || '........................'}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL IMPOR SMART */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-indigo-50">
            <h3 className="text-2xl font-extrabold mb-2 text-slate-800">Impor Smart CP/TP</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Tempelkan teks Capaian Pembelajaran atau Tujuan Pembelajaran dari dokumen PDF/Word Anda di bawah ini. AI akan mengekstraknya secara otomatis.</p>
            <textarea placeholder="Contoh: 'Pada akhir fase E, peserta didik dapat...' atau 'Siswa mampu memahami konsep...'" className="w-full h-56 border border-slate-200 p-4 rounded-2xl mb-6 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-sm leading-relaxed" value={importText} onChange={(e) => setImportText(e.target.value)} />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition">Batal</button>
              <button onClick={() => runSmartExtract(importText)} disabled={!importText.trim() || isExtracting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-indigo-100 transition active:scale-95 disabled:opacity-50">
                {isExtracting ? 'Sedang Mengekstrak...' : 'Ekstrak Sekarang ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 py-12 bg-slate-100/50 text-center border-t border-slate-200">
        <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} Generator RPM Pro - Solusi Modul Ajar Kurikulum Merdeka</p>
      </footer>
    </div>
  );
};

export default App;
