import React, { useState, FormEvent, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import { Feature, FeatureKey, AspectRatio, PromoScript, HashtagStrategy, StoryboardScene } from './types';
import * as gemini from './services/gemini';
import { createAudioPlayer } from './utils';

// --- Reusable Helper ---
const downloadFile = (url: string, baseFilename: string, extension?: string) => {
    const link = document.createElement('a');
    link.href = url;
    
    let fileExtension = 'jpeg';
    if (extension) {
        fileExtension = extension;
    } else if (url.startsWith('data:')) {
        const mimeType = url.split(';')[0].split(':')[1];
        fileExtension = mimeType.split('/')[1] || 'jpeg';
    }

    link.download = `${baseFilename}-${Date.now()}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Reusable UI Components ---

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-soft-blue-600"></div>
  </div>
);

const ImageGrid: React.FC<{ images: string[]; cols?: number }> = ({ images, cols = 4 }) => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-4 mt-6`}>
        {images.map((src, index) => (
            <div key={index} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-md">
                <img src={src} alt={`Generated result ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                    <button
                        onClick={() => downloadFile(src, `cavero-image-${index + 1}`)}
                        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-soft-blue-600 hover:bg-soft-blue-700 rounded-full p-3"
                        aria-label={`Download image ${index + 1}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>
            </div>
        ))}
    </div>
);


interface FileUploadProps {
  id: string;
  label: string;
  onFileSelect: (file: File | null) => void;
  file: File | null;
}
const FileUpload: React.FC<FileUploadProps> = ({ id, label, onFileSelect, file }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex text-sm text-gray-600">
          <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-soft-blue-600 hover:text-soft-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-soft-blue-500">
            <span>Unggah file</span>
            <input id={id} name={id} type="file" className="sr-only" onChange={(e) => onFileSelect(e.target.files ? e.target.files[0] : null)} accept="image/*" />
          </label>
          <p className="pl-1">atau tarik dan lepas</p>
        </div>
        {file ? <p className="text-xs text-gray-500">{file.name}</p> : <p className="text-xs text-gray-500">PNG, JPG, GIF hingga 10MB</p>}
      </div>
    </div>
  </div>
);

const HamburgerIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="md:hidden p-2 text-gray-600 hover:text-gray-900" aria-label="Open menu">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>
);


// --- Feature Components ---

const TextToImage: React.FC = () => {
    const [prompt, setPrompt] = useState<string>("Wanita muslim Indonesia duduk disebuah meja makan di tempat bakso");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!prompt) return;
        setLoading(true);
        setImages([]);
        try {
            const result = await gemini.generateImagesFromText(prompt, aspectRatio);
            setImages(result);
        } catch (error) {
            console.error("Error generating images:", error);
            alert("Gagal membuat gambar. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Generator Teks ke Gambar</h1>
            <p className="text-gray-500 mt-2 mb-6">Ubah imajinasi Anda menjadi gambar yang menakjubkan.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Masukkan prompt deskriptif di sini..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                />
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="w-full md:w-auto p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                    >
                        <option value="9:16">Potret 9:16</option>
                        <option value="1:1">Persegi 1:1</option>
                        <option value="16:9">Lanskap 16:9</option>
                    </select>
                    <button type="submit" disabled={loading || !prompt} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                        {loading ? 'Membuat...' : 'Buat'}
                    </button>
                </div>
            </form>
            {loading && <LoadingSpinner />}
            {images.length > 0 && <div className="animate-fadeIn"><ImageGrid images={images} cols={3} /></div>}
        </div>
    );
};


const ImageCombiner: React.FC = () => {
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [instructions, setInstructions] = useState<string>("tangan kiri model menunjukkan kemasan produk ke arah kamera");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [background, setBackground] = useState<string>('Asli');
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!modelFile || !productFile || !instructions) return;
        setLoading(true);
        setImages([]);
        try {
            const result = await gemini.combineImages(modelFile, productFile, instructions, aspectRatio, background);
            setImages(result);
        } catch (error) {
            console.error("Error combining images:", error);
            alert("Gagal menggabungkan gambar. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Penggabung Gambar Model dan Produk</h1>
            <p className="text-gray-500 mt-2 mb-6">Letakkan produk Anda secara mulus dengan model atau subjek apa pun.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FileUpload id="model-upload" label="1. Unggah Gambar Model/Subjek" file={modelFile} onFileSelect={setModelFile} />
                    <FileUpload id="product-upload" label="2. Unggah Gambar Produk/Objek" file={productFile} onFileSelect={setProductFile} />
                </div>
                <div>
                     <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">3. Berikan Instruksi Anda</label>
                    <input
                        id="instructions"
                        type="text"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="p-3 border border-gray-300 rounded-md">
                        <option value="9:16">Potret 9:16</option>
                        <option value="1:1">Persegi 1:1</option>
                        <option value="16:9">Lanskap 16:9</option>
                    </select>
                    <select value={background} onChange={(e) => setBackground(e.target.value)} className="p-3 border border-gray-300 rounded-md">
                        <option value="Acak">Acak</option>
                        <option value="Asli">Asli</option>
                        <option value="Kustom">Kustom</option>
                    </select>
                     <button type="submit" disabled={loading || !modelFile || !productFile || !instructions} className="flex-grow text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                        {loading ? 'Membuat...' : 'Buat 3 Variasi'}
                    </button>
                </div>
            </form>
            {loading && <LoadingSpinner />}
            {images.length > 0 && <div className="animate-fadeIn"><ImageGrid images={images} cols={3} /></div>}
        </div>
    );
};


const ChangeModelStyle: React.FC = () => {
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!modelFile) return;
        setLoading(true);
        setImages([]);
        try {
            const result = await gemini.generateModelVariations(modelFile, prompt);
            setImages(result);
        } catch (error) {
            console.error("Error generating variations:", error);
            alert("Gagal membuat variasi. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Ubah Gaya Model</h1>
            <p className="text-gray-500 mt-2 mb-6">Hasilkan berbagai pose dan gaya dari satu gambar model.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload id="style-model-upload" label="Unggah Gambar Model" file={modelFile} onFileSelect={setModelFile} />
                <div>
                    <label htmlFor="style-prompt" className="block text-sm font-medium text-gray-700">Instruksi Spesifik (Opsional)</label>
                    <textarea
                        id="style-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Contoh: gaya foto studio profesional, pencahayaan dramatis, konsep pop-art..."
                        className="mt-1 w-full p-3 h-24 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                    />
                </div>
                <button type="submit" disabled={loading || !modelFile} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat 3 Variasi Gaya'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {images.length > 0 && (
                <div className="animate-fadeIn">
                    <ImageGrid images={images} cols={3} />
                </div>
            )}
        </div>
    );
};


const PromoScriptWriter: React.FC = () => {
    const [productName, setProductName] = useState('Baso Aci');
    const [description, setDescription] = useState('Tersedia berbagai varian rasa');
    const [style, setStyle] = useState('Gaul');
    const [audience, setAudience] = useState('Gen Z');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState<PromoScript | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!productName || !description) return;
        setLoading(true);
        setScript(null);
        try {
            const result = await gemini.generatePromoScript(productName, description, style, audience);
            setScript(result);
        } catch (error) {
            console.error("Error generating script:", error);
            alert("Gagal membuat naskah. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Pembuat Naskah Promosi AI</h1>
            <p className="text-gray-500 mt-2 mb-6">Buat naskah promosi yang menarik dalam hitungan detik.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Produk/Topik</label>
                    <input type="text" value={productName} onChange={e => setProductName(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-md h-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Gaya Bahasa</label>
                        <select value={style} onChange={e => setStyle(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-md">
                            <option>Gaul</option>
                            <option>Profesional</option>
                            <option>Santai</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Audiens</label>
                        <select value={audience} onChange={e => setAudience(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-md">
                            <option>Gen Z</option>
                            <option>Milenial</option>
                            <option>Umum</option>
                        </select>
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat Naskah'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {script && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-bold text-gray-800">HOOK 🎣</h3><p className="pl-4 border-l-4 border-soft-blue-200 text-gray-800">{script.hook}</p>
                    <h3 className="text-xl font-bold text-gray-800">MASALAH 😥</h3><p className="pl-4 border-l-4 border-soft-blue-200 text-gray-800">{script.problem}</p>
                    <h3 className="text-xl font-bold text-gray-800">SOLUSI ✨</h3><p className="pl-4 border-l-4 border-soft-blue-200 text-gray-800">{script.solution}</p>
                    <h3 className="text-xl font-bold text-gray-800">CTA 🛒</h3><p className="pl-4 border-l-4 border-soft-blue-200 text-gray-800">{script.cta}</p>
                    <h3 className="text-xl font-bold text-gray-800">CAPTION ✍️</h3><p className="pl-4 border-l-4 border-soft-blue-200 whitespace-pre-wrap text-gray-800">{script.caption}</p>
                </div>
            )}
        </div>
    );
};

const HashtagPlanner: React.FC = () => {
    const [keyword, setKeyword] = useState('Baso Aci');
    const [loading, setLoading] = useState(false);
    const [strategy, setStrategy] = useState<HashtagStrategy | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if(!keyword) return;
        setLoading(true);
        setStrategy(null);
        try {
            const result = await gemini.generateHashtags(keyword);
            setStrategy(result);
        } catch (error) {
            console.error("Error generating hashtags:", error);
            alert("Gagal membuat hashtag. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Perencana Hashtag AI</h1>
            <p className="text-gray-500 mt-2 mb-6">Temukan grup hashtag terbaik untuk menjangkau audiens Anda.</p>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Masukkan 1 Kata Kunci Utama" className="flex-grow w-full p-3 border border-gray-300 rounded-md" />
                <button type="submit" disabled={loading} className="px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat Strategi Hashtag'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {strategy && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-2">Hashtag Utama</h3>
                        <div className="flex flex-wrap gap-2">{strategy.mainHashtags.map(h => <span key={h} className="bg-soft-blue-100 text-soft-blue-800 px-2 py-1 rounded-full text-sm">#{h}</span>)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-2">Hashtag Luas</h3>
                        <div className="flex flex-wrap gap-2">{strategy.broadHashtags.map(h => <span key={h} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">#{h}</span>)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-2">Hashtag Tren</h3>
                        <div className="flex flex-wrap gap-2">{strategy.trendingHashtags.map(h => <span key={h} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">#{h}</span>)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="font-bold text-lg mb-2">Hashtag Audiens</h3>
                        <div className="flex flex-wrap gap-2">{strategy.audienceHashtags.map(h => <span key={h} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">#{h}</span>)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};


const TextToSpeech: React.FC = () => {
    const [script, setScript] = useState('Halo, selamat datang di Cavero Smart Content! Siap membuat konten viral hari ini?');
    const [style, setStyle] = useState('Ceria');
    const [voice, setVoice] = useState('Kore');
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if(!script) return;
        setLoading(true);
        setAudioUrl(null);
        try {
            const base64Audio = await gemini.generateSpeech(script, style, voice);
            const playerUrl = await createAudioPlayer(base64Audio);
            setAudioUrl(playerUrl);
        } catch (error) {
            console.error("Error generating audio:", error);
            alert("Gagal membuat audio. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Teks ke Suara (AI Voiceover)</h1>
            <p className="text-gray-500 mt-2 mb-6">Ubah naskah Anda menjadi sulih suara berkualitas tinggi.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea value={script} onChange={e => setScript(e.target.value)} className="w-full h-48 p-3 border border-gray-300 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
                        <option>Ceria</option>
                        <option>Sedih</option>
                        <option>Lucu</option>
                        <option>Profesional</option>
                        <option>Berbisik</option>
                    </select>
                    <select value={voice} onChange={e => setVoice(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md">
                        <option>Puck</option>
                        <option>Charon</option>
                        <option>Kore</option>
                        <option>Fenrir</option>
                        <option>Zephyr</option>
                    </select>
                </div>
                <button type="submit" disabled={loading} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat Audio'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {audioUrl && (
                <div className="mt-6 animate-fadeIn">
                    <audio controls src={audioUrl} className="w-full" />
                     <a href={audioUrl} download="cavero-audio.wav" className="mt-2 inline-block text-soft-blue-600 hover:underline">
                        Unduh Audio
                    </a>
                </div>
            )}
        </div>
    );
};


const ImageToPrompt: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState<string>("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setPrompt("");
        try {
            const result = await gemini.generatePromptFromImage(file);
            setPrompt(result);
        } catch (error) {
            console.error("Error generating prompt:", error);
            alert("Gagal membuat prompt dari gambar.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Generator Gambar ke Prompt</h1>
            <p className="text-gray-500 mt-2 mb-6">Unggah gambar untuk mendapatkan deskripsi prompt AI yang mendetail.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload id="image-prompt-upload" label="Unggah Gambar" file={file} onFileSelect={setFile} />
                <button type="submit" disabled={loading || !file} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat Prompt'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {prompt && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md animate-fadeIn">
                    <h3 className="text-xl font-bold mb-2">Prompt yang Dihasilkan:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-md">{prompt}</p>
                </div>
            )}
        </div>
    );
};

const ImageToImage: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<string[]>([]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file || !prompt) return;
        setLoading(true);
        setImages([]);
        try {
            const result = await gemini.generateImageFromImage(file, prompt);
            setImages(result);
        } catch (error) {
            console.error("Error generating image from image:", error);
            alert("Gagal memodifikasi gambar.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Generator Gambar ke Gambar</h1>
            <p className="text-gray-500 mt-2 mb-6">Ubah gambar yang ada dengan instruksi dari Anda.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload id="image-image-upload" label="Unggah Gambar Awal" file={file} onFileSelect={setFile} />
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Masukkan instruksi modifikasi (contoh: tambahkan kacamata hitam pada orang tersebut)..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-md"
                />
                <button type="submit" disabled={loading || !file || !prompt} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat 3 Variasi'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {images.length > 0 && <div className="animate-fadeIn"><ImageGrid images={images} cols={3} /></div>}
        </div>
    );
};

const StoryboardDirector: React.FC = () => {
    const [script, setScript] = useState<string>("");
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [scenes, setScenes] = useState<StoryboardScene[]>([]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!script) return;
        setLoading(true);
        setScenes([]);
        try {
            const result = await gemini.generateStoryboardFromScript(script, modelFile);
            setScenes(result);
        } catch (error) {
            console.error("Error generating storyboard:", error);
            alert("Gagal membuat storyboard. Coba sederhanakan naskah Anda.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Sutradara Storyboard AI</h1>
            <p className="text-gray-500 mt-2 mb-6">Visualisasikan cerita atau naskah Anda menjadi sebuah storyboard.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Masukkan naskah atau ide cerita singkat di sini..."
                    className="w-full h-48 p-3 border border-gray-300 rounded-md"
                />
                <FileUpload id="storyboard-model-upload" label="Unggah Gambar Model (Opsional, untuk konsistensi)" file={modelFile} onFileSelect={setModelFile} />

                <button type="submit" disabled={loading || !script} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat Storyboard'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {scenes.length > 0 && (
                <div className="mt-6 space-y-4 animate-fadeIn">
                    {scenes.map((scene, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">Adegan {index + 1}</h3>
                                {scene.imageUrl && (
                                    <button
                                        onClick={() => downloadFile(scene.imageUrl!, `cavero-storyboard-${index + 1}`)}
                                        className="p-2 text-soft-blue-600 hover:bg-soft-blue-100 rounded-full transition-colors"
                                        aria-label={`Unduh adegan ${index + 1}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-600 mb-2">{scene.scene_description}</p>
                            {scene.imageUrl && <img src={scene.imageUrl} alt={`Storyboard scene ${index + 1}`} className="w-full rounded-md object-contain" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const RemoveBackground: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setResultImage(null);
        try {
            const result = await gemini.removeImageBackground(file);
            setResultImage(result);
        } catch (error) {
            console.error("Error removing background:", error);
            alert("Gagal menghapus background.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Penghapus Background AI</h1>
            <p className="text-gray-500 mt-2 mb-6">Hapus latar belakang dari gambar manapun dengan satu klik.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload id="bg-remove-upload" label="Unggah Gambar" file={file} onFileSelect={setFile} />
                <button type="submit" disabled={loading || !file} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Memproses...' : 'Hapus Background'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {resultImage && (
                <div className="mt-6 text-center animate-fadeIn">
                    <h3 className="text-xl font-bold mb-2">Hasil:</h3>
                    <div className="inline-block p-4 bg-gray-100 rounded-lg shadow-inner" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' x=\'0\' y=\'0\' fill=\'%23e9e9e9\'/%3E%3Crect width=\'10\' height=\'10\' x=\'10\' y=\'10\' fill=\'%23e9e9e9\'/%3E%3C/svg%3E")' }}>
                        <img src={resultImage} alt="Gambar dengan background dihapus" className="max-w-full h-auto max-h-96" />
                    </div>
                     <button
                        onClick={() => downloadFile(resultImage, 'cavero-no-bg', 'png')}
                        className="mt-4 inline-flex items-center px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh Gambar
                    </button>
                </div>
            )}
        </div>
    );
};

const ImageToVideoPrompt: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [instructions, setInstructions] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState<string>("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setPrompt("");
        try {
            const result = await gemini.generateVideoPromptFromImage(file, instructions);
            setPrompt(result);
        } catch (error) {
            console.error("Error generating video prompt:", error);
            alert("Gagal membuat prompt video dari gambar.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Generator Prompt Video dari Gambar</h1>
            <p className="text-gray-500 mt-2 mb-6">Ubah gambar statis menjadi ide prompt video yang dinamis.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload id="image-video-prompt-upload" label="Unggah Gambar" file={file} onFileSelect={setFile} />
                <div>
                    <label htmlFor="video-prompt-instructions" className="block text-sm font-medium text-gray-700">Instruksi Tambahan (Opsional)</label>
                     <textarea
                        id="video-prompt-instructions"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Contoh: fokus pada detail produk, buat suasana sinematik, tambahkan gerakan kamera zoom in..."
                        className="mt-1 w-full p-3 h-24 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                    />
                </div>
                <button type="submit" disabled={loading || !file} className="w-full text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 transition-colors">
                    {loading ? 'Membuat...' : 'Buat Prompt Video'}
                </button>
            </form>
            {loading && <LoadingSpinner />}
            {prompt && (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md animate-fadeIn">
                    <h3 className="text-xl font-bold mb-2">Prompt Video yang Dihasilkan:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-md">{prompt}</p>
                </div>
            )}
        </div>
    );
};


const TextToVideo: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [prompt, setPrompt] = useState<string>("Seekor kucing oranye mengendarai skateboard di jalanan Tokyo, gaya sinematik.");
    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<number | null>(null);

    const loadingMessages = [
        "Sedang menyiapkan kanvas digital Anda...",
        "AI sedang merangkai adegan...",
        "Menerapkan sentuhan sinematik...",
        "Hampir selesai! Sedang melakukan render akhir...",
        "Mengoptimalkan setiap frame...",
        "Memoles piksel terakhir..."
    ];

    useEffect(() => {
        const checkKey = async () => {
            if (await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkKey();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setLoading(true);
        setVideoUrl(null);
        setError(null);
        setLoadingMessage(loadingMessages[0]);

        let messageIndex = 0;
        intervalRef.current = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 10000);

        try {
            const videoUri = await gemini.generateVideoFromText(prompt, aspectRatio, resolution);
            const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                throw new Error(`Gagal mengunduh video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            const objectUrl = URL.createObjectURL(videoBlob);
            setVideoUrl(objectUrl);
        } catch (err: any) {
            console.error("Error generating video:", err);
            const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
            setError(errorMessage);
            if (errorMessage.includes("Requested entity was not found")) {
                 setError("Kunci API tidak valid atau tidak ditemukan. Silakan pilih kunci yang benar.");
                setApiKeySelected(false);
            }
        } finally {
            setLoading(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    };
    
    if (!apiKeySelected) {
        return (
             <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Diperlukan Kunci API untuk Pembuatan Video</h1>
                <p className="text-gray-600 mb-6 max-w-md">
                    Fitur ini menggunakan model Veo canggih dari Google. Untuk melanjutkan, silakan pilih Kunci API Anda.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 transition-colors"
                >
                    Pilih Kunci API
                </button>
                 <p className="text-sm text-gray-500 mt-4">
                    Pembuatan video mungkin dikenakan biaya. Pelajari lebih lanjut tentang{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-soft-blue-600 underline">
                        penagihan
                    </a>.
                </p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Generator Teks ke Video</h1>
            <p className="text-gray-500 mt-2 mb-6">Ubah deskripsi teks Anda menjadi klip video pendek yang memukau.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Masukkan prompt video yang deskriptif di sini..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500 transition-colors"
                    aria-label="Prompt Video"
                />
                <div className="flex flex-wrap items-center gap-4">
                     <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                        className="p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                        aria-label="Rasio Aspek"
                    >
                        <option value="16:9">Lanskap 16:9</option>
                        <option value="9:16">Potret 9:16</option>
                    </select>
                     <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                        className="p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                        aria-label="Resolusi"
                    >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                    </select>
                    <button type="submit" disabled={loading || !prompt} className="flex-grow text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {loading ? 'Membuat Video...' : 'Buat Video'}
                    </button>
                </div>
            </form>
            {loading && (
                <div className="text-center p-8">
                    <LoadingSpinner />
                    <p className="text-lg text-gray-600 mt-4 animate-pulse">{loadingMessage}</p>
                    <p className="text-sm text-gray-500 mt-2">Proses ini bisa memakan waktu beberapa menit. Mohon bersabar.</p>
                </div>
            )}
            {error && <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
            {videoUrl && (
                <div className="mt-8 text-center animate-fadeIn">
                    <h2 className="text-2xl font-bold mb-4">Video Anda Sudah Siap!</h2>
                    <video src={videoUrl} controls className="max-w-full mx-auto rounded-lg shadow-lg" />
                    <a
                        href={videoUrl}
                        download={`cavero-video-${Date.now()}.mp4`}
                        className="mt-4 inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                    >
                        Unduh Video
                    </a>
                </div>
            )}
        </div>
    );
};

const ImageToVideo: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState<string>("");
    const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('16:9');
    const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<number | null>(null);

    const loadingMessages = [
        "Menganalisis gambar Anda...",
        "AI sedang membayangkan gerakan...",
        "Menghidupkan adegan...",
        "Hampir selesai! Sedang melakukan render akhir...",
        "Mengoptimalkan setiap frame...",
        "Memoles piksel terakhir..."
    ];

    useEffect(() => {
        const checkKey = async () => {
            if (await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        };
        checkKey();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!imageFile) return;

        setLoading(true);
        setVideoUrl(null);
        setError(null);
        setLoadingMessage(loadingMessages[0]);

        let messageIndex = 0;
        intervalRef.current = window.setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            setLoadingMessage(loadingMessages[messageIndex]);
        }, 10000);

        try {
            const videoUri = await gemini.generateVideoFromImage(imageFile, prompt, aspectRatio, resolution);
            const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                throw new Error(`Gagal mengunduh video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            const objectUrl = URL.createObjectURL(videoBlob);
            setVideoUrl(objectUrl);
        } catch (err: any) {
            console.error("Error generating video from image:", err);
            const errorMessage = err.message || "Terjadi kesalahan yang tidak diketahui.";
            setError(errorMessage);
            if (errorMessage.includes("Requested entity was not found")) {
                 setError("Kunci API tidak valid atau tidak ditemukan. Silakan pilih kunci yang benar.");
                setApiKeySelected(false);
            }
        } finally {
            setLoading(false);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    };
    
    if (!apiKeySelected) {
        return (
             <div className="p-4 md:p-8 flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Diperlukan Kunci API untuk Pembuatan Video</h1>
                <p className="text-gray-600 mb-6 max-w-md">
                    Fitur ini menggunakan model Veo canggih dari Google. Untuk melanjutkan, silakan pilih Kunci API Anda.
                </p>
                <button
                    onClick={handleSelectKey}
                    className="px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 transition-colors"
                >
                    Pilih Kunci API
                </button>
                 <p className="text-sm text-gray-500 mt-4">
                    Pembuatan video mungkin dikenakan biaya. Pelajari lebih lanjut tentang{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-soft-blue-600 underline">
                        penagihan
                    </a>.
                </p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">Generator Gambar ke Video</h1>
            <p className="text-gray-500 mt-2 mb-6">Ubah gambar Anda menjadi klip video pendek dengan instruksi opsional.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FileUpload id="image-video-upload" label="Unggah Gambar Awal" file={imageFile} onFileSelect={setImageFile} />
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Instruksi tambahan (opsional), misal: 'buat gambar ini menjadi hidup dengan angin sepoi-sepoi dan gerakan kamera perlahan ke kanan'"
                    className="w-full h-24 p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500 transition-colors"
                    aria-label="Instruksi Video (Opsional)"
                />
                <div className="flex flex-wrap items-center gap-4">
                     <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                        className="p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                        aria-label="Rasio Aspek"
                    >
                        <option value="16:9">Lanskap 16:9</option>
                        <option value="9:16">Potret 9:16</option>
                    </select>
                     <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                        className="p-3 border border-gray-300 rounded-md focus:ring-soft-blue-500 focus:border-soft-blue-500"
                        aria-label="Resolusi"
                    >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                    </select>
                    <button type="submit" disabled={loading || !imageFile} className="flex-grow text-lg px-6 py-3 bg-soft-blue-600 text-white font-semibold rounded-md hover:bg-soft-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {loading ? 'Membuat Video...' : 'Buat Video'}
                    </button>
                </div>
            </form>
            {loading && (
                <div className="text-center p-8">
                    <LoadingSpinner />
                    <p className="text-lg text-gray-600 mt-4 animate-pulse">{loadingMessage}</p>
                    <p className="text-sm text-gray-500 mt-2">Proses ini bisa memakan waktu beberapa menit. Mohon bersabar.</p>
                </div>
            )}
            {error && <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
            {videoUrl && (
                <div className="mt-8 text-center animate-fadeIn">
                    <h2 className="text-2xl font-bold mb-4">Video Anda Sudah Siap!</h2>
                    <video src={videoUrl} controls className="max-w-full mx-auto rounded-lg shadow-lg" />
                    <a
                        href={videoUrl}
                        download={`cavero-video-${Date.now()}.mp4`}
                        className="mt-4 inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                    >
                        Unduh Video
                    </a>
                </div>
            )}
        </div>
    );
};


const features: Feature[] = [
    { key: 'text-to-image', name: 'Teks ke Gambar', icon: 'text-image', implemented: true },
    { key: 'image-combiner', name: 'Penggabung Gambar', icon: 'combine', implemented: true },
    { key: 'change-model-style', name: 'Ubah Gaya Model', icon: 'style', implemented: true },
    { key: 'promo-script-writer', name: 'Buat Naskah Promo', icon: 'script', implemented: true },
    { key: 'hashtag-planner', name: 'Perencana Hashtag', icon: 'hashtag', implemented: true },
    { key: 'text-to-speech', name: 'Teks ke Suara', icon: 'voice', implemented: true },
    { key: 'image-to-prompt', name: 'Gambar ke Prompt', icon: 'image-prompt', implemented: true },
    { key: 'image-to-image', name: 'Gambar ke Gambar', icon: 'image-image', implemented: true },
    { key: 'storyboard-director', name: 'Sutradara Storyboard', icon: 'storyboard', implemented: true },
    { key: 'remove-background', name: 'Hapus Background', icon: 'background', implemented: true },
    { key: 'image-to-video-prompt', name: 'Gambar ke Prompt Video', icon: 'video-prompt', implemented: true },
    { key: 'text-to-video', name: 'Teks ke Video', icon: 'video', implemented: true },
    { key: 'image-to-video', name: 'Gambar ke Video', icon: 'video', implemented: true },
];

const App: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<FeatureKey>('text-to-image');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const renderContent = () => {
        switch (activeFeature) {
            case 'text-to-image': return <TextToImage />;
            case 'image-combiner': return <ImageCombiner />;
            case 'change-model-style': return <ChangeModelStyle />;
            case 'promo-script-writer': return <PromoScriptWriter />;
            case 'hashtag-planner': return <HashtagPlanner />;
            case 'text-to-speech': return <TextToSpeech />;
            case 'image-to-prompt': return <ImageToPrompt />;
            case 'image-to-image': return <ImageToImage />;
            case 'storyboard-director': return <StoryboardDirector />;
            case 'remove-background': return <RemoveBackground />;
            case 'image-to-video-prompt': return <ImageToVideoPrompt />;
            case 'text-to-video': return <TextToVideo />;
            case 'image-to-video': return <ImageToVideo />;
            default:
                return <div className="p-8"><h1 className="text-2xl font-bold">Fitur Belum Tersedia</h1><p>Fitur ini sedang dalam pengembangan.</p></div>;
        }
    };

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            <Sidebar 
                features={features} 
                activeFeature={activeFeature} 
                setActiveFeature={(feature) => {
                    setActiveFeature(feature);
                    setIsSidebarOpen(false); // Close sidebar on selection in mobile
                }}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />
            <main className="flex-1 overflow-y-auto relative">
                <div className="md:hidden sticky top-0 bg-white/80 backdrop-blur-sm z-10 p-2 border-b flex items-center">
                    <HamburgerIcon onClick={() => setIsSidebarOpen(true)} />
                    <h1 className="text-lg font-bold font-poppins text-gray-800 ml-2">
                        {features.find(f => f.key === activeFeature)?.name}
                    </h1>
                </div>
                <div key={activeFeature} className="animate-fadeIn">
                  {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default App;