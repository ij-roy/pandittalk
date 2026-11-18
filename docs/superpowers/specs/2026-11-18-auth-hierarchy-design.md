# PanditTalk Auth Hierarchy Design

## Goal

Make the website and mobile sign-in screens feel compact, intentional, and trustworthy while preserving PanditTalk's existing warm cream, gold, olive, white-surface, and dark-ink branding.

## Problem

The current screen is clearer than the earlier version, but the vertical rhythm still distributes too much attention across the brand block, heading copy, form card, social section, availability notice, help links, and global footer. The visitor's most important task—entering a phone number, accepting the consent statement, and sending a code—does not dominate strongly enough.

## Design direction

- Use a single narrow auth column rather than a wide page layout.
- Reduce page top padding, card padding, and gaps between the phone field, consent, and primary action.
- Keep the existing palette and typography; no new theme, gradient, or accent color is introduced.
- Make the primary path visually strongest through size, order, and spacing rather than a new color.
- Keep social sign-in available but visibly secondary, separated by a quiet centered divider.
- Keep reassurance and support content available, but compress it into low-emphasis single-line or compact link treatments.

## Website layout

The `/login` page will follow this order:

1. Compact top breathing room.
2. `Sign in or create your account.` heading.
3. One concise sentence explaining that the Indian mobile number creates a new account or opens an existing PanditTalk account.
4. Compact form surface containing:
   - Indian mobile-number field.
   - Short helper text.
   - Age/terms/privacy consent row with clearly styled links.
   - Primary `Send code` action immediately after consent.
5. Secondary social section with centered `Or continue with`, provider controls, and only necessary provider status text.
6. Quiet one-line reassurance and compact account-help links.

The page and card widths will be reduced from the current broad auth presentation. Desktop spacing will remain comfortable without creating a large vertical gap; mobile spacing will use smaller but still touch-safe values. The global footer remains available below the auth content but will not compete with the primary form.

## Mobile layout

The native login screen will use the same order and wording as the website. The brand hero will become compact so it identifies PanditTalk without pushing the form below the fold. The account heading and explanation will carry the service meaning; the logo block will not repeat that job.

The mobile screen will keep:

- Existing color tokens and native components.
- The consent row before `Send code`.
- Gold, bold, underlined legal links.
- Centered social separator.
- Google/Apple platform availability rules.
- Existing OTP, resend, cooldown, error, and legal URL behavior.

## Interaction and accessibility

- Maintain minimum touch targets of 44 points/pixels.
- Preserve visible keyboard focus and reduced-motion behavior.
- Social buttons remain pressable when consent is missing and explain the required checkbox with the existing accessible message plus the short attention animation.
- Do not change the backend authentication contract.
- Keep unavailable provider feedback explicit rather than silently disabling controls.

## Inspiration boundary

Dribbble and Behance authentication references were used only for structural inspiration: compact form grouping, restrained secondary actions, and deliberate spacing. PanditTalk's current brand palette, typography, content, accessibility requirements, and product meaning remain the source of truth.

## Acceptance criteria

- At 390px, the phone field, consent row, and primary action form the visually dominant group without unnecessary empty gaps.
- At desktop widths, the auth column is narrow enough to read as a focused task rather than a general content page.
- The social section is visibly secondary but still discoverable and interactive.
- Website and mobile use matching wording and action order.
- Existing website UI, contract, accessibility, and mobile type/lint checks continue to pass.
