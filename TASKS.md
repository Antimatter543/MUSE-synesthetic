# MUSE — Task Board

> Canonical task list. Update this file as tasks complete. Referenced by MEMORY.md.

## Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Write all backend code (agents, tools, API) | ✅ Done | In initial commit |
| 2 | Write all frontend code (React, WebSocket, AudioWorklet) | ✅ Done | In initial commit |
| 3 | Write tests (pytest + vitest) | ✅ Done | In initial commit |
| 4 | Write README, BLOG_POST.md, DEMO_SCRIPT.md | ✅ Done | In initial commit |
| 5 | Clean repo + push to GitHub | ✅ Done | commit 9767c2a |
| 6 | Start Devpost draft | ✅ Done | Draft exists, needs video URL |
| 7 | Deploy backend to Cloud Run | ✅ Done | https://muse-backend-873840430322.us-central1.run.app |
| 8 | Deploy frontend (GCS static) | ✅ Done | https://storage.googleapis.com/muse-frontend-project-b5adb824-a03c-48da-935/index.html |
| 9 | Record 4-minute demo video | ⬜ Todo | Script ready in DEMO_SCRIPT.md |
| 10 | Publish blog post on dev.to | ⬜ Todo | BLOG_POST.md ready with #GeminiLiveAgentChallenge tag |
| 10a | Add hashtag to BLOG_POST.md | ✅ Done | Added footer with #GeminiLiveAgentChallenge |
| 11 | Submit Devpost (add video URL) | ⬜ Todo | Depends on #9 |
| 11a | Generate architecture diagram | ✅ Done | deploy/architecture.svg ready to upload to Devpost |
| 12 | GDG community signup (bonus) | ⬜ Todo | Optional bonus |
| 13 | Optimize WebSocket session lifecycle to reduce idle usage | ✅ Done | Frontend now connects only on Start Session and disconnects on End Session |

## Critical Path

~~Deploy (#7, #8)~~ ✅ → Record video (#9) → Submit Devpost (#11)

Blog post (#10) and GDG (#12) are independent.

## Key Details

- **Challenge**: Gemini Live Agent Challenge 2026
- **Deadline**: Check Devpost for current deadline
- **Stack**: FastAPI + Google ADK + Gemini Live API + React/Vite
- **Backend URL**: https://muse-backend-873840430322.us-central1.run.app
- **Frontend URL**: https://storage.googleapis.com/muse-frontend-project-b5adb824-a03c-48da-935/index.html
- **GCP project**: `project-b5adb824-a03c-48da-935` / project number `873840430322`
- **GCS bucket (images)**: `muse-gallery-images-91690`
- **GCS bucket (frontend)**: `muse-frontend-project-b5adb824-a03c-48da-935`
- **API key secret**: `google-api-key` in Secret Manager
- **Local backend port**: 8081 (Cloud Run uses 8080)
- **WebSocket**: `ws://<host>/ws/{session_id}` — binary PCM + JSON frames
- **Session efficiency update (Mar 4, 2026)**: WebSocket connection is now user-driven (start/end session) instead of auto-connecting on page load, reducing idle backend/model session usage while a tab is open.
