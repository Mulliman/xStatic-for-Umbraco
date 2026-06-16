# Counter Dashboard - Unit Testing Example

A complete working example demonstrating how to write unit tests for Umbraco backoffice extensions using `@open-wc/testing`.

## What This Example Shows

This example demonstrates:

- **Testing Contexts** - Testing state management with observables
- **Testing Lit Elements** - Testing component rendering and interactions
- **Testing with Context** - Setting up host elements for context consumption
- **Async Testing** - Using `done()` callback for observable subscriptions

## Extension Types Included

| Type | File | Description |
|------|------|-------------|
| Context | `counter-context.ts` | Manages counter state with increment/decrement/reset |
| Dashboard Element | `counter-dashboard.element.ts` | Displays counter and control buttons |
| Unit Tests | `*.test.ts` | Comprehensive tests for both |

## Project Structure

```
counter-dashboard/
├── src/
│   ├── counter-context.ts              # Context with counter state
│   ├── counter-context.test.ts         # Context unit tests
│   ├── counter-dashboard.element.ts    # Dashboard Lit element
│   └── counter-dashboard.element.test.ts # Element unit tests
├── web-test-runner.config.mjs          # Test runner config
├── package.json
├── tsconfig.json
└── README.md
```

## Running the Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Key Testing Patterns

### 1. Testing a Context

```typescript
import { expect, fixture, defineCE } from '@open-wc/testing';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

class TestHostElement extends UmbLitElement {}
const testHostTag = defineCE(TestHostElement);

describe('CounterContext', () => {
  let context: CounterContext;
  let hostElement: UmbLitElement;

  beforeEach(async () => {
    hostElement = await fixture(`<${testHostTag}></${testHostTag}>`);
    context = new CounterContext(hostElement);
  });

  it('initializes with 0', (done) => {
    context.count.subscribe((value) => {
      expect(value).to.equal(0);
      done();
    });
  });

  it('increments correctly', (done) => {
    let callCount = 0;
    context.count.subscribe((value) => {
      callCount++;
      if (callCount === 1) {
        expect(value).to.equal(0);
        context.increment();
      } else if (callCount === 2) {
        expect(value).to.equal(1);
        done();
      }
    });
  });
});
```

### 2. Testing a Lit Element

```typescript
import { expect, fixture } from '@open-wc/testing';
import { html } from 'lit';

describe('CounterDashboard', () => {
  let element: CounterDashboardElement;

  beforeEach(async () => {
    element = await fixture(html`<counter-dashboard></counter-dashboard>`);
  });

  it('renders the count display', () => {
    const display = element.shadowRoot?.querySelector('.count-display');
    expect(display).to.exist;
  });

  it('updates on button click', async () => {
    const button = element.shadowRoot?.querySelector('.increment-btn');
    button?.click();
    await element.updateComplete;

    const display = element.shadowRoot?.querySelector('.count-display');
    expect(display?.textContent).to.include('1');
  });
});
```

### 3. Testing Element with Context

```typescript
describe('CounterDashboard with Context', () => {
  let element: CounterDashboardElement;
  let context: CounterContext;
  let hostElement: UmbLitElement;

  beforeEach(async () => {
    // 1. Create host for context
    hostElement = await fixture(`<${testHostTag}></${testHostTag}>`);

    // 2. Create context on host
    context = new CounterContext(hostElement);

    // 3. Create element as child (so it can consume context)
    element = await fixture(html`<counter-dashboard></counter-dashboard>`, {
      parentNode: hostElement,
    });

    await element.updateComplete;
  });

  it('displays value from context', async () => {
    const display = element.shadowRoot?.querySelector('.count-display');
    expect(display?.textContent).to.include('0');
  });

  it('updates when context changes', async () => {
    context.increment();
    await element.updateComplete;

    const display = element.shadowRoot?.querySelector('.count-display');
    expect(display?.textContent).to.include('1');
  });
});
```

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-unit-testing` | @open-wc/testing patterns |
| `umbraco-context-api` | Context creation and consumption |
| `umbraco-dashboard` | Dashboard element patterns |
