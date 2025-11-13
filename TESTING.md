1. Introduction

This document provides a complete testing guideline for the Nuxt 3 frontend application.
It describes all test categories, tools, configurations, folder structure, and recommended workflows.

This testing strategy is designed for modern Nuxt projects that use:
•	Vue 3 + Composition API
•	Naive UI
•	OpenLayers or other map libraries
•	REST API using $fetch
•	Component-based architecture

⸻

2. Testing Overview

A modern frontend application should include four levels of testing:

Level	Name	Tools	Purpose
1	Unit Test	Vitest	Test pure logic functions
2	Component Test	Vitest + Vue Test Utils	Test a single Vue component
3	Integration Test	Nuxt Test Utils	Test multiple components + a full page
4	End-to-End Test (E2E)	Cypress	Simulate real user behavior in browser

This layered approach ensures the system is reliable from the smallest function to the full UI.

⸻

3. Required Dependencies

Install testing dependencies:

npm install -D vitest @vue/test-utils jsdom
npm install -D @nuxt/test-utils
npm install -D cypress


⸻

4. Vitest Configuration (Unit + Component Testing)

vitest.config.ts:

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
plugins: [vue()],
resolve: {
alias: {
'~': path.resolve(__dirname, './'),
'@': path.resolve(__dirname, './'),
},
},
test: {
globals: true,
environment: 'jsdom',
},
})

This configuration allows:
•	Vue SFC testing
•	JSDOM environment
•	Nuxt-style alias support (~/ & @/)

⸻

5. Test Directory Structure

Recommended structure:

tests/
unit/
formats.test.ts
api-utils.test.ts

components/
SidebarMenu.test.ts
TrackInfoPanel.test.ts
LegendBar.test.ts

integration/
map-page.test.ts
index-page.test.ts

cypress/
e2e/
map.cy.js
sidebar.cy.js
download.cy.js


⸻

6. Unit Testing

Purpose

Unit tests validate small, isolated logic functions such as utilities and composables.

Example (utils/formats.test.ts):

import { formatTimestamp } from '~/utils/formats'

describe('formatTimestamp', () => {
it('formats timestamp correctly', () => {
expect(formatTimestamp(1000000000)).toBe('2001-09-09')
})
})


⸻

7. Component Testing

Purpose

Component tests validate a single Vue component in isolation.

Tools
•	Vitest
•	@vue/test-utils
•	Mocked UI libraries (e.g., Naive UI)

Example: SidebarMenu.test.ts

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import SidebarMenu from '~/components/SidebarMenu.vue'

// mock Naive-UI
vi.mock('naive-ui', () => {
const stub = (name) => ({
name,
template: `<div><slot /></div>`
})
return {
NDatePicker: stub('NDatePicker'),
NButton: stub('NButton'),
NDataTable: stub('NDataTable'),
NConfigProvider: stub('NConfigProvider'),
}
})

describe('SidebarMenu', () => {
it('renders correctly', () => {
const wrapper = mount(SidebarMenu)

    expect(wrapper.find('.query-button').exists()).toBe(true)
    expect(wrapper.text()).toContain('query')
    expect(wrapper.find('.result-panel').exists()).toBe(false)
})
})


⸻

8. Integration Testing

Purpose

Integration tests validate how multiple components work together inside an actual Nuxt page.

Tool

@nuxt/test-utils

Example (tests/integration/map-page.test.ts):

import { setup, $fetch } from '@nuxt/test-utils'

describe('Map Page', async () => {
await setup({
server: true,
browser: false,
})

it('renders the map page', async () => {
const html = await $fetch('/map')
expect(html).toContain('Storm')
})
})

Integration tests ensure:
•	pages render correctly
•	server-side rendering works
•	Nuxt runtime (plugins, composables) works normally

⸻

9. End-to-End Testing (E2E)

Purpose

Simulate real user behavior in a browser environment using Cypress.

Steps

1. Run Nuxt

npm run dev

2. Start Cypress

npx cypress open

Example test (cypress/e2e/map.cy.js):

describe('Map Interaction', () => {
it('can query storm data and display results', () => {
cy.visit('/map')

    cy.get('.query-button').click()

    cy.get('.result-panel').should('be.visible')
})
})

E2E tests validate the entire stack:
•	frontend UI
•	backend API
•	events
•	rendering
•	user flow

⸻

10. Recommended Testing Workflow (Step-by-Step)

You can follow these steps in order:

✔ Step 1 — Unit Tests

Test all utilities and composables.

✔ Step 2 — Component Tests

Test SidebarMenu, TrackInfoPanel, etc.

✔ Step 3 — Integration Tests

Test full Nuxt pages.

✔ Step 4 — E2E Tests

Use Cypress to test real browser behavior.

This workflow ensures complete test coverage from smallest to largest.

⸻

11. Summary

A robust Nuxt 3 testing strategy includes:
Unit Tests → Component Tests → Integration Tests → E2E Tests
using Vitest + Vue Test Utils + Nuxt Test Utils + Cypress.

This multi-layer structure guarantees correctness, stability, and reliability of the entire app.

⸻

12. Step-by-Step Testing Checklist

This section provides a concrete procedure to follow each time you test the platform, ensuring consistent and thorough test coverage.

1. Prepare Environment (Install Dependencies)
- Run `npm install -D vitest @vue/test-utils jsdom` to install unit and component test dependencies.
- Run `npm install -D @nuxt/test-utils` for integration testing utilities.
- Run `npm install -D cypress` to install the E2E testing framework.

2. Run Unit Tests
- Execute `npx vitest tests/unit` to run all unit tests.
- This validates small, isolated logic functions.

3. Run Component Tests
- Execute `npx vitest tests/components` to test individual Vue components.
- Ensures components render and behave correctly in isolation.

4. Run Integration Tests
- Execute `npx vitest tests/integration` to test multiple components and full pages.
- Validates server-side rendering and Nuxt composables.

5. Run E2E Tests
- Start the Nuxt development server with `npm run dev`.
- Open Cypress with `npx cypress open` to run end-to-end tests.
- Simulates real user interactions in a browser environment.

6. Optional: Run Full Test Suite Before Delivery
- Run `npx vitest --run` to execute all tests in one command.
- Recommended before major demos or production delivery to ensure overall stability.

⸻