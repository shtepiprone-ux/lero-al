import{j as t,B as m}from"./iframe-BWqC60Cj.js";import{s as e}from"./_storyI18n-DUPbxmag.js";import{M as i}from"./MantineHomeSection-iUitqfff.js";import{S as _}from"./Stack-DqzY2ynC.js";import{T as d}from"./Title-pnvfNB3M.js";import{T as l}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";var c,h,u;const g={title:"Patterns/Mantine/HomeSection",component:i,parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Canonical homepage content-band section (Task 662) — real production component migrated from the homepage's four Tailwind `py-12 md:py-16 2xl:py-20` band wrappers. Owns vertical rhythm (48/64/80px) via a Mantine `py` responsive style prop bound to `base`/`md`/`xxl`; the third step was rebound from the legacy Tailwind `2xl` trigger to Mantine's own `xxl` (1440px) breakpoint (owner decision 2026-07-28, Task 669). Background (`muted`/`brandFade`) via design tokens; reuses `.container-wide` for the inner content column. Viewport and locale switched via Storybook toolbar."}}}},n={render:(b,r)=>{var a,s;const o=(s=r==null||(a=r.globals)===null||a===void 0?void 0:a.locale)!==null&&s!==void 0?s:"en";return t.jsxs(_,{gap:0,children:[t.jsxs(i,{variant:"default",children:[t.jsx(d,{order:3,mb:"xs",children:e(o,"storybook.mantine.home_section_caption_default")}),t.jsx(l,{c:"dimmed",mb:"md",children:e(o,"storybook.mantine.home_section_body")}),t.jsx(m,{fullWidth:!0,styles:{root:{"@media (min-width: 40em)":{width:"auto"}}},children:e(o,"storybook.mantine.home_section_cta")})]}),t.jsxs(i,{variant:"muted",children:[t.jsx(d,{order:3,mb:"xs",children:e(o,"storybook.mantine.home_section_caption_muted")}),t.jsx(l,{c:"dimmed",mb:"md",children:e(o,"storybook.mantine.home_section_body")}),t.jsx(m,{fullWidth:!0,styles:{root:{"@media (min-width: 40em)":{width:"auto"}}},children:e(o,"storybook.mantine.home_section_cta")})]}),t.jsxs(i,{variant:"brandFade",children:[t.jsx(d,{order:3,mb:"xs",children:e(o,"storybook.mantine.home_section_caption_brandfade")}),t.jsx(l,{c:"dimmed",mb:"md",children:e(o,"storybook.mantine.home_section_body")}),t.jsx(m,{fullWidth:!0,styles:{root:{"@media (min-width: 40em)":{width:"auto"}}},children:e(o,"storybook.mantine.home_section_cta")})]})]})}};n.parameters={...n.parameters,docs:{...(c=n.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Stack gap={0}>\r
        <MantineHomeSection variant="default">\r
          <Title order={3} mb="xs">{storyT(l, 'storybook.mantine.home_section_caption_default')}</Title>\r
          <Text c="dimmed" mb="md">{storyT(l, 'storybook.mantine.home_section_body')}</Text>\r
          <Button fullWidth styles={{
          root: {
            '@media (min-width: 40em)': {
              width: 'auto'
            }
          }
        }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>\r
        </MantineHomeSection>\r
\r
        <MantineHomeSection variant="muted">\r
          <Title order={3} mb="xs">{storyT(l, 'storybook.mantine.home_section_caption_muted')}</Title>\r
          <Text c="dimmed" mb="md">{storyT(l, 'storybook.mantine.home_section_body')}</Text>\r
          <Button fullWidth styles={{
          root: {
            '@media (min-width: 40em)': {
              width: 'auto'
            }
          }
        }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>\r
        </MantineHomeSection>\r
\r
        <MantineHomeSection variant="brandFade">\r
          <Title order={3} mb="xs">{storyT(l, 'storybook.mantine.home_section_caption_brandfade')}</Title>\r
          <Text c="dimmed" mb="md">{storyT(l, 'storybook.mantine.home_section_body')}</Text>\r
          <Button fullWidth styles={{
          root: {
            '@media (min-width: 40em)': {
              width: 'auto'
            }
          }
        }}>{storyT(l, 'storybook.mantine.home_section_cta')}</Button>\r
        </MantineHomeSection>\r
      </Stack>;
  }
}`,...(u=n.parameters)===null||u===void 0||(h=u.docs)===null||h===void 0?void 0:h.source}}};const j=["Default"];export{n as Default,j as __namedExportsOrder,g as default};
