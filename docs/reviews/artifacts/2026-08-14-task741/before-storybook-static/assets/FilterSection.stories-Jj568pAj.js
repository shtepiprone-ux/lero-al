import{j as t,B as l}from"./iframe-BWqC60Cj.js";import{s as e}from"./_storyI18n-DUPbxmag.js";import{M as n}from"./MantineFilterSection-YpA3RDq_.js";import{S as u}from"./Stack-DqzY2ynC.js";import{T as _}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";var c,d,m;const w={title:"Patterns/Mantine/FilterSection",component:n,parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Canonical labelled-section wrapper (Task 671) — real production component migrated from FiltersPanel's repeated `px-5 py-5` + uppercase micro-heading + `divide-y` local composition (17 call sites). First section renders no top divider; subsequent sections draw the canonical `gray-3` rule. Viewport and locale switched via Storybook toolbar."}}}},i={render:(h,r)=>{var a,s;const o=(s=r==null||(a=r.globals)===null||a===void 0?void 0:a.locale)!==null&&s!==void 0?s:"en";return t.jsxs(u,{gap:0,children:[t.jsx(n,{label:e(o,"storybook.mantine.form_section_location"),children:t.jsx(l,{variant:"default",fullWidth:!0,styles:{root:{"@media (min-width: 40em)":{width:"auto"}}},children:e(o,"storybook.mantine.home_section_cta")})}),t.jsx(n,{label:e(o,"storybook.mantine.form_section_details"),withDivider:!0,children:t.jsx(l,{variant:"light",fullWidth:!0,styles:{root:{"@media (min-width: 40em)":{width:"auto"}}},children:e(o,"storybook.mantine.action_add_new")})}),t.jsx(n,{label:e(o,"storybook.mantine.form_section_contact"),withDivider:!0,action:t.jsx(_,{size:"xs",c:"dimmed",children:e(o,"storybook.mantine.action_filter")}),children:t.jsx(l,{variant:"default",fullWidth:!0,styles:{root:{"@media (min-width: 40em)":{width:"auto"}}},children:e(o,"storybook.mantine.home_section_cta")})})]})}};i.parameters={...i.parameters,docs:{...(c=i.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  // Reuses existing \`storybook.mantine.*\` keys (form_section_location/details/contact,
  // home_section_cta, action_add_new, action_filter) — no new i18n keys added for this
  // Story (kickoff R9/AC9: zero new i18n keys for Task 671).
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Stack gap={0}>\r
        <MantineFilterSection label={storyT(l, 'storybook.mantine.form_section_location')}>\r
          <Button variant="default" fullWidth styles={{
          root: {
            '@media (min-width: 40em)': {
              width: 'auto'
            }
          }
        }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>\r
        </MantineFilterSection>\r
\r
        <MantineFilterSection label={storyT(l, 'storybook.mantine.form_section_details')} withDivider>\r
          <Button variant="light" fullWidth styles={{
          root: {
            '@media (min-width: 40em)': {
              width: 'auto'
            }
          }
        }}>{storyT(l, 'storybook.mantine.action_add_new')}</Button>\r
        </MantineFilterSection>\r
\r
        <MantineFilterSection label={storyT(l, 'storybook.mantine.form_section_contact')} withDivider action={<Text size="xs" c="dimmed">{storyT(l, 'storybook.mantine.action_filter')}</Text>}>\r
          <Button variant="default" fullWidth styles={{
          root: {
            '@media (min-width: 40em)': {
              width: 'auto'
            }
          }
        }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>\r
        </MantineFilterSection>\r
      </Stack>;
  }
}`,...(m=i.parameters)===null||m===void 0||(d=m.docs)===null||d===void 0?void 0:d.source}}};const x=["Default"];export{i as Default,x as __namedExportsOrder,w as default};
