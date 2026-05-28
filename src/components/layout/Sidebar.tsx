import { Activity, Building2, ChevronLeft, FileSpreadsheet, LayoutDashboard, MapPin, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import logo1 from '/SICM1.png'

type Screen = 'home' | 'municipio' | 'lancamento' | 'dashboard' | 'importar' | 'secretaria' | 'lancamento-secretaria' | 'lancamento-outra-unidade'

interface SidebarProps {
  activeScreen: Screen
  onNavigate: (screen: 'home' | 'dashboard' | 'importar') => void
  onBackToLanding?: () => void
}

const navItems = [
  {
    id: 'dashboard' as const,
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Indicadores e análises',
  },
  {
    id: 'home' as const,
    label: 'Municípios',
    icon: MapPin,
    description: 'Gerenciar municípios e UBS',
  },
  {
    id: 'importar' as const,
    label: 'Importar Excel',
    icon: FileSpreadsheet,
    description: 'Lançar dados via planilha',
  },
]

export function Sidebar({ activeScreen, onNavigate, onBackToLanding }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const activeNav = activeScreen === 'lancamento' || activeScreen === 'municipio' || activeScreen === 'secretaria' || activeScreen === 'lancamento-secretaria' || activeScreen === 'lancamento-outra-unidade' ? 'home' : activeScreen

  // Fecha sidebar ao navegar no mobile
  function handleNav(screen: 'home' | 'dashboard' | 'importar') {
    onNavigate(screen)
    setMobileOpen(false)
  }

  // Fecha ao redimensionar para desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Bloqueia scroll do body quando sidebar mobile está aberta
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* Botão hamburger mobile */}
      <button
        type="button"
        className="mobile-menu-btn saude"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`app-sidebar sidebar-scroll ${mobileOpen ? 'open' : ''}`}>
        {/* Botão fechar no mobile */}
        <button
          type="button"
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-5 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-center mb-4">
            <img
              src={logo1}
              alt="Logo"
              className="w-[165px] h-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>

          <div className="text-center">
            <p className="text-green-300/50 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
              SICM
            </p>
            <h1 className="text-white font-bold text-base leading-tight">
              SICM-Saúde
            </h1>
            <a
              href="https://www.uel.br/projetos/nigep/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300/70 text-xs mt-1 leading-snug hover:text-green-200 transition-colors duration-150 underline-offset-2 hover:underline"
            >
              Desenvolvido por NIGEP
            </a>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-4">
          <p className="text-green-400/50 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
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
                    onClick={() => handleNav(item.id)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-green-100/70 hover:bg-white/8 hover:text-white',
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
                      <p className={['text-xs leading-tight mt-0.5', isActive ? 'text-green-200/60' : 'text-green-400/40'].join(' ')}>
                        {item.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-300 shrink-0" />
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
            <div className="w-6 h-6 rounded-md bg-green-400/20 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-green-300" />
            </div>
            <span className="text-green-300/60 text-xs font-medium">Sistema ativo</span>
          </div>
          <div className="flex items-center gap-1.5 mb-3">
            <Building2 className="w-3 h-3 text-green-400/40" />
            <p className="text-green-400/40 text-xs">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
          {onBackToLanding && (
            <button
              type="button"
              onClick={() => { onBackToLanding(); setMobileOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-green-300/60 hover:text-white hover:bg-white/10 transition-all duration-150 text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Página inicial
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
