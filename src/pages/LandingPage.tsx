import logoSicmSaude from '/logoscmsaude.png'
import logoSicmEdu from '/SICMEDUCAÇÃO.png'
import logo1 from '/logo1.png'

interface LandingPageProps {
  onEnterModule: (module: 'saude' | 'educacao') => void
}

export function LandingPage({ onEnterModule }: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Barra superior verde ── */}
      <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #01884d, #004aad)' }} />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-6">

          {/* Identidade */}
          <div className="flex items-center gap-4">
            <img
              src={logo1}
              alt="SICM"
              className="h-12 w-auto object-contain shrink-0"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div>
              <p className="text-[10px] font-bold text-[#01884d] uppercase tracking-[0.18em]">SICM</p>
              <h1 className="text-base font-extrabold text-gray-900 leading-tight">
                Sistema de Informações de Custos Municipais
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Título central */}
        <div className="text-center mb-12 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Bem-vindo ao <span className="text-[#01884d]">SICM</span>
          </h2>
          <p className="text-gray-500 mt-3 text-base leading-relaxed">
            Selecione o módulo que deseja acessar
          </p>
        </div>

        {/* ── Cards de módulos ── */}
        <div className="flex flex-wrap justify-center gap-6 w-full max-w-3xl">

          {/* SICM-Saúde — ativo */}
          <button
            type="button"
            onClick={() => onEnterModule('saude')}
            className="group relative flex flex-col items-center gap-4 bg-white border-2 border-gray-100 rounded-2xl p-8 w-60 shadow-sm hover:shadow-xl hover:border-[#01884d]/30 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#01884d]/20"
          >
            {/* Badge disponível */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#01884d] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
              ● Disponível
            </span>

            {/* Imagem do módulo */}
            <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[#01884d]/20 transition-colors">
              <img
                src={logoSicmSaude}
                alt="SICM-Saúde"
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const p = e.currentTarget.parentElement;
                  if (p) p.innerHTML = `<div style="width:56px;height:56px;background:linear-gradient(135deg,#01884d,#016038);border-radius:14px;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="28" height="28" fill="none"><rect x="10" y="3" width="4" height="18" rx="1.5" fill="white"/><rect x="3" y="10" width="18" height="4" rx="1.5" fill="white"/></svg></div>`;
                }}
              />
            </div>

            {/* Texto */}
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-900 group-hover:text-[#01884d] transition-colors leading-tight">
                SICM-Saúde
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-snug">
                Custos de UBS e<br />Atenção Básica
              </p>
            </div>

            {/* CTA */}
            <span className="inline-flex items-center gap-1.5 bg-[#01884d]/10 text-[#01884d] text-xs font-semibold px-4 py-1.5 rounded-full group-hover:bg-[#01884d] group-hover:text-white transition-all duration-200">
              Acessar
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          {/* SICM-Educação — ATIVO */}
          <button
            type="button"
            onClick={() => onEnterModule('educacao')}
            className="group relative flex flex-col items-center gap-4 bg-white border-2 border-gray-100 rounded-2xl p-8 w-60 shadow-sm hover:shadow-xl hover:border-[#1066C6]/30 hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#1066C6]/20"
          >
            {/* Badge disponível */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1066C6] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
              ● Disponível
            </span>

            {/* Imagem do módulo */}
            <div className="w-28 h-28 rounded-2xl bg-[#AECBE6]/10 border border-[#AECBE6]/30 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[#1066C6]/20 transition-colors">
              <img
                src={logoSicmEdu}
                alt="SICM-Educação"
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const p = e.currentTarget.parentElement;
                  if (p) p.innerHTML = `<div style="width:56px;height:56px;background:linear-gradient(135deg,#1066C6,#072F76);border-radius:14px;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="28" height="28" fill="none"><path d="M12 3L2 9l10 6 10-6-10-6z" stroke="white" stroke-width="1.5"/><path d="M2 17l10 6 10-6" stroke="white" stroke-width="1.5"/><path d="M2 13l10 6 10-6" stroke="white" stroke-width="1.5"/></svg></div>`;
                }}
              />
            </div>

            {/* Texto */}
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-900 group-hover:text-[#1066C6] transition-colors leading-tight">
                SICM-Educação
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-snug">
                Rede de ensino<br />municipal
              </p>
            </div>

            {/* CTA */}
            <span className="inline-flex items-center gap-1.5 bg-[#1066C6]/10 text-[#1066C6] text-xs font-semibold px-4 py-1.5 rounded-full group-hover:bg-[#1066C6] group-hover:text-white transition-all duration-200">
              Acessar
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>

          {/* Módulo em breve — Infraestrutura */}
          <div
            className="relative flex flex-col items-center gap-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 w-60 opacity-50 cursor-not-allowed select-none"
          >
            {/* Badge em breve */}
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Em breve
            </span>

            {/* Ícone placeholder */}
            <div className="w-28 h-28 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-400 leading-tight">SICM-Infraestrutura</p>
              <p className="text-xs text-gray-300 mt-1">Obras e serviços urbanos</p>
            </div>

            <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-400 text-xs font-semibold px-4 py-1.5 rounded-full">
              Em desenvolvimento
            </span>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Sistema de Informações de Custos Municipais
          </p>
          <a
            href="https://www.uel.br/projetos/nigep/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-[#01884d] transition-colors hover:underline underline-offset-2"
          >
            NIGEP / UEL
          </a>
        </div>
      </footer>
    </div>
  )
}
