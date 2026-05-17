import logoSicmEdu from '/SICMEDUCAÇÃO.png'
import logo1 from '/logo1.png'

interface EduLandingPageProps {
  onEnterModule: () => void
  onBackToMain: () => void
}

export function EduLandingPage({ onEnterModule, onBackToMain }: EduLandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Barra superior azul ── */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #1066C6, #072F76)' }} />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={logo1}
              alt="SICM"
              className="h-12 w-auto object-contain shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p className="text-[10px] font-bold text-[#1066C6] uppercase tracking-[0.18em]">SICM</p>
              <h1 className="text-base font-extrabold text-gray-900 leading-tight">
                Sistema de Informações de Custos Municipais
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToMain}
            className="text-sm text-gray-400 hover:text-[#1066C6] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-10 max-w-lg">
          <div className="w-36 h-36 mx-auto mb-6 rounded-2xl bg-[#AECBE6]/20 border border-[#AECBE6]/40 flex items-center justify-center overflow-hidden shadow-inner">
            <img
              src={logoSicmEdu}
              alt="SICM-Educação"
              className="w-32 h-32 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const p = e.currentTarget.parentElement
                if (p) p.innerHTML = `<div style="width:64px;height:64px;background:linear-gradient(135deg,#1066C6,#072F76);border-radius:14px;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="32" height="32" fill="none"><path d="M12 3L2 9l10 6 10-6-10-6z" stroke="white" stroke-width="1.5"/><path d="M2 17l10 6 10-6" stroke="white" stroke-width="1.5"/><path d="M2 13l10 6 10-6" stroke="white" stroke-width="1.5"/></svg></div>`
              }}
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
            <span className="text-[#1066C6]">SICM</span>-Educação
          </h2>
          <p className="text-gray-500 mt-3 text-base leading-relaxed">
            Gestão de custos da rede municipal de ensino
          </p>
          <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-md mx-auto">
            Controle de custos pedagógicos, sociais e administrativos por escola,
            com indicadores de desempenho educacional (IDEB) e eficiência na alocação de recursos.
          </p>
        </div>

        <button
          type="button"
          onClick={onEnterModule}
          className="inline-flex items-center gap-2 bg-[#1066C6] hover:bg-[#072F76] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base"
        >
          Acessar Módulo
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
          {[
            { icon: '📊', title: 'Custos por Escola', desc: 'Pedagógico, Social e Administrativo por aluno' },
            { icon: '🎓', title: 'Desempenho (IDEB)', desc: 'Notas, fluxo e aprendizado adequado' },
            { icon: '⚡', title: 'Eficiência', desc: 'Benchmarking e análise envoltória de dados' },
          ].map((f) => (
            <div key={f.title} className="text-center p-5 rounded-xl bg-[#AECBE6]/10 border border-[#AECBE6]/30">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-sm font-bold text-gray-800 mt-2">{f.title}</p>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} SICM-Educação — Baseado nas pesquisas do NIGEP/UEL
          </p>
          <a
            href="https://www.uel.br/projetos/nigep/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#1066C6] transition-colors hover:underline underline-offset-2"
          >
            NIGEP / UEL
          </a>
        </div>
      </footer>
    </div>
  )
}
