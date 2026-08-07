# BridgePoint

BridgePoint is an AI-assisted community resource navigation and workflow prototype. I built it around a practical problem I kept coming back to. Support systems can be difficult to understand even when the right program exists, and the process of finding a resource is only part of the problem.

The application brings resource discovery, guided life tasks, document tools, and role-specific workflows into one place. It has separate experiences for community members, students, professionals, instructors, organizations, and administrators.

This is an active prototype, not a production human-services system.

## What is implemented

- Community resource discovery and location-aware filtering
- Guided life tasks, form help, phone preparation, and step-by-step navigation
- Student lessons, study rooms, notes, and resource kits
- Professional workflow generation, case documentation, analytics, and export tools
- Organization membership, invitations, directories, broadcasts, and shared resource bundles
- Role-specific onboarding, permissions, and navigation
- AI-assisted resource guidance, document analysis, moderation, and workflow generation

## How it is built

The frontend uses React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, and shadcn/ui. Supabase provides authentication, data storage, and Edge Functions.

AI requests run server-side through Supabase Edge Functions. Text and tool-calling workflows use the OpenAI Chat Completions API, while form analysis uses the OpenAI Responses API so PDFs are handled as file inputs and JPEG/PNG scans are handled as image inputs. The OpenAI API key stays on the server.

The application uses one account model with mode-specific routing instead of splitting each audience into a separate product. Resource navigation, student tools, professional tools, organization management, and administrative workflows remain separate enough to test and change without treating the application as one large page.

## My role

I define the product goals and workflows, break them into concrete tasks for AI-assisted implementation, review the generated work, test real behavior and edge cases, troubleshoot integration failures, and decide what is ready to keep. I use AI as a development collaborator, but I remain responsible for the requirements, testing, corrections, and final product decisions.

My broader approach is intentional. As AI systems get more capable, I think learning how to collaborate with them well is more useful for the work I want to do than treating traditional hand-coding from scratch as the only path into software. BridgePoint is one of the projects where I am putting that approach into practice and learning where it works, where it fails, and how much verification it actually requires.

## Local setup

Install dependencies and copy the browser-safe environment template.

```bash
npm ci
cp .env.example .env
npm run dev
```

The frontend expects a configured Supabase project. Server-side AI functions also require `OPENAI_API_KEY` in Supabase project secrets. That key should never be added to `.env` or browser code.

## Verification

```bash
npx vitest run
npm run lint
npm run build
```

The repository uses Vitest and Testing Library for automated checks. Provider-contract tests also exercise the OpenAI request boundary without sending live requests or exposing credentials.

## Status

BridgePoint is under active iteration. The repository is meant to show the current product, architecture, testing approach, and the way I work with AI-assisted implementation. Features should be evaluated from the code and working behavior rather than treated as production guarantees.
