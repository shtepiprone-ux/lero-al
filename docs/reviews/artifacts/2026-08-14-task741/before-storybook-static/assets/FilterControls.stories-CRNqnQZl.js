import{j as t,r as c}from"./iframe-BWqC60Cj.js";import{s as u}from"./_storyI18n-DUPbxmag.js";import{F as h,a as f,b as y}from"./FilterRoomsRow-DY3LpR73.js";import{M as T}from"./_MantineStoryShell-v1yXHo2n.js";import{S as l}from"./Stack-DqzY2ynC.js";import{T as _}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./TextInput-C4SGdSHD.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./utils-D5ceN5oG.js";import"./index-DUUQ4TXw.js";var g,p,x;const N={title:"Mantine/Primitives/FilterControls",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 554/556 precedent): the rendered-assert harness\r\n(`scripts/check-stories-rendered.mjs`) only gives PERMANENT, standing enforcement under\r\n`--mantine-only` to stories whose title matches this exact prefix. These three leaf filter\r\nsub-components (Task 566) are presentational forwarders consumed by `FiltersPanel`/\r\n`ListingsFilters` — this title is a display-grouping choice for gate enforcement, not a\r\ntaxonomy claim."}}}},b=[{value:"new_build",labelKey:"condition_new_build"},{value:"good",labelKey:"condition_good"},{value:"needs_repair",labelKey:"condition_needs_repair"},{value:"needs_renovation",labelKey:"condition_needs_renovation"},{value:"under_construction",labelKey:"condition_under_construction"}];function v({minPlaceholder:a,maxPlaceholder:n}){const[s,o]=c.useState(""),[e,r]=c.useState("120000");return t.jsx(h,{minValue:s,maxValue:e,onMinChange:o,onMaxChange:r,minPlaceholder:a,maxPlaceholder:n})}function S({getLabel:a,ariaLabel:n}){const[s,o]=c.useState(["good"]);return t.jsx(f,{options:b,selected:s,getLabel:a,ariaLabel:n,onToggle:e=>o(r=>r.includes(e)?r.filter(m=>m!==e):[...r,e])})}function k({ariaLabel:a}){const[n,s]=c.useState(["3"]);return t.jsx(y,{selected:n,ariaLabel:a,onToggle:o=>s(e=>e.includes(o)?e.filter(r=>r!==o):[...e,o])})}const i={render:(a,n)=>{var s,o;const e=(o=n==null||(s=n.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en",r=d=>u(e,`storybook.filtercontrols.${d}`),m=d=>r(d);return t.jsx(T,{children:t.jsxs(l,{gap:"xl",children:[t.jsxs(l,{gap:"xs",children:[t.jsx(_,{size:"xs",c:"gray.5",fw:500,children:"FilterRangeInputs — Mantine TextInput ×2 (§6e chrome, h-11, even-split row)"}),t.jsx(v,{minPlaceholder:r("price_min"),maxPlaceholder:r("price_max")})]}),t.jsx(l,{gap:"xs",children:t.jsx(S,{getLabel:m,ariaLabel:u(e,"common.condition")})}),t.jsxs(l,{gap:"xs",children:[t.jsx(_,{size:"xs",c:"gray.5",fw:500,children:'FilterRoomsRow — Mantine Button toggles over room counts (5 → "5+")'}),t.jsx(k,{ariaLabel:u(e,"common.rooms_label")})]})]})})}};i.parameters={...i.parameters,docs:{...(g=i.parameters)===null||g===void 0?void 0:g.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.filtercontrols.\${key}\`);
    const getLabel = (key: string) => t(key);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* FilterRangeInputs — §6e TextInput ×2, even-split row, h-11 */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              FilterRangeInputs — Mantine TextInput ×2 (§6e chrome, h-11, even-split row)\r
            </Text>\r
            <RangeInputsDemo minPlaceholder={t('price_min')} maxPlaceholder={t('price_max')} />\r
          </Stack>\r
\r
          {/* FilterMultiToggle — Mantine Button toggles (§6a chrome, filled=selected / default=unselected).\r
              Task 624: this annotation used to render as visible <Text>, leaking as a hardcoded\r
              English string in every locale — kept as a source comment only, never rendered. */}\r
          <Stack gap="xs">\r
            <MultiToggleDemo getLabel={getLabel} ariaLabel={storyT(locale, 'common.condition')} />\r
          </Stack>\r
\r
          {/* FilterRoomsRow — §6a Button toggles over room counts, one pre-selected */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              FilterRoomsRow — Mantine Button toggles over room counts (5 → &quot;5+&quot;)\r
            </Text>\r
            <RoomsRowDemo ariaLabel={storyT(locale, 'common.rooms_label')} />\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(x=i.parameters)===null||x===void 0||(p=x.docs)===null||p===void 0?void 0:p.source}}};const O=["Default"];export{i as Default,O as __namedExportsOrder,N as default};
