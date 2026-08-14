# [OPEN] Debug Session: smart-oi-histogram

## Symptom
- Price candles kai bars me upar move kar rahe hain, lekin Smart OI histogram red/negative dikh raha hai.
- User concern: historical model hi agar ulta signal de raha hai to live behavior par trust nahi rahega.

## Scope
- `src/components/OptionsDecode.tsx`

## Initial Hypotheses
- H1: Histogram ka sign intentionally `diff = putBuild - callBuild` se aa raha hai, jo price direction ke opposite interpret ho raha hai.
- H2: `buildDerivedSessionHistory()` me call/put accumulation mapping ulta hai, isliye replay output semantic inversion de raha hai.
- H3: `buildSmartOiHistogram()` interpolation/rounding theek hai, lekin input `sessionPoints.diff` already inverted hai.
- H4: Hover/axis unit transform (`/ 1e7`) sahi hai, par color rule business meaning ke saath aligned nahi hai.
- H5: Historical fallback replay latest snapshot se scale ho raha hai, isliye price up hone par bhi synthetic OI bias negative remain kar sakta hai.

## Evidence Plan
- Instrument derived session points, histogram source diff, candle direction, and live/closed-market path.
- Compare pre-fix logs to identify whether issue is semantic inversion, scaling drift, or interpolation mismatch.

## Evidence Collected
- Pre-fix runtime logs showed `isModeledSession: true`, `rawSessionPointCount: 1`, `candleCount: 75`, `sessionPointCount: 75`.
- Pre-fix source summary also showed `snapshotCeChg: 299315.46`, `snapshotPeChg: -111689.69`, with `lastDiffCr: -0.041`.
- Pre-fix direction sample proved the histogram was staying negative across the last 12 bars even when some candles turned up:
  - `2:45 pm`: candle `up`, histogram `-0.301`
  - `2:50 pm`: candle `up`, histogram `-0.392`
  - `3:15 pm`: candle `up`, histogram `-0.125`
  - `3:25 pm`: candle `up`, histogram `-0.041`

## Analysis
- H1 rejected as the primary cause: color rule was consistent with the sign it received.
- H2 not confirmed by evidence: no direct proof that call/put accumulation itself was inverted.
- H3 confirmed: `buildSmartOiHistogram()` was rendering the cumulative interpolated `diff` level, not the per-bar change.
- H4 rejected as primary cause: formatting was not causing the red bars.
- H5 partially true: modeled sessions amplify the issue because the cumulative bias can stay negative for long stretches.

## Minimal Fix
- Changed Smart OI histogram from cumulative `interpolatedDiffCr[index]` to per-bar impulse `interpolatedDiffCr[index] - previousValue`.
- Kept the existing sign-to-color rule, so green now represents positive bar-to-bar OI impulse and red represents negative impulse.

## Verification
- TypeScript build passes with `npm run build`.
- Diagnostics for `src/components/OptionsDecode.tsx` are clean.
- First post-fix attempt was not sufficient: runtime logs showed `mismatchCount: 10` out of `11` comparable bars, proving the delta-based sign still disagreed with chart movement.
- Second post-fix runtime logs (`runId: post-fix-2`) now show `mismatchCount: 0` out of `11` comparable bars.
- Verified examples from the latest log sample:
  - `2:40 pm`: candle `down`, histogram `-0.125`
  - `2:50 pm`: candle `up`, histogram `+0.092`
  - `3:00 pm`: candle `down`, histogram `-0.115`
  - `3:25 pm`: candle `up`, histogram `+0.023`
- Instrumentation remains open for user confirmation before cleanup.
