# Axxess OS components

React + TypeScript components built from the Software Design Figma file
(https://www.figma.com/design/nQoaWS1HQMcpcNdju5ZEIp/Software-Design).

## Run

```bash
npm install
npm run dev        # the app at http://localhost:5173
npm run build      # type-check and build
```

## Use

```tsx
import { Button, TextInput, Badge } from "./components";

<Button variant="primary" icon="arrow-right">Continue</Button>
<TextInput label="Application" placeholder="Select an application" trailingIcon />
<Badge status="green" icon>successful</Badge>
```

Importing from `src/components` also loads `src/styles/tokens.css` (colors, type, spacing and radius as CSS variables). Load the fonts (Google Sans Flex, and Inter for the workspace name) as `index.html` does.

## Layout

```
src/
  styles/tokens.css        tokens from the Figma variables
  components/
    <Name>/<Name>.tsx      one folder per component, with its CSS
    Icon/icons.ts          the 42 icons the app uses (generated)
    internal/              shared pieces (Choice for checkbox/radio/toggle, Field for inputs)
    index.ts               public exports
  assets/icons/            original SVG exports from Figma
  App.tsx                  routes, and the component gallery
```

Components: Button, Checkbox, Radio, Toggle, TextInput, TextArea, Badge, Filter, Tab, NavItem, Navigation, Avatar, Icon,
plus the pieces the flows use: PageHeader, Stepper, OptionCard, Combobox, DetailList, DateInput, Divider,
FilterMenu, Menu, Timeline, SidePanel, SearchField, Pagination.

Add an icon by dropping its SVG export into `src/assets/icons` and running `npm run icons`.

## Pages

| URL | What |
| --- | --- |
| `#/requests` (default) | Requests list and request details panel (Approve Request flow) |
| `#/request-access` | Request Access flow; a sent request appears on the Requests page |
| `#/components` | Gallery of every component |

Requests live in an in-memory store (`src/data/RequestsContext.tsx`), seeded from `src/data/requests.ts`;
people and applications are in `src/data/directory.ts`. All of it resets on reload; swap these for API calls.

You are signed in as Chinedu Adeyemi. Approve or reject from the ⋯ menu in the details panel when
a request is waiting on you (REQ-0848 is, as the Figma owner).

## Request Access flow

```
src/flows/request-access/
  RequestAccessFlow.tsx    page layout, screen order, Continue/submit
  steps.tsx                the six screens: beneficiary, application, access level,
                           business reason, access duration, review
  state.ts                 the request draft, stepper config, when Continue is enabled
```

## Requests page

```
src/pages/requests/
  RequestsPage.tsx         tabs, search, filters, table, pagination
  RequestDetailPanel.tsx   the details panel: request details, reason, policy, approval flow, lifecycle
src/shell/AppShell.tsx     sidebar and top bar shared by app pages
```

`<RequestAccessFlow onClose={...} onSubmit={(request) => ...} />` hands you the finished request on submit.
