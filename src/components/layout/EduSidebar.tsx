import { Activity, BookOpen, ChevronLeft, FileSpreadsheet, GraduationCap, LayoutDashboard, MapPin } from 'lucide-react'
import logoEdu from '/SICM2.png'

export type EduScreen = 'edu-home' | 'edu-municipio' | 'edu-lancamento' | 'edu-dashboard' | 'edu-importar'

interface EduSidebarProps {
  activeScreen: EduScreen
  onNavigate: (screen: 'edu-home' | 'edu-dashboard' | 'edu-importar') => void
  onBackToLanding?: () => void
}

const navItems = [
  {
    id: 'edu-dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Indicadores e análises',
  },
  {
    id: 'edu-home' as const,
    label: 'Municípios',
    icon: MapPin,
    description: 'Gerenciar municípios e escolas',
  },
  {
    id: 'edu-importar' as const,
    label: 'Importar Excel',
    icon: FileSpreadsheet,
    description: 'Lançar dados via planilha',
  },
]

export function EduSidebar({ activeScreen, onNavigate, onBackToLanding }: EduSidebarProps) {
  const activeNav = activeScreen === 'edu-lancamento' || activeScreen === 'edu-municipio' ? 'edu-home' : activeScreen

  return (
    <aside className="edu-sidebar sidebar-scroll">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-center mb-4">
          <img
            src={logoEdu}
            alt="SICM-Educação"
            className="w-[140px] h-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        <div className="text-center">
          <p className="text-blue-200/50 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
            SICM
          </p>
          <h1 className="text-white font-bold text-base leading-tight">
            SICM-Educação
          </h1>
          <a
            href="https://www.uel.br/projetos/nigep/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-200/70 text-xs mt-1 leading-snug hover:text-blue-100 transition-colors duration-150 underline-offset-2 hover:underline"
          >
            Desenvolvido por NIGEP
          </a>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-blue-300/50 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                    isActive
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-blue-100/70 hover:bg-white/8 hover:text-white',
                  ].join(' ')}
                >
                  <div
                    className={[
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isActive ? 'bg-white/20' : 'bg-white/5',
                    ].join(' ')}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className={['text-xs leading-tight mt-0.5', isActive ? 'text-blue-200/60' : 'text-blue-300/40'].join(' ')}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Info do sistema */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-blue-400/20 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-blue-300" />
          </div>
          <span className="text-blue-300/60 text-xs font-medium">Sistema ativo</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <GraduationCap className="w-3 h-3 text-blue-400/40" />
          <p className="text-blue-400/40 text-xs">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-blue-300/60 hover:text-white hover:bg-white/10 transition-all duration-150 text-xs font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Página inicial
          </button>
        )}
      </div>
    </aside>
  )
}
