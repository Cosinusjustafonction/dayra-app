export const COLORS = {
    // Base
    background: '#F9FAFB', // Cool Gray 50 (Premium, clean base)
    cardBg: '#FFFFFF',     // Pure White (Minimalist)

    // Brand (Gen Z Premium - Lilac Refresh)
    primary: '#cab7eb',    // Lilac (User Requested)
    secondary: '#818CF8',  // Indigo-400 (Complementary soft blue-purple)
    accent: '#F472B6',     // Pink-400 (Playful accent)

    // Text
    text: '#111827',       // Gray-900 (Sharp, high contrast)
    textMuted: '#6B7280',  // Gray-500 (Sophisticated secondary text)
    white: '#FFFFFF',      // Keep for text on dark buttons

    // Status
    success: '#10B981',    // Emerald-500
    danger: '#EF4444',     // Red-500
    warning: '#F59E0B',    // Amber-500
    info: '#3B82F6',       // Blue-500

    // UI Elements
    border: '#E5E7EB',     // Gray-200 (Subtle, premium borders)
    inputBg: '#F3F4F6',    // Gray-100 (Soft input background)
    iconBg: '#F3F4F6',     // Gray-100 (Soft icon background)
    overlay: 'rgba(17, 24, 39, 0.5)', // Dark overlay
};

export const THEME = {
    dark: false,
    colors: {
        primary: COLORS.primary,
        background: COLORS.background,
        card: COLORS.cardBg,
        text: COLORS.text,
        border: COLORS.border,
        notification: COLORS.danger,
    },
    fonts: {
        regular: {
            fontFamily: 'System',
            fontWeight: '400',
        },
        medium: {
            fontFamily: 'System',
            fontWeight: '500',
        },
        bold: {
            fontFamily: 'System',
            fontWeight: '700',
        },
        heavy: {
            fontFamily: 'System',
            fontWeight: '900',
        },
    },
};
