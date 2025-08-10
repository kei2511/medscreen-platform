export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">Maaf, halaman yang Anda cari tidak ditemukan.</p>
        <a 
          href="/" 
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  );
}
