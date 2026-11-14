/**
 * Design tokens — single source of truth for PanditTalk mobile UI.
 * Semantic names chosen for future dark-mode toggle.
 */

/** Rich antique gold — primary brand accent */
export const GOLD = '#B8942F';
/** Lighter gold for highlights, active glows */
export const GOLD_LIGHT = '#D4AF37';
export const GOLD_RING_BORDER = '#8B6914';
/** Gold accent bar used by SectionHeader */
export const SECTION_BAR = GOLD;

export const DEEP_GREY = '#2F2F2F';
export const SOFT_YELLOW = '#F6E79A';

/** Warm light screen background */
export const BG = '#F2F0EB';
/** Top stop of the app-wide warm-cream screen gradient */
export const SCREEN_BG_TOP = '#FCF8F1';
/** Bottom stop of the screen gradient — a touch deeper than BG for gentle depth */
export const SCREEN_BG_BOTTOM = '#EAE6DD';
/** Soft warm anchor tint used at the very top of every screen */
export const SCREEN_TOP_GLOW = 'rgba(212, 175, 55, 0.10)';
export const WHITE = '#FFFFFF';
export const SURFACE = '#FFFFFF';
export const SURFACE_ELEVATED = '#FFFFFF';

/**
 * Supporting accents — deep, desaturated, premium. Used ONLY as tile/stat
 * backgrounds alongside gold to create calm grouping. Never bright/candy.
 * PALETTE LOCK: do not add more than these three.
 */
export const ACCENT_INDIGO = '#3B3A5A';
export const ACCENT_ROSE = '#9E5B5B';
export const ACCENT_SAGE = '#5E7460';
/** Icon/text color on accent + gold tile surfaces */
export const ON_ACCENT = '#FFFFFF';
/**
 * Translucent deep-ink disc placed behind tile icons that render in their own
 * (non-white) color, guaranteeing contrast on light accent tones (e.g. gold).
 */
export const ACCENT_ICON_PLATE = 'rgba(31, 31, 31, 0.20)';

export const BLACK = '#000000';
export const NEAR_BLACK = '#1F1F1F';
export const TEXT_PRIMARY_DARK = '#1A1A1A';

export const MUTED_GREY = '#9F9F9F';
export const GREY_LABEL = '#888888';
export const PLACEHOLDER_GREY = '#D9D9D9';
export const IMAGE_PLACEHOLDER = '#E5E5E5';
export const STAR_EMPTY = '#E0E0E0';
export const DISABLED = '#C8C8C8';

export const BLOG_CARD_BG = '#F7F1C8';
export const TOOL_ICON_WRAP_BG = '#F7F1C8';
export const BANNER_BUTTON_BG = '#F7EB66';

/** Premium banner: rich orange → gold/yellow */
export const BANNER_GRADIENT_START = '#B85C00';
export const BANNER_GRADIENT_END = SOFT_YELLOW;

export const AVAILABLE_GREEN = '#2E9E4F';
export const STATUS_ONLINE = AVAILABLE_GREEN;
export const BUSY_AMBER = '#C4A000';

export const HOW_BORDER_GREY = '#9A9A9A';
export const HOW_SURFACE_LIGHT = '#FAFAFA';
export const HOW_GLYPH_GREY = '#777777';

export const STACK_LAYER_MID = '#F9E895';
export const STACK_LAYER_BACK = '#FFF8DC';

/** Expert detail / premium surfaces */
export const WARM_IVORY = '#FFFAF4';

export const ORB_STAND_GREY = '#C9C9C9';
export const ORB_BALL_FILL = '#E8F4FF';
export const ORB_BALL_BORDER = '#B8D4F0';
export const ORB_SHADOW = '#7EB8E8';

export const SHADOW_BLACK = '#000000';

/** Gold-tinted card borders */
export const GOLD_BORDER = 'rgba(184, 148, 47, 0.35)';
/** @deprecated Use GOLD_BORDER — kept for existing imports */
export const BLOG_CARD_BORDER = GOLD_BORDER;

/** Focus rings, online-dot glow */
export const GOLD_GLOW = 'rgba(184, 148, 47, 0.25)';

/** Filter chips, light dividers */
export const CHIP_BORDER = '#D8D8D8';
export const HEADER_RULE_GREY = '#E8E8E8';

/** Experts promo banner */
export const EXPERTS_BANNER_GRADIENT_START = '#C4621A';
export const EXPERTS_BANNER_GRADIENT_END = '#D4AF37';

/** Selected filter chip accent */
export const FILTER_CHIP_ACCENT = '#B8942F';
export const FILTER_ACTIVE = GOLD;

/** Review count under stars */
export const REVIEWS_MUTED_GOLD = '#A67C52';

/** Tab bar chrome */
export const TAB_BAR_BG = '#FFFFFF';
export const TAB_BAR_BORDER = 'rgba(184, 148, 47, 0.12)';
export const TAB_ACTIVE = NEAR_BLACK;

/** Semantic danger */
export const DANGER_RED = '#C0392B';
/** Muted danger tint for icon containers (e.g. logout) */
export const DANGER_TINT = 'rgba(192, 57, 43, 0.12)';
export const SESSION_RED = '#D64545';
export const LOGOUT_RED = '#ff4444';

/** Success / status accents */
export const SUCCESS_GREEN = '#27AE60';

/** Warm surface variants */
export const WARM_WHITE = '#FFFBF5';
export const HIGHLIGHT_IVORY = '#FFF8E7';
export const RECHARGE_HIGHLIGHT = '#FFF4D6';
export const WARNING_BANNER_BG = '#FEF3C7';

/** Wallet gradient depth */
export const WALLET_GOLD_DARK = '#8B6914';

/** Links and info accents */
export const LINK_BLUE = '#2196F3';

/** Toggle off state */
export const TOGGLE_TRACK_OFF = '#cccccc';

/** Session call screens (dark UI) */
export const SESSION_BG = '#1A1A2E';
export const SESSION_SURFACE = '#12121f';
export const SESSION_PANEL = '#3a3a52';
export const SESSION_CARD = '#2A2A42';

/** Guidance step indicator */
export const STEP_FUTURE = '#D0D0D0';

/** Modal overlays */
export const SCRIM_BLACK = 'rgba(0, 0, 0, 0.35)';
export const SHEET_SCRIM = 'rgba(0, 0, 0, 0.4)';
