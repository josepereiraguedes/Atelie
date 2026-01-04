import { CatalogThemeConfig } from '@/shared/types/database.types';

// Definições de todos os temas disponíveis

export const catalogThemes: Record<string, CatalogThemeConfig> = {
    vibrant: {
        id: 'vibrant',
        name: 'Vibrante',
        description: 'Cores vibrantes e modernas',
        colors: {
            headerGradient: ['#3b82f6', '#8b5cf6', '#ec4899'],
            background: ['#f8fafc', '#e2e8f0'],
            cardBg: '#ffffff',
            badgeGradient: ['#ef4444', '#dc2626'],
            priceGradient: ['#059669', '#10b981'],
            textPrimary: '#1e293b',
            textSecondary: '#64748b'
        },
        fonts: {
            header: 'bold 56px Inter, -apple-system, sans-serif',
            body: 'bold 20px Inter, sans-serif'
        },
        effects: {
            shadowColor: 'rgba(0,0,0,0.15)',
            shadowBlur: 20,
            borderRadius: 20
        },
        badge: {
            text: 'OFERTA',
            emoji: '🔥'
        }
    },

    elegant: {
        id: 'elegant',
        name: 'Elegante',
        description: 'Preto e dourado premium',
        colors: {
            headerGradient: ['#1a1a1a', '#2d2d2d', '#1a1a1a'],
            background: ['#0a0a0a', '#1a1a1a'],
            cardBg: '#1f1f1f',
            badgeGradient: ['#d4af37', '#f4d03f'],
            priceGradient: ['#d4af37', '#f4d03f'],
            textPrimary: '#ffffff',
            textSecondary: '#d4af37'
        },
        fonts: {
            header: 'bold 60px Georgia, serif',
            body: 'bold 22px Georgia, serif'
        },
        effects: {
            shadowColor: 'rgba(212,175,55,0.3)',
            shadowBlur: 25,
            borderRadius: 15
        },
        badge: {
            text: 'PREMIUM',
            emoji: '✨'
        }
    },

    minimal: {
        id: 'minimal',
        name: 'Minimalista',
        description: 'Clean e moderno',
        colors: {
            headerGradient: ['#ffffff', '#f8fafc', '#ffffff'],
            background: ['#ffffff', '#fafafa'],
            cardBg: '#ffffff',
            badgeGradient: ['#000000', '#1a1a1a'],
            priceGradient: ['#000000', '#1a1a1a'],
            textPrimary: '#000000',
            textSecondary: '#6b7280'
        },
        fonts: {
            header: 'bold 58px -apple-system, sans-serif',
            body: 'bold 20px -apple-system, sans-serif'
        },
        effects: {
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowBlur: 15,
            borderRadius: 8
        },
        badge: {
            text: 'NOVO',
            emoji: '⚡'
        }
    },

    christmas: {
        id: 'christmas',
        name: 'Natalino',
        description: 'Espírito de Natal',
        colors: {
            headerGradient: ['#c41e3a', '#165b33', '#d4af37'],
            background: ['#fef3f3', '#f0f9f4'],
            cardBg: '#ffffff',
            badgeGradient: ['#c41e3a', '#a01729'],
            priceGradient: ['#165b33', '#1e7e34'],
            textPrimary: '#1a1a1a',
            textSecondary: '#c41e3a'
        },
        fonts: {
            header: 'bold 56px Inter, sans-serif',
            body: 'bold 20px Inter, sans-serif'
        },
        effects: {
            shadowColor: 'rgba(196,30,58,0.2)',
            shadowBlur: 20,
            borderRadius: 20
        },
        badge: {
            text: 'NATAL',
            emoji: '🎄'
        }
    },

    'black-friday': {
        id: 'black-friday',
        name: 'Black Friday',
        description: 'Mega descontos',
        colors: {
            headerGradient: ['#000000', '#1a1a1a', '#000000'],
            background: ['#0a0a0a', '#1a1a1a'],
            cardBg: '#1f1f1f',
            badgeGradient: ['#fbbf24', '#f59e0b'],
            priceGradient: ['#fbbf24', '#f59e0b'],
            textPrimary: '#ffffff',
            textSecondary: '#fbbf24'
        },
        fonts: {
            header: 'bold 62px Impact, sans-serif',
            body: 'bold 22px Impact, sans-serif'
        },
        effects: {
            shadowColor: 'rgba(251,191,36,0.4)',
            shadowBlur: 30,
            borderRadius: 12
        },
        badge: {
            text: 'MEGA DESCONTO',
            emoji: '💥'
        }
    }
};

export const getTheme = (themeId: string): CatalogThemeConfig => {
    return catalogThemes[themeId] || catalogThemes.vibrant;
};
