# Source inventory — 10 September 2026

Read-only inventory from the reference checkout. File existence is not production verification. Paths below are relative to the monorepo; browser routes are specified in documents 02 and 03.

## Mobile route files

- `apps/mobile/app/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/(tabs)/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/(tabs)/experts.tsx` — P03
- `apps/mobile/app/(tabs)/guidance.tsx` — P05; legacy start-guidance redirects to guidance
- `apps/mobile/app/(tabs)/home.tsx` — P01; home re-exports index
- `apps/mobile/app/(tabs)/index.tsx` — P01; home re-exports index
- `apps/mobile/app/(tabs)/profile.tsx` — P02; re-exports profile setup
- `apps/mobile/app/(tabs)/tools.tsx` — P13/P14 tools hub
- `apps/mobile/app/articles/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/articles/[slug].tsx` — P17
- `apps/mobile/app/articles/index.tsx` — P17
- `apps/mobile/app/booking/confirmation.tsx` — P06
- `apps/mobile/app/booking/select-slot.tsx` — P06
- `apps/mobile/app/bookings/history.tsx` — P11
- `apps/mobile/app/bookings/review.tsx` — P11
- `apps/mobile/app/expert/[id].tsx` — P04 legacy mock prototype; use real plural experts source
- `apps/mobile/app/experts/[id].tsx` — P04
- `apps/mobile/app/guidance/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/guidance/flow.tsx` — P05; legacy start-guidance redirects to guidance
- `apps/mobile/app/guidance/start.tsx` — P05; legacy start-guidance redirects to guidance
- `apps/mobile/app/legal-webview.tsx` — P18
- `apps/mobile/app/link-phone.tsx` — P02
- `apps/mobile/app/login.tsx` — P02
- `apps/mobile/app/modal.tsx` — Expo sample modal; no business feature to reproduce
- `apps/mobile/app/notifications/index.tsx` — P16
- `apps/mobile/app/profile-setup.tsx` — P02
- `apps/mobile/app/reports/index.tsx` — P15
- `apps/mobile/app/session/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/session/audio.tsx` — P09
- `apps/mobile/app/session/chat.tsx` — P07/P08
- `apps/mobile/app/session/video.tsx` — P10
- `apps/mobile/app/settings/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/settings/index.tsx` — P18
- `apps/mobile/app/settings/webview.tsx` — P18
- `apps/mobile/app/start-guidance.tsx` — P05; legacy start-guidance redirects to guidance
- `apps/mobile/app/tools/_layout.tsx` — Shared shell/navigation infrastructure (P01); no standalone page
- `apps/mobile/app/tools/compatibility-detailed-result.tsx` — P14
- `apps/mobile/app/tools/compatibility-result.tsx` — P13
- `apps/mobile/app/tools/compatibility.tsx` — P13
- `apps/mobile/app/tools/horoscope-result.tsx` — P13
- `apps/mobile/app/tools/horoscope.tsx` — P13
- `apps/mobile/app/tools/kundli-detailed-result.tsx` — P14
- `apps/mobile/app/tools/kundli-detailed.tsx` — P14
- `apps/mobile/app/tools/kundli-result.tsx` — P13
- `apps/mobile/app/tools/kundli.tsx` — P13
- `apps/mobile/app/tools/monthly-horoscope.tsx` — P14
- `apps/mobile/app/tools/palm-reading.tsx` — P13
- `apps/mobile/app/tools/tarot.tsx` — P13
- `apps/mobile/app/verify-otp.tsx` — P02
- `apps/mobile/app/wallet/index.tsx` — P12
- `apps/mobile/app/wallet/recharge.tsx` — P12

## Mobile supporting clients and domain helpers

- `apps/mobile/lib/articlesApi.ts`
- `apps/mobile/lib/authApi.ts`
- `apps/mobile/lib/authSecureStorage.ts`
- `apps/mobile/lib/birthDateTime.ts`
- `apps/mobile/lib/bookingApi.ts`
- `apps/mobile/lib/bookingDisplay.ts`
- `apps/mobile/lib/bookingPricing.ts`
- `apps/mobile/lib/callBookingStatus.ts`
- `apps/mobile/lib/chatBookingStatus.ts`
- `apps/mobile/lib/chatSocket.ts`
- `apps/mobile/lib/webrtcAudio.ts`
- `apps/mobile/lib/webrtcVideo.ts`
- `apps/mobile/lib/expertsApi.ts`
- `apps/mobile/lib/formatRelativeTime.ts`
- `apps/mobile/lib/googleAuth.ts`
- `apps/mobile/lib/guidanceFromTool.ts`
- `apps/mobile/lib/jwtUtils.ts`
- `apps/mobile/lib/localNotificationScheduler.ts`
- `apps/mobile/lib/notificationApi.ts`
- `apps/mobile/lib/notificationFilters.ts`
- `apps/mobile/lib/notificationPreferences.ts`
- `apps/mobile/lib/profileProgress.ts`
- `apps/mobile/lib/profileUtils.ts`
- `apps/mobile/lib/razorpayCheckout.ts`
- `apps/mobile/lib/reportsApi.ts`
- `apps/mobile/lib/sessionReminderScheduler.ts`
- `apps/mobile/lib/toolsApi.ts`
- `apps/mobile/lib/walletApi.ts`
- `apps/mobile/lib/walletBalance.ts`

## Backend HTTP route declarations

Exact prefix, request DTO and role permissions must be checked in the named controller and backend bootstrap. Administrative/Pandit routes are reference boundaries, not authorization to expose them to customers.

```text
apps/backend/apps/user-service/src/wallet/wallet.controller.ts:22:@Controller('wallet')
apps/backend/apps/user-service/src/wallet/wallet.controller.ts:26:  @Get()
apps/backend/apps/user-service/src/wallet/wallet.controller.ts:32:  @Post('create-order')
apps/backend/apps/user-service/src/wallet/wallet.controller.ts:41:  @Post('verify-payment')
apps/backend/apps/user-service/src/wallet/wallet.controller.ts:50:  @Post('webhook')
apps/backend/apps/user-service/src/user-service.controller.ts:13:@Controller()
apps/backend/apps/user-service/src/user-service.controller.ts:17:  @Get()
apps/backend/apps/user-service/src/user-service.controller.ts:24:  @Get('users/profile')
apps/backend/apps/user-service/src/user-service.controller.ts:33:  @Patch('users/profile')
apps/backend/apps/user-service/src/user-service.controller.ts:43:  @Post('users/profile/avatar')
apps/backend/apps/user-service/src/user-service.controller.ts:59:  @Delete('users/profile')
apps/backend/apps/user-service/src/tools/tools.controller.ts:26:@Controller('tools')
apps/backend/apps/user-service/src/tools/tools.controller.ts:30:  @Post('kundli')
apps/backend/apps/user-service/src/tools/tools.controller.ts:39:  @Post('horoscope')
apps/backend/apps/user-service/src/tools/tools.controller.ts:44:  @Post('compatibility')
apps/backend/apps/user-service/src/tools/tools.controller.ts:53:  @Post('tarot')
apps/backend/apps/user-service/src/tools/tools.controller.ts:58:  @Post('palm-reading')
apps/backend/apps/user-service/src/tools/tools.controller.ts:63:  @Post('monthly-horoscope')
apps/backend/apps/user-service/src/tools/tools.controller.ts:70:  @Post('unlock')
apps/backend/apps/user-service/src/tools/tools.controller.ts:83:  @Get('unlocked')
apps/backend/apps/user-service/src/webrtc/video-session.controller.ts:26:@Controller('sessions/video')
apps/backend/apps/user-service/src/webrtc/video-session.controller.ts:34:  @Post('create')
apps/backend/apps/user-service/src/webrtc/video-session.controller.ts:53:  @Post('join')
apps/backend/apps/user-service/src/webrtc/video-session.controller.ts:75:  @Get(':bookingId')
apps/backend/apps/user-service/src/webrtc/video-session.controller.ts:84:  @Delete(':bookingId')
apps/backend/apps/user-service/src/reports/reports.controller.ts:16:@Controller('reports')
apps/backend/apps/user-service/src/reports/reports.controller.ts:21:  @Get()
apps/backend/apps/user-service/src/reports/reports.controller.ts:28:  @Get(':id')
apps/backend/apps/user-service/src/notifications/notifications.controller.ts:16:@Controller('notifications')
apps/backend/apps/user-service/src/notifications/notifications.controller.ts:21:  @Get()
apps/backend/apps/user-service/src/notifications/notifications.controller.ts:28:  @Get('unread-count')
apps/backend/apps/user-service/src/notifications/notifications.controller.ts:35:  @Patch('read-all')
apps/backend/apps/user-service/src/notifications/notifications.controller.ts:42:  @Patch(':id/read')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:37:@Controller('bookings')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:46:  @Post()
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:62:  @Post('chat-now')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:70:  @Post('chat-now/queue')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:78:  @Delete('chat-now/queue')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:86:  @Get('chat-now/queue')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:94:  @Get()
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:99:  @Get('pandit')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:106:  @Get('pandit/:panditId/status')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:113:  @Get(':id/user-details')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:121:  @Get(':id')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:129:  @Patch(':id/status')
apps/backend/apps/user-service/src/bookings/bookings.controller.ts:138:  @Post(':id/review')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:30:@Controller('pandit/articles')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:35:  @Get()
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:43:  @Get('stats')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:48:  @Post()
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:56:  @Get(':id')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:64:  @Patch(':id')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:73:  @Post(':id/publish')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:82:  @Post(':id/unpublish')
apps/backend/apps/user-service/src/articles/pandit-articles.controller.ts:90:  @Post(':id/cover')
apps/backend/apps/user-service/src/webrtc/audio-session.controller.ts:26:@Controller('sessions/audio')
apps/backend/apps/user-service/src/webrtc/audio-session.controller.ts:34:  @Post('create')
apps/backend/apps/user-service/src/webrtc/audio-session.controller.ts:53:  @Post('join')
apps/backend/apps/user-service/src/webrtc/audio-session.controller.ts:75:  @Get(':bookingId')
apps/backend/apps/user-service/src/webrtc/audio-session.controller.ts:84:  @Delete(':bookingId')
apps/backend/apps/user-service/src/articles/articles.controller.ts:20:@Controller('articles')
apps/backend/apps/user-service/src/articles/articles.controller.ts:27:  @Get()
apps/backend/apps/user-service/src/articles/articles.controller.ts:34:  @Get('sitemap')
apps/backend/apps/user-service/src/articles/articles.controller.ts:39:  @Get('authors/:panditId')
apps/backend/apps/user-service/src/articles/articles.controller.ts:44:  @Post('sync/blogger')
apps/backend/apps/user-service/src/articles/articles.controller.ts:52:  @Post(':slug/events')
apps/backend/apps/user-service/src/articles/articles.controller.ts:60:  @Get(':slug')
apps/backend/apps/user-service/src/auth/auth.controller.ts:22:@Controller('auth')
apps/backend/apps/user-service/src/auth/auth.controller.ts:40:  @Post('request-otp')
apps/backend/apps/user-service/src/auth/auth.controller.ts:59:  @Post('verify-otp')
apps/backend/apps/user-service/src/auth/auth.controller.ts:90:  @Post('google')
apps/backend/apps/user-service/src/auth/auth.controller.ts:108:  @Post('apple')
apps/backend/apps/user-service/src/auth/auth.controller.ts:128:  @Post('complete-social')
apps/backend/apps/user-service/src/auth/auth.controller.ts:157:  @Post('link-google')
apps/backend/apps/user-service/src/auth/auth.controller.ts:166:  @Post('refresh')
apps/backend/apps/user-service/src/auth/auth.controller.ts:189:  @Post('logout')
apps/backend/apps/user-service/src/experts/experts.controller.ts:26:@Controller('experts')
apps/backend/apps/user-service/src/experts/experts.controller.ts:30:  @Get()
apps/backend/apps/user-service/src/experts/experts.controller.ts:35:  @Get('me')
apps/backend/apps/user-service/src/experts/experts.controller.ts:41:  @Get(':id/available-slots')
apps/backend/apps/user-service/src/experts/experts.controller.ts:55:  @Get(':id/all-slots')
apps/backend/apps/user-service/src/experts/experts.controller.ts:82:  @Patch(':id/presence')
apps/backend/apps/user-service/src/experts/experts.controller.ts:92:  @Get(':id')
```

## Socket commands

```text
177:  @SubscribeMessage('joinSession')
252:  @SubscribeMessage('leaveSession')
266:  @SubscribeMessage('joinPanditDashboard')
295:  @SubscribeMessage('sendMessage')
336:  @SubscribeMessage('typing')
354:  @SubscribeMessage('endSession')
417:  @SubscribeMessage('joinAudioSession')
549:  @SubscribeMessage('leaveAudioSession')
590:  @SubscribeMessage('endAudioSession')
615:  @SubscribeMessage('joinVideoSession')
747:  @SubscribeMessage('leaveVideoSession')
788:  @SubscribeMessage('endVideoSession')
813:  @SubscribeMessage('requestGraceRefund')
864:  @SubscribeMessage('videoCameraState')
```

## Inventory limitations

Native layouts, redirect aliases and generic modal infrastructure are not separate business capabilities. Review imports and handlers to identify any new nested feature. Native notification delivery, secure storage, OAuth, payment and WebRTC implementations require browser adapters. A non-TSX debugging artifact under the tabs folder is not a customer route and should not be reproduced.
