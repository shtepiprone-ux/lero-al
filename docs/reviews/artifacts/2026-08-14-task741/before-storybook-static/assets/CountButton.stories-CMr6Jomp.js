import{j as t}from"./iframe-BWqC60Cj.js";import{s as h}from"./_storyI18n-DUPbxmag.js";import{d as o}from"./RangeDatePicker-Dt_rNT9t.js";import"./MantineHomeSection-iUitqfff.js";import"./MantineFilterSection-YpA3RDq_.js";import{M as b}from"./_MantineStoryShell-v1yXHo2n.js";import{S as e}from"./Stack-DqzY2ynC.js";import{T as r}from"./Text-ZiglToyN.js";import{S as p}from"./sliders-horizontal-D5x7441Z.js";import"./preload-helper-Dp1pzeXC.js";import"./SimpleGrid-KrH1v0nV.js";import"./Avatar-B1u-IzMg.js";import"./use-uncontrolled-CxrsbXe8.js";import"./Title-pnvfNB3M.js";import"./Textarea-lEE62Y6x.js";import"./get-env-uyVen0u2.js";import"./InputBase-DV75-CNg.js";import"./Input-ChQbmR0L.js";import"./TextInput-C4SGdSHD.js";import"./Alert-CdAug_hS.js";import"./ThemeIcon-DREj4u5X.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./circle-check-CnzcspZt.js";import"./Badge-tZlP7Rz3.js";import"./utils-D5ceN5oG.js";import"./Card-D7uN-cSx.js";import"./camera-DYMZ0GDz.js";import"./LightboxView-CvKwUqdC.js";import"./AppImage--686g1R4.js";import"./ActionIcon-BlvdNdEl.js";import"./x-oNeZx8ai.js";import"./chevron-right-daoqVDRa.js";import"./maximize-2-PobGhKgS.js";import"./Divider-DJCK80GL.js";import"./Anchor-BmIezIhy.js";import"./phone-CZ1sHUGw.js";import"./eye-B-khOYU_.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./PasswordInput-C-zO3SDg.js";import"./CheckIcon-31AzgUPg.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./check-BHCgvXo2.js";import"./copy-DFez1--2.js";import"./index-PXfbuUw3.js";import"./en-US-BBmapk28.js";var s,u,d;const pt={title:"Mantine/Primitives/CountButton",parameters:{skipCanvas:!0,layout:"fullscreen",docs:{description:{component:"Title under `Mantine/Primitives/` (Task 554/556/566/567 precedent) — the rendered-assert\r\nharness's `--mantine-only` gate only gives standing enforcement to stories under this exact\r\nprefix.\r\n\n`MantineCountButton` (Task 567 round-2, Fix 3): count renders inline in the Button's\r\n`rightSection` (like a `leftSection` icon), never as an absolute corner badge — the round-1\r\ncorner-badge approach was genuinely clipped by Mantine `Button`'s own `overflow:hidden` root."}}}},i={render:(f,a)=>{var l,c;const m=(c=a==null||(l=a.globals)===null||l===void 0?void 0:l.locale)!==null&&c!==void 0?c:"en",n=x=>h(m,`storybook.mantine.${x}`);return t.jsx(b,{children:t.jsxs(e,{gap:"xl",children:[t.jsxs(e,{gap:"xs",children:[t.jsx(r,{size:"xs",c:"gray.5",fw:500,children:"with count — filled brand, count inline in rightSection (white pill, brand text)"}),t.jsx(o,{count:3,onClick:()=>{},children:n("count_button_label")})]}),t.jsxs(e,{gap:"xs",children:[t.jsx(r,{size:"xs",c:"gray.5",fw:500,children:"no count (0 / undefined) — renders exactly like a plain Button, no badge"}),t.jsx(o,{count:0,onClick:()=>{},children:n("count_button_label")})]}),t.jsxs(e,{gap:"xs",children:[t.jsx(r,{size:"xs",c:"gray.5",fw:500,children:"with count — default (bordered) variant, count inline"}),t.jsx(o,{variant:"default",count:7,onClick:()=>{},children:n("count_button_label")})]}),t.jsxs(e,{gap:"xs",children:[t.jsx(r,{size:"xs",c:"gray.5",fw:500,children:"icon + label + count, with iconOnlyBelow=860 — narrow the toolbar viewport below 860px to see the label collapse: leftSection icon and the count badge stay, only the label hides, touch target stays ≥44px (Task 571)"}),t.jsx(o,{leftSection:t.jsx(p,{className:"h-4 w-4"}),count:3,iconOnlyBelow:860,"aria-label":n("count_button_label"),onClick:()=>{},children:n("count_button_label")})]}),t.jsxs(e,{gap:"xs",children:[t.jsx(r,{size:"xs",c:"gray.5",fw:500,children:"secondary outline filter button — default (bordered/white) variant + filter icon in leftSection + count inline in rightSection (the HeroSearch filters trigger)"}),t.jsx(o,{variant:"default",leftSection:t.jsx(p,{className:"h-4 w-4"}),count:2,onClick:()=>{},children:n("count_button_label")})]})]})})}};i.parameters={...i.parameters,docs:{...(s=i.parameters)===null||s===void 0?void 0:s.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              with count — filled brand, count inline in rightSection (white pill, brand text)\r
            </Text>\r
            <MantineCountButton count={3} onClick={() => {}}>\r
              {t('count_button_label')}\r
            </MantineCountButton>\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              no count (0 / undefined) — renders exactly like a plain Button, no badge\r
            </Text>\r
            <MantineCountButton count={0} onClick={() => {}}>\r
              {t('count_button_label')}\r
            </MantineCountButton>\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              with count — default (bordered) variant, count inline\r
            </Text>\r
            <MantineCountButton variant="default" count={7} onClick={() => {}}>\r
              {t('count_button_label')}\r
            </MantineCountButton>\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              icon + label + count, with iconOnlyBelow=860 — narrow the toolbar viewport below\r
              860px to see the label collapse: leftSection icon and the count badge stay, only\r
              the label hides, touch target stays ≥44px (Task 571)\r
            </Text>\r
            <MantineCountButton leftSection={<SlidersHorizontal className="h-4 w-4" />} count={3} iconOnlyBelow={860} aria-label={t('count_button_label')} onClick={() => {}}>\r
              {t('count_button_label')}\r
            </MantineCountButton>\r
          </Stack>\r
\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              secondary outline filter button — default (bordered/white) variant + filter icon in\r
              leftSection + count inline in rightSection (the HeroSearch filters trigger)\r
            </Text>\r
            <MantineCountButton variant="default" leftSection={<SlidersHorizontal className="h-4 w-4" />} count={2} onClick={() => {}}>\r
              {t('count_button_label')}\r
            </MantineCountButton>\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(d=i.parameters)===null||d===void 0||(u=d.docs)===null||u===void 0?void 0:u.source}}};const mt=["Default"];export{i as Default,mt as __namedExportsOrder,pt as default};
