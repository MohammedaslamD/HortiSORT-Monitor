# Phase 2: Dashboard + Machine Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Dashboard, Machine List, and Machine Detail pages with supporting service layer for the HortiSort Monitor frontend.

**Architecture:** 
- Service layer: Plain async functions wrapping mock data (machineService, ticketService, dailyLogService) with a userLookup utility
- Dashboard: Composed of StatsCard, RecentTickets, RecentLogs widgets
- Machine List: Filter bar (search, status, model, city) + responsive table/card list
- Machine Detail: Tabbed interface (Overview, Daily Logs, Tickets, History) with error state for invalid IDs
- All data fetching and state management handled in page components
- Routes: Add /machines/:id to AppRoutes.tsx

**Tech Stack:** React 19, TypeScript 5.9, Vitest, Tailwind CSS v3, react-router-dom, existing common components (Button, Badge, Card, Input, Select, etc.)

---