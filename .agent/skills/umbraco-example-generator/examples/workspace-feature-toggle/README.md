# Feature Toggle Example

A complete, testable example demonstrating workspace context patterns in Umbraco backoffice.

## Tests

- **38 unit tests** - Context and element tests using @open-wc/testing
- **13 E2E tests** - Playwright tests against the mocked backoffice (MSW mode)

## Extension types included

- **workspaceContext** - Manages feature toggle state with array and derived observables
- **workspaceView** - Displays feature toggles and allows user interaction
- **workspaceAction** - Toggles all features with a single button
- **workspaceFooterApp** - Shows active feature count in footer

## How it works

The `ExampleFeatureToggleContext` manages an array of features using `UmbArrayState`. It exposes:
- `features` - Observable array of all features
- `activeCount` - Derived observable counting enabled features
- `allEnabled` / `allDisabled` - Derived boolean observables

Other extensions consume this context to display and modify state.

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Unit Tests

```bash
npm test
```

## Running E2E Tests (MSW Mode)

The E2E tests run against the mocked Umbraco backoffice - no .NET backend required.

### 1. Start the mocked backoffice

```bash
cd /path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client
VITE_EXTERNAL_EXTENSION=/path/to/this/folder npm run dev:external
```

### 2. Run Playwright tests

```bash
# Headless
npm run test:e2e

# With browser visible
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui
```

## Key patterns demonstrated

### Context with array state
```typescript
#features = new UmbArrayState<Feature>(DEFAULT_FEATURES, (x) => x.id);
readonly features = this.#features.asObservable();
readonly activeCount = this.#features.asObservablePart((features) =>
    features.filter((f) => f.enabled).length
);
```

### Testing observables with done() callback
```typescript
it('initializes with default features', (done) => {
    context.features.subscribe((features) => {
        expect(features.length).to.equal(3);
        done();
    });
});
```

### Testing state changes with call count
```typescript
it('toggles feature', (done) => {
    let callCount = 0;
    context.features.subscribe((features) => {
        callCount++;
        if (callCount === 1) {
            context.toggle('dark-mode');
        } else if (callCount === 2) {
            expect(features.find(f => f.id === 'dark-mode')?.enabled).to.be.true;
            done();
        }
    });
});
```

### Testing elements with context
```typescript
beforeEach(async () => {
    hostElement = await fixture(`<${testHostElement}></${testHostElement}>`);
    context = new ExampleFeatureToggleContext(hostElement);
    element = await fixture(html`<example-feature-toggle-view></example-feature-toggle-view>`, {
        parentNode: hostElement,
    });
});
```
