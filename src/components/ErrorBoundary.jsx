import React from 'react';
import { AlertTriangle, RefreshCw, LogOut, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL FRONTEND ERROR CAUGHT BY ERROR BOUNDARY:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    const errorStr = (this.state.error?.message || this.state.error?.toString() || '');
    if (
      errorStr.includes('dynamically imported module') ||
      errorStr.includes('Failed to fetch') ||
      errorStr.includes('Loading chunk')
    ) {
      window.location.reload();
      return;
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showStack: false,
    });
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const textToCopy = `=== POS ERROR LOG ===\nMessage: ${error?.toString()}\n\nStack:\n${errorInfo?.componentStack || error?.stack || 'N/A'}`;
    navigator.clipboard.writeText(textToCopy);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showStack, copied } = this.state;
      const errorStr = (error?.message || error?.toString() || '');
      const isDynamicImportError = errorStr.includes('dynamically imported module') || errorStr.includes('Failed to fetch') || errorStr.includes('Loading chunk');

      return (
        <div className="flex-1 w-full h-full min-h-[100dvh] bg-slate-900 text-white p-4 sm:p-8 flex items-center justify-center font-sans overflow-y-auto">
          <div className="max-w-2xl w-full bg-slate-800/90 border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-in fade-in zoom-in-95">
            {/* Top Red Glow Accent */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header Alert */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3.5 bg-red-500/20 border border-red-500/40 text-red-400 rounded-2xl shrink-0">
                <AlertTriangle size={32} />
              </div>
              <div>
                <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black tracking-widest uppercase rounded-full inline-block mb-2">
                  System Error Warning
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  Tampilan Mengalami Kendala / Error
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                  {isDynamicImportError
                    ? 'Versi aplikasi baru telah dirilis atau terjadi gangguan jaringan. Klik tombol di bawah untuk memuat ulang aplikasi.'
                    : 'Sidenavbar tetap aktif. Anda dapat berpindah mode kasir atau memuat ulang halaman ini.'}
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 mb-6 font-mono text-xs sm:text-sm text-red-300 break-words shadow-inner relative">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Detail Pesan Error
                </span>
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-bold rounded-lg transition-colors active:scale-95"
                >
                  {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Tersalin' : 'Salin Log'}</span>
                </button>
              </div>
              <p className="font-bold">{error?.toString() || 'Unknown Error Exception'}</p>

              {/* Stack Trace Toggle */}
              {errorInfo?.componentStack && (
                <div className="mt-3 pt-3 border-t border-slate-900">
                  <button
                    onClick={() => this.setState(prev => ({ showStack: !prev.showStack }))}
                    className="flex items-center gap-1 text-[11px] font-sans font-bold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <span>{showStack ? 'Sembunyikan Component Stack' : 'Lihat Component Stack'}</span>
                    {showStack ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showStack && (
                    <pre className="mt-2 text-[10px] text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed p-2 bg-slate-900/90 rounded-lg">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-95 border border-emerald-400/30"
              >
                <RefreshCw size={18} />
                <span>Coba Muat Ulang View</span>
              </button>
              {this.props.onLogout && (
                <button
                  onClick={this.props.onLogout}
                  className="py-3.5 px-5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 border border-slate-600"
                >
                  <LogOut size={18} />
                  <span>Reset / Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
